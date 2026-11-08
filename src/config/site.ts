export const siteConfig = {
  name: "StokCerdas AI",
  tagline: "Kelola Stok Lebih Cerdas, Jalankan Bisnis Lebih Tenang.",
  description:
    "Aplikasi manajemen persediaan berbasis AI untuk UMKM retail dan toko kelontong. Pantau stok, catat penjualan, dan peroleh rekomendasi restock tepat waktu.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  mainNav: [
    {
      title: "Ringkasan",
      href: "/dashboard",
      icon: "LayoutDashboard",
    },
    {
      title: "Produk",
      href: "/dashboard/products",
      icon: "Package",
    },
    {
      title: "Inventaris",
      href: "/dashboard/inventory",
      icon: "Warehouse",
    },
    {
      title: "Penjualan",
      href: "/dashboard/sales",
      icon: "ShoppingCart",
    },
    {
      title: "AI Analysis",
      href: "/dashboard/ai-analysis",
      icon: "BrainCircuit",
    },
    {
      title: "Laporan",
      href: "/dashboard/reports",
      icon: "BarChart3",
    },
    {
      title: "Pengaturan",
      href: "/dashboard/settings",
      icon: "Settings",
    },
  ],
};

