# StokCerdas AI

> **"Kelola Stok Lebih Cerdas, Jalankan Bisnis Lebih Tenang."**  
> Solusi Manajemen Persediaan & Kasir Ritel Berbasis Kecerdasan Buatan untuk UMKM Bali dan Indonesia.  
> **Tim:** Ramayana — Primakara University

---

## 1. Description
**StokCerdas AI** adalah platform SaaS manajemen inventaris dan kasir ritel multi-toko (multi-tenant) yang dirancang khusus untuk memecahkan masalah klasik UMKM: ketidakcocokan stok fisik, kehabisan barang dagangan mendadak (*stockout*), penumpukan barang yang lambat terjual (*overstock*), dan kerugian akibat pembukuan manual yang rawan keliru.

Sistem memadukan perhitungan deterministik di sisi backend (Average Daily Sales, Reorder Point, Safety Stock) dengan kecerdasan buatan (Google Gemini API) untuk memberikan narasi rekomendasi restock proaktif dan chatbot asisten bisnis interaktif dalam Bahasa Indonesia.

---

## 2. Problem & Target User

### Problem (Masalah Nyata)
* **Kehabisan Barang Saat Dibutuhkan (*Stockout*)**: Pemilik usaha sering kali baru menyadari stok barang kosong tepat ketika ada pelanggan yang ingin membeli.
* **Penumpukan Barang (*Overstock*)**: Produk yang kurang diminati pasar tetap dibeli dan menumpuk di gudang, menyebabkan modal usaha tertahan pada barang yang tidak terjual.
* **Kesulitan Membaca Pola Penjualan**: Meskipun terdapat catatan transaksi, pemilik usaha kesulitan menganalisis produk mana yang paling cepat atau lambat terjual.
* **Pembelian Berdasarkan Asumsi**: Keputusan restock hanya didasarkan pada perkiraan atau kebiasaan semata, bukan berdasarkan data riil penjualan.

### Target User
* **Pengguna Utama**: Pelaku Usaha Mikro, Kecil, dan Menengah (UMKM) yang menjual produk fisik, khususnya pemilik toko kelontong, minimarket kecil, toko makanan/minuman kemasan, dan toko perlengkapan rumah tangga skala kecil.
* **Staf Toko / Kasir**: Pegawai yang bertugas mencatat transaksi harian di kasir dan menerima pasokan barang masuk dari supplier.

---

## 3. Key Features (Fitur Utama MVP)

1. **Dashboard Ringkasan Operasional**:
   - Memantau kondisi persediaan, metrik total produk, total stok fisik, omzet hari ini, dan daftar produk yang memerlukan restock secara real-time.
2. **Product Management (Katalog Produk)**:
   - Pencatatan produk lengkap dengan SKU, kategori barang, harga modal, harga jual, stok fisik, dan batas stok pengaman (*safety stock*). Mode baca (read-only) untuk staf dan kelola penuh untuk pemilik.
3. **Stock Management & Audit Trail Mutasi**:
   - Pemantauan stok fisik otoritatif di level database PostgreSQL.
   - Pencatatan arus barang masuk (*Stock In*) dan penyesuaian opname fisik dengan alasan selisih stok.
4. **Sales Recording (Kasir POS Cepat)**:
   - Pencatatan transaksi kasir real-time dengan pemotongan stok otomatis dan atomik melalui stored procedure ber-lock baris (`record_sale`).
   - Anti-klik ganda (*idempotent*) dan penolakan otomatis jika stok habis.
5. **AI Inventory Analyzer**:
   - Menganalisis kondisi persediaan berdasarkan data riil (ADS, ROP, Lead Time, Estimasi Hari Habis) dan menyajikan narasi risiko bisnis dalam Bahasa Indonesia yang komunikatif.
6. **Smart Restock Recommendation**:
   - Menghitung titik pemesanan kembali (*Reorder Point*) dan memberikan rekomendasi kuantitas belanja sebelum stok toko habis.
7. **AI Business Assistant**:
   - Asisten percakapan cerdas yang terhubung dengan basis data toko untuk menjawab pertanyaan seputar produk terlaris, analisis stok kritis, dan simulasi skenario belanja.
8. **Role-Based Access Control (RBAC)**:
   - Pemisahan wewenang tegas antara akun Pemilik Toko (`OWNER`) dan Staf Kasir (`STAFF`) yang ditegakkan di level database dengan Supabase Row Level Security (RLS).
9. **Laporan Performa Bisnis**:
   - Rekapitulasi omzet multi-periode (Hari Ini, 7 Hari, 30 Hari, 90 Hari), grafik tren penjualan, peringkat produk terlaris, dan estimasi valuasi aset barang.

---

## 4. Tech Stack

