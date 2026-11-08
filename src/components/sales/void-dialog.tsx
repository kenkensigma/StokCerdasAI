"use client";

import * as React from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils/format";

interface VoidDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  saleId: string | null;
  transactionNumber: string;
  totalAmount: number;
}

export function VoidDialog({
  isOpen,
  onClose,
  onSuccess,
  saleId,
  transactionNumber,
  totalAmount,
}: VoidDialogProps) {
  const [reason, setReason] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen || !saleId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 3) {
      setError("Alasan pembatalan minimal 3 karakter (contoh: Salah input kasir, Pelanggan membatalkan pesanan)");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/sales/${saleId}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Gagal membatalkan transaksi");
      }

      setReason("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat membatalkan transaksi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-red-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-950">
                Konfirmasi Pembatalan (VOID)
              </h3>
              <p className="font-mono text-xs text-red-700">
                {transactionNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Tutup dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Nomor Transaksi:</span>
              <span className="font-mono font-bold text-slate-900">{transactionNumber}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Nilai Transaksi:</span>
              <span className="font-bold text-slate-900">{formatRupiah(totalAmount)}</span>
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 text-xs text-amber-800 leading-relaxed">
            <p className="font-semibold mb-0.5">Dampak Pembatalan (VOID):</p>
            <ul className="list-disc pl-4 space-y-1 text-xs text-amber-700">
              <li>Status transaksi berubah permanen menjadi <strong>VOIDED</strong>.</li>
              <li>Stok seluruh produk dalam transaksi ini akan <strong>otomatis dikembalikan</strong> ke inventaris.</li>
              <li>Mutasi stok pembalikan (REVERSAL) dicatat dalam audit trail.</li>
            </ul>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Alasan Pembatalan Transaksi <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Salah memasukkan produk, pelanggan meminta pembatalan sebelum serah terima..."
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              Kembali
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              isLoading={isLoading}
            >
              Batalkan Transaksi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

