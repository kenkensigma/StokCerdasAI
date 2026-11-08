import {
  aiInsightInputSchema,
  aiInsightResponseSchema,
  type AiInsightInput,
  type AiInsightResponse,
} from "@/lib/validations/ai";

const SYSTEM_INSTRUCTION = `You are StokCerdas AI, an inventory analysis assistant for small Indonesian retail businesses (toko kelontong, minimarket).
Your role is to explain verified inventory metrics and provide actionable context in concise, professional Bahasa Indonesia.

Strict Rules:
1. Use ONLY the supplied data.
2. Never invent or recalculate quantities, prices, supplier names, dates, or sales trends.
3. Never contradict or modify the supplied calculated metrics (stok, ROP, rata-rata penjualan, estimasi hari habis).
4. Do NOT claim that a forecast is certain. Use cautious phrasing like "diperkirakan", "berdasarkan data", "disarankan".
5. If data coverage is limited (WAITING or LIMITED), clearly explain that more sales records are needed for higher accuracy.
6. Return ONLY a valid JSON object matching this schema:
{
  "status": "NORMAL" | "LOW" | "CRITICAL" | "WAITING" | "COLLECTING",
  "summary": string (maksimal 250 karakter, ringkasan kondisi stok),
  "riskExplanation": string (maksimal 500 karakter, mengapa produk berisiko atau aman),
  "recommendation": string (maksimal 500 karakter, saran tindakan nyata untuk pemilik toko),
  "reason": string (maksimal 500 karakter, alasan bisnis di balik rekomendasi),
  "confidenceNote": string (maksimal 250 karakter, penjelasan tingkat kepastian data)
}`;

/**
 * Generates deterministic fallback insights when Gemini API is unreachable,
 * times out, or returns invalid structure.
 * This guarantees that business operations and inventory displays NEVER crash.
 */
export function generateFallbackInsight(input: AiInsightInput, reason = "fallback"): AiInsightResponse {
  void reason;
  const { productName, currentStock, unit, reorderPoint, estimatedStockoutDays, suggestedRestockQuantity, dataCoverage } = input;

  if (dataCoverage.level === "WAITING" || currentStock === 0 && dataCoverage.daysWithSalesHistory === 0) {
    return {
      status: "WAITING",
      summary: `Stok ${productName} siap dipantau. Menunggu data transaksi penjualan pertama.`,
      riskExplanation: `Produk memiliki stok fisik ${currentStock} ${unit}. Belum ada transaksi penjualan tercatat untuk menghitung laju harian.`,
      recommendation: "Lakukan penjualan normal melalui kasir. Sistem akan otomatis menganalisis setelah ada histori transaksi.",
      reason: "Perhitungan titik pemesanan ulang (ROP) membutuhkan histori penjualan aktual.",
      confidenceNote: "Tingkat keyakinan: Menunggu data penjualan perdana.",
    };
  }

  if (currentStock <= 0) {
    return {
      status: "CRITICAL",
      summary: `Stok ${productName} fisik telah habis (0 ${unit}). Potensi kehilangan pendapatan penjualan.`,
      riskExplanation: `Persediaan kosong sedangkan produk memiliki catatan permintaan. Setiap permintaan pembeli berisiko tidak terpenuhi.`,
      recommendation: suggestedRestockQuantity > 0
        ? `Segera lakukan pengadaan restock sebanyak ${suggestedRestockQuantity} ${unit} ke supplier.`
        : "Segera hubungi supplier untuk pengadaan barang masuk.",
      reason: `Produk membutuhkan waktu tunggu supplier ${input.supplierLeadTimeDays} hari untuk tiba di toko.`,
      confidenceNote: `Analisis menggunakan histori penjualan ${dataCoverage.periodDays} hari (${dataCoverage.level}).`,
    };
  }

  if (estimatedStockoutDays !== null && estimatedStockoutDays <= input.supplierLeadTimeDays) {
    return {
      status: "CRITICAL",
      summary: `Stok ${productName} (${currentStock} ${unit}) kritis! Diperkirakan habis sebelum barang pesanan tiba.`,
      riskExplanation: `Sisa persediaan hanya cukup untuk sekitar ${estimatedStockoutDays} hari, sementara waktu tunggu supplier adalah ${input.supplierLeadTimeDays} hari.`,
      recommendation: `Segera lakukan pemesanan ulang minimal ${suggestedRestockQuantity} ${unit} hari ini.`,
      reason: `Waktu pengiriman supplier lebih lambat daripada laju penjualan harian (${input.averageDailySales} ${unit}/hari).`,
      confidenceNote: `Analisis menggunakan data penjualan aktual (${dataCoverage.level}).`,
    };
  }

  if (currentStock <= reorderPoint) {
    return {
      status: "LOW",
      summary: `Stok ${productName} (${currentStock} ${unit}) menyentuh titik pemesanan kembali (ROP: ${reorderPoint} ${unit}).`,
      riskExplanation: `Persediaan mulai menipis dan mendekati batas stok pengaman (safety stock: ${input.safetyStock} ${unit}).`,
      recommendation: `Disarankan membuat pesanan pembelian restock sekitar ${suggestedRestockQuantity} ${unit}.`,
      reason: `Mencegah terjadinya kehabisan stok saat terjadi lonjakan pembelian mendadak.`,
      confidenceNote: `Analisis histori ${dataCoverage.periodDays} hari (${dataCoverage.level}).`,
    };
  }

  return {
    status: "NORMAL",
    summary: `Stok ${productName} (${currentStock} ${unit}) dalam kondisi aman dan mencukupi.`,
    riskExplanation: `Persediaan berada di atas batas titik pemesanan ulang (${reorderPoint} ${unit}) dan diproyeksikan bertahan ~${estimatedStockoutDays ?? "beberapa"} hari.`,
    recommendation: "Belum diperlukan restock. Pertahankan pemantauan berkala.",
    reason: `Laju penjualan stabil di ${input.averageDailySales} ${unit}/hari dengan buffer stok pengaman yang cukup.`,
    confidenceNote: `Analisis data penjualan terkini (${dataCoverage.level}).`,
  };
}

