import { createClient } from "@/lib/supabase/server";
import { productSchema, productUpdateSchema, type ProductInput, type ProductUpdateInput } from "@/lib/validations/inventory";
import type { Database } from "@/types/database.types";

type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

export interface GetProductsFilter {
  search?: string;
  categoryId?: string;
  includeArchived?: boolean;
}

export async function getProducts(storeId: string, filters: GetProductsFilter = {}) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(`
      id,
      store_id,
      category_id,
      supplier_id,
      name,
      sku,
      description,
      initial_stock,
      current_stock,
      unit,
      cost_price,
      selling_price,
      safety_stock,
      target_inventory_days,
      created_at,
      updated_at,
      archived_at,
      categories(id, name),
      suppliers(id, name)
    `)
    .eq("store_id", storeId);

  if (!filters.includeArchived) {
    query = query.is("archived_at", null);
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.search) {
    const s = filters.search.trim();
    query = query.or(`name.ilike.%${s}%,sku.ilike.%${s}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    throw new Error("Gagal memuat produk: " + error.message);
  }

  return data || [];
}

export async function getProductById(storeId: string, productId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories(id, name),
      suppliers(id, name)
    `)
    .eq("id", productId)
    .eq("store_id", storeId)
    .single();

  if (error || !data) {
    throw new Error("Produk tidak ditemukan");
  }

  return data;
}

export async function createProduct(storeId: string, userId: string, input: ProductInput) {
  const validated = productSchema.parse(input);
  const supabase = await createClient();

  // 1. Verify SKU uniqueness within this store
  const { data: existingSku } = await supabase
    .from("products")
    .select("id")
    .eq("store_id", storeId)
    .eq("sku", validated.sku)
    .is("archived_at", null)
    .single();

  if (existingSku) {
    throw new Error(`SKU "${validated.sku}" sudah digunakan oleh produk lain.`);
  }

  // 2. Insert product with initial_stock == current_stock (Rule: ADR-004)
  const { data: product, error: insertError } = await supabase
    .from("products")
    .insert({
      store_id: storeId,
      name: validated.name,
      sku: validated.sku,
      category_id: validated.categoryId || null,
      supplier_id: validated.supplierId || null,
      description: validated.description || null,
      initial_stock: validated.initialStock,
      current_stock: validated.initialStock,
      unit: validated.unit,
      cost_price: validated.costPrice,
      selling_price: validated.sellingPrice,
      safety_stock: validated.safetyStock,
      target_inventory_days: validated.targetInventoryDays,
    })
    .select()
    .single();

  if (insertError || !product) {
    throw new Error("Gagal menyimpan produk: " + insertError?.message);
  }

  // 3. Record initial stock movement if initial_stock > 0
  if (validated.initialStock > 0) {
    const { error: moveError } = await supabase
      .from("stock_movements")
      .insert({
        store_id: storeId,
        product_id: product.id,
        user_id: userId,
        movement_type: "IN",
        quantity: validated.initialStock,
        note: "Stok awal saat pendaftaran produk",
      });

    if (moveError) {
      console.warn("Gagal mencatat movement stok awal:", moveError.message);
    }
  }

  return product;
}

export async function updateProduct(
  storeId: string,
  productId: string,
  input: ProductUpdateInput
) {
  const validated = productUpdateSchema.parse(input);
  const supabase = await createClient();

  // Note: current_stock and initial_stock are NEVER updated here.
  // Stock changes must use Stock-In or Stock-Adjustment (Rule: ADR-004 / invariants)
  const updatePayload: ProductUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (validated.name !== undefined) updatePayload.name = validated.name;
  if (validated.categoryId !== undefined) updatePayload.category_id = validated.categoryId;
  if (validated.supplierId !== undefined) updatePayload.supplier_id = validated.supplierId;
  if (validated.description !== undefined) updatePayload.description = validated.description;
  if (validated.unit !== undefined) updatePayload.unit = validated.unit;
  if (validated.costPrice !== undefined) updatePayload.cost_price = validated.costPrice;
  if (validated.sellingPrice !== undefined) updatePayload.selling_price = validated.sellingPrice;
  if (validated.safetyStock !== undefined) updatePayload.safety_stock = validated.safetyStock;
  if (validated.targetInventoryDays !== undefined) updatePayload.target_inventory_days = validated.targetInventoryDays;

  const { data, error } = await supabase
    .from("products")
    .update(updatePayload)
    .eq("id", productId)
    .eq("store_id", storeId)
    .select()
    .single();

  if (error) {
    throw new Error("Gagal memperbarui produk: " + error.message);
  }

  return data;
}

export async function archiveProduct(storeId: string, productId: string) {
  const supabase = await createClient();

  // Soft-delete by setting archived_at
  const { error } = await supabase
    .from("products")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", productId)
    .eq("store_id", storeId);

  if (error) {
    throw new Error("Gagal mengarsipkan produk: " + error.message);
  }

  return { success: true };
}
