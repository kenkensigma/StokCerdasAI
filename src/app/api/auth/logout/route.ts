import { NextResponse } from "next/server";
import { logoutUser } from "@/lib/auth/service";

export async function POST() {
  try {
    await logoutUser();
    return NextResponse.json({
      data: null,
      message: "Berhasil keluar dari akun",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal keluar";
    return NextResponse.json(
      {
        error: {
          code: "LOGOUT_FAILED",
          message,
        },
      },
      { status: 500 }
    );
  }
}