/**
 * Calls Google Gemini API to analyze a single product's deterministic inventory metrics.
 * Uses structured JSON generation, strict server-side validation via Zod,
 * and a 10-second timeout.
 */
export async function analyzeProductWithGemini(
  input: AiInsightInput
): Promise<{ insight: AiInsightResponse; modelName: string; isFallback: boolean }> {
  // 1. Validate input strictly with Zod
  const validatedInput = aiInsightInputSchema.parse(input);

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";

  // If API key is not configured, gracefully use deterministic fallback
  if (!apiKey || apiKey === "your-gemini-api-key") {
    return {
      insight: generateFallbackInsight(validatedInput, "no_api_key"),
      modelName: "deterministic-rule-engine",
      isFallback: true,
    };
  }

  const userPrompt = `Analisis metrik persediaan berikut dan berikan penjelasan kontekstual:
${JSON.stringify(validatedInput, null, 2)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout for complex AI reasoning

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      modelName
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: 1024,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.warn(`[Gemini API Error] Status: ${response.status}. Details: ${errorText.slice(0, 200)}`);
      return {
        insight: generateFallbackInsight(validatedInput, `gemini_http_${response.status}`),
        modelName,
        isFallback: true,
      };
    }

    const data = await response.json();
    const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawContent) {
      console.warn("[Gemini API] Received empty candidate response parts.");
      return {
        insight: generateFallbackInsight(validatedInput, "empty_response"),
        modelName,
        isFallback: true,
      };
    }

    // Parse and validate with Zod
    const parsedJson = JSON.parse(rawContent);
    const validatedInsight = aiInsightResponseSchema.parse(parsedJson);

    return {
      insight: validatedInsight,
      modelName,
      isFallback: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn(`[Gemini Integration] Fallback activated due to: ${message}`);
    return {
      insight: generateFallbackInsight(validatedInput, "exception"),
      modelName,
      isFallback: true,
    };
  }
}

