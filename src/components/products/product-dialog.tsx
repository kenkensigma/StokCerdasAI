"use client";

import * as React from "react";
import { X, Package, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ProductFormData {
  id?: string;
  name: string;
  sku: string;
  categoryId: string | null;
  description: string;
  initialStock: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  safetyStock: number;
  targetInventoryDays: number;
}

interface Category {
  id: string;
  name: string;
}

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
  initialData?: ProductFormData | null;
}

export function ProductDialog({
  isOpen,
  onClose,
  onSuccess,
  categories,
  initialData,
}: ProductDialogProps) {
  const isEdit = !!initialData?.id;

  const [formData, setFormData] = React.useState<ProductFormData>(() => {
    if (initialData) return initialData;
    return {
      name: "",
      sku: "",
      categoryId: categories[0]?.id || null,
      description: "",
      initialStock: 0,
      unit: "pcs",
      costPrice: 0,
      sellingPrice: 0,
      safetyStock: 5,
      targetInventoryDays: 7,
    };
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = isEdit ? `/api/products/${initialData?.id}` : "/api/products";
      const method = isEdit ? "PATCH" : "POST";

      const payload = isEdit
        ? {
            name: formData.name,
            categoryId: formData.categoryId,
            description: formData.description || null,
            unit: formData.unit,
            costPrice: formData.costPrice,
            sellingPrice: formData.sellingPrice,
            safetyStock: formData.safetyStock,
            targetInventoryDays: formData.targetInventoryDays,
          }
        : {
            ...formData,
            description: formData.description || null,
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Gagal menyimpan produk");

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan produk");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEdit ? "Ubah Data Produk" : "Tambah Produk Baru"}
              </h3>
              <p className="text-xs text-slate-500">
                {isEdit
                  ? "Perbarui informasi produk katalog toko"
                  : "Daftarkan item barang dagangan fisik baru"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Tutup modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Produk *
                </label>
                <Input
                  placeholder="Contoh: Indomie Goreng Spesial 85g"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SKU (Kode Unik) *
                </label>
                <Input
                  placeholder="Contoh: IND-GOR-01"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                  required
                  disabled={isEdit}
                  className={isEdit ? "bg-slate-50 text-slate-500" : ""}
                />
                {isEdit && (
                  <p className="text-[11px] text-slate-400 mt-1">SKU tidak dapat diubah setelah terdaftar.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori
                </label>
                <select
                  value={formData.categoryId || ""}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value || null })}
                  className="flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <option value="">Tanpa Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Satuan Barang *
                </label>
                <Input
                  placeholder="pcs, botol, kg, sak, pak..."
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isEdit ? "Stok Saat Ini" : "Stok Awal Fisik *"}
                </label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.initialStock}
                  onChange={(e) =>
                    setFormData({ ...formData, initialStock: parseFloat(e.target.value) || 0 })
                  }
                  required={!isEdit}
                  disabled={isEdit}
                  className={isEdit ? "bg-slate-50 text-slate-500" : ""}
                />
                {isEdit ? (
                  <p className="text-[11px] text-blue-600 mt-1 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Untuk mengubah stok, gunakan menu Barang Masuk atau Penyesuaian.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Stok awal langsung tersimpan sebagai kuantitas fisik awal di inventaris.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Harga Beli / Modal (Rp)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.costPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Harga Jual (Rp) *
                </label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.sellingPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Safety Stock (Batas Waspada) *
                </label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.safetyStock}
                  onChange={(e) =>
                    setFormData({ ...formData, safetyStock: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Sistem menandai peringatan ketika stok mendekati batas ini.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Hari Inventaris
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.targetInventoryDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetInventoryDays: parseInt(e.target.value, 10) || 7,
                    })
                  }
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Target persediaan untuk kalkulasi saran restock (bawaan: 7 hari).
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Catatan Tambahan (Opsional)
                </label>
                <Input
                  placeholder="Lokasi rak, distributor, atau informasi kemasan..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {isEdit ? "Simpan Perubahan" : "Daftarkan Produk"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
