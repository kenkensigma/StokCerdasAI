import { NextResponse, type NextRequest } from "next/server";
import { requireStoreMember } from "@/lib/auth/session";
import { runStoreAiAnalysis } from "@/services/ai-analysis.service";

export async function POST(request: NextRequest) {
  try {
    const member = await requireStoreMember("view_inventory_analysis");

    let productId: string | undefined;
    try {
      const body = await request.json();
      if (body && typeof body.productId === "string") {
        productId = body.productId;
      }
    } catch {
      // Body is optional (refresh all)
    }

    const insights = await runStoreAiAnalysis(member.storeId, { productId });

    return NextResponse.json({
      data: insights,
      message: `Analisis AI berhasil diperbarui untuk ${insights.length} produk`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui analisis AI";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: { code: "ANALYSIS_FAILED", message } }, { status });
  }
}

