"use client";

import * as React from "react";
import { X, SlidersHorizontal, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  unit: string;
  current_stock: number;
}

interface StockAdjustmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: ProductOption[];
}

export function StockAdjustmentDialog({
  isOpen,
  onClose,
  onSuccess,
  products,
}: StockAdjustmentDialogProps) {
  const [productId, setProductId] = React.useState<string>(() => products[0]?.id || "");
  const [newStock, setNewStock] = React.useState<number>(() => products[0]?.current_stock || 0);
  const [reason, setReason] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === productId);

  // When product changes, default newStock to its current stock
  const handleProductChange = (id: string) => {
    setProductId(id);
    const p = products.find((prod) => prod.id === id);
    if (p) setNewStock(p.current_stock);
  };

  if (!isOpen) return null;

  const currentStock = selectedProduct?.current_stock ?? 0;
  const delta = newStock - currentStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || newStock < 0 || !reason.trim()) {
      setError("Isi produk, jumlah stok fisik baru, dan alasan penyesuaian");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/inventory/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          newStock,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Gagal mencatat penyesuaian");

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Penyesuaian Stok (Stock Opname)</h3>
              <p className="text-[11px] text-slate-500">Sesuaikan stok sistem dengan hasil hitung fisik</p>
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
          <div className="p-6 space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Produk *
              </label>
              <select
                value={productId}
                onChange={(e) => handleProductChange(e.target.value)}
                required
                className="flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">Stok Sistem Saat Ini:</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {currentStock} {selectedProduct.unit}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Selisih Penyesuaian:</span>
                  <p
                    className={`font-bold mt-0.5 ${
                      delta > 0
                        ? "text-green-700"
                        : delta < 0
                        ? "text-red-700"
                        : "text-slate-500"
                    }`}
                  >
                    {delta > 0 ? `+${delta}` : delta} {selectedProduct.unit}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Stok Fisik Aktual Hasil Opname *
              </label>
              <Input
                type="number"
                min="0"
                step="any"
                value={newStock}
                onChange={(e) => setNewStock(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alasan Penyesuaian (Audit Log) *
              </label>
              <Input
                placeholder="Contoh: Selisih audit fisik bulanan, Barang bocor/rusak..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <div className="rounded-md bg-amber-50/70 border border-amber-200 p-3 text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <p>
                Perubahan ini akan langsung memperbarui jumlah stok di database dan dicatat permanen dalam riwayat mutasi stok.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" isLoading={isLoading} className="bg-amber-600 hover:bg-amber-700 text-white">
              Simpan Penyesuaian
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
