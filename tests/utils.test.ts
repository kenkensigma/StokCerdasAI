import test from "node:test";
import assert from "node:assert/strict";
import { formatRupiah, formatQuantity, formatDate } from "../src/lib/utils/format";
import { hasPermission } from "../src/lib/permissions/roles";

test("formatRupiah formats currency correctly", () => {
  const result = formatRupiah(25000);
  assert.ok(result.includes("25.000"));
});

test("formatQuantity formats quantities with and without units", () => {
  assert.strictEqual(formatQuantity(10, "pcs"), "10 pcs");
  assert.strictEqual(formatQuantity(0, "kg"), "0 kg");
});

test("formatDate formats valid date string", () => {
  const dateStr = "2026-11-07T10:00:00.000Z";
  const formatted = formatDate(dateStr);
  assert.ok(formatted.length > 0);
  assert.notStrictEqual(formatted, "-");
});

test("hasPermission enforces role boundaries", () => {
  // OWNER permissions
  assert.strictEqual(hasPermission("OWNER", "manage_products"), true);
  assert.strictEqual(hasPermission("OWNER", "record_sales"), true);
  assert.strictEqual(hasPermission("OWNER", "void_sales"), true);

  // STAFF permissions
  assert.strictEqual(hasPermission("STAFF", "record_sales"), true);
  assert.strictEqual(hasPermission("STAFF", "view_products"), true);
  assert.strictEqual(hasPermission("STAFF", "manage_products"), false);
  assert.strictEqual(hasPermission("STAFF", "void_sales"), false);
  assert.strictEqual(hasPermission("STAFF", "adjust_stock"), false);
});
