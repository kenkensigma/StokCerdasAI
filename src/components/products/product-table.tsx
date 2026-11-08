"use client";

import * as React from "react";
import { Edit2, Archive, Package, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { formatRupiah, formatQuantity } from "@/lib/utils/format";
import type { StockStatus } from "@/types/database.types";

export interface ProductItem {
  id: string;
  name: string;
  sku: string;
  category_id: string | null;
  description: string | null;
  initial_stock: number;
  current_stock: number;
  unit: string;
  cost_price: number;
  selling_price: number;
  safety_stock: number;
  target_inventory_days: number;
  created_at: string;
  categories: { id: string; name: string } | null;
  status?: StockStatus;
}

interface Category {
  id: string;
  name: string;
}

interface ProductTableProps {
  products: ProductItem[];
  categories: Category[];
  onEdit: (product: ProductItem) => void;
  onArchive: (product: ProductItem) => void;
  canManage: boolean;
}

export function ProductTable({
  products,
  categories,
  onEdit,
  onArchive,
  canManage,
}: ProductTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");

  const filtered = React.useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat =
        selectedCategory === "ALL" || p.category_id === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchTerm, selectedCategory]);

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Cari nama produk atau SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <option value="ALL">Semua Kategori ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 font-semibold">Nama Produk</th>
              <th className="py-3 px-4 font-semibold">SKU</th>
              <th className="py-3 px-4 font-semibold">Kategori</th>
              <th className="py-3 px-4 font-semibold text-right">Stok Fisik</th>
              <th className="py-3 px-4 font-semibold text-right">Harga Jual</th>
              <th className="py-3 px-4 font-semibold text-center">Status</th>
              {canManage && (
                <th className="py-3 px-4 font-semibold text-center">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={canManage ? 7 : 6}
                  className="py-12 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package className="h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">Tidak ada produk ditemukan</p>
                    <p className="text-xs text-slate-400">
                      {searchTerm
                        ? "Coba sesuaikan kata kunci pencarian atau kategori Anda."
                        : "Katalog produk masih kosong. Tambahkan produk pertama Anda."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((product) => {
                const categoryName = product.categories?.name || "Tanpa Kategori";
                const isLow = product.current_stock <= product.safety_stock;
                const status: StockStatus =
                  product.status || (isLow ? (product.current_stock <= 0 ? "CRITICAL" : "LOW") : "WAITING");

                return (
                  <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{product.name}</p>
                      {product.description && (
                        <p className="text-[11px] text-slate-400 truncate max-w-xs">
                          {product.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 font-medium">
                      {product.sku}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px]">
                        {categoryName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-bold ${
                          product.current_stock <= 0
                            ? "text-red-700"
                            : isLow
                            ? "text-amber-700"
                            : "text-slate-900"
                        }`}
                      >
                        {formatQuantity(product.current_stock, product.unit)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      {formatRupiah(product.selling_price)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusIndicator status={status} />
                    </td>
                    {canManage && (
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(product)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Ubah data produk"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onArchive(product)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
                            title="Arsipkan produk"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
