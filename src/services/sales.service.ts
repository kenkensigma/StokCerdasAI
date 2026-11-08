import { createClient } from "@/lib/supabase/server";
import {
  createSaleSchema,
  voidSaleSchema,
  type CreateSaleInput,
  type VoidSaleInput,
} from "@/lib/validations/sales";
import type { Json } from "@/types/database.types";

export interface GetSalesFilter {
  status?: "COMPLETED" | "VOIDED";
  search?: string;
  limit?: number;
}

export function generateTransactionNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TRX-${yyyy}${mm}${dd}-${random}`;
}

export async function recordSale(
  storeId: string,
  userId: string,
  input: CreateSaleInput
) {
  const validated = createSaleSchema.parse(input);
  const supabase = await createClient();

  const transactionNumber = generateTransactionNumber();
  const idempotencyKey = validated.idempotencyKey || crypto.randomUUID();

  const { data, error } = await supabase.rpc("record_sale", {
    p_store_id: storeId,
    p_user_id: userId,
    p_transaction_number: transactionNumber,
    p_idempotency_key: idempotencyKey,
    p_items: validated.items as unknown as Json,
    p_notes: validated.notes || null,
  });

  if (error) {
    throw new Error(error.message || "Gagal memproses transaksi penjualan");
  }

  return data;
}

export async function getSales(storeId: string, filters: GetSalesFilter = {}) {
  const supabase = await createClient();

  let query = supabase
    .from("sales")
    .select(`
      id,
      store_id,
      transaction_number,
      user_id,
      transaction_date,
      total_amount,
      status,
      idempotency_key,
      notes,
      created_at,
      profiles:user_id (
        id,
        full_name
      ),
      sale_items (
        id,
        product_id,
        quantity,
        unit_price,
        subtotal,
        products:product_id (
          id,
          name,
          sku,
          unit
        )
      )
    `)
    .eq("store_id", storeId)
    .order("transaction_date", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.search) {
    query = query.ilike("transaction_number", `%${filters.search}%`);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  } else {
    query = query.limit(50);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Gagal memuat riwayat transaksi: " + error.message);
  }

  return data;
}

export async function getSaleById(storeId: string, saleId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sales")
    .select(`
      id,
      store_id,
      transaction_number,
      user_id,
      transaction_date,
      total_amount,
      status,
      idempotency_key,
      notes,
      created_at,
      profiles:user_id (
        id,
        full_name
      ),
      sale_items (
        id,
        product_id,
        quantity,
        unit_price,
        subtotal,
        products:product_id (
          id,
          name,
          sku,
          unit
        )
      )
    `)
    .eq("store_id", storeId)
    .eq("id", saleId)
    .single();

  if (error || !data) {
    throw new Error("Transaksi tidak ditemukan: " + (error?.message || ""));
  }

  return data;
}

export async function voidSale(
  storeId: string,
  userId: string,
  saleId: string,
  input: VoidSaleInput
) {
  const validated = voidSaleSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("void_sale", {
    p_store_id: storeId,
    p_user_id: userId,
    p_sale_id: saleId,
    p_reason: validated.reason,
  });

  if (error) {
    throw new Error(error.message || "Gagal membatalkan transaksi penjualan");
  }

  return data;
}
