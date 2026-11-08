import { createClient } from "@/lib/supabase/server";
import { categorySchema, type CategoryInput } from "@/lib/validations/inventory";

export async function getCategories(storeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, store_id, name, created_at")
    .eq("store_id", storeId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Gagal memuat kategori: " + error.message);
  }

  return data || [];
}

export async function createCategory(storeId: string, input: CategoryInput) {
  const validated = categorySchema.parse(input);
  const supabase = await createClient();

  // Check unique name per store
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("store_id", storeId)
    .ilike("name", validated.name)
    .single();

  if (existing) {
    throw new Error(`Kategori "${validated.name}" sudah ada.`);
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      store_id: storeId,
      name: validated.name,
    })
    .select()
    .single();

  if (error) {
    throw new Error("Gagal membuat kategori: " + error.message);
  }

  return data;
}

export async function updateCategory(storeId: string, categoryId: string, input: CategoryInput) {
  const validated = categorySchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .update({ name: validated.name })
    .eq("id", categoryId)
    .eq("store_id", storeId)
    .select()
    .single();

  if (error) {
    throw new Error("Gagal memperbarui kategori: " + error.message);
  }

  return data;
}

export async function deleteCategory(storeId: string, categoryId: string) {
  const supabase = await createClient();

  // Check if any active products are using this category
  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .eq("store_id", storeId)
    .is("archived_at", null);

  if (countError) {
    throw new Error("Gagal memverifikasi penggunaan kategori: " + countError.message);
  }

  if (count && count > 0) {
    throw new Error(`Kategori tidak dapat dihapus karena masih digunakan oleh ${count} produk aktif.`);
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("store_id", storeId);

  if (error) {
    throw new Error("Gagal menghapus kategori: " + error.message);
  }

  return { success: true };
}

