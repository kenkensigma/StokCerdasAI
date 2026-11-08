"use client";

import * as React from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Boxes,
  ArrowDownLeft,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleRestrictedCard } from "@/components/auth/role-restricted-card";
import { useAuthSession } from "@/hooks/use-auth-session";
import type { BusinessReportData } from "@/services/reports.service";

const PERIOD_OPTIONS = [
  { label: "Hari Ini", days: 1 },
  { label: "7 Hari Terakhir", days: 7 },
  { label: "30 Hari Terakhir", days: 30 },
  { label: "90 Hari Terakhir", days: 90 },
];

export default function ReportsPage() {
  const { isOwner, isLoading: isAuthLoading } = useAuthSession();
  const [periodDays, setPeriodDays] = React.useState<number>(7);
  const [data, setData] = React.useState<BusinessReportData | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isCancelled = false;

    fetch(`/api/reports?periodDays=${periodDays}`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil data laporan bisnis");
        return res.json();
      })
      .then((json) => {
        if (!isCancelled) {
          setData(json.data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Terjadi kesalahan koneksi");
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [periodDays]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  if (!isAuthLoading && !isOwner) {
    return (
      <RoleRestrictedCard
        title="Laporan Finansial — Khusus Pemilik Toko"
        description="Laporan performa finansial, omzet penjualan, dan valuasi aset toko merupakan informasi strategis yang hanya dapat diakses oleh Pemilik Toko (OWNER). Akun Anda terdaftar sebagai Staf Toko (STAFF)."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Laporan Bisnis & Mutasi Stok
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Rekapitulasi penjualan, omzet bersih, barang terlaris, dan pergerakan persediaan.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => {
                setPeriodDays(opt.days);
                setIsLoading(true);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                periodDays === opt.days
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-xs sm:text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Omzet Penjualan</span>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold mt-1 text-slate-900">
              {isLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                formatCurrency(data?.summary.totalRevenue ?? 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-slate-500">
              {isLoading ? "-" : `${data?.summary.totalTransactions ?? 0} transaksi berhasil`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Rata-rata Nilai Belanja</span>
              <ShoppingCart className="h-4 w-4 text-slate-400" />
            </div>
            <CardTitle className="text-2xl font-bold mt-1 text-slate-900">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatCurrency(data?.summary.averageTransactionValue ?? 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-slate-500">Omzet per struk transaksi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Unit Terjual (Keluar)</span>
              <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold mt-1 text-slate-900">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                `${data?.movements.stockOutUnits ?? 0} unit`
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-emerald-700 font-medium">Melalui kasir / POS</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Estimasi Nilai Persediaan</span>
              <Boxes className="h-4 w-4 text-slate-400" />
            </div>
            <CardTitle className="text-2xl font-bold mt-1 text-slate-900">
              {isLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                formatCurrency(data?.summary.estimatedInventoryAssetValue ?? 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-slate-500">
              {isLoading ? "-" : `${data?.summary.totalStockUnits ?? 0} unit fisik di gudang/rak`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Top Products & Stock Movements Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products (2 Cols) */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Produk Terlaris (Top Selling)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Daftar produk dengan kuantitas penjualan tertinggi pada periode ini
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : !data?.topProducts || data.topProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Belum ada transaksi penjualan tercatat pada periode ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2.5 px-3 font-semibold w-12">Peringkat</th>
                        <th className="py-2.5 px-3 font-semibold">Produk & SKU</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Unit Terjual</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Kontribusi Omzet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.topProducts.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                                idx === 0
                                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                                  : idx === 1
                                  ? "bg-slate-200 text-slate-700"
                                  : idx === 2
                                  ? "bg-amber-50 text-amber-900 border border-amber-200"
                                  : "text-slate-500"
                              }`}
                            >
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-semibold text-slate-900">{p.name}</p>
                            <span className="text-slate-400 text-xs">SKU: {p.sku}</span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900">
                            {p.quantitySold} {p.unit}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-blue-700">
                            {formatCurrency(p.totalRevenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stock Movements Summary (1 Col) */}
        <div>
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Boxes className="h-4 w-4 text-slate-600" />
                Rekapitulasi Mutasi Stok
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Ringkasan arus barang masuk dan keluar persediaan
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3.5 text-xs flex-1">
              {isLoading ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-lg bg-green-50/70 border border-green-200 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-green-900 block">Stok Masuk (Stock-IN)</span>
                      <span className="text-xs text-green-700">Penerimaan dari supplier</span>
                    </div>
                    <span className="text-base font-bold text-green-800">
                      +{data?.movements.stockInUnits ?? 0} unit
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-blue-900 block">Stok Keluar (Penjualan)</span>
                      <span className="text-xs text-blue-700">Transaksi kasir selesai</span>
                    </div>
                    <span className="text-base font-bold text-blue-800">
                      -{data?.movements.stockOutUnits ?? 0} unit
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-amber-900 block">Penyesuaian (Opname)</span>
                      <span className="text-xs text-amber-700">Koreksi fisik selisih stok</span>
                    </div>
                    <span className="text-base font-bold text-amber-800">
                      {(data?.movements.adjustmentUnits ?? 0) >= 0 ? "+" : ""}
                      {data?.movements.adjustmentUnits ?? 0} unit
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 block">Pembatalan (Void)</span>
                      <span className="text-xs text-slate-500">Stok dikembalikan ke rak</span>
                    </div>
                    <span className="text-base font-bold text-slate-700">
                      +{data?.movements.reversalUnits ?? 0} unit
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Completed Sales Table */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Riwayat Transaksi Terkini
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              10 struk transaksi penjualan terakhir yang berhasil tercatat
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-2 py-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !data?.recentSales || data.recentSales.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Belum ada riwayat transaksi pada rentang waktu ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 px-3 font-semibold">No. Transaksi</th>
                    <th className="py-2.5 px-3 font-semibold">Waktu Penjualan</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Jumlah Barang</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Total Transaksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentSales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono font-semibold text-blue-700">
                        {s.transactionNumber}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {formatDate(s.transactionDate)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-700">
                        {s.itemCount} item
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatCurrency(s.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
