"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  SlidersHorizontal,
  RefreshCw,
  AlertCircle,
  History,
  PackageCheck,
  Search,
  Filter,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatQuantity } from "@/lib/utils/format";
import { StockInDialog } from "@/components/inventory/stock-in-dialog";
import { StockAdjustmentDialog } from "@/components/inventory/stock-adjustment-dialog";
import { MovementTable, type StockMovementItem } from "@/components/inventory/movement-table";
import type { StockStatus } from "@/types/database.types";

interface InventoryProduct {
  id: string;
  name: string;
  sku: string;
  unit: string;
  current_stock: number;
  safety_stock: number;
  reorderPoint?: number;
  averageDailySales?: number;
  estimatedStockoutDays?: number | null;
  suggestedRestockQuantity?: number;
  confidenceLevel?: string;
  categoryName?: string;
  status: StockStatus;
  urgencyExplanation?: string;
  categories?: { id: string; name: string } | null;
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = React.useState<"overview" | "movements">("overview");
  const [products, setProducts] = React.useState<InventoryProduct[]>([]);
  const [movements, setMovements] = React.useState<StockMovementItem[]>([]);
  const [isOwner, setIsOwner] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  // Modal dialog states
  const [isStockInOpen, setIsStockInOpen] = React.useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [invRes, movRes, meRes] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/inventory/movements"),
        fetch("/api/auth/me"),
      ]);

      const [invData, movData, meData] = await Promise.all([
        invRes.json(),
        movRes.json(),
        meRes.json(),
      ]);

      if (!invRes.ok) throw new Error(invData.error?.message || "Gagal memuat inventaris");
      if (!movRes.ok) throw new Error(movData.error?.message || "Gagal memuat riwayat mutasi");

      setProducts(invData.data || []);
      setMovements(movData.data || []);
      setIsOwner(meData.data?.role === "OWNER");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const [invRes, movRes, meRes] = await Promise.all([
          fetch("/api/inventory"),
          fetch("/api/inventory/movements"),
          fetch("/api/auth/me"),
        ]);

        const [invData, movData, meData] = await Promise.all([
          invRes.json(),
          movRes.json(),
          meRes.json(),
        ]);

        if (!ignore) {
          if (!invRes.ok) throw new Error(invData.error?.message || "Gagal memuat inventaris");
          if (!movRes.ok) throw new Error(movData.error?.message || "Gagal memuat riwayat mutasi");

          setProducts(invData.data || []);
          setMovements(movData.data || []);
          setIsOwner(meData.data?.role === "OWNER");
        }
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [products, searchTerm, statusFilter]);

  const productOptions = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    unit: p.unit,
    current_stock: p.current_stock,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Inventaris & Mutasi Stok
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau stok fisik otoritatif, laju konsumsi harian, titik pemesanan kembali (ROP), dan audit mutasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-1.5"
            aria-label="Segarkan data inventaris"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Segarkan
          </Button>

          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdjustmentOpen(true)}
              disabled={products.length === 0}
              className="flex items-center gap-1.5"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Penyesuaian (Opname)
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => setIsStockInOpen(true)}
            disabled={products.length === 0}
            className="flex items-center gap-1.5"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Catat Barang Masuk (IN)
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === "overview"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <PackageCheck className="h-4 w-4" />
          Status Stok Aktual ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("movements")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === "movements"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <History className="h-4 w-4" />
          Riwayat Mutasi Stok ({movements.length})
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-red-700">
            <p className="font-semibold">Gagal memuat data inventaris</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="text-xs">
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Main Tab Content */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : activeTab === "overview" ? (
        products.length === 0 ? (
          <EmptyState
            title="Belum ada data produk di inventaris"
            description="Tambahkan produk pertama Anda di Katalog Produk untuk mulai memantau stok dan pergerakan barang."
            action={
              <Link href="/dashboard/products">
                <Button size="sm">Buka Katalog Produk</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {/* Search and Status Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari nama barang atau SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-9 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
                >
                  <option value="ALL">Semua Status ({products.length})</option>
                  <option value="CRITICAL">Kritis (CRITICAL)</option>
                  <option value="LOW">Menipis (LOW)</option>
                  <option value="NORMAL">Normal (NORMAL)</option>
                  <option value="COLLECTING">Mengumpulkan Data (COLLECTING)</option>
                  <option value="WAITING">Menunggu Data (WAITING)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Ringkasan Status Stok Fisik Aktual</CardTitle>
                <CardDescription>
                  Authoritative current stock dihitung dan disinkronkan langsung dari basis data PostgreSQL.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-md border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Nama Produk</th>
                        <th className="py-3 px-4 font-semibold">SKU</th>
                        <th className="py-3 px-4 font-semibold">Kategori</th>
                        <th className="py-3 px-4 font-semibold text-right">Stok Fisik</th>
                        <th className="py-3 px-4 font-semibold text-right">ROP</th>
                        <th className="py-3 px-4 font-semibold text-right">Laju Harian</th>
                        <th className="py-3 px-4 font-semibold text-right">Est. Habis</th>
                        <th className="py-3 px-4 font-semibold text-right">Saran Restock</th>
                        <th className="py-3 px-4 font-semibold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-900">
                            <div>
                              <span>{item.name}</span>
                              {item.urgencyExplanation && (
                                <p className="text-[11px] text-slate-500 font-normal line-clamp-1 mt-0.5">
                                  {item.urgencyExplanation}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500">{item.sku}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {item.categoryName || item.categories?.name || "Tanpa Kategori"}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-bold ${
                              item.current_stock <= 0
                                ? "text-red-700"
                                : item.current_stock <= (item.reorderPoint || item.safety_stock)
                                ? "text-amber-700"
                                : "text-slate-900"
                            }`}
                          >
                            {formatQuantity(item.current_stock, item.unit)}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600 font-medium">
                            {item.reorderPoint !== undefined ? (
                              formatQuantity(item.reorderPoint, item.unit)
                            ) : (
                              formatQuantity(item.safety_stock, item.unit)
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600">
                            {item.averageDailySales !== undefined ? (
                              `${item.averageDailySales} ${item.unit}/hari`
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {item.estimatedStockoutDays !== null && item.estimatedStockoutDays !== undefined ? (
                              <span
                                className={`font-semibold ${
                                  item.estimatedStockoutDays <= 2
                                    ? "text-red-700 font-bold"
                                    : item.estimatedStockoutDays <= 5
                                    ? "text-amber-700"
                                    : "text-slate-700"
                                }`}
                              >
                                {item.estimatedStockoutDays} hari
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-blue-700">
                            {item.suggestedRestockQuantity !== undefined && item.suggestedRestockQuantity > 0 ? (
                              `+${formatQuantity(item.suggestedRestockQuantity, item.unit)}`
                            ) : (
                              <span className="text-slate-400 font-normal">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <StatusIndicator status={item.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Riwayat Mutasi Stok (Audit Trail)</CardTitle>
            <CardDescription>
              Setiap perubahan stok (Masuk, Keluar, Opname, Pembalikan) tercatat secara transparan dan permanen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MovementTable movements={movements} />
          </CardContent>
        </Card>
      )}

      {/* Stock IN Modal Dialog */}
      <StockInDialog
        key={`stock-in-${isStockInOpen ? "open" : "closed"}`}
        isOpen={isStockInOpen}
        onClose={() => setIsStockInOpen(false)}
        onSuccess={() => {
          setIsStockInOpen(false);
          fetchData();
        }}
        products={productOptions}
      />

      {/* Stock Adjustment Modal Dialog (OWNER Only) */}
      <StockAdjustmentDialog
        key={`stock-adj-${isAdjustmentOpen ? "open" : "closed"}`}
        isOpen={isAdjustmentOpen}
        onClose={() => setIsAdjustmentOpen(false)}
        onSuccess={() => {
          setIsAdjustmentOpen(false);
          fetchData();
        }}
        products={productOptions}
      />
    </div>
  );
}
