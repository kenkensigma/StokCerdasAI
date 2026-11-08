import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateInventoryMetrics,
  type DeterministicCalculationInput,
} from "../src/lib/inventory-calculator";

describe("Deterministic Inventory Calculator — Section 10 Specification", () => {
  it("should return WAITING status and zero metrics when there is no sales history", () => {
    const input: DeterministicCalculationInput = {
      currentStock: 25,
      safetyStock: 10,
      dailySalesMap: {},
      periodDays: 7,
      supplierLeadTimeDays: 3,
      targetInventoryDays: 7,
    };

    const result = calculateInventoryMetrics(input);

    assert.equal(result.status, "WAITING");
    assert.equal(result.confidenceLevel, "WAITING");
    assert.equal(result.totalQuantitySold, 0);
    assert.equal(result.averageDailySales, 0);
    assert.equal(result.estimatedStockoutDays, null);
    assert.equal(result.reorderPoint, 10); // 0 * 3 + 10
    assert.equal(result.suggestedRestockQuantity, 0);
  });

  it("should calculate Average Daily Sales correctly counting calendar days without sales as 0", () => {
    // 7-day period with sales on only 2 days: 10 units on day 1, 11 units on day 3 = 21 total
    // ADS = 21 / 7 = 3.00
    const input: DeterministicCalculationInput = {
      currentStock: 15,
      safetyStock: 5,
      periodDays: 7,
      supplierLeadTimeDays: 2,
      targetInventoryDays: 7,
      dailySalesMap: {
        "2026-11-01": 10,
        "2026-11-03": 11,
      },
    };

    const result = calculateInventoryMetrics(input);

    assert.equal(result.totalQuantitySold, 21);
    assert.equal(result.distinctDaysWithSales, 2);
    assert.equal(result.averageDailySales, 3);
    assert.equal(result.confidenceLevel, "LIMITED");
  });

  it("should calculate estimated stockout days and ROP accurately", () => {
    // Current stock = 30, ADS = 10, Lead time = 3 days, Safety stock = 10
    // Stockout days = 30 / 10 = 3 days
    // ROP = (10 * 3) + 10 = 40
    // Since current stock (30) <= ROP (40), status should be LOW or CRITICAL
    const input: DeterministicCalculationInput = {
      currentStock: 30,
      safetyStock: 10,
      periodDays: 7,
      supplierLeadTimeDays: 3,
      targetInventoryDays: 7,
      dailySalesMap: {
        "2026-11-01": 10,
        "2026-11-02": 10,
        "2026-11-03": 10,
        "2026-11-04": 10,
        "2026-11-05": 10,
        "2026-11-06": 10,
        "2026-11-07": 10,
      },
    };

    const result = calculateInventoryMetrics(input);

    assert.equal(result.averageDailySales, 10);
    assert.equal(result.estimatedStockoutDays, 3);
    assert.equal(result.reorderPoint, 40);
    assert.equal(result.confidenceLevel, "BETTER_DATA");
    // Stockout days (3) <= lead time (3) triggers CRITICAL urgency
    assert.equal(result.status, "CRITICAL");
  });

  it("should calculate suggested restock quantity using target inventory days", () => {
    // ADS = 10, Target days = 7, Safety stock = 10 => Target stock = (10 * 7) + 10 = 80
    // Current stock = 30 => Suggested restock = 80 - 30 = 50
    const input: DeterministicCalculationInput = {
      currentStock: 30,
      safetyStock: 10,
      periodDays: 7,
      supplierLeadTimeDays: 3,
      targetInventoryDays: 7,
      dailySalesMap: {
        "2026-11-01": 10,
        "2026-11-02": 10,
        "2026-11-03": 10,
        "2026-11-04": 10,
        "2026-11-05": 10,
        "2026-11-06": 10,
        "2026-11-07": 10,
      },
    };

    const result = calculateInventoryMetrics(input);

    assert.equal(result.targetStock, 80);
    assert.equal(result.suggestedRestockQuantity, 50);
  });

  it("should return 0 suggested restock if current stock exceeds target stock", () => {
    // Current stock = 100, Target stock = 80 => Suggested restock = max(0, 80 - 100) = 0
    const input: DeterministicCalculationInput = {
      currentStock: 100,
      safetyStock: 10,
      periodDays: 7,
      supplierLeadTimeDays: 3,
      targetInventoryDays: 7,
      dailySalesMap: {
        "2026-11-01": 10,
        "2026-11-02": 10,
        "2026-11-03": 10,
        "2026-11-04": 10,
        "2026-11-05": 10,
        "2026-11-06": 10,
        "2026-11-07": 10,
      },
    };

    const result = calculateInventoryMetrics(input);

    assert.equal(result.suggestedRestockQuantity, 0);
    assert.equal(result.status, "NORMAL");
  });

  it("should correctly identify CRITICAL status when stock is 0", () => {
    const input: DeterministicCalculationInput = {
      currentStock: 0,
      safetyStock: 10,
      periodDays: 7,
      dailySalesMap: {
        "2026-11-01": 5,
        "2026-11-02": 5,
        "2026-11-03": 5,
      },
    };

    const result = calculateInventoryMetrics(input);

    assert.equal(result.status, "CRITICAL");
  });
});

