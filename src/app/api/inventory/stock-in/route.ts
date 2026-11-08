import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { requireStoreMember } from "@/lib/auth/session";
import { recordStockIn } from "@/services/inventory.service";

export async function POST(request: NextRequest) {
  try {
    const member = await requireStoreMember("record_stock_in");
    const body = await request.json();
    const result = await recordStockIn(member.storeId, member.userId, body);

    return NextResponse.json(
      {
        data: result,
        message: "Barang masuk berhasil dicatat dan stok telah diperbarui",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Data barang masuk tidak valid",
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Gagal mencatat barang masuk";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: { code: "STOCK_IN_FAILED", message } }, { status });
  }
}

