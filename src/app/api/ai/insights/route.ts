import { NextResponse } from "next/server";
import { requireStoreMember } from "@/lib/auth/session";
import { getLatestStoreAiInsights } from "@/services/ai-analysis.service";

export async function GET() {
  try {
    const member = await requireStoreMember("view_inventory_analysis");
    const result = await getLatestStoreAiInsights(member.storeId);

    return NextResponse.json({
      data: result,
      message: "Data analisis AI berhasil dimuat",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memuat analisis AI";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: { code: "FETCH_FAILED", message } }, { status });
  }
}

