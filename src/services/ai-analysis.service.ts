import { createClient } from "@/lib/supabase/server";
import { getStoreIntelligence } from "@/services/intelligence.service";
import { analyzeProductWithGemini } from "@/services/gemini.service";
import type { AiInsightInput, AiInsightResponse } from "@/lib/validations/ai";
import type { AiInsightStatus, Json } from "@/types/database.types";

export interface StoredAiInsight {
  id: string;
  storeId: string;
  productId: string;
  productName: string;
  productSku: string;
  productUnit: string;
  categoryName: string | null;
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  averageDailySales: number;
  estimatedStockoutDays: number | null;
  suggestedRestockQuantity: number;
  modelName: string;
  status: AiInsightStatus;
  analysisInput: AiInsightInput;
  analysisResult: AiInsightResponse;
  createdAt: string;
  isFallback?: boolean;
}

/**
 * Executes an AI analysis cycle for a store or a single product.
 * Fetches deterministic inventory metrics, calls Gemini, and persists to ai_insights table.
 */
export async function runStoreAiAnalysis(
  storeId: string,
  options: { productId?: string; maxBatchSize?: number } = {}
): Promise<StoredAiInsight[]> {
  const supabase = await createClient();
  const maxBatch = options.maxBatchSize ?? 12;

  // 1. Get deterministic calculations
  const intelligence = await getStoreIntelligence(storeId, { periodDays: 7 });

  let targetItems = intelligence.items;
  if (options.productId) {
    targetItems = targetItems.filter((item) => item.id === options.productId);
  } else {
    // Prioritize products that are CRITICAL, LOW, or have active sales
    targetItems = targetItems.slice(0, maxBatch);
  }

  if (targetItems.length === 0) {
    return [];
  }

  const results: StoredAiInsight[] = [];

  for (const item of targetItems) {
    const inputPayload: AiInsightInput = {
      productId: item.id,
      productName: item.name,
      currentStock: item.currentStock,
      unit: item.unit,
      salesLast7Days: item.totalQuantitySold,
      averageDailySales: item.averageDailySales,
      estimatedStockoutDays: item.estimatedStockoutDays,
      reorderPoint: item.reorderPoint,
      supplierLeadTimeDays: item.supplierLeadTimeDays,
      safetyStock: item.safetyStock,
      suggestedRestockQuantity: item.suggestedRestockQuantity,
      dataCoverage: {
        daysWithSalesHistory: item.distinctDaysWithSales,
        periodDays: item.periodDays,
        level: item.confidenceLevel,
      },
    };

    // Analyze with Gemini (or deterministic fallback)
    const { insight, modelName, isFallback } = await analyzeProductWithGemini(inputPayload);

    const insightStatus: AiInsightStatus = isFallback ? "COMPLETED" : "COMPLETED";

    // Persist snapshot to ai_insights table
    const { data: inserted, error: insertError } = await supabase
      .from("ai_insights")
      .insert({
        store_id: storeId,
        product_id: item.id,
        analysis_input: inputPayload as unknown as Json,
        analysis_result: insight as unknown as Json,
        model_name: modelName,
        status: insightStatus,
        error_message: null,
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      console.error("[AI Analysis] Failed to persist insight:", insertError.message);
    }

    results.push({
      id: inserted?.id || `temp-${item.id}`,
      storeId,
      productId: item.id,
      productName: item.name,
      productSku: item.sku,
      productUnit: item.unit,
      categoryName: item.categoryName,
      currentStock: item.currentStock,
      safetyStock: item.safetyStock,
      reorderPoint: item.reorderPoint,
      averageDailySales: item.averageDailySales,
      estimatedStockoutDays: item.estimatedStockoutDays,
      suggestedRestockQuantity: item.suggestedRestockQuantity,
      modelName,
      status: insightStatus,
      analysisInput: inputPayload,
      analysisResult: insight,
      createdAt: inserted?.created_at || new Date().toISOString(),
      isFallback,
    });
  }

  return results;
}

/**
 * Fetches the latest AI insights for a store.
 * If no insights exist yet, automatically runs the initial analysis.
 */
export async function getLatestStoreAiInsights(
  storeId: string
): Promise<{
  insights: StoredAiInsight[];
  summary: {
    totalAnalyzed: number;
    criticalCount: number;
    lowCount: number;
    normalCount: number;
    waitingCount: number;
    lastAnalyzedAt: string | null;
  };
}> {
  const supabase = await createClient();

  // Query latest insights from ai_insights table with joined product info
  const { data: rows, error } = await supabase
    .from("ai_insights")
    .select(`
      id,
      store_id,
      product_id,
      analysis_input,
      analysis_result,
      model_name,
      status,
      error_message,
      created_at,
      products (
        id,
        name,
        sku,
        unit,
        current_stock,
        safety_stock,
        category_id,
        categories (name)
      )
    `)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[getLatestStoreAiInsights] Query error:", error.message);
  }

  // Deduplicate to keep only the most recent insight per product_id
  const seenProductIds = new Set<string>();
  const latestInsights: StoredAiInsight[] = [];

  if (rows && rows.length > 0) {
    for (const row of rows) {
      if (!row.product_id || seenProductIds.has(row.product_id)) continue;
      seenProductIds.add(row.product_id);

      const product = row.products as unknown as {
        id: string;
        name: string;
        sku: string;
        unit: string;
        current_stock: number;
        safety_stock: number;
        categories: { name: string } | null;
      } | null;

      const input = row.analysis_input as unknown as AiInsightInput;
      const result = row.analysis_result as unknown as AiInsightResponse;

      if (!input || !result) continue;

      latestInsights.push({
        id: row.id,
        storeId: row.store_id,
        productId: row.product_id,
        productName: product?.name || input.productName,
        productSku: product?.sku || "SKU",
        productUnit: product?.unit || input.unit,
        categoryName: product?.categories?.name || null,
        currentStock: Number(product?.current_stock ?? input.currentStock),
        safetyStock: Number(product?.safety_stock ?? input.safetyStock),
        reorderPoint: input.reorderPoint,
        averageDailySales: input.averageDailySales,
        estimatedStockoutDays: input.estimatedStockoutDays,
        suggestedRestockQuantity: input.suggestedRestockQuantity,
        modelName: row.model_name,
        status: row.status as AiInsightStatus,
        analysisInput: input,
        analysisResult: result,
        createdAt: row.created_at,
      });
    }
  }

  // If no insights were ever generated, run the initial batch now
  if (latestInsights.length === 0) {
    const generated = await runStoreAiAnalysis(storeId);
    latestInsights.push(...generated);
  }

  // Calculate summary counts
  let criticalCount = 0;
  let lowCount = 0;
  let normalCount = 0;
  let waitingCount = 0;

  for (const item of latestInsights) {
    const st = item.analysisResult?.status;
    if (st === "CRITICAL") criticalCount++;
    else if (st === "LOW") lowCount++;
    else if (st === "NORMAL") normalCount++;
    else waitingCount++;
  }

  return {
    insights: latestInsights,
    summary: {
      totalAnalyzed: latestInsights.length,
      criticalCount,
      lowCount,
      normalCount,
      waitingCount,
      lastAnalyzedAt: latestInsights[0]?.createdAt || null,
    },
  };
}
