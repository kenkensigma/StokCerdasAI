"use client";

import * as React from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  AlertCircle,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRupiah } from "@/lib/utils/format";
import type { ProductItem } from "@/components/products/product-table";
import { SaleDetailDialog, type SaleDetailData } from "./sale-detail-dialog";

export interface CartItem {
  product: ProductItem;
  quantity: number;
}

interface PosCashierProps {
  products: ProductItem[];
  categories: { id: string; name: string }[];
  onSaleCompleted: () => void;
}

export function PosCashier({
  products,
  categories,
  onSaleCompleted,
}: PosCashierProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [notes, setNotes] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Success dialog state
  const [completedSale, setCompletedSale] = React.useState<SaleDetailData | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = React.useState(false);

  // Filter products
  const availableProducts = React.useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory =
        selectedCategory === "ALL" || p.category_id === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Cart operations
  const addToCart = (product: ProductItem) => {
    if (product.current_stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.current_stock) {
          setError(`Stok maksimal untuk ${product.name} adalah ${product.current_stock} ${product.unit}`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setError(null);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.product.current_stock) {
              setError(`Stok tidak mencukupi untuk ${item.product.name} (maks: ${item.product.current_stock})`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
    setError(null);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    setError(null);
  };

  const clearCart = () => {
    setCart([]);
    setNotes("");
    setError(null);
  };

  // Calculations
  const totalAmount = React.useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.quantity * item.product.selling_price,
      0
    );
  }, [cart]);

  const totalItemsCount = React.useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Checkout submission
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setError("Keranjang belanja masih kosong");
      return;
    }

    setIsLoading(true);
    setError(null);

    const idempotencyKey = crypto.randomUUID();

    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.selling_price,
        })),
        notes: notes.trim() || null,
        idempotencyKey,
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error?.message || "Gagal memproses transaksi penjualan");
      }

      // Fetch full sale detail for receipt
      const saleId = resData.data.sale_id;
      const detailRes = await fetch(`/api/sales/${saleId}`);
      const detailData = await detailRes.json();

      if (detailRes.ok && detailData.data) {
        setCompletedSale(detailData.data);
        setIsSuccessDialogOpen(true);
      }

      clearCart();
      onSaleCompleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat transaksi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Product Selection (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
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
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
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

        {/* Product Catalog Grid */}
        {availableProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Tidak ada produk ditemukan"
            description="Tidak ada barang dagangan yang sesuai dengan filter pencarian."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {availableProducts.map((prod) => {
              const inCart = cart.find((item) => item.product.id === prod.id);
              const isOutOfStock = prod.current_stock <= 0;
              const isMaxInCart = inCart && inCart.quantity >= prod.current_stock;

              return (
                <div
                  key={prod.id}
                  className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all ${
                    isOutOfStock
                      ? "bg-slate-50 border-slate-200 opacity-60"
                      : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {prod.name}
                      </h4>
                      {isOutOfStock ? (
                        <span className="shrink-0 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                          HABIS
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Stok: {prod.current_stock} {prod.unit}
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[10px] text-slate-400">
                      {prod.sku} &bull; {prod.categories?.name || "Tanpa Kategori"}
                    </p>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-700">
                      {formatRupiah(prod.selling_price)}
                    </span>

                    <Button
                      type="button"
                      size="sm"
                      variant={inCart ? "secondary" : "outline"}
                      disabled={isOutOfStock || isMaxInCart}
                      onClick={() => addToCart(prod)}
                      className="h-8 text-xs font-medium px-2.5 flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {inCart ? `+1 (${inCart.quantity})` : "Tambah"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Column: Active Cart / Checkout (5 cols) */}
      <div className="lg:col-span-5">
        <Card className="sticky top-24 border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-indigo-600" />
              <CardTitle className="text-sm">Keranjang Transaksi</CardTitle>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] font-medium text-red-600 hover:text-red-700 cursor-pointer"
              >
                Kosongkan
              </button>
            )}
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <ShoppingCart className="h-8 w-8 mx-auto opacity-30" />
                <p className="text-xs">Keranjang transaksi masih kosong</p>
                <p className="text-[11px] text-slate-400">
                  Pilih produk dari katalog di sebelah kiri untuk mulai transaksi kasir
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-semibold text-slate-800 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {formatRupiah(item.product.selling_price)} / {item.product.unit}
                      </p>
                      <p className="text-xs font-bold text-indigo-600 mt-0.5">
                        {formatRupiah(item.product.selling_price * item.quantity)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="h-7 w-7 rounded-lg border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-100 text-slate-700 cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>

                      <span className="w-8 text-center font-bold text-xs">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        disabled={item.quantity >= item.product.current_stock}
                        className="h-7 w-7 rounded-lg border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-100 text-slate-700 disabled:opacity-40 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="h-7 w-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center ml-1 cursor-pointer"
                        title="Hapus barang"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Transaction Notes */}
            {cart.length > 0 && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  Catatan Transaksi (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Meja 4, Bawa pulang..."
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            )}

            {/* Financial Summary */}
            {cart.length > 0 && (
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Produk</span>
                  <span className="font-medium">{totalItemsCount} pcs ({cart.length} jenis)</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-800">Total Pembayaran</span>
                  <span className="text-lg font-extrabold text-indigo-700">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Checkout Button */}
            <Button
              type="button"
              disabled={cart.length === 0 || isLoading}
              isLoading={isLoading}
              onClick={handleCheckout}
              className="w-full py-3 h-11 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
            >
              {isLoading ? "Memproses Transaksi..." : `Selesaikan Transaksi (${formatRupiah(totalAmount)})`}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Success Receipt Modal Dialog */}
      <SaleDetailDialog
        isOpen={isSuccessDialogOpen}
        onClose={() => {
          setIsSuccessDialogOpen(false);
          setCompletedSale(null);
        }}
        sale={completedSale}
      />
    </div>
  );
}
