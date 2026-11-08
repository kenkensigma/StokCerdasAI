# StokCerdas AI

> **"Kelola Stok Lebih Cerdas, Jalankan Bisnis Lebih Tenang."**
> Solusi Manajemen Persediaan & Kasir Ritel Berbasis Kecerdasan Buatan untuk UMKM Bali dan Indonesia.

---

## 1. Description
**StokCerdas AI** adalah platform SaaS manajemen inventaris dan kasir ritel multi-toko (multi-tenant) yang dirancang khusus untuk memecahkan masalah klasik UMKM: ketidakcocokan stok fisik, kehabisan barang dagangan mendadak (*stockout*), penumpukan barang yang lambat terjual (*dead stock*), dan kerugian akibat pembukuan manual yang rawan keliru.

Sistem memadukan perhitungan deterministik di sisi backend (Average Daily Sales, Reorder Point, Safety Stock) dengan kecerdasan buatan (Google Gemini API) untuk memberikan narasi rekomendasi restock proaktif dan chatbot asisten bisnis interaktif dalam Bahasa Indonesia.

---

## 2. Problem & Target User

### Problem
* **Selisih Stok Fisik vs Catatan**: Pembukuan manual di kertas atau Excel sering tidak sinkron dengan fisik barang di rak warung.
* **Kehabisan Stok Kritis (*Stockout*)**: Pemilik toko terlambat memesan ulang barang ke supplier karena tidak tahu titik aman pemesanan (*Reorder Point*), sehingga kehilangan omzet penjualan.
* **Modal Usaha Mati (*Dead Stock*)**: Pemilik toko sering over-restock barang yang jarang laku sehingga modal tertahan.
* **Kerumitan Rumus Matematis**: Pemilik UMKM tidak memiliki waktu atau latar belakang untuk menghitung rumus inventaris yang rumit secara harian.

### Target User
* **Pemilik Toko Kelontong, Warung Madura, & Minimarket Lokal** di Bali dan Indonesia.
* **Kasir & Staf Operasional Toko** yang membutuhkan aplikasi pencatatan transaksi cepat dan anti-ganda.

---

## 3. Key Features

1. **Kasir POS & Transaksi Atomik Idempoten**:
   - Pencatatan penjualan real-time dengan barcode scanner/SKU search.
   - Eksekusi pengurangan stok secara atomik di level database PostgreSQL melalui stored procedure ber-lock baris (`record_sale`).
   - Anti-klik ganda dan penolakan otomatis jika stok tidak mencukupi.
2. **Audit Trail Mutasi Stok Lengkap**:
   - Rekam jejak seluruh arus barang (`INITIAL_STOCK`, `STOCK_IN`, `SALE`, `ADJUSTMENT_IN/OUT`, `VOID_REVERSAL`).
   - Fitur Stock Opname fisik dengan alasan selisih stok wajib diisi.
3. **Multi-Tenant & Role-Based Access Control (RBAC)**:
   - Partisi data per toko dilindungi oleh **Row-Level Security (RLS)** PostgreSQL.
   - Peran terpisah: `OWNER` (akses penuh, void transaksi, tim, laporan) dan `STAFF` (kasir & catat stok masuk).
4. **Kalkulator Inventaris Deterministik**:
   - **Rata-rata Penjualan Harian (ADS)**: $\text{Total Penjualan} / \text{Jumlah Hari Data}$
   - **Estimasi Hari Stok Habis**: $\text{Stok Saat Ini} / \text{ADS}$
   - **Titik Pemesanan Ulang (ROP)**: $(\text{ADS} \times \text{Lead Time}) + \text{Safety Stock}$
   - **Saran Jumlah Restock**: $\text{Target Persediaan} - \text{Stok Saat Ini}$
   - **Data Confidence Level**: Evaluasi tingkat kematangan data (`WAITING`, `LIMITED`, `EARLY`, `HIGH`).
5. **AI Inventory Analyzer**:
   - Menghasilkan kartu analisis risiko stok dan rekomendasi pengadaan yang mudah dipahami pemilik warung.
   - Dual-Protection Fallback Engine: Jika AI offline atau timeout, mesin kalkulasi lokal otomatis menyajikan rekomendasi tanpa ada transaksi yang terganggu.
6. **Asisten Bisnis Interaktif (Chatbot AI)**:
   - Chatbot interaktif di dashboard (`/dashboard/assistant`) yang menjawab pertanyaan stok, evaluasi penjualan, dan simulasi restock berdasarkan data inventaris toko.
7. **Laporan Penjualan & Valuasi Aset**:
   - Rekap omzet multi-periode (Hari Ini, 7 Hari, 30 Hari, 90 Hari).
   - Klasifikasi produk terlaris (*Top Selling*) dan rekap arus mutasi barang.
   - Estimasi total nilai aset fisik persediaan.

---

## 4. Tech Stack

* **Frontend & Framework**: Next.js 16 (App Router + React 19 + Turbopack)
* **Bahasa**: TypeScript (Strict Type Checking)
* **Styling & UI**: Tailwind CSS v4, Lucide React Icons, Radix UI primitives
* **Database & Auth**: Supabase (PostgreSQL 15+, Supabase Auth, Row-Level Security, Database Functions/RPC)
* **AI Engine**: Google Gemini API (`gemini-3.5-flash`) via Google Gen AI SDK
* **Validasi Skema**: Zod Runtime Validation
* **Testing Suite**: Node.js Native Test Runner + `tsx` (55 Unit & Integration Tests)

---

## 5. AI Implementation

