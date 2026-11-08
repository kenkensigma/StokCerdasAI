import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { requireStoreMember } from "@/lib/auth/session";
import { updateCategory, deleteCategory } from "@/services/category.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const member = await requireStoreMember("manage_products");
    const body = await request.json();
    const updated = await updateCategory(member.storeId, id, body);

    return NextResponse.json({
      data: updated,
      message: "Kategori berhasil diperbarui",
    });
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

    const message = error instanceof Error ? error.message : "Gagal memperbarui kategori";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: { code: "UPDATE_FAILED", message } }, { status });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const member = await requireStoreMember("manage_products");
    await deleteCategory(member.storeId, id);

    return NextResponse.json({
      data: null,
      message: "Kategori berhasil dihapus",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghapus kategori";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: { code: "DELETE_FAILED", message } }, { status });
  }
}

