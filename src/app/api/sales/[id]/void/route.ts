import { NextResponse } from "next/server";
import { getActiveStoreContext } from "@/lib/auth/session";
import { voidSale } from "@/services/sales.service";
import { ZodError } from "zod";

export async function POST(
  request: Request,
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

    // Role check: Only OWNER can void transactions
    if (context.role !== "OWNER") {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "Hanya pemilik toko (OWNER) yang berhak membatalkan transaksi penjualan",
          },
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const result = await voidSale(context.storeId, context.userId, id, body);

    return NextResponse.json({
      data: result,
      message: "Transaksi berhasil dibatalkan dan stok telah dipulihkan",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: error.issues[0]?.message || "Alasan pembatalan tidak valid",
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Gagal membatalkan transaksi";
    return NextResponse.json(
      { error: { code: "VOID_FAILED", message } },
      { status: 400 }
    );
  }
}

