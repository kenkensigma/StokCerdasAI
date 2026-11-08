import { createClient } from "@/lib/supabase/server";
import { getStoreIntelligence } from "@/services/intelligence.service";
import { getStoreReports } from "@/services/reports.service";

const ASSISTANT_SYSTEM_INSTRUCTION = `Anda adalah "Asisten Bisnis StokCerdas AI", asisten pintar untuk pemilik toko retail UMKM (toko kelontong, minimarket).
Tugas Anda adalah membantu pemilik toko memahami persediaan, menghitung kebutuhan restock, dan mengevaluasi penjualan secara akurat, ramah, dan mudah dipahami.

PANDUAN UTAMA:
1. Jawab berdasarkan data inventaris dan penjualan toko yang tercatat jika pengguna menanyakan kondisi riil tokonya.
2. DILARANG KERAS mengarang angka stok, harga supplier, atau data riil yang tidak tercantum di database.
3. Jika pengguna menanyakan simulasi, perumpamaan, atau skenario hipotesis (contoh: "kalau aku restock 60 lalu laku 20, perlu restock lagi ga?"):
   - Jawab secara cerdas, jelas, dan logis menggunakan prinsip dasar manajemen stok ritel:
     * Hitung sisa stok yang ada (misal: 60 - 20 = 40 unit).
     * Jelaskan bahwa keputusan perlu/tidaknya restock tergantung pada: Titik Pemesanan Ulang (Reorder Point / ROP), Laju Penjualan Harian, dan Waktu Pengiriman Supplier (Lead Time).
     * Berikan kesimpulan yang praktis (misal: jika 40 unit masih cukup untuk beberapa hari ke depan sebelum supplier tiba, maka belum perlu restock; namun jika laju penjualannya sangat cepat misal 20 unit/hari, maka sudah harus pesan kembali).
   - Jangan memaksakan mengaitkan pertanyaan skenario umum ke nama produk acak yang ada di database toko kecuali pengguna secara khusus menyebut produk tersebut.
4. Gunakan rumus baku manajemen inventaris:
   - Rata-rata Penjualan Harian (ADS) = Total Penjualan / Jumlah Hari
   - Estimasi Hari Habis = Sisa Stok / Rata-rata Penjualan Harian
   - Reorder Point (ROP) = (Penjualan Harian × Lead Time) + Safety Stock
   - Saran Jumlah Restock = Target Persediaan - Sisa Stok
5. Berikan jawaban dalam Bahasa Indonesia yang ramah, terstruktur rapi dengan Markdown (bullet points, bold), dan berikan penjelasan yang tuntas tanpa terpotong.`;

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Builds deterministic context from the store database for the Gemini Assistant
 */
async function buildStoreContext(storeId: string): Promise<string> {
  try {
    const supabase = await createClient();

    // 1. Get store name
    const { data: store } = await supabase
      .from("stores")
      .select("name")
      .eq("id", storeId)
      .single();

    const storeName = store?.name || "Toko Anda";

    // 2. Get deterministic intelligence
    const intelligence = await getStoreIntelligence(storeId, { periodDays: 7 });

    // 3. Get business reports
    const reports = await getStoreReports(storeId, 7);

    // Group items by status
    const criticalItems = intelligence.items.filter((i) => i.status === "CRITICAL");
    const lowItems = intelligence.items.filter((i) => i.status === "LOW");
    const normalItems = intelligence.items.filter((i) => i.status === "NORMAL");
    const waitingItems = intelligence.items.filter((i) => i.status === "WAITING");

    const formatItem = (i: typeof intelligence.items[0]) =>
      `- ${i.name} (SKU: ${i.sku}): Stok ${i.currentStock} ${i.unit}, ROP: ${i.reorderPoint} ${i.unit}, Laju: ${i.averageDailySales} ${i.unit}/hari, Est Habis: ${i.estimatedStockoutDays !== null ? `${i.estimatedStockoutDays} hari` : "belum ada estimasi"}, Saran Restock: ${i.suggestedRestockQuantity} ${i.unit}, Lead Time: ${i.supplierLeadTimeDays} hari. Status: ${i.status}`;

    const contextLines = [
      `Nama Toko: ${storeName}`,
      `Total Produk: ${intelligence.summary.totalProducts} SKU`,
      `Total Stok Fisik: ${reports.summary.totalStockUnits} unit`,
      `Total Omzet Penjualan (7 hari terakhir): Rp ${reports.summary.totalRevenue.toLocaleString("id-ID")}`,
      `Total Transaksi Penjualan (7 hari terakhir): ${reports.summary.totalTransactions} transaksi`,
      "",
      `=== PRODUK STOK KRITIS (${criticalItems.length} produk) ===`,
      criticalItems.length > 0 ? criticalItems.map(formatItem).join("\n") : "- Tidak ada produk dalam status kritis.",
      "",
      `=== PRODUK STOK MENIPIS / PERLU RESTOCK (${lowItems.length} produk) ===`,
      lowItems.length > 0 ? lowItems.map(formatItem).join("\n") : "- Tidak ada produk yang menipis.",
      "",
      `=== PRODUK STATUS AMAN (${normalItems.length} produk) ===`,
      normalItems.length > 0 ? normalItems.map(formatItem).join("\n") : "- Tidak ada.",
      "",
      `=== PRODUK MENUNGGU DATA PENJUALAN (${waitingItems.length} produk) ===`,
      waitingItems.length > 0 ? waitingItems.map(formatItem).join("\n") : "- Tidak ada.",
      "",
      `=== PRODUK TERLARIS (TOP SELLING 7 HARI) ===`,
      reports.topProducts.length > 0
        ? reports.topProducts
            .map(
              (p, idx) =>
                `${idx + 1}. ${p.name} (SKU: ${p.sku}) — Terjual: ${p.quantitySold} ${p.unit}, Total Omzet: Rp ${p.totalRevenue.toLocaleString("id-ID")}`
            )
            .join("\n")
        : "- Belum ada catatan produk terjual pada periode ini.",
    ];

    return contextLines.join("\n");
  } catch (err) {
    console.warn("[buildStoreContext] Failed to retrieve server context, using fallback context:", err);
    return "Nama Toko: Toko Anda (Mode Offline/Standby)\nStatus: Menunggu pembaruan koneksi database.";
  }
}

