import { NextResponse, type NextRequest } from "next/server";
import { requireStoreMember } from "@/lib/auth/session";
import { getStoreReports } from "@/services/reports.service";

export async function GET(request: NextRequest) {
  try {
    const member = await requireStoreMember("view_reports");
    const { searchParams } = new URL(request.url);

    const periodParam = searchParams.get("periodDays");
    const periodDays = periodParam ? parseInt(periodParam, 10) : 7;

    const reports = await getStoreReports(
      member.storeId,
      isNaN(periodDays) ? 7 : periodDays
    );

    return NextResponse.json({
      data: reports,
      message: "Data laporan bisnis berhasil dimuat",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memuat laporan bisnis";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: { code: "REPORT_FETCH_FAILED", message } }, { status });
  }
}
