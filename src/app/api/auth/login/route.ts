import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { loginUser } from "@/lib/auth/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await loginUser(body);

    return NextResponse.json(
      {
        data: result,
        message: "Berhasil masuk ke toko",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Format email atau password tidak valid",
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Gagal melakukan autentikasi";
    return NextResponse.json(
      {
        error: {
          code: "AUTHENTICATION_FAILED",
          message,
        },
      },
      { status: 401 }
    );
  }
}

