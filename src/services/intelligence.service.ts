import { createClient } from "@/lib/supabase/server";
import {
  calculateInventoryMetrics,
  type DeterministicCalculationResult,
} from "@/lib/inventory-calculator";
import type { StockStatus } from "@/types/database.types";

export interface ProductIntelligenceItem extends DeterministicCalculationResult {
  id: string;
  name: string;
  sku: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  categoryId: string | null;
  categoryName: string | null;
  supplierId: string | null;
  supplierName: string | null;
  supplierLeadTimeDays: number;
  targetInventoryDays: number;
  suggestedRestockCost: number;
  hasEverSold: boolean;
}

export interface StoreIntelligenceSummary {
  totalProducts: number;
  criticalCount: number;
  lowCount: number;
  normalCount: number;
  waitingCount: number;
  collectingCount: number;
  totalRestockUnits: number;
  estimatedRestockCapital: number;
  calculatedPeriodDays: number;
}

export interface StoreIntelligenceResponse {
  summary: StoreIntelligenceSummary;
  items: ProductIntelligenceItem[];
}

/**
 * Service to compute deterministic inventory metrics for a store
 * per PROJECT_SPEC.md Section 10.
 */
export async function getStoreIntelligence(
  storeId: string,
  options: {
    periodDays?: number;
    categoryId?: string;
    statusFilter?: StockStatus | "ALL";
  } = {}
): Promise<StoreIntelligenceResponse> {
  const supabase = await createClient();
  const periodDays = Math.max(1, options.periodDays ?? 7);

  // 1. Fetch active products with category and supplier
  let productQuery = supabase
    .from("products")
    .select(`
      id,
      store_id,
      category_id,
      supplier_id,
      name,
      sku,
      unit,
      current_stock,
      safety_stock,
      target_inventory_days,
      cost_price,
      selling_price,
      categories (id, name),
      suppliers (id, name, lead_time_days)
    `)
    .eq("store_id", storeId)
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (options.categoryId) {
    productQuery = productQuery.eq("category_id", options.categoryId);
  }

  const { data: products, error: prodError } = await productQuery;
  if (prodError) {
    throw new Error("Gagal memuat data produk: " + prodError.message);
  }

  if (!products || products.length === 0) {
    return {
      summary: {
        totalProducts: 0,
        criticalCount: 0,
        lowCount: 0,
        normalCount: 0,
        waitingCount: 0,
        collectingCount: 0,
        totalRestockUnits: 0,
        estimatedRestockCapital: 0,
        calculatedPeriodDays: periodDays,
      },
      items: [],
    };
  }

  const productIds = products.map((p) => p.id);

  // 2. Identify products that have ever had ANY completed sale in history
  const { data: allEverSoldData } = await supabase
    .from("sale_items")
    .select(`
      product_id,
      sales!inner (status)
    `)
    .in("product_id", productIds)
    .eq("sales.status", "COMPLETED");

  const everSoldProductIds = new Set(allEverSoldData?.map((item) => item.product_id) || []);

  // 3. Fetch completed sales in the period window
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - periodDays);
  const cutoffIso = cutoffDate.toISOString();

  const { data: windowSalesData, error: salesError } = await supabase
    .from("sale_items")
    .select(`
      product_id,
      quantity,
      sales!inner (
        transaction_date,
        status
      )
    `)
    .in("product_id", productIds)
    .eq("sales.status", "COMPLETED")
    .gte("sales.transaction_date", cutoffIso);

  if (salesError) {
    throw new Error("Gagal memuat histori penjualan: " + salesError.message);
  }

  // 4. Group sales by product and date (YYYY-MM-DD)
  const productDailySales: Record<string, Record<string, number>> = {};
  for (const pid of productIds) {
    productDailySales[pid] = {};
  }

  if (windowSalesData) {
    for (const record of windowSalesData) {
      const pid = record.product_id;
      const rawDate = (record.sales as unknown as { transaction_date: string })?.transaction_date;
      if (!rawDate) continue;

      const dateStr = rawDate.split("T")[0]; // YYYY-MM-DD
      const qty = Number(record.quantity) || 0;

      if (!productDailySales[pid]) {
        productDailySales[pid] = {};
      }
      productDailySales[pid][dateStr] = (productDailySales[pid][dateStr] || 0) + qty;
    }
  }

  // 5. Compute deterministic metrics for each product
  const items: ProductIntelligenceItem[] = [];

  let criticalCount = 0;
  let lowCount = 0;
  let normalCount = 0;
  let waitingCount = 0;
  let collectingCount = 0;
  let totalRestockUnits = 0;
  let estimatedRestockCapital = 0;

  for (const p of products) {
    const cat = p.categories as unknown as { id: string; name: string } | null;
    const sup = p.suppliers as unknown as { id: string; name: string; lead_time_days: number } | null;

    const leadTimeDays = sup?.lead_time_days && sup.lead_time_days > 0 ? sup.lead_time_days : 3;
    const targetDays = p.target_inventory_days && p.target_inventory_days > 0 ? p.target_inventory_days : 7;
    const hasEverSold = everSoldProductIds.has(p.id);

    const metrics = calculateInventoryMetrics({
      currentStock: Number(p.current_stock) || 0,
      safetyStock: Number(p.safety_stock) || 0,
      targetInventoryDays: targetDays,
      supplierLeadTimeDays: leadTimeDays,
      periodDays,
      dailySalesMap: productDailySales[p.id] || {},
    });

    // If the product has never sold once in history, status is explicitly WAITING
    let finalStatus = metrics.status;
    let finalConfidence = metrics.confidenceLevel;

    if (!hasEverSold) {
      finalStatus = "WAITING";
      finalConfidence = "WAITING";
    }

    // Apply status filter if provided
    if (options.statusFilter && options.statusFilter !== "ALL" && finalStatus !== options.statusFilter) {
      continue;
    }

    const costPrice = Number(p.cost_price) || 0;
    const sellingPrice = Number(p.selling_price) || 0;
    const suggestedRestockCost = metrics.suggestedRestockQuantity * costPrice;

    // Track summary counts
    if (finalStatus === "CRITICAL") criticalCount++;
    else if (finalStatus === "LOW") lowCount++;
    else if (finalStatus === "NORMAL") normalCount++;
    else if (finalStatus === "WAITING") waitingCount++;
    else if (finalStatus === "COLLECTING") collectingCount++;

    totalRestockUnits += metrics.suggestedRestockQuantity;
    estimatedRestockCapital += suggestedRestockCost;

    items.push({
      ...metrics,
      status: finalStatus,
      confidenceLevel: finalConfidence,
      id: p.id,
      name: p.name,
      sku: p.sku,
      unit: p.unit,
      costPrice,
      sellingPrice,
      categoryId: cat?.id || null,
      categoryName: cat?.name || null,
      supplierId: sup?.id || null,
      supplierName: sup?.name || null,
      supplierLeadTimeDays: leadTimeDays,
      targetInventoryDays: targetDays,
      suggestedRestockCost,
      hasEverSold,
    });
  }

  // Sort by urgency: CRITICAL first, then LOW, then COLLECTING, then NORMAL, then WAITING
  const statusWeight: Record<StockStatus, number> = {
    CRITICAL: 1,
    LOW: 2,
    COLLECTING: 3,
    NORMAL: 4,
    WAITING: 5,
  };

  items.sort((a, b) => {
    const weightDiff = (statusWeight[a.status] || 99) - (statusWeight[b.status] || 99);
    if (weightDiff !== 0) return weightDiff;
    return a.name.localeCompare(b.name);
  });

  return {
    summary: {
      totalProducts: products.length,
      criticalCount,
      lowCount,
      normalCount,
      waitingCount,
      collectingCount,
      totalRestockUnits,
      estimatedRestockCapital,
      calculatedPeriodDays: periodDays,
    },
    items,
  };
}

/**
 * Get intelligence for a single product
 */
export async function getSingleProductIntelligence(
  storeId: string,
  productId: string,
  periodDays = 7
): Promise<ProductIntelligenceItem | null> {
  const result = await getStoreIntelligence(storeId, { periodDays });
  return result.items.find((item) => item.id === productId) || null;
}

