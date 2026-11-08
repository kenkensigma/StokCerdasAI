import { NextResponse, type NextRequest } from "next/server";
import { requireStoreMember } from "@/lib/auth/session";
import { getStoreDetails, updateStoreDetails } from "@/services/store-settings.service";

export async function GET() {
  try {
    const member = await requireStoreMember("manage_settings");
    const store = await getStoreDetails(member.storeId);

    return NextResponse.json({
      data: store,
      message: "Data toko berhasil dimuat",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memuat profil toko";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: { code: "STORE_FETCH_FAILED", message } }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const member = await requireStoreMember("manage_settings");
    const body = await request.json();
    const updated = await updateStoreDetails(member.storeId, body);

    return NextResponse.json({
      data: updated,
      message: "Profil toko berhasil diperbarui",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui profil toko";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: { code: "STORE_UPDATE_FAILED", message } }, { status });
  }
}

