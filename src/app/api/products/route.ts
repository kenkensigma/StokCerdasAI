import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { requireStoreMember } from "@/lib/auth/session";
import { getProducts, createProduct } from "@/services/product.service";

export async function GET(request: NextRequest) {
  try {
    const member = await requireStoreMember("view_products");
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const includeArchived = searchParams.get("includeArchived") === "true";

    const products = await getProducts(member.storeId, {
      search,
      categoryId,
      includeArchived,
    });

    return NextResponse.json({
      data: products,
      message: "Daftar produk berhasil dimuat",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memuat produk";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: { code: "FETCH_FAILED", message } }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const member = await requireStoreMember("manage_products");
    const body = await request.json();
    const created = await createProduct(member.storeId, member.userId, body);

    return NextResponse.json(
      {
        data: created,
        message: "Produk berhasil ditambahkan",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Data produk tidak valid",
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Gagal menambahkan produk";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: { code: "CREATE_FAILED", message } }, { status });
  }
}

