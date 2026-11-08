import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateLocalAssistantFallback, askBusinessAssistant } from "../src/services/ai-assistant.service";

describe("AI Business Assistant — Section 12 Specification", () => {
  it("should answer restock questions using deterministic fallback rules", () => {
    const reply = generateLocalAssistantFallback("Produk apa yang harus direstock hari ini?");

    assert.ok(reply.length > 0);
    assert.ok(reply.toLowerCase().includes("restock") || reply.toLowerCase().includes("kritis"));
  });

  it("should answer top selling query using fallback rules", () => {
    const reply = generateLocalAssistantFallback("Produk mana yang paling banyak terjual?");

    assert.ok(reply.length > 0);
    assert.ok(reply.toLowerCase().includes("penjualan") || reply.toLowerCase().includes("laporan"));
  });

  it("should answer general inventory health questions", () => {
    const reply = generateLocalAssistantFallback("Bagaimana omzet dan pendapatan toko?");

    assert.ok(reply.length > 0);
    assert.ok(reply.toLowerCase().includes("omzet") || reply.toLowerCase().includes("penjualan"));
  });

  it("askBusinessAssistant handles calls gracefully even outside server context", async () => {
    const reply = await askBusinessAssistant("dummy-store", "Tolong berikan rekomendasi restock.");
    assert.ok(reply.length > 0);
  });
});

