import { NextResponse, type NextRequest } from "next/server";
import { requireStoreMember } from "@/lib/auth/session";
import { getStoreMembers, createStaffMember } from "@/services/store-settings.service";

export async function GET() {
  try {
    const member = await requireStoreMember("view_dashboard");
    const staffList = await getStoreMembers(member.storeId);

    return NextResponse.json({
      data: staffList,
      message: "Daftar staf berhasil dimuat",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memuat tim toko";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: { code: "STAFF_FETCH_FAILED", message } }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const member = await requireStoreMember("manage_team");
    const body = await request.json();
    const created = await createStaffMember(member.storeId, body);

    return NextResponse.json(
      {
        data: created,
        message: "Akun staf berhasil dibuat dan ditambahkan ke toko",
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menambahkan staf";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: { code: "STAFF_CREATE_FAILED", message } }, { status });
  }
}