/**
 * Handles an interactive query from the store owner to the AI Business Assistant.
 */
export async function askBusinessAssistant(
  storeId: string,
  userMessage: string,
  chatHistory: AssistantMessage[] = []
): Promise<string> {
  const context = await buildStoreContext(storeId);

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";

  // Deterministic fallback if API key is not configured or in testing
  if (!apiKey || apiKey === "your-gemini-api-key") {
    return generateLocalAssistantFallback(userMessage, context);
  }

  // Format history
  const contents = [
    {
      role: "user",
      parts: [
        {
          text: `Berikut adalah data riil inventaris toko saya saat ini:\n\n${context}\n\nMohon bantu jawab pertanyaan saya berdasarkan data di atas secara profesional dan akurat.`,
        },
      ],
    },
    {
      role: "model",
      parts: [
        {
          text: "Baik, saya siap membantu menganalisis persediaan dan penjualan toko Anda berdasarkan data riil yang tercatat. Silakan ajukan pertanyaan Anda.",
        },
      ],
    },
    ...chatHistory.slice(-4).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    })),
    {
      role: "user",
      parts: [{ text: userMessage }],
    },
  ];

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
        contents,
        systemInstruction: {
          parts: [{ text: ASSISTANT_SYSTEM_INSTRUCTION }],
        },
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Assistant Gemini Error] Status: ${response.status}`);
      return generateLocalAssistantFallback(userMessage, context);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return generateLocalAssistantFallback(userMessage, context);
    }

    return text.trim();
  } catch (error) {
    console.warn("[Assistant Gemini Integration] Exception, falling back to local rule-engine:", error);
    return generateLocalAssistantFallback(userMessage, context);
  }
}

/**
 * Generates an intelligent deterministic response if the Gemini API is unreachable.
 */
export function generateLocalAssistantFallback(userMessage: string, context = ""): string {
  void context;
  const query = userMessage.toLowerCase();

  if (query.includes("restock") || query.includes("beli") || query.includes("kurang") || query.includes("kritis")) {
    return (
      "Berdasarkan data terkini toko Anda:\n\n" +
      "Produk yang perlu diprioritaskan untuk restock adalah produk dengan status **KRITIS** atau **MENIPIS** (berada pada atau di bawah titik Reorder Point / ROP). Anda dapat melihat rincian jumlah restock yang disarankan dan estimasi hari habis di menu **Inventaris** atau **Analisis AI**."
    );
  }

  if (query.includes("terlaris") || query.includes("banyak terjual") || query.includes("paling laku")) {
    return (
      "Berdasarkan ringkasan penjualan toko 7 hari terakhir, produk dengan volume transaksi tertinggi tercantum di menu **Laporan Bisnis**. Sistem merekam setiap barang keluar secara autoritatif di database PostgreSQL."
    );
  }

  if (query.includes("omzet") || query.includes("pendapatan") || query.includes("penjualan")) {
    return (
      "Seluruh pencatatan penjualan melalui modul Kasir (POS) tersimpan secara real-time. Anda dapat memantau ringkasan omzet harian dan mingguan langsung melalui kartu metrik utama di halaman **Ringkasan Toko**."
    );
  }

  return (
    "Terima kasih atas pertanyaan Anda. Asisten StokCerdas AI siap membantu memantau stok, ROP, dan riwayat penjualan toko Anda. " +
    "Silakan tanyakan hal spesifik seperti:\n- *Produk apa yang harus direstock hari ini?*\n- *Produk mana yang paling banyak terjual?*\n- *Mengapa produk tertentu berstatus kritis?*"
  );
}
