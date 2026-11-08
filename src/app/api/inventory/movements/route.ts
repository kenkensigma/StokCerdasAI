import { NextResponse, type NextRequest } from "next/server";
import { requireStoreMember } from "@/lib/auth/session";
import { getStockMovements } from "@/services/inventory.service";

export async function GET(request: NextRequest) {
  try {
    const member = await requireStoreMember("view_inventory_analysis");
    const { searchParams } = new URL(request.url);

    const productId = searchParams.get("productId") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;

    const movements = await getStockMovements(member.storeId, { productId, limit });

    return NextResponse.json({
      data: movements,
      message: "Riwayat pergerakan stok berhasil dimuat",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memuat mutasi stok";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: { code: "FETCH_FAILED", message } }, { status });
  }
}

