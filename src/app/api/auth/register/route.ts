import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { registerOwner } from "@/lib/auth/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await registerOwner(body);

    return NextResponse.json(
      {
        data: result,
        message: "Toko dan akun pemilik berhasil didaftarkan",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Data pendaftaran tidak valid",
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Terjadi kesalahan internal";
    return NextResponse.json(
      {
        error: {
          code: "REGISTRATION_FAILED",
          message,
        },
      },
      { status: 400 }
    );
  }
}

