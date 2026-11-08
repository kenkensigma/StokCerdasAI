import { createClient } from "@/lib/supabase/server";

export interface TopProductReportItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface StockMovementSummary {
  stockInUnits: number;
  stockOutUnits: number;
  adjustmentUnits: number;
  reversalUnits: number;
}

export interface BusinessReportData {
  periodDays: number;
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    averageTransactionValue: number;
    totalStockUnits: number;
    estimatedInventoryAssetValue: number;
  };
  topProducts: TopProductReportItem[];
  movements: StockMovementSummary;
  recentSales: Array<{
    id: string;
    transactionNumber: string;
    transactionDate: string;
    totalAmount: number;
    itemCount: number;
  }>;
}

/**
 * Generates comprehensive business performance & stock movement reports
 * for a store over a given time window (e.g., 1 day, 7 days, 30 days, 90 days).
 */
export async function getStoreReports(
  storeId: string,
  periodDays = 7
): Promise<BusinessReportData> {
  const supabase = await createClient();

  const periodDaysSafe = Math.max(1, periodDays);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDaysSafe);
  const startDateIso = startDate.toISOString();

  // 1. Fetch completed sales within period
  const { data: sales, error: salesError } = await supabase
    .from("sales")
    .select(`
      id,
      transaction_number,
      transaction_date,
      total_amount,
      status,
      sale_items (
        id,
        product_id,
        quantity,
        subtotal,
        products (
          id,
          name,
          sku,
          unit,
          cost_price
        )
      )
    `)
    .eq("store_id", storeId)
    .eq("status", "COMPLETED")
    .gte("transaction_date", startDateIso)
    .order("transaction_date", { ascending: false });

  if (salesError) {
    throw new Error("Gagal memuat laporan transaksi: " + salesError.message);
  }

  const validSales = sales || [];
  let totalRevenue = 0;
  const productAggMap = new Map<
    string,
    { name: string; sku: string; unit: string; quantitySold: number; totalRevenue: number }
  >();

  const recentSalesList: Array<{
    id: string;
    transactionNumber: string;
    transactionDate: string;
    totalAmount: number;
    itemCount: number;
  }> = [];

  for (const sale of validSales) {
    const saleAmount = Number(sale.total_amount);
    totalRevenue += saleAmount;

    const items = sale.sale_items || [];
    let itemCount = 0;

    for (const item of items) {
      const qty = Number(item.quantity);
      const subtotal = Number(item.subtotal);
      itemCount += qty;

      const p = item.products as unknown as {
        id: string;
        name: string;
        sku: string;
        unit: string;
        cost_price: number;
      } | null;

      if (p) {
        const existing = productAggMap.get(p.id) || {
          name: p.name,
          sku: p.sku,
          unit: p.unit,
          quantitySold: 0,
          totalRevenue: 0,
        };

        existing.quantitySold += qty;
        existing.totalRevenue += subtotal;
        productAggMap.set(p.id, existing);
      }
    }

    if (recentSalesList.length < 10) {
      recentSalesList.push({
        id: sale.id,
        transactionNumber: sale.transaction_number,
        transactionDate: sale.transaction_date,
        totalAmount: saleAmount,
        itemCount,
      });
    }
  }

  const totalTransactions = validSales.length;
  const averageTransactionValue =
    totalTransactions > 0 ? Number((totalRevenue / totalTransactions).toFixed(0)) : 0;

  // Sort top products by quantity sold
  const topProducts: TopProductReportItem[] = Array.from(productAggMap.entries())
    .map(([id, agg]) => ({
      id,
      name: agg.name,
      sku: agg.sku,
      unit: agg.unit,
      quantitySold: agg.quantitySold,
      totalRevenue: agg.totalRevenue,
    }))
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 10);

  // 2. Fetch stock movements summary within period
  const { data: movementsData } = await supabase
    .from("stock_movements")
    .select("movement_type, quantity")
    .eq("store_id", storeId)
    .gte("created_at", startDateIso);

  const movements: StockMovementSummary = {
    stockInUnits: 0,
    stockOutUnits: 0,
    adjustmentUnits: 0,
    reversalUnits: 0,
  };

  if (movementsData) {
    for (const m of movementsData) {
      const qty = Number(m.quantity);
      if (m.movement_type === "IN") {
        movements.stockInUnits += qty;
      } else if (m.movement_type === "OUT") {
        movements.stockOutUnits += Math.abs(qty);
      } else if (m.movement_type === "ADJUSTMENT") {
        movements.adjustmentUnits += qty;
      } else if (m.movement_type === "REVERSAL") {
        movements.reversalUnits += qty;
      }
    }
  }

  // 3. Fetch active inventory asset valuation
  const { data: activeProducts } = await supabase
    .from("products")
    .select("current_stock, cost_price, selling_price")
    .eq("store_id", storeId)
    .is("archived_at", null);

  let totalStockUnits = 0;
  let estimatedInventoryAssetValue = 0;

  if (activeProducts) {
    for (const prod of activeProducts) {
      const stock = Number(prod.current_stock);
      const cost = Number(prod.cost_price) > 0 ? Number(prod.cost_price) : Number(prod.selling_price);
      totalStockUnits += stock;
      estimatedInventoryAssetValue += stock * cost;
    }
  }

  return {
    periodDays: periodDaysSafe,
    summary: {
      totalRevenue,
      totalTransactions,
      averageTransactionValue,
      totalStockUnits,
      estimatedInventoryAssetValue: Math.round(estimatedInventoryAssetValue),
    },
    topProducts,
    movements,
    recentSales: recentSalesList,
  };
}

