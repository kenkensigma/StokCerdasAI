import { NextResponse } from "next/server";
import { getActiveStoreContext } from "@/lib/auth/session";
import { getSales, recordSale } from "@/services/sales.service";
import { runStoreAiAnalysis } from "@/services/ai-analysis.service";
import { ZodError } from "zod";

export async function GET(request: Request) {
  try {
    const context = await getActiveStoreContext();
    if (!context) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Sesi tidak valid atau telah berakhir" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as "COMPLETED" | "VOIDED" | null;
    const search = searchParams.get("search") || undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;

    const data = await getSales(context.storeId, {
      status: status || undefined,
      search,
      limit,
    });

    return NextResponse.json({
      data,
      message: "Data transaksi penjualan berhasil dimuat",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memuat data penjualan";
    return NextResponse.json(
      { error: { code: "SALES_FETCH_FAILED", message } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await getActiveStoreContext();
    if (!context) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Sesi tidak valid atau telah berakhir" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = await recordSale(context.storeId, context.userId, body);

    // Non-blocking background AI insight refresh for affected items per docs/ai-integration.md Section 3
    // AI failure must never delay or fail the sales transaction.
    if (body?.items && Array.isArray(body.items) && body.items.length > 0) {
      const firstProductId = body.items[0]?.productId;
      if (firstProductId) {
        runStoreAiAnalysis(context.storeId, { productId: firstProductId }).catch((err) =>
          console.warn("[Sales AI Trigger] Non-blocking background analysis note:", err)
        );
      }
    }

    return NextResponse.json(
      {
        data: result,
        message: "Transaksi penjualan berhasil dicatat dan stok telah diperbarui",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: error.issues[0]?.message || "Data input transaksi tidak valid",
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Gagal mencatat transaksi penjualan";
    return NextResponse.json(
      { error: { code: "SALE_CREATION_FAILED", message } },
      { status: 400 }
    );
  }
}
