import { createClient } from "@/lib/supabase/server";
import { stockInSchema, stockAdjustmentSchema, type StockInInput, type StockAdjustmentInput } from "@/lib/validations/inventory";
import { getStoreIntelligence } from "@/services/intelligence.service";
import type { DataConfidenceLevel } from "@/lib/inventory-calculator";
import type { StockStatus } from "@/types/database.types";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
  currentStock: number;
  current_stock: number;
  safetyStock: number;
  safety_stock: number;
  reorderPoint: number;
  averageDailySales: number;
  estimatedStockoutDays: number | null;
  suggestedRestockQuantity: number;
  confidenceLevel: DataConfidenceLevel;
  categoryName?: string;
  status: StockStatus;
  urgencyExplanation: string;
}

export async function getInventoryOverview(storeId: string): Promise<InventoryItem[]> {
  const intelligence = await getStoreIntelligence(storeId, { periodDays: 7 });

  return intelligence.items.map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    unit: item.unit,
    currentStock: item.currentStock,
    current_stock: item.currentStock,
    safetyStock: item.safetyStock,
    safety_stock: item.safetyStock,
    reorderPoint: item.reorderPoint,
    averageDailySales: item.averageDailySales,
    estimatedStockoutDays: item.estimatedStockoutDays,
    suggestedRestockQuantity: item.suggestedRestockQuantity,
    confidenceLevel: item.confidenceLevel,
    categoryName: item.categoryName || undefined,
    status: item.status,
    urgencyExplanation: item.urgencyExplanation,
  }));
}

export async function getStockMovements(
  storeId: string,
  options: { productId?: string; limit?: number } = {}
) {
  const supabase = await createClient();

  let query = supabase
    .from("stock_movements")
    .select(`
      id,
      store_id,
      product_id,
      user_id,
      movement_type,
      quantity,
      reference_id,
      note,
      created_at,
      products(id, name, sku, unit),
      profiles(id, full_name)
    `)
    .eq("store_id", storeId);

  if (options.productId) {
    query = query.eq("product_id", options.productId);
  }

  const limit = options.limit || 50;
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error("Gagal memuat riwayat mutasi stok: " + error.message);
  }

  return data || [];
}

export async function recordStockIn(storeId: string, userId: string, input: StockInInput) {
  const validated = stockInSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("record_stock_in", {
    p_store_id: storeId,
    p_product_id: validated.productId,
    p_quantity: validated.quantity,
    p_user_id: userId,
    p_note: validated.notes || null,
  });

  if (error) {
    throw new Error("Gagal mencatat barang masuk: " + error.message);
  }

  return data;
}

export async function recordStockAdjustment(storeId: string, userId: string, input: StockAdjustmentInput) {
  const validated = stockAdjustmentSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("record_stock_adjustment", {
    p_store_id: storeId,
    p_product_id: validated.productId,
    p_new_stock: validated.newStock,
    p_user_id: userId,
    p_reason: validated.reason,
  });

  if (error) {
    throw new Error("Gagal mencatat penyesuaian stok: " + error.message);
  }

  return data;
}

