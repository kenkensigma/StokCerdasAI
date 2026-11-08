import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { requireStoreMember } from "@/lib/auth/session";
import { recordStockAdjustment } from "@/services/inventory.service";

export async function POST(request: NextRequest) {
  try {
    const member = await requireStoreMember("adjust_stock");
    const body = await request.json();
    const result = await recordStockAdjustment(member.storeId, member.userId, body);

    return NextResponse.json(
      {
        data: result,
        message: "Penyesuaian stok berhasil disimpan",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Data penyesuaian stok tidak valid",
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Gagal melakukan penyesuaian stok";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: { code: "ADJUSTMENT_FAILED", message } }, { status });
  }
}

