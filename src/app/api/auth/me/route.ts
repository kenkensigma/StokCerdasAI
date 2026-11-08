import { NextResponse } from "next/server";
import { getActiveStoreContext } from "@/lib/auth/session";

export async function GET() {
  try {
    const context = await getActiveStoreContext();

    if (!context) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHENTICATED",
            message: "Sesi tidak ditemukan atau belum login",
          },
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      data: context,
      message: "Data sesi pengguna berhasil dimuat",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kesalahan server";
    return NextResponse.json(
      {
        error: {
          code: "SERVER_ERROR",
          message,
        },
      },
      { status: 500 }
    );
  }
}

