import { NextResponse } from "next/server";
import { requireStoreMember } from "@/lib/auth/session";
import { getInventoryOverview } from "@/services/inventory.service";

export async function GET() {
  try {
    const member = await requireStoreMember("view_inventory_analysis");
    const inventory = await getInventoryOverview(member.storeId);

    return NextResponse.json({
      data: inventory,
      message: "Data pemantauan inventaris berhasil dimuat",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memuat inventaris";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: { code: "FETCH_FAILED", message } }, { status });
  }
}

