import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { requireStoreMember } from "@/lib/auth/session";
import { getCategories, createCategory } from "@/services/category.service";

export async function GET() {
  try {
    const member = await requireStoreMember("view_products");
    const categories = await getCategories(member.storeId);

    return NextResponse.json({
      data: categories,
      message: "Kategori berhasil dimuat",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memuat kategori";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: { code: "FETCH_FAILED", message } }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const member = await requireStoreMember("manage_products");
    const body = await request.json();
    const created = await createCategory(member.storeId, body);

    return NextResponse.json(
      {
        data: created,
        message: "Kategori berhasil dibuat",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Data kategori tidak valid",
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Gagal membuat kategori";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: { code: "CREATE_FAILED", message } }, { status });
  }
}

