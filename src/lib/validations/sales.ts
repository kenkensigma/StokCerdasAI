import { z } from "zod";

export const saleItemSchema = z.object({
  productId: z.string().uuid("ID produk tidak valid"),
  quantity: z.coerce.number().positive("Jumlah kuantitas harus lebih besar dari 0"),
  unitPrice: z.coerce.number().min(0, "Harga satuan tidak boleh negatif"),
});

export const createSaleSchema = z.object({
  items: z
    .array(saleItemSchema)
    .min(1, "Keranjang transaksi harus memiliki minimal 1 produk"),
  notes: z
    .string()
    .trim()
    .max(255, "Catatan transaksi maksimal 255 karakter")
    .nullable()
    .optional(),
  idempotencyKey: z
    .string()
    .trim()
    .min(8, "Kunci idempotensi tidak valid")
    .max(64, "Kunci idempotensi maksimal 64 karakter")
    .optional(),
});

export const voidSaleSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Alasan pembatalan minimal 3 karakter (contoh: Salah input pesanan, Pelanggan membatalkan transaksi)")
    .max(255, "Alasan pembatalan maksimal 255 karakter"),
});

export type SaleItemInput = z.infer<typeof saleItemSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type VoidSaleInput = z.infer<typeof voidSaleSchema>;
