import Link from "next/link";
import {
  Boxes,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Store,
  Receipt,
  Sparkles,
  Zap,
  Lock,
  Layers,
} from "lucide-react";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs transition-transform group-hover:scale-105">
              <Boxes className="h-5 w-5" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold tracking-tight text-slate-950">
                Stok<span className="text-blue-600">Cerdas</span>
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                AI
              </span>
            </div>
          </Link>

          {/* Main Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700">
            <Link href="#fitur" className="hover:text-blue-600 transition-colors">
              Inventaris
            </Link>
            <Link href="#kasir" className="hover:text-blue-600 transition-colors">
              Kasir POS
            </Link>
            <Link href="#ai-intelligence" className="hover:text-blue-600 transition-colors">
              Kecerdasan AI
            </Link>
            <Link href="#keamanan" className="hover:text-blue-600 transition-colors">
              Keamanan & Privasi
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-700 hover:text-blue-600 px-3 py-2 transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 text-sm font-semibold shadow-xs transition-colors"
            >
              Daftar Toko Gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* 2. Hero Section (Type-Led with Tasteful Floating Cards & Metrics) */}
        <section className="pt-16 pb-16 md:pt-24 md:pb-24 border-b border-slate-200 bg-white relative overflow-hidden">
          {/* Subtle architectural ambient highlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none -z-10 flex items-start justify-center">
            <div className="w-[600px] h-[260px] bg-blue-100/40 blur-3xl rounded-full" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Value Proposition */}
            <div className="max-w-3xl mx-auto text-center space-y-5 mb-14">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.12]">
                Kelola Stok Fisik & Kasir Ritel{" "}
                <span className="text-blue-600">Tanpa Pernah Selisih</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
                Sistem inventaris multi-toko berbasis database PostgreSQL otoritatif. Transaksi kasir memotong stok seketika secara atomik, lengkap dengan audit trail mutasi fisik dan rekomendasi restock cerdas dari kecerdasan buatan (AI).
              </p>
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-6 text-sm font-semibold shadow-xs transition-colors"
                >
                  Mulai Gunakan Sekarang
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-6 text-sm font-semibold transition-colors"
                >
                  Masuk ke Toko Anda
                </Link>
              </div>
            </div>

            {/* Floating Highlights & Feature Cards (Clean, Elevated, Interactive) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Floating Card 1: Real-Time Stock */}
              <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                      <Zap className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Otoritatif Real-Time
                    </span>
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900 leading-snug">
                      Stok Fisik Selalu Sinkron
                    </p>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      Setiap penjualan kasir langsung memotong stok di level database. Tidak ada selisih antara angka di aplikasi dengan barang di rak toko.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Audit Mutasi Masuk/Keluar</span>
                  <span className="font-bold text-emerald-700">0% Selisih</span>
                </div>
              </div>

              {/* Floating Card 2: High-Speed POS */}
              <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                      Anti-Dobel
                    </span>
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900 leading-snug">
                      Kasir POS Cepat & Idempoten
                    </p>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      Pencatatan kasir yang aman dari klik ganda saat koneksi lambat. Transaksi ditolak otomatis jika stok produk telah habis.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Kecepatan Pemrosesan</span>
                  <span className="font-bold text-blue-700">&lt; 0.5 Detik</span>
                </div>
              </div>

              {/* Floating Card 3: AI Restock Prediction */}
              <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                      StokCerdas AI
                    </span>
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900 leading-snug">
                      Prediksi Restock Proaktif
                    </p>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      Kalkulasi Reorder Point (ROP) matematis dipadukan dengan penjelasan AI yang mudah dimengerti pemilik toko sebelum stok kehabisan.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Akurasi Laju Penjualan</span>
                  <span className="font-bold text-indigo-700">Deterministik + AI</span>
                </div>
              </div>
            </div>

            {/* Quick Reliability Metrics Bar */}
            <div className="mt-10 max-w-4xl mx-auto p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-around gap-4 text-center">
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-slate-950">0%</p>
                <p className="text-xs font-medium text-slate-600 mt-0.5">Toleransi Selisih Stok</p>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-blue-600">&lt; 0.5s</p>
                <p className="text-xs font-medium text-slate-600 mt-0.5">Kecepatan Transaksi Kasir</p>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-slate-950">100%</p>
                <p className="text-xs font-medium text-slate-600 mt-0.5">Audit Trail Mutasi Fisik</p>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-emerald-600">RLS</p>
                <p className="text-xs font-medium text-slate-600 mt-0.5">Isolasi Data Multi-Toko</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Indonesian UMKM Categories Strip */}
        <section className="py-10 bg-slate-50 border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-semibold text-slate-600 mb-6">
              Dipercaya oleh berbagai kategori usaha ritel dan UMKM di Indonesia
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              <div className="p-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs">
                <Store className="h-4 w-4 text-blue-600" />
                <span>Toko Kelontong</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs">
                <Boxes className="h-4 w-4 text-blue-600" />
                <span>Minimarket Ritel</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>Apotek & Toko Obat</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs">
                <Layers className="h-4 w-4 text-blue-600" />
                <span>Grosir Sembako</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs col-span-2 sm:col-span-1">
                <Receipt className="h-4 w-4 text-blue-600" />
                <span>Toko ATK & Hobi</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Core Features Section (Pilar Utama Sistem) */}
        <section id="fitur" className="py-16 md:py-24 bg-white border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
                Fondasi Sistem Kasir & Inventaris Modern
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Tiga pilar arsitektur yang dirancang untuk mencegah selisih stok fisik di lapangan, menjaga keaslian data finansial, dan menghemat waktu operasional pemilik toko.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1: Authoritative Stock & Movements */}
              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Boxes className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">
                      Stok Otoritatif & Audit Mutasi
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      Kuantitas stok hanya diperbarui melalui prosedur transaksi database (RPC). Setiap stok masuk, penjualan kasir, atau penyesuaian opname menghasilkan catatan mutasi yang tidak dapat dimanipulasi.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2 text-xs font-medium">
                  <div className="flex justify-between text-slate-600">
                    <span>Mutasi Masuk (PO Supplier)</span>
                    <span className="font-semibold text-emerald-700">+50 sak</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Mutasi Keluar (Penjualan Kasir)</span>
                    <span className="font-semibold text-red-700">-12 sak</span>
                  </div>
                  <div className="flex justify-between text-slate-600 border-t border-slate-100 pt-1.5">
                    <span className="font-bold text-slate-900">Stok Akhir Terverifikasi</span>
                    <span className="font-bold text-blue-700">38 sak</span>
                  </div>
                </div>
              </div>

              {/* Feature 2: High-Speed POS & Atomicity */}
              <div id="kasir" className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">
                      Kasir Cepat & Kunci Idempotensi
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      Pencatatan kasir instan yang melindungi bisnis Anda dari pemotongan stok ganda akibat kendala sinyal internet. Transaksi ditolak otomatis jika stok tidak mencukupi.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2 text-xs font-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Idempotency Key Check</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                      Aktif (Anti-Dobel)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Row-Level Database Lock</span>
                    <span className="font-semibold text-slate-900">FOR UPDATE</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
                    <span className="text-slate-600">Waktu Eksekusi Kasir</span>
                    <span className="font-bold text-emerald-700">&lt; 0.5 detik</span>
                  </div>
                </div>
              </div>

              {/* Feature 3: Deterministic Calculations & AI */}
              <div id="ai-intelligence" className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="h-10 w-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">
                      Kecerdasan Buatan Terintegrasi (AI)
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      Kalkulasi stok dan reorder point selalu dihitung secara matematis oleh backend. Modul AI bertugas menerjemahkan tren penjualan ke dalam bahasa manusia yang praktis untuk keputusan restock.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>Reorder Point (ROP)</span>
                    <span className="font-bold text-slate-900">10 unit</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>Estimasi Habis (Lead Time 2h)</span>
                    <span className="font-bold text-amber-700">1.8 hari lagi</span>
                  </div>
                  <p className="border-t border-slate-100 pt-1.5 text-slate-600 leading-snug">
                    AI menjelaskan urgensi pemesanan supplier tanpa pernah mengubah stok secara sepihak.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Deep-Dive Comparison Section (Mengapa StokCerdas Berbeda) */}
        <section id="keamanan" className="py-16 md:py-24 bg-slate-50 border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950 leading-tight">
                  Dirancang Khusus untuk Ketahanan Operasional Ritel
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  Aplikasi inventaris biasa sering mengalami selisih karena stok disimpan di browser atau aplikasi kasir yang lambat saat jaringan tidak stabil. StokCerdas AI memprioritaskan integritas data di setiap titik.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Pemisahan Peran Tegas (OWNER vs STAFF)
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Staf kasir hanya dapat mencatat penjualan. Penyesuaian stok opname dan pembatalan faktur membutuhkan otorisasi pemilik toko.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Isolasi Data Antar-Toko (Multi-Tenant RLS)
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Setiap toko memiliki lingkungan data terisolasi. Toko lain tidak dapat melihat harga modal, stok, maupun transaksi kasir Anda.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Presisi Finansial Aman (PostgreSQL NUMERIC)
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Kuantitas stok dan perhitungan Rupiah bebas dari kesalahan pembulatan desimal floating-point.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Pembatalan Transaksi Transparan (Void Workflow)
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Tidak ada transaksi yang dihapus secara diam-diam. Faktur yang dibatalkan mengembalikan stok secara atomik beserta alasan pembatalan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security and Reliability Spec Card */}
              <div className="p-6 sm:p-8 rounded-xl border border-slate-200 bg-white shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Spesifikasi Keandalan Sistem</p>
                      <p className="text-xs text-slate-600">Audit Standar StokCerdas AI</p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                    Production Grade
                  </span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-medium text-slate-700">Toleransi Selisih Stok</span>
                    <span className="font-bold text-blue-700">0% (Authoritative Database)</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-medium text-slate-700">Perlindungan Penjualan Ganda</span>
                    <span className="font-bold text-slate-900">Client UUID Idempotency</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-medium text-slate-700">Audit Trail Pembatalan Kasir</span>
                    <span className="font-bold text-slate-900">Immutable Ledger</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-medium text-slate-700">Pemulihan Kegagalan AI</span>
                    <span className="font-bold text-slate-900">Fail-Safe (Penjualan Tetap Berjalan)</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/register"
                    className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors"
                  >
                    Mulai Pendaftaran Toko Anda
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Call to Action (Grounded Banner) */}
        <section className="py-16 md:py-20 bg-slate-900 text-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              Tingkatkan Keuntungan Toko dengan Manajemen Stok Akurat
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              Daftarkan usaha Anda dalam hitungan menit. Kelola produk, catat transaksi kasir pertama, dan pantau stok fisik secara profesional.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-6 text-sm font-semibold shadow-xs transition-colors"
              >
                Buat Akun Toko Gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 text-sm font-semibold transition-colors"
              >
                Masuk ke Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 7. Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 text-xs sm:text-sm text-slate-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs shadow-xs">
              <Boxes className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">{siteConfig.name}</p>
              <p className="text-xs text-slate-600">
                Sistem Manajemen Inventaris & Kasir Ritel UMKM Indonesia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-medium text-slate-700">
            <Link href="/login" className="hover:text-blue-600 transition-colors">
              Masuk
            </Link>
            <Link href="/register" className="hover:text-blue-600 transition-colors">
              Daftar
            </Link>
            <Link href="#fitur" className="hover:text-blue-600 transition-colors">
              Fitur
            </Link>
            <Link href="#keamanan" className="hover:text-blue-600 transition-colors">
              Keamanan
            </Link>
          </div>

          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} {siteConfig.name}. Seluruh hak cipta dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}
