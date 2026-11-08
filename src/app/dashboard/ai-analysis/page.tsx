"use client";

import * as React from "react";
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  ShieldCheck,
  AlertCircle,
  Package,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleRestrictedCard } from "@/components/auth/role-restricted-card";
import { useAuthSession } from "@/hooks/use-auth-session";
import type { StoredAiInsight } from "@/services/ai-analysis.service";

interface AiInsightsResponseData {
  insights: StoredAiInsight[];
  summary: {
    totalAnalyzed: number;
    criticalCount: number;
    lowCount: number;
    normalCount: number;
    waitingCount: number;
    lastAnalyzedAt: string | null;
  };
}

async function fetchInsightsApi(): Promise<AiInsightsResponseData> {
  const res = await fetch("/api/ai/insights");
  if (!res.ok) {
    throw new Error("Gagal mengambil data analisis AI");
  }
  const json = await res.json();
  return json.data;
}

export default function AiAnalysisPage() {
  const { isOwner, isLoading: isAuthLoading } = useAuthSession();
  const [data, setData] = React.useState<AiInsightsResponseData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [singleRefreshingId, setSingleRefreshingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notification, setNotification] = React.useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  React.useEffect(() => {
    let isCancelled = false;

    fetchInsightsApi()
      .then((resData) => {
        if (!isCancelled) {
          setData(resData);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Terjadi kesalahan koneksi");
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    setNotification(null);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        throw new Error("Gagal memperbarui analisis AI");
      }

      const refreshed = await fetchInsightsApi();
      setData(refreshed);
      setNotification("Analisis AI seluruh katalog toko berhasil diperbarui!");
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui analisis");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefreshSingle = async (productId: string, productName: string) => {
    setSingleRefreshingId(productId);
    setNotification(null);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (!res.ok) {
        throw new Error(`Gagal memperbarui analisis untuk ${productName}`);
      }

      const refreshed = await fetchInsightsApi();
      setData(refreshed);
      setNotification(`Analisis AI untuk "${productName}" berhasil diperbarui.`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui produk");
    } finally {
      setSingleRefreshingId(null);
    }
  };

  const formatTimestamp = (dateString: string | null) => {
    if (!dateString) return "Belum pernah dianalisis";
    try {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  const insightsList = data?.insights ?? [];
  const filteredInsights = insightsList.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.categoryName && item.categoryName.toLowerCase().includes(searchQuery.toLowerCase()));

    const itemStatus = item.analysisResult?.status || "WAITING";
    const matchesStatus =
      statusFilter === "ALL" ||
      itemStatus === statusFilter ||
      (statusFilter === "NEEDS_ATTENTION" && (itemStatus === "CRITICAL" || itemStatus === "LOW"));

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CRITICAL":
        return <Badge variant="critical">Prioritas Kritis</Badge>;
      case "LOW":
        return <Badge variant="warning">Stok Menipis</Badge>;
      case "NORMAL":
        return <Badge variant="success">Stok Aman</Badge>;
      case "WAITING":
      case "COLLECTING":
      default:
        return <Badge variant="waiting">Menunggu Data</Badge>;
    }
  };

  if (!isAuthLoading && !isOwner) {
    return (
      <RoleRestrictedCard
        title="Analisis Stok AI — Khusus Pemilik Toko"
        description="Fitur analisis persediaan prediktif dan rekomendasi restock proaktif merupakan fitur manajemen strategis untuk Pemilik Toko (OWNER). Akun Anda terdaftar sebagai Staf Toko (STAFF)."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              AI Inventory Analyzer
            </h1>
            <Badge variant="default" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
              StokCerdas AI
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Penjelasan kontekstual dan rekomendasi restock berbasis AI dari metrik penjualan riil tokomu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
            {isRefreshing ? "Menganalisis..." : "Perbarui Analisis AI"}
          </Button>
        </div>
      </div>

      {/* Freshness banner & notifications */}
      {notification && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-md text-xs sm:text-sm flex items-center justify-between">
          <span>{notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-blue-600 hover:text-blue-800 font-semibold text-xs ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3 bg-white">
          <span className="text-xs text-slate-500 font-medium">Total Dianalisis</span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {isLoading ? "-" : data?.summary.totalAnalyzed ?? 0}
          </p>
          <span className="text-xs text-slate-400 mt-0.5 block">SKU terpantau</span>
        </Card>

        <Card className="p-3 bg-red-50/50 border-red-200">
          <span className="text-xs text-red-700 font-medium flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
            Stok Kritis
          </span>
          <p className="text-xl font-bold text-red-700 mt-1">
            {isLoading ? "-" : data?.summary.criticalCount ?? 0}
          </p>
          <span className="text-xs text-red-600/80 mt-0.5 block">Perlu restock hari ini</span>
        </Card>

        <Card className="p-3 bg-amber-50/50 border-amber-200">
          <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            Stok Menipis
          </span>
          <p className="text-xl font-bold text-amber-700 mt-1">
            {isLoading ? "-" : data?.summary.lowCount ?? 0}
          </p>
          <span className="text-xs text-amber-600/80 mt-0.5 block">Mendekati ROP</span>
        </Card>

        <Card className="p-3 bg-green-50/50 border-green-200">
          <span className="text-xs text-green-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
            Stok Aman
          </span>
          <p className="text-xl font-bold text-green-700 mt-1">
            {isLoading ? "-" : data?.summary.normalCount ?? 0}
          </p>
          <span className="text-xs text-green-600/80 mt-0.5 block">Di atas titik aman</span>
        </Card>

        <Card className="p-3 bg-slate-50 border-slate-200 col-span-2 md:col-span-1">
          <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
            Menunggu Data
          </span>
          <p className="text-xl font-bold text-slate-700 mt-1">
            {isLoading ? "-" : data?.summary.waitingCount ?? 0}
          </p>
          <span className="text-xs text-slate-500 mt-0.5 block">Belum ada transaksi</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              statusFilter === "ALL"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Semua ({data?.insights.length ?? 0})
          </button>
          <button
            onClick={() => setStatusFilter("CRITICAL")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              statusFilter === "CRITICAL"
                ? "bg-red-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Kritis ({data?.summary.criticalCount ?? 0})
          </button>
          <button
            onClick={() => setStatusFilter("LOW")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              statusFilter === "LOW"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Menipis ({data?.summary.lowCount ?? 0})
          </button>
          <button
            onClick={() => setStatusFilter("NORMAL")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              statusFilter === "NORMAL"
                ? "bg-green-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Aman ({data?.summary.normalCount ?? 0})
          </button>
          <button
            onClick={() => setStatusFilter("WAITING")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              statusFilter === "WAITING"
                ? "bg-slate-700 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Menunggu Data ({data?.summary.waitingCount ?? 0})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari nama produk / SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-9"
          />
        </div>
      </div>

      {/* Analysis Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : filteredInsights.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Tidak ada hasil analisis yang cocok"
          description={
            searchQuery
              ? `Tidak ditemukan produk dengan kata kunci "${searchQuery}". Coba ubah pencarian atau filter.`
              : "Belum ada produk terdaftar di toko ini. Daftarkan produk terlebih dahulu di menu Produk."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredInsights.map((item) => {
            const result = item.analysisResult;
            const input = item.analysisInput;
            const isSingleLoading = singleRefreshingId === item.productId;

            return (
              <Card key={item.id} className="border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base font-semibold text-slate-900">
                          {item.productName}
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 mt-0.5">
                          SKU: {item.productSku} {item.categoryName ? `· ${item.categoryName}` : ""}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {getStatusBadge(result?.status || "WAITING")}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 text-xs">
                    {/* Quick Metrics Strip */}
                    <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                      <div>
                        <span className="text-slate-500 text-xs block">Stok Fisik</span>
                        <p
                          className={`font-bold text-sm mt-0.5 ${
                            item.currentStock <= item.reorderPoint ? "text-red-600" : "text-slate-900"
                          }`}
                        >
                          {item.currentStock} {item.productUnit}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-500 text-xs block">Titik ROP</span>
                        <p className="font-semibold text-sm text-slate-900 mt-0.5">
                          {item.reorderPoint} {item.productUnit}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-500 text-xs block">Est. Habis</span>
                        <p className="font-semibold text-sm text-slate-900 mt-0.5">
                          {item.estimatedStockoutDays !== null ? `${item.estimatedStockoutDays} hari` : "-"}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-500 text-xs block">Saran Restock</span>
                        <p
                          className={`font-bold text-sm mt-0.5 ${
                            item.suggestedRestockQuantity > 0 ? "text-blue-600" : "text-slate-600"
                          }`}
                        >
                          {item.suggestedRestockQuantity > 0
                            ? `${item.suggestedRestockQuantity} ${item.productUnit}`
                            : "-"}
                        </p>
                      </div>
                    </div>

                    {/* AI Explanation Box */}
                    <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-blue-900 text-xs flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                          Penjelasan AI ({item.modelName})
                        </span>
                        <span className="text-xs text-blue-700/80">
                          {input.dataCoverage.level}
                        </span>
                      </div>

                      {/* Summary */}
                      <p className="text-slate-800 font-medium leading-relaxed">
                        {result?.summary || "Analisis sedang disiapkan."}
                      </p>

                      {/* Risk Explanation */}
                      {result?.riskExplanation && (
                        <div className="text-slate-700 leading-relaxed pt-1 border-t border-blue-100/70">
                          <span className="font-medium text-slate-900">Analisis Risiko: </span>
                          {result.riskExplanation}
                        </div>
                      )}

                      {/* Recommendation */}
                      {result?.recommendation && (
                        <div className="text-slate-700 leading-relaxed bg-white/70 p-2.5 rounded border border-blue-100">
                          <span className="font-semibold text-blue-900">Saran Tindakan: </span>
                          {result.recommendation}
                        </div>
                      )}

                      {/* Confidence note */}
                      {result?.confidenceNote && (
                        <p className="text-xs text-slate-500 pt-0.5">
                          ℹ️ {result.confidenceNote}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </div>

                {/* Footer with timestamp and per-product refresh */}
                <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 rounded-b-xl">
                  <span>Dianalisis: {formatTimestamp(item.createdAt)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isSingleLoading || isRefreshing}
                    onClick={() => handleRefreshSingle(item.productId, item.productName)}
                    className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isSingleLoading ? "animate-spin" : ""}`} />
                    {isSingleLoading ? "Menganalisis..." : "Analisis Ulang"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
