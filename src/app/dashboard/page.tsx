"use client";

import * as React from "react";
import Link from "next/link";
import {
  Package,
  Boxes,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthSession } from "@/hooks/use-auth-session";
import type { StoreIntelligenceResponse } from "@/services/intelligence.service";
import type { StoredAiInsight } from "@/services/ai-analysis.service";

export default function DashboardOverviewPage() {
  const { isOwner } = useAuthSession();
  const [intel, setIntel] = React.useState<StoreIntelligenceResponse | null>(null);
  const [aiInsight, setAiInsight] = React.useState<StoredAiInsight | null>(null);
  const [todaySales, setTodaySales] = React.useState<{ totalAmount: number; count: number }>({
    totalAmount: 0,
    count: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadDashboardData() {
      try {
        // 1. Fetch intelligence metrics
        const intelRes = await fetch("/api/inventory/intelligence?periodDays=7");
        if (intelRes.ok) {
          const intelJson = await intelRes.json();
          setIntel(intelJson.data);
        }

        // 2. Fetch latest AI insights
        const aiRes = await fetch("/api/ai/insights");
        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          const list = aiJson.data?.insights as StoredAiInsight[] | undefined;
          if (list && list.length > 0) {
            // Find the most critical or lowest stock insight
            const critical = list.find((item) => item.analysisResult?.status === "CRITICAL");
            const low = list.find((item) => item.analysisResult?.status === "LOW");
            setAiInsight(critical || low || list[0]);
          }
        }

        // 3. Fetch sales today
        const salesRes = await fetch("/api/sales?limit=20");
        if (salesRes.ok) {
          const salesJson = await salesRes.json();
          const salesList = (salesJson.data || []) as Array<{
            total_amount: number;
            transaction_date: string;
            status: string;
          }>;

          const todayStr = new Date().toISOString().split("T")[0];
          const todayCompleted = salesList.filter(
            (s) => s.status === "COMPLETED" && s.transaction_date.startsWith(todayStr)
          );

          const totalToday = todayCompleted.reduce((sum, s) => sum + Number(s.total_amount), 0);
          setTodaySales({
            totalAmount: totalToday,
            count: todayCompleted.length,
          });
        }
      } catch (err) {
        console.error("Failed to load dashboard overview data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const items = intel?.items ?? [];
  const totalPhysicalStock = items.reduce((sum, item) => sum + item.currentStock, 0);
  const urgentItems = items
    .filter((item) => item.status === "CRITICAL" || item.status === "LOW" || item.status === "WAITING")
    .slice(0, 4);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Ringkasan Toko
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau kondisi persediaan dan penjualan toko secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/sales"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-blue-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            Catat Penjualan
          </Link>
          {isOwner ? (
            <Link
              href="/dashboard/products"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Tambah Produk
            </Link>
          ) : (
            <Link
              href="/dashboard/inventory"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Boxes className="h-4 w-4" aria-hidden="true" />
              Barang Masuk
            </Link>
          )}
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Produk</span>
              <Package className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl font-bold mt-1">
              {isLoading ? <Skeleton className="h-8 w-16" /> : intel?.summary.totalProducts ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-slate-500">Item fisik aktif terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Stok Fisik</span>
              <Boxes className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl font-bold mt-1">
              {isLoading ? <Skeleton className="h-8 w-20" /> : `${totalPhysicalStock} unit`}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-slate-500">Autoritatif di database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Penjualan Hari Ini</span>
              <ShoppingCart className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl font-bold mt-1">
              {isLoading ? <Skeleton className="h-8 w-28" /> : formatCurrency(todaySales.totalAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-green-700 font-medium">
              {isLoading ? "-" : `${todaySales.count} transaksi hari ini`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Perlu Restock Segera</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl font-bold mt-1 text-amber-700">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                `${(intel?.summary.criticalCount ?? 0) + (intel?.summary.lowCount ?? 0)} Produk`
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-slate-500">
              {isLoading ? "-" : `${intel?.summary.criticalCount ?? 0} Kritis · ${intel?.summary.lowCount ?? 0} Menipis`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Inventory Warnings & AI Context Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Inventory List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Perhatian Stok Inventaris
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Produk yang memerlukan tindakan restock berdasarkan perhitungan ROP & laju penjualan
                </CardDescription>
              </div>
              <Link
                href="/dashboard/inventory"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
              >
                Lihat Semua
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : urgentItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Semua stok produk saat ini dalam kondisi aman dan normal.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {urgentItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">
                          SKU: {item.sku} · Lead time: {item.supplierLeadTimeDays} hari · ROP: {item.reorderPoint}{" "}
                          {item.unit}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span
                          className={`text-xs font-bold ${
                            item.status === "CRITICAL"
                              ? "text-red-700"
                              : item.status === "LOW"
                              ? "text-amber-700"
                              : "text-slate-600"
                          }`}
                        >
                          Sisa {item.currentStock} {item.unit}
                        </span>
                        <StatusIndicator status={item.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Insight Snapshot Card (1 Col) */}
        {/* Right Column: AI Context Snapshot (Owner) or Operational Guide (Staff) */}
        <div>
          {isOwner ? (
            <Card className="h-full flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="text-xs font-medium gap-1 bg-blue-50 text-blue-700 border-blue-200">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                    AI Inventory Analyzer
                  </Badge>
                  <span className="text-xs text-slate-400">StokCerdas AI</span>
                </div>
                <CardTitle className="text-base font-semibold mt-2 text-slate-900">
                  {aiInsight ? aiInsight.productName : "Analisis Risiko Terkini"}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {aiInsight
                    ? `SKU: ${aiInsight.productSku} · Stok: ${aiInsight.currentStock} ${aiInsight.productUnit}`
                    : "Dihasilkan dari metrik deterministik backend dan dijelaskan oleh AI"}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col justify-between text-xs space-y-4">
                {isLoading ? (
                  <div className="space-y-2 py-4">
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : aiInsight ? (
                  <div className="rounded-lg bg-blue-50/70 border border-blue-100 p-3.5 space-y-2">
                    <p className="font-semibold text-blue-900">
                      {aiInsight.analysisResult?.summary || "Rekomendasi Restock"}
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      {aiInsight.analysisResult?.riskExplanation ||
                        aiInsight.analysisResult?.recommendation ||
                        "Persediaan dipantau oleh AI."}
                    </p>
                    {aiInsight.suggestedRestockQuantity > 0 && (
                      <div className="pt-1 text-xs text-blue-800 font-medium">
                        Saran kuantitas restock: {aiInsight.suggestedRestockQuantity} {aiInsight.productUnit}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 text-slate-600 text-xs">
                    Belum ada analisis produk. Buka menu AI Inventory Analyzer untuk memulai analisis.
                  </div>
                )}

                <div className="border-t border-slate-100 pt-3">
                  <Link
                    href="/dashboard/ai-analysis"
                    className="w-full inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  >
                    Buka Halaman Analisis Lengkap
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex flex-col justify-between border-blue-100 bg-blue-50/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="text-xs font-medium gap-1 bg-amber-50 text-amber-700 border-amber-200">
                    Akses Operasional
                  </Badge>
                  <span className="text-xs text-slate-400">Staf Kasir</span>
                </div>
                <CardTitle className="text-base font-semibold mt-2 text-slate-900">
                  Panduan Kasir & Persediaan
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Hak akses staf mencakup pencatatan transaksi kasir dan mutasi barang masuk.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col justify-between text-xs space-y-4">
                <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
                  <div className="rounded-lg bg-white border border-slate-200 p-3 shadow-xs">
                    <p className="font-semibold text-slate-900 mb-1">Kasir POS Cepat</p>
                    <p>Catat setiap transaksi penjualan langsung agar stok fisik di rak otomatis terpotong seketika.</p>
                  </div>
                  <div className="rounded-lg bg-white border border-slate-200 p-3 shadow-xs">
                    <p className="font-semibold text-slate-900 mb-1">Penerimaan Barang Masuk</p>
                    <p>Catat pasokan barang baru dari supplier melalui menu Inventaris agar jumlah stok selalu akurat.</p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <Link
                    href="/dashboard/sales"
                    className="w-full inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Buka Kasir POS Sekarang
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
