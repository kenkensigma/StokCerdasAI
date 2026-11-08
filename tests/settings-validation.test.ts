import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { updateStoreSchema, createStaffSchema } from "../src/lib/validations/settings";

describe("Store Settings & Staff Creation Validation Schemas", () => {
  it("should validate valid store profile update payload", () => {
    const valid = updateStoreSchema.parse({
      name: "Toko Sembako Berkah Jaya",
      phone: "08123456789",
      address: "Jl. Hayam Wuruk No. 12, Denpasar",
    });

    assert.equal(valid.name, "Toko Sembako Berkah Jaya");
  });

  it("should reject store name shorter than 2 characters", () => {
    assert.throws(() => {
      updateStoreSchema.parse({
        name: "T",
      });
    });
  });

  it("should validate valid staff account creation payload", () => {
    const validStaff = createStaffSchema.parse({
      fullName: "Budi Santoso",
      email: "budi.kasir@tokoberkah.com",
      password: "password123",
    });

    assert.equal(validStaff.fullName, "Budi Santoso");
    assert.equal(validStaff.email, "budi.kasir@tokoberkah.com");
  });

  it("should reject staff password shorter than 8 characters", () => {
    assert.throws(() => {
      createStaffSchema.parse({
        fullName: "Budi Kasir",
        email: "budi@kasir.com",
        password: "12345",
      });
    });
  });

  it("should reject invalid email format for staff account", () => {
    assert.throws(() => {
      createStaffSchema.parse({
        fullName: "Budi Kasir",
        email: "not-an-email",
        password: "password123",
      });
    });
  });
});

