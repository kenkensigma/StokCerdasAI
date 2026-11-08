import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { requireStoreMember } from "@/lib/auth/session";
import { getProductById, updateProduct, archiveProduct } from "@/services/product.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const member = await requireStoreMember("view_products");
    const product = await getProductById(member.storeId, id);

    return NextResponse.json({
      data: product,
      message: "Detail produk berhasil dimuat",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Produk tidak ditemukan";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 404;
    return NextResponse.json({ error: { code: "NOT_FOUND", message } }, { status });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const member = await requireStoreMember("manage_products");
    const body = await request.json();
    const updated = await updateProduct(member.storeId, id, body);

    return NextResponse.json({
      data: updated,
      message: "Data produk berhasil diperbarui",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Data pembaruan tidak valid",
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Gagal memperbarui produk";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: { code: "UPDATE_FAILED", message } }, { status });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const member = await requireStoreMember("manage_products");
    await archiveProduct(member.storeId, id);

    return NextResponse.json({
      data: null,
      message: "Produk berhasil diarsipkan",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengarsipkan produk";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: { code: "ARCHIVE_FAILED", message } }, { status });
  }
}

