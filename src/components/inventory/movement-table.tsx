"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatQuantity } from "@/lib/utils/format";
import type { StockMovementType } from "@/types/database.types";

export interface StockMovementItem {
  id: string;
  store_id: string;
  product_id: string;
  user_id: string;
  movement_type: StockMovementType;
  quantity: number;
  note: string | null;
  created_at: string;
  products: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  } | null;
  profiles: {
    id: string;
    full_name: string;
  } | null;
}

interface MovementTableProps {
  movements: StockMovementItem[];
}

export function MovementTable({ movements }: MovementTableProps) {
  const getBadge = (type: StockMovementType) => {
    switch (type) {
      case "IN":
        return <Badge variant="success">MASUK (IN)</Badge>;
      case "OUT":
        return <Badge variant="default">KELUAR (OUT)</Badge>;
      case "ADJUSTMENT":
        return <Badge variant="warning">PENYESUAIAN</Badge>;
      case "REVERSAL":
        return <Badge variant="critical">PEMBALIKAN</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
          <tr>
            <th className="py-3 px-4 font-semibold">Waktu</th>
            <th className="py-3 px-4 font-semibold">Produk</th>
            <th className="py-3 px-4 font-semibold text-center">Jenis Mutasi</th>
            <th className="py-3 px-4 font-semibold text-right">Kuantitas</th>
            <th className="py-3 px-4 font-semibold">Dicatat Oleh</th>
            <th className="py-3 px-4 font-semibold">Keterangan / Catatan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {movements.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-10 text-center text-slate-400">
                Belum ada catatan mutasi persediaan barang
              </td>
            </tr>
          ) : (
            movements.map((m) => {
              const productName = m.products?.name || "Produk dihapus";
              const sku = m.products?.sku || "-";
              const unit = m.products?.unit || "";
              const userName = m.profiles?.full_name || "Sistem";

              const isPositive = m.movement_type === "IN" || (m.movement_type === "ADJUSTMENT" && m.quantity > 0);
              const isNegative = m.movement_type === "OUT" || (m.movement_type === "ADJUSTMENT" && m.quantity < 0);

              return (
                <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {formatDateTime(m.created_at)}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{productName}</p>
                    <span className="font-mono text-[11px] text-slate-400">{sku}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {getBadge(m.movement_type)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`font-bold ${
                        isPositive
                          ? "text-green-700"
                          : isNegative
                          ? "text-red-700"
                          : "text-slate-800"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {formatQuantity(m.quantity, unit)}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    {userName}
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                    {m.note || "-"}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

