"use client";

import * as React from "react";
import { X, Printer, AlertTriangle, User, Calendar, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, formatDateTime, formatQuantity } from "@/lib/utils/format";

export interface SaleDetailItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  products: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  } | null;
}

export interface SaleDetailData {
  id: string;
  store_id: string;
  transaction_number: string;
  user_id: string;
  transaction_date: string;
  total_amount: number;
  status: "COMPLETED" | "VOIDED";
  idempotency_key: string;
  notes: string | null;
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
  } | null;
  sale_items: SaleDetailItem[];
}

interface SaleDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleDetailData | null;
}

export function SaleDetailDialog({ isOpen, onClose, sale }: SaleDetailDialogProps) {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const isVoided = sale.status === "VOIDED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/60">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Struk Transaksi Penjualan
              </h3>
              <p className="font-mono text-xs text-indigo-600 font-medium">
                {sale.transaction_number}
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

        {/* Content Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
          {/* Status Alert if Voided */}
          {isVoided && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-800">
                <p className="font-bold">Transaksi Ini Telah Dibatalkan (VOID)</p>
                <p className="mt-0.5 text-red-700 leading-relaxed">
                  Stok barang telah dipulihkan otomatis ke inventaris dan tercatat dalam mutasi REVERSAL.
                </p>
              </div>
            </div>
          )}

          {/* Meta Information Cards */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>Waktu Transaksi</span>
              </div>
              <p className="font-medium text-slate-800">
                {formatDateTime(sale.transaction_date)}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500">
                <User className="h-3.5 w-3.5" />
                <span>Kasir / Petugas</span>
              </div>
              <p className="font-medium text-slate-800">
                {sale.profiles?.full_name || "Petugas Kasir"}
              </p>
            </div>

            <div className="col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-slate-500">Status Pembayaran:</span>
              {isVoided ? (
                <Badge variant="critical">BATAL (VOIDED)</Badge>
              ) : (
                <Badge variant="success">SELESAI (COMPLETED)</Badge>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-700">Daftar Produk yang Dibeli</h4>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Produk</th>
                    <th className="py-2.5 px-2 text-right font-semibold">Harga</th>
                    <th className="py-2.5 px-2 text-center font-semibold">Qty</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sale.sale_items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <p className="font-medium text-slate-800">
                          {item.products?.name || "Produk dihapus"}
                        </p>
                        <p className="font-mono text-[10px] text-slate-400">
                          {item.products?.sku || "-"}
                        </p>
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-700">
                        {formatRupiah(item.unit_price)}
                      </td>
                      <td className="py-2.5 px-2 text-center font-medium text-slate-800">
                        {formatQuantity(item.quantity, item.products?.unit || "")}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatRupiah(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grand Total Breakdown */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Total Item ({sale.sale_items.length} jenis barang)</span>
              <span>
                {sale.sale_items.reduce((sum, item) => sum + item.quantity, 0)} pcs
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900">Total Transaksi</span>
              <span
                className={`text-base font-extrabold ${
                  isVoided ? "text-slate-400 line-through" : "text-indigo-600"
                }`}
              >
                {formatRupiah(sale.total_amount)}
              </span>
            </div>
          </div>

          {/* Transaction Notes */}
          {sale.notes && (
            <div className="text-xs bg-amber-50/80 p-3 rounded-xl border border-amber-200/70 text-amber-900">
              <p className="font-semibold text-[11px] text-amber-800 uppercase tracking-wider mb-0.5">
                Catatan Transaksi
              </p>
              <p className="leading-relaxed">{sale.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/70 flex justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Cetak Struk
          </Button>

          <Button type="button" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
