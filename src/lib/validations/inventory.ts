import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama kategori minimal 2 karakter")
    .max(50, "Nama kategori maksimal 50 karakter"),
});

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama produk minimal 2 karakter")
    .max(100, "Nama produk maksimal 100 karakter"),
  sku: z
    .string()
    .trim()
    .min(1, "SKU wajib diisi")
    .max(50, "SKU maksimal 50 karakter")
    .toUpperCase(),
  categoryId: z.string().uuid("ID Kategori tidak valid").nullable().optional(),
  supplierId: z.string().uuid("ID Supplier tidak valid").nullable().optional(),
  description: z.string().trim().max(500, "Deskripsi maksimal 500 karakter").nullable().optional(),
  initialStock: z.coerce
    .number()
    .min(0, "Stok awal tidak boleh negatif")
    .default(0),
  unit: z
    .string()
    .trim()
    .min(1, "Satuan wajib diisi (contoh: pcs, kg, sak, botol)")
    .max(20, "Satuan maksimal 20 karakter"),
  costPrice: z.coerce
    .number()
    .min(0, "Harga beli (modal) tidak boleh negatif")
    .default(0),
  sellingPrice: z.coerce
    .number()
    .min(0, "Harga jual tidak boleh negatif")
    .default(0),
  safetyStock: z.coerce
    .number()
    .min(0, "Safety stock tidak boleh negatif")
    .default(0),
  targetInventoryDays: z.coerce
    .number()
    .int("Target hari harus berupa bilangan bulat")
    .min(1, "Target hari inventaris minimal 1 hari")
    .default(7),
});

export const productUpdateSchema = z.object({
  name: z.string().trim().min(2, "Nama produk minimal 2 karakter").max(100).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  supplierId: z.string().uuid().nullable().optional(),
  description: z.string().trim().max(500).nullable().optional(),
  unit: z.string().trim().min(1).max(20).optional(),
  costPrice: z.coerce.number().min(0).optional(),
  sellingPrice: z.coerce.number().min(0).optional(),
  safetyStock: z.coerce.number().min(0).optional(),
  targetInventoryDays: z.coerce.number().int().min(1).optional(),
});

export const stockInSchema = z.object({
  productId: z.string().uuid("ID produk tidak valid"),
  quantity: z.coerce.number().positive("Jumlah masuk harus lebih besar dari 0"),
  notes: z.string().trim().max(255, "Catatan maksimal 255 karakter").optional(),
});

export const stockAdjustmentSchema = z.object({
  productId: z.string().uuid("ID produk tidak valid"),
  newStock: z.coerce.number().min(0, "Jumlah stok fisik aktual tidak boleh negatif"),
  reason: z
    .string()
    .trim()
    .min(3, "Alasan penyesuaian minimal 3 karakter (contoh: Selisih opname, Barang rusak)")
    .max(255, "Alasan maksimal 255 karakter"),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type StockInInput = z.infer<typeof stockInSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;

