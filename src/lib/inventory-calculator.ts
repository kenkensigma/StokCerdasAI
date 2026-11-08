import type { StockStatus } from "@/types/database.types";

export type DataConfidenceLevel = "WAITING" | "LIMITED" | "EARLY" | "BETTER_DATA";

export interface DeterministicCalculationInput {
  currentStock: number;
  safetyStock: number;
  targetInventoryDays?: number; // Default: 7
  supplierLeadTimeDays?: number; // Default: 3
  periodDays?: number; // Window size in calendar days (e.g., 7, 14, 30). Default: 7
  dailySalesMap: Record<string, number>; // YYYY-MM-DD -> quantity sold
}

export interface DeterministicCalculationResult {
  currentStock: number;
  safetyStock: number;
  totalQuantitySold: number;
  distinctDaysWithSales: number;
  periodDays: number;
  averageDailySales: number;
  estimatedStockoutDays: number | null;
  reorderPoint: number;
  targetStock: number;
  suggestedRestockQuantity: number;
  confidenceLevel: DataConfidenceLevel;
  status: StockStatus;
  urgencyExplanation: string;
}

/**
 * Calculates deterministic inventory metrics per PROJECT_SPEC.md Section 10.
 * Pure mathematical functions — NO AI dependencies or side effects.
 */
export function calculateInventoryMetrics(
  input: DeterministicCalculationInput
): DeterministicCalculationResult {
  const periodDays = Math.max(1, input.periodDays ?? 7);
  const targetDays = Math.max(1, input.targetInventoryDays ?? 7);
  const leadTimeDays = Math.max(1, input.supplierLeadTimeDays ?? 3);
  const safetyStock = Math.max(0, input.safetyStock);
  const currentStock = Math.max(0, input.currentStock);

  // 1. Calculate sales metrics over the window
  const salesEntries = Object.entries(input.dailySalesMap || {});
  let totalQuantitySold = 0;
  let distinctDaysWithSales = 0;

  for (const [, qty] of salesEntries) {
    if (qty > 0) {
      totalQuantitySold += qty;
      distinctDaysWithSales += 1;
    }
  }

  // 2. Average Daily Sales = Total Quantity Sold / Number of Days
  // Calendar days without sales count as 0
  const averageDailySales = Number((totalQuantitySold / periodDays).toFixed(2));

  // 3. Data Confidence Level per PROJECT_SPEC.md Section 10.5
  let confidenceLevel: DataConfidenceLevel = "WAITING";
  if (distinctDaysWithSales === 0) {
    confidenceLevel = "WAITING";
  } else if (distinctDaysWithSales <= 2) {
    confidenceLevel = "LIMITED";
  } else if (distinctDaysWithSales <= 6) {
    confidenceLevel = "EARLY";
  } else {
    confidenceLevel = "BETTER_DATA";
  }

  // 4. Estimated Days Until Stockout = Current Stock / Average Daily Sales
  let estimatedStockoutDays: number | null = null;
  if (averageDailySales > 0) {
    estimatedStockoutDays = Number((currentStock / averageDailySales).toFixed(1));
  }

  // 5. Reorder Point (ROP) = (Average Daily Sales × Supplier Lead Time) + Safety Stock
  const reorderPoint = Math.ceil(averageDailySales * leadTimeDays + safetyStock);

  // 6. Suggested Restock Quantity
  // Target Stock = (Average Daily Sales × Target Inventory Days) + Safety Stock
  const targetStock = Math.ceil(averageDailySales * targetDays + safetyStock);
  const suggestedRestockQuantity = Math.max(0, targetStock - currentStock);

  // 7. Stock Status Derivation per PROJECT_SPEC.md Section 8.4 & 10
  let status: StockStatus = "NORMAL";
  let urgencyExplanation = "Stok dalam kondisi optimal di atas titik pemesanan kembali.";

  if (confidenceLevel === "WAITING") {
    status = "WAITING";
    urgencyExplanation = "Belum ada histori penjualan. Menunggu transaksi pertama dicatat.";
  } else if (currentStock <= 0) {
    status = "CRITICAL";
    urgencyExplanation = "Stok fisik telah habis (0). Segera lakukan pemesanan barang masuk.";
  } else if (
    estimatedStockoutDays !== null &&
    estimatedStockoutDays <= leadTimeDays
  ) {
    status = "CRITICAL";
    urgencyExplanation = `Stok diperkirakan habis dalam ${estimatedStockoutDays} hari, lebih singkat dari waktu tunggu supplier (${leadTimeDays} hari).`;
  } else if (currentStock <= Math.max(1, safetyStock * 0.5)) {
    status = "CRITICAL";
    urgencyExplanation = "Stok telah menembus batas kritis di bawah 50% safety stock.";
  } else if (currentStock <= reorderPoint) {
    status = "LOW";
    urgencyExplanation = `Stok (${currentStock}) telah menyentuh atau berada di bawah Reorder Point (${reorderPoint}). Perlu segera restock.`;
  } else if (confidenceLevel === "LIMITED") {
    status = "COLLECTING";
    urgencyExplanation = "Histori penjualan masih terbatas (1–2 hari). Status bersifat sementara.";
  } else {
    status = "NORMAL";
    urgencyExplanation = "Persediaan mencukupi untuk memenuhi kebutuhan penjualan harian.";
  }

  return {
    currentStock,
    safetyStock,
    totalQuantitySold,
    distinctDaysWithSales,
    periodDays,
    averageDailySales,
    estimatedStockoutDays,
    reorderPoint,
    targetStock,
    suggestedRestockQuantity,
    confidenceLevel,
    status,
    urgencyExplanation,
  };
}

