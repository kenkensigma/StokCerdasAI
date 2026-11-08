"use client";

import * as React from "react";
import { ShoppingBag, History, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PosCashier } from "@/components/sales/pos-cashier";
import { SalesHistoryTable } from "@/components/sales/sales-history-table";
import { SaleDetailDialog, type SaleDetailData } from "@/components/sales/sale-detail-dialog";
import { VoidDialog } from "@/components/sales/void-dialog";
import type { ProductItem } from "@/components/products/product-table";

interface Category {
  id: string;
  name: string;
}

export default function SalesPage() {
  const [activeTab, setActiveTab] = React.useState<"pos" | "history">("pos");
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [sales, setSales] = React.useState<SaleDetailData[]>([]);
  const [isOwner, setIsOwner] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Dialog states
  const [selectedSale, setSelectedSale] = React.useState<SaleDetailData | null>(null);
  const [voidTarget, setVoidTarget] = React.useState<SaleDetailData | null>(null);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prodRes, catRes, salesRes, meRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
        fetch("/api/sales"),
        fetch("/api/auth/me"),
      ]);

      const [prodData, catData, salesData, meData] = await Promise.all([
        prodRes.json(),
        catRes.json(),
        salesRes.json(),
        meRes.json(),
      ]);

      if (!prodRes.ok) throw new Error(prodData.error?.message || "Gagal memuat produk");
      if (!catRes.ok) throw new Error(catData.error?.message || "Gagal memuat kategori");
      if (!salesRes.ok) throw new Error(salesData.error?.message || "Gagal memuat riwayat penjualan");

      setProducts(prodData.data || []);
      setCategories(catData.data || []);
      setSales(salesData.data || []);
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
        const [prodRes, catRes, salesRes, meRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories"),
          fetch("/api/sales"),
          fetch("/api/auth/me"),
        ]);

        const [prodData, catData, salesData, meData] = await Promise.all([
          prodRes.json(),
          catRes.json(),
          salesRes.json(),
          meRes.json(),
        ]);

        if (!ignore) {
          if (!prodRes.ok) throw new Error(prodData.error?.message || "Gagal memuat produk");
          if (!catRes.ok) throw new Error(catData.error?.message || "Gagal memuat kategori");
          if (!salesRes.ok) throw new Error(salesData.error?.message || "Gagal memuat riwayat penjualan");

          setProducts(prodData.data || []);
          setCategories(catData.data || []);
          setSales(salesData.data || []);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Penjualan Kasir & Riwayat Transaksi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Catat transaksi multi-produk kasir cepat, potong stok otomatis, dan kelola audit pembatalan (void).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Segarkan
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("pos")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === "pos"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          Mesin Kasir (POS)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === "history"
              ? "border-indigo-600 text-indigo-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <History className="h-4 w-4" />
          Riwayat Transaksi ({sales.length})
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-red-700">
            <p className="font-semibold">Gagal memuat data penjualan</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="text-xs">
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Main Content */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-80 w-full" />
        </div>
      ) : activeTab === "pos" ? (
        <PosCashier
          products={products}
          categories={categories}
          onSaleCompleted={fetchData}
        />
      ) : (
        <SalesHistoryTable
          sales={sales}
          onViewDetail={(s) => setSelectedSale(s)}
          onVoidClick={(s) => setVoidTarget(s)}
          isOwner={isOwner}
        />
      )}

      {/* Struk / Sale Detail Modal */}
      <SaleDetailDialog
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        sale={selectedSale}
      />

      {/* Void Confirmation Modal (OWNER Only) */}
      <VoidDialog
        isOpen={!!voidTarget}
        onClose={() => setVoidTarget(null)}
        onSuccess={() => {
          setVoidTarget(null);
          fetchData();
        }}
        saleId={voidTarget?.id || null}
        transactionNumber={voidTarget?.transaction_number || ""}
        totalAmount={voidTarget?.total_amount || 0}
      />
    </div>
  );
}
