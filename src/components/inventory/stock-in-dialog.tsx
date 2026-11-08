"use client";

import * as React from "react";
import { X, ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  unit: string;
  current_stock: number;
}

interface StockInDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: ProductOption[];
}

export function StockInDialog({
  isOpen,
  onClose,
  onSuccess,
  products,
}: StockInDialogProps) {
  const [productId, setProductId] = React.useState<string>(() => products[0]?.id || "");
  const [quantity, setQuantity] = React.useState<number>(1);
  const [notes, setNotes] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p.id === productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || quantity <= 0) {
      setError("Pilih produk dan masukkan kuantitas barang masuk yang valid");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/inventory/stock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Gagal mencatat barang masuk");

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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-700">
              <ArrowDownToLine className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Catat Barang Masuk (Stock IN)</h3>
              <p className="text-[11px] text-slate-500">Menambah jumlah stok fisik ke inventaris</p>
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
                onChange={(e) => setProductId(e.target.value)}
                required
                className="flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — Stok saat ini: {p.current_stock} {p.unit}
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="rounded-md bg-slate-50 border border-slate-200 p-3 text-xs">
                <span className="text-slate-500">Stok sistem sebelum mutasi: </span>
                <span className="font-bold text-slate-900">
                  {selectedProduct.current_stock} {selectedProduct.unit}
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah Masuk ({selectedProduct?.unit || "unit"}) *
              </label>
              <Input
                type="number"
                min="0.001"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan / Nomor Surat Jalan (Opsional)
              </label>
              <Input
                placeholder="Contoh: Penerimaan dari distributor PT Sukses Makmur"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" isLoading={isLoading} className="bg-green-700 hover:bg-green-800">
              Konfirmasi Barang Masuk
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