* **Frontend & Framework**: Next.js 16 (App Router + React 19 + Turbopack)
* **Backend Runtime**: Next.js API Routes (Server Components & Route Handlers)
* **Bahasa**: TypeScript (Strict Type Checking)
* **Styling & UI**: Tailwind CSS v4, Lucide React Icons
* **Database & Auth**: Supabase (PostgreSQL 15+, Supabase Auth, Row-Level Security, Transaksional RPC)
* **AI Model & Engine**: Google Gemini API (`gemini-3.5-flash`) dengan latensi rendah (`thinkingBudget: 0`)
* **Validasi Skema**: Zod Runtime Validation
* **Testing Suite**: Node.js Native Test Runner + `tsx` (55 Unit & Integration Tests Lolos)
* **Hosting & Deployment**: Vercel

---

## 5. AI Implementation

* **Model yang Digunakan**: Google Gemini API (`gemini-3.5-flash`)
* **Metode Pemanggilan**: Server-Side REST API dengan Structured Output JSON & Context-Augmented Generation.
* **Peran AI**:
  1. *Analisis Kondisi Persediaan*: Mengidentifikasi produk berisiko kehabisan stok atau barang yang perputarannya lambat.
  2. *Penjelasan Rekomendasi*: Menerjemahkan metrik matematis rumit menjadi narasi saran tindakan praktis.
  3. *Asisten Pertanyaan Bisnis*: Konsultasi interaktif bagi pemilik usaha berbasis data riil toko.
* **Batasan & Responsible AI**:
  - AI dilarang keras mengarang (*hallucinate*) angka stok fisik, omzet, atau harga supplier.
  - Kegagalan API AI tidak pernah membatalkan atau memblokir transaksi kasir yang sah (didukung sistem *fallback* deterministik lokal).
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
[ Dashboard & Rekomendasi Pintar ]
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
git clone https://github.com/kenkensigma/StokCerdasAI.git
cd StokCerdasAI

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
* **Deployment URL**: [https://stok-cerdas-ai.vercel.app](https://stok-cerdas-ai.vercel.app)
* **Status**: Siap diakses live oleh dewan juri.

---

## 9. Demo Account (Untuk Juri)
Untuk mempermudah pengujian oleh dewan juri, telah disediakan akun demo resmi yang sudah terisi data toko ritel dan 7 hari histori transaksi:

| Peran | Email | Password | Keterangan & Hak Akses |
| :--- | :--- | :--- | :--- |
| **Owner (Pemilik Toko)** | `owner@stokcerdas.id` | `Password123!` | Akses penuh: Katalog Produk CRUD, Koreksi Opname Stok, Void Transaksi, Analisis AI, Asisten AI, Laporan Finansial, dan Manajemen Tim. |
| **Staff (Kasir)** | `staff@stokcerdas.id` | `Password123!` | Akses operasional harian: Kasir POS cepat dan pencatatan barang masuk. Menu sensitif otomatis dibatasi. |

---

## 10. Known Limitations
1. **Model Offline / Jeda Jaringan**: Pada kondisi koneksi internet terputus, sistem otomatis beralih menggunakan kalkulasi deterministik *fallback* lokal sehingga kasir dan stok fisik tidak pernah macet.
2. **Kebutuhan Data Awal**: Akurasi proyeksi hari habis stok memerlukan minimal 3–7 hari riwayat transaksi kasir agar tren laju harian representatif.
3. **Integrasi Perangkat Keras**: Pemindaian barcode saat ini menggunakan input keyboard/scanner barcode USB standar, belum mendukung kamera native WebRTC.

---

## 11. Third-party Resources / Credits
* [Next.js](https://nextjs.org/) — React Framework
* [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
* [Supabase](https://supabase.com/) — Database PostgreSQL & Autentikasi dengan Row Level Security
* [Google Gemini API](https://ai.google.dev/) — Large Language Model API (`gemini-3.5-flash`)
* [Lucide Icons](https://lucide.dev/) — Open-source icon library
* [Zod](https://zod.dev/) — TypeScript-first schema declaration and runtime validation

---

## 12. Team Members

**Tim: Ramayana (Primakara University)**

| Nama | Peran | Tanggung Jawab |
| :--- | :--- | :--- |
| **I Gede Raditya Putra** | Lead Full-Stack Developer & AI Architect | Perancangan arsitektur sistem, implementasi seluruh kode program (frontend, backend, database PostgreSQL & RLS), integrasi AI, serta otomasi test suite. |
| **Ni Putu Alya Mukhbita Devi** | Technical Writer & Proposal Lead | Penyusunan dokumen proposal kompetisi, penulisan narasi solusi, penyelarasan format panduan, dan dokumentasi submission. |
| **I Nyoman Nityananda Rama** | Product Ideation & Business Researcher | Riset kebutuhan dan pain points UMKM ritel lokal Bali, perumusan ide solusi bisnis, studi produk kompetitor, dan konseptualisasi fitur. |

---

## 📜 Lisensi
Lisensi MIT. Dibangun dengan bangga untuk memajukan UMKM ritel Bali dan Indonesia pada **Bali DigiFest 2026: AI Web Innovation Challenge**.
