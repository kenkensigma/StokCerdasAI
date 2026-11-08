import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  categorySchema,
  productSchema,
  productUpdateSchema,
  stockInSchema,
  stockAdjustmentSchema,
} from "../src/lib/validations/inventory";

const VALID_UUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

describe("Category Validation Schema", () => {
  it("should validate a valid category name", () => {
    const result = categorySchema.safeParse({ name: "Makanan Ringan" });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.name, "Makanan Ringan");
    }
  });

  it("should reject an empty category name", () => {
    const result = categorySchema.safeParse({ name: "" });
    assert.equal(result.success, false);
  });
});

describe("Product Validation Schema (Creation & Update Invariants)", () => {
  it("should accept valid product creation data and sanitize SKU", () => {
    const validData = {
      name: "Minyak Goreng Sawit 2L",
      sku: "myk-grg-2l",
      categoryId: VALID_UUID,
      description: "Minyak goreng kemasan pouch",
      initialStock: 25,
      unit: "pouch",
      costPrice: 28000,
      sellingPrice: 34000,
      safetyStock: 5,
      targetInventoryDays: 14,
    };

    const result = productSchema.safeParse(validData);
    assert.equal(result.success, true);
    if (result.success) {
      // SKU must be auto-uppercased
      assert.equal(result.data.sku, "MYK-GRG-2L");
      assert.equal(result.data.initialStock, 25);
    }
  });

  it("should reject negative initial stock", () => {
    const invalidData = {
      name: "Beras Rojolele 5kg",
      sku: "BRS-ROJO-5",
      initialStock: -10,
      costPrice: 60000,
      sellingPrice: 75000,
      safetyStock: 5,
      targetInventoryDays: 7,
    };

    const result = productSchema.safeParse(invalidData);
    assert.equal(result.success, false);
  });

  it("should reject negative selling price or cost price", () => {
    const invalidPrice = {
      name: "Gula Pasir 1kg",
      sku: "GLA-PSR-1K",
      initialStock: 10,
      costPrice: -500,
      sellingPrice: 15000,
      safetyStock: 2,
      targetInventoryDays: 7,
    };

    const result = productSchema.safeParse(invalidPrice);
    assert.equal(result.success, false);
  });

  it("should enforce product update schema does not allow current_stock or initial_stock mutations", () => {
    const updatePayload = {
      name: "Minyak Goreng Premium 2L",
      costPrice: 29000,
      sellingPrice: 35000,
      safetyStock: 8,
      targetInventoryDays: 10,
      // Attempting to directly alter stock outside of movements
      currentStock: 9999,
      initialStock: 8888,
    };

    const result = productUpdateSchema.safeParse(updatePayload);
    assert.equal(result.success, true);
    if (result.success) {
      // Stripped or absent from the validated payload
      assert.equal("currentStock" in result.data, false);
      assert.equal("initialStock" in result.data, false);
    }
  });
});

describe("Stock Movement & Adjustment Validation", () => {
  it("should validate a valid Stock-IN payload", () => {
    const payload = {
      productId: VALID_UUID,
      quantity: 50,
      notes: "Pengiriman supplier PT Sumber Rejeki",
    };

    const result = stockInSchema.safeParse(payload);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.quantity, 50);
    }
  });

  it("should reject zero or negative quantity for Stock-IN", () => {
    const zeroPayload = {
      productId: VALID_UUID,
      quantity: 0,
    };
    const negativePayload = {
      productId: VALID_UUID,
      quantity: -5,
    };

    assert.equal(stockInSchema.safeParse(zeroPayload).success, false);
    assert.equal(stockInSchema.safeParse(negativePayload).success, false);
  });

  it("should validate Stock Adjustment with reason", () => {
    const payload = {
      productId: VALID_UUID,
      newStock: 18,
      reason: "Hasil stock opname fisik akhir bulan ditemukan selisih",
    };

    const result = stockAdjustmentSchema.safeParse(payload);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.newStock, 18);
    }
  });

  it("should reject Stock Adjustment with negative stock or empty reason", () => {
    const negativeStock = {
      productId: VALID_UUID,
      newStock: -1,
      reason: "Barang hilang",
    };

    const missingReason = {
      productId: VALID_UUID,
      newStock: 10,
      reason: "a", // too short (min 3 chars)
    };

    assert.equal(stockAdjustmentSchema.safeParse(negativeStock).success, false);
    assert.equal(stockAdjustmentSchema.safeParse(missingReason).success, false);
  });
});
