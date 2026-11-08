"use client";

import * as React from "react";
import { Plus, FolderTree, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductTable, type ProductItem } from "@/components/products/product-table";
import { ProductDialog, type ProductFormData } from "@/components/products/product-dialog";
import { CategoryManagerDialog } from "@/components/categories/category-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [canManage, setCanManage] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Dialog states
  const [isProductDialogOpen, setIsProductDialogOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<ProductFormData | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = React.useState(false);

  // Archive modal state
  const [archiveTarget, setArchiveTarget] = React.useState<ProductItem | null>(null);
  const [isArchiving, setIsArchiving] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prodRes, catRes, meRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
        fetch("/api/auth/me"),
      ]);

      const [prodData, catData, meData] = await Promise.all([
        prodRes.json(),
        catRes.json(),
        meRes.json(),
      ]);

      if (!prodRes.ok) throw new Error(prodData.error?.message || "Gagal memuat produk");
      if (!catRes.ok) throw new Error(catData.error?.message || "Gagal memuat kategori");

      setProducts(prodData.data || []);
      setCategories(catData.data || []);
      setCanManage(meData.data?.role === "OWNER");
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
        const [prodRes, catRes, meRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories"),
          fetch("/api/auth/me"),
        ]);
        const [prodData, catData, meData] = await Promise.all([
          prodRes.json(),
          catRes.json(),
          meRes.json(),
        ]);
        if (!ignore) {
          if (!prodRes.ok) throw new Error(prodData.error?.message || "Gagal memuat produk");
          if (!catRes.ok) throw new Error(catData.error?.message || "Gagal memuat kategori");
          setProducts(prodData.data || []);
          setCategories(catData.data || []);
          setCanManage(meData.data?.role === "OWNER");
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

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductDialogOpen(true);
  };

  const handleEditProduct = (prod: ProductItem) => {
    setEditingProduct({
      id: prod.id,
      name: prod.name,
      sku: prod.sku,
      categoryId: prod.category_id,
      description: prod.description || "",
      initialStock: prod.initial_stock,
      unit: prod.unit,
      costPrice: prod.cost_price,
      sellingPrice: prod.selling_price,
      safetyStock: prod.safety_stock,
      targetInventoryDays: prod.target_inventory_days,
    });
    setIsProductDialogOpen(true);
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setIsArchiving(true);
    try {
      const res = await fetch(`/api/products/${archiveTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Gagal mengarsipkan produk");

      setArchiveTarget(null);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengarsipkan produk");
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Katalog Produk
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola data master barang, SKU, kategori, harga jual, dan stok pengaman.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-1.5"
            aria-label="Segarkan data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Segarkan
          </Button>

          {canManage && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCategoryDialogOpen(true)}
                className="flex items-center gap-1.5"
              >
                <FolderTree className="h-4 w-4 text-slate-600" aria-hidden="true" />
                Kelola Kategori
              </Button>

              <Button
                size="sm"
                onClick={handleOpenAddProduct}
                className="flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Tambah Produk
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-red-700">
            <p className="font-semibold">Gagal memuat katalog produk</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="text-xs">
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Staff Mode Operational Badge */}
      {!canManage && !isLoading && !error && (
        <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <span className="font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px]">Mode Staf</span>
            <span>Akses katalog produk hanya-baca (Read-Only). Penambahan dan perubahan produk dikelola oleh Pemilik Toko.</span>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <ProductTable
          products={products}
          categories={categories}
          onEdit={handleEditProduct}
          onArchive={(prod) => setArchiveTarget(prod)}
          canManage={canManage}
        />
      )}

      {/* Modals & Dialogs */}
      <ProductDialog
        key={editingProduct?.id || (isProductDialogOpen ? "new" : "closed")}
        isOpen={isProductDialogOpen}
        onClose={() => setIsProductDialogOpen(false)}
        onSuccess={() => {
          setIsProductDialogOpen(false);
          fetchData();
        }}
        categories={categories}
        initialData={editingProduct}
      />

      <CategoryManagerDialog
        isOpen={isCategoryDialogOpen}
        onClose={() => setIsCategoryDialogOpen(false)}
        categories={categories}
        onCategoryChanged={fetchData}
      />

      {/* Archive Confirmation Modal */}
      {archiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">Konfirmasi Arsipkan Produk</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin mengarsipkan produk{" "}
              <span className="font-semibold text-slate-900">{archiveTarget.name}</span> (SKU:{" "}
              <span className="font-mono">{archiveTarget.sku}</span>)?
            </p>
            <p className="mt-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              Produk yang diarsipkan tidak akan tampil di daftar penjualan aktif, namun riwayat transaksi
              dan mutasi masa lalu tetap tersimpan secara aman.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setArchiveTarget(null)}
                disabled={isArchiving}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmArchive}
                isLoading={isArchiving}
              >
                Arsipkan Produk
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
