import { NextResponse } from "next/server";
import { getActiveStoreContext } from "@/lib/auth/session";
import { getSaleById } from "@/services/sales.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getActiveStoreContext();
    if (!context) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Sesi tidak valid atau telah berakhir" } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const data = await getSaleById(context.storeId, id);

    return NextResponse.json({
      data,
      message: "Detail transaksi berhasil dimuat",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transaksi tidak ditemukan";
    return NextResponse.json(
      { error: { code: "SALE_NOT_FOUND", message } },
      { status: 404 }
    );
  }
}