* **Model yang Digunakan**: `gemini-3.5-flash`
* **Metode Pemanggilan**: Server-Side REST API dengan Structured Output JSON & Conversational Context.
* **Peran AI**:
  1. *Contextualizer & Explainer*: Menerjemahkan angka metrik matematis dari backend menjadi bahasa bisnis natural.
  2. *Interactive Advisory*: Menjawab pertanyaan konsultasi pemilik toko dan memberikan panduan praktis restock.
* **Batasan & Responsible AI**:
  - AI dilarang keras mengarang (*hallucinate*) jumlah stok fisik, omzet, atau harga supplier.
  - Kegagalan AI tidak pernah membatalkan atau memblokir transaksi kasir yang sah.
  - Hanya data ringkasan inventaris teragregasi yang dikirim ke model; data privasi pelanggan tidak pernah dibagikan.

---

## 6. Architecture / Data Flow

```text
[ Pengguna / Kasir / Owner ]
             │
             ▼
[ Next.js Frontend (React 19, Tailwind v4, Responsive UI) ]
             │
   (HTTPS / Session Cookies)
             ▼
[ Next.js API Routes / Server Actions ]
   ├── Validasi Input (Zod Schemas)
   ├── Otorisasi Peran (RBAC: OWNER vs STAFF)
   │
   ├──▶ [ Supabase Database (PostgreSQL 15 + RLS) ]
   │       ├── Atomic Transactions & RPC (`record_sale`, `void_sale`)
   │       └── Source of Truth Stok & Audit Trail Mutasi
   │
   └──▶ [ Backend Inventory Calculator ] ──(Metrik Deterministik: ADS, ROP, Hari Habis)──┐
                                                                                         │
   ┌─────────────────────────────────────────────────────────────────────────────────────┘
   ▼
[ Google Gemini AI Engine ]
   ├── System Prompt Ketat Anti-Halusinasi
   ├── Structured JSON Validation (Zod)
   └── Autonomous Fallback Engine (Dual Protection)
             │
             ▼
[ Hasil Rekomendasi & Jawaban Asisten Bisnis ]
```

---

## 7. Installation / Run Instructions

### Prerequisites
- Node.js 20+ LTS
- npm 10+
- Akun Supabase (PostgreSQL)
- Google Gemini API Key

### Langkah Menjalankan:
```bash
# 1. Clone repository
git clone https://github.com/your-username/stokpintar-ai.git
cd stokpintar-ai

# 2. Install dependencies
npm install

# 3. Salin environment variable
cp .env.example .env.local

# 4. Jalankan script database
# Buka Supabase SQL Editor dan jalankan seluruh isi file:
# supabase/setup_all.sql

# 5. Jalankan server development
npm run dev
```

Buka browser di **`http://localhost:3000`**.

### Menjalankan Pengujian (Test Suite):
```bash
# Typecheck
npm run typecheck

# Linting
npm run lint

# Automated Unit & Integration Tests (55 test cases)
npm run test

# Production Build
npm run build
```

---

## 8. Deployment URL
* **URL Production**: `https://stokcerdas-ai.vercel.app` *(atau URL Vercel tim Anda)*
* **Status**: Siap dideploy (Lolos build optimasi Next.js 16).

---

## 9. Demo Account (Untuk Juri)
Untuk mempermudah penjurian, gunakan akun demo yang sudah disiapkan:

| Peran | Email | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Owner (Pemilik Toko)** | `demo.owner@stokcerdas.id` | *(Lihat form submission panitia)* | Akses penuh dashboard, kasir, analisis AI, laporan, pengaturan |
| **Staff (Kasir)** | `demo.kasir@stokcerdas.id` | *(Lihat form submission panitia)* | Akses operasional kasir POS dan pencatatan stok masuk |

> *Catatan Keamanan: Password akun demo dikirimkan melalui form submission resmi panitia, tidak dipublikasikan secara terbuka di repository.*

---

## 10. Known Limitations
1. **Model Offline / Jeda Waktu Gemini**: Pada kondisi koneksi sangat lambat, sistem beralih menggunakan kalkulasi deterministik fallback lokal secara otomatis agar kasir tidak terhenti.
2. **Kebutuhan Data Awal**: Akurasi proyeksi hari habis stok membutuhkan minimal 3–7 hari riwayat transaksi kasir agar pola penjualan representatif.
3. **Integrasi Perangkat Keras**: Pemindaian barcode saat ini menggunakan input keyboard/scanner USB standar, belum mendukung kamera native WebRTC.

---

## 11. Third-party Resources / Credits
* [Next.js](https://nextjs.org/) — React Framework
* [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
* [Supabase](https://supabase.com/) — Open source Firebase alternative (PostgreSQL, Auth, RLS)
* [Google Gemini API](https://ai.google.dev/) — Large Language Model API
* [Lucide Icons](https://lucide.dev/) — Open-source icon library
* [Zod](https://zod.dev/) — TypeScript-first schema declaration and validation

---

## 12. Team Members

| Nama | Peran | Tanggung Jawab |
| :--- | :--- | :--- |
| **I Gede Raditya Putra** | Lead Developer & Architect | Desain sistem, arsitektur database, integrasi AI |
| **[Nama Anggota 1]** | Frontend & UI/UX Engineer | Antarmuka pengguna, dashboard kasir, visual styling |
| **[Nama Anggota 2]** | Backend & QA Engineer | Implementasi RPC database, integrasi test suite, dokumentasi |

---

## 📜 Lisensi
Lisensi MIT. Dibangun dengan bangga untuk memajukan UMKM ritel Bali dan Indonesia pada **Bali DigiFest 2026**.
