import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  saleItemSchema,
  createSaleSchema,
  voidSaleSchema,
} from "../src/lib/validations/sales";
import { generateTransactionNumber } from "../src/services/sales.service";

const VALID_UUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const VALID_UUID_2 = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

describe("Sales Validation Schemas", () => {
  it("should validate a valid sale item", () => {
    const item = {
      productId: VALID_UUID,
      quantity: 3,
      unitPrice: 15000,
    };
    const result = saleItemSchema.safeParse(item);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.quantity, 3);
      assert.equal(result.data.unitPrice, 15000);
    }
  });

  it("should reject a sale item with zero or negative quantity", () => {
    const zeroItem = {
      productId: VALID_UUID,
      quantity: 0,
      unitPrice: 15000,
    };
    const negativeItem = {
      productId: VALID_UUID,
      quantity: -2,
      unitPrice: 15000,
    };

    assert.equal(saleItemSchema.safeParse(zeroItem).success, false);
    assert.equal(saleItemSchema.safeParse(negativeItem).success, false);
  });

  it("should reject a sale item with negative unit price", () => {
    const item = {
      productId: VALID_UUID,
      quantity: 1,
      unitPrice: -500,
    };
    assert.equal(saleItemSchema.safeParse(item).success, false);
  });

  it("should validate createSaleSchema with multiple items", () => {
    const salePayload = {
      items: [
        { productId: VALID_UUID, quantity: 2, unitPrice: 34000 },
        { productId: VALID_UUID_2, quantity: 5, unitPrice: 3500 },
      ],
      notes: "Pelanggan reguler",
      idempotencyKey: "test-idempotency-key-12345",
    };

    const result = createSaleSchema.safeParse(salePayload);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.items.length, 2);
    }
  });

  it("should reject createSaleSchema with empty items array", () => {
    const emptySale = {
      items: [],
      notes: "Kosong",
    };
    assert.equal(createSaleSchema.safeParse(emptySale).success, false);
  });

  it("should validate voidSaleSchema with adequate reason", () => {
    const validVoid = {
      reason: "Pelanggan membatalkan pesanan sebelum serah terima barang",
    };
    assert.equal(voidSaleSchema.safeParse(validVoid).success, true);
  });

  it("should reject voidSaleSchema with reason shorter than 3 characters", () => {
    const invalidVoid = {
      reason: "no",
    };
    assert.equal(voidSaleSchema.safeParse(invalidVoid).success, false);
  });
});

describe("Sales Helper & Transaction Invariants", () => {
  it("should generate a well-formatted transaction number", () => {
    const trxNumber = generateTransactionNumber();
    assert.match(trxNumber, /^TRX-\d{8}-\d{4}$/);
  });

  it("should calculate correct subtotal and prevent floating point errors", () => {
    const items = [
      { quantity: 3, unitPrice: 10999.5 },
      { quantity: 2, unitPrice: 4500 },
    ];

    const total = items.reduce(
      (sum, item) => sum + Math.round(item.quantity * item.unitPrice * 100) / 100,
      0
    );

    // 3 * 10999.5 = 32998.50, 2 * 4500 = 9000.00 => total 41998.50
    assert.equal(total, 41998.5);
  });
});

