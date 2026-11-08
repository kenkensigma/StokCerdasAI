import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema, loginSchema } from "../src/lib/validations/auth";

test("registerSchema accepts valid registration data", () => {
  const result = registerSchema.safeParse({
    ownerName: "Budi Santoso",
    storeName: "Toko Sembako Berkah",
    email: "budi@tokoberkah.com",
    password: "Password123!",
    confirmPassword: "Password123!",
  });

  assert.strictEqual(result.success, true);
  if (result.success) {
    assert.strictEqual(result.data.email, "budi@tokoberkah.com");
    assert.strictEqual(result.data.ownerName, "Budi Santoso");
    assert.strictEqual(result.data.storeName, "Toko Sembako Berkah");
  }
});

test("registerSchema rejects mismatched confirmPassword", () => {
  const result = registerSchema.safeParse({
    ownerName: "Budi Santoso",
    storeName: "Toko Sembako Berkah",
    email: "budi@tokoberkah.com",
    password: "Password123!",
    confirmPassword: "DifferentPassword!",
  });

  assert.strictEqual(result.success, false);
  if (!result.success) {
    const errorMessages = result.error.flatten().fieldErrors.confirmPassword;
    assert.ok(errorMessages && errorMessages.length > 0);
    assert.ok(errorMessages[0].includes("cocok"));
  }
});

test("registerSchema rejects password shorter than 8 characters", () => {
  const result = registerSchema.safeParse({
    ownerName: "Budi Santoso",
    storeName: "Toko Sembako Berkah",
    email: "budi@tokoberkah.com",
    password: "short",
    confirmPassword: "short",
  });

  assert.strictEqual(result.success, false);
});

test("registerSchema rejects invalid email format", () => {
  const result = registerSchema.safeParse({
    ownerName: "Budi Santoso",
    storeName: "Toko Sembako Berkah",
    email: "invalid-email-without-at",
    password: "Password123!",
    confirmPassword: "Password123!",
  });

  assert.strictEqual(result.success, false);
});

test("loginSchema accepts valid login input", () => {
  const result = loginSchema.safeParse({
    email: "owner@retail.id",
    password: "SecretPassword123",
  });

  assert.strictEqual(result.success, true);
});

test("loginSchema rejects missing password", () => {
  const result = loginSchema.safeParse({
    email: "owner@retail.id",
    password: "",
  });

  assert.strictEqual(result.success, false);
});

