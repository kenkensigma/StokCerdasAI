"use client";

import * as React from "react";
import { Receipt, Eye, Ban, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRupiah, formatDateTime } from "@/lib/utils/format";
import type { SaleDetailData } from "./sale-detail-dialog";

interface SalesHistoryTableProps {
  sales: SaleDetailData[];
  onViewDetail: (sale: SaleDetailData) => void;
  onVoidClick: (sale: SaleDetailData) => void;
  isOwner: boolean;
}

export function SalesHistoryTable({
  sales,
  onViewDetail,
  onVoidClick,
  isOwner,
}: SalesHistoryTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  const filteredSales = React.useMemo(() => {
    return sales.filter((s) => {
      const matchSearch =
        s.transaction_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.profiles?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [sales, searchTerm, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Cari no. transaksi atau nama kasir..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
          >
            <option value="ALL">Semua Status ({sales.length})</option>
            <option value="COMPLETED">Selesai (COMPLETED)</option>
            <option value="VOIDED">Dibatalkan (VOIDED)</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      {filteredSales.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Tidak ada riwayat transaksi"
          description={
            searchTerm || statusFilter !== "ALL"
              ? "Tidak ditemukan transaksi yang cocok dengan kriteria pencarian Anda."
              : "Belum ada transaksi penjualan yang tercatat di toko ini."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">No. Transaksi</th>
                <th className="py-3 px-4 font-semibold">Waktu</th>
                <th className="py-3 px-4 font-semibold">Kasir</th>
                <th className="py-3 px-4 font-semibold text-center">Item</th>
                <th className="py-3 px-4 font-semibold text-right">Total Transaksi</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-blue-700">
                    {sale.transaction_number}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {formatDateTime(sale.transaction_date)}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {sale.profiles?.full_name || "Kasir"}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600 font-medium">
                    {sale.sale_items?.length || 0} barang
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-bold ${
                      sale.status === "VOIDED"
                        ? "text-slate-400 line-through"
                        : "text-slate-900"
                    }`}
                  >
                    {formatRupiah(sale.total_amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {sale.status === "VOIDED" ? (
                      <Badge variant="critical">BATAL</Badge>
                    ) : (
                      <Badge variant="success">SELESAI</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetail(sale)}
                      className="inline-flex items-center gap-1 text-xs h-8 px-2.5"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                      Detail
                    </Button>

                    {isOwner && sale.status === "COMPLETED" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onVoidClick(sale)}
                        className="inline-flex items-center gap-1 text-xs h-8 px-2.5"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        Void
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
