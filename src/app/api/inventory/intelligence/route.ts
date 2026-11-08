import { NextResponse, type NextRequest } from "next/server";
import { requireStoreMember } from "@/lib/auth/session";
import { getStoreIntelligence } from "@/services/intelligence.service";
import type { StockStatus } from "@/types/database.types";

export async function GET(request: NextRequest) {
  try {
    const member = await requireStoreMember("view_inventory_analysis");
    const { searchParams } = new URL(request.url);

    const periodDaysParam = searchParams.get("periodDays");
    const periodDays = periodDaysParam ? parseInt(periodDaysParam, 10) : 7;
    const categoryId = searchParams.get("categoryId") || undefined;
    const statusParam = searchParams.get("status") || "ALL";

    const intelligence = await getStoreIntelligence(member.storeId, {
      periodDays: isNaN(periodDays) ? 7 : periodDays,
      categoryId,
      statusFilter: statusParam as StockStatus | "ALL",
    });

    return NextResponse.json({
      data: intelligence,
      message: "Kalkulasi deterministik inventaris berhasil dimuat",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memuat analisis inventaris";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: { code: "FETCH_FAILED", message } }, { status });
  }
}

