"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  BrainCircuit,
  Bot,
  BarChart3,
  Settings,
  Store,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { siteConfig } from "@/config/site";
import type { Role } from "@/lib/permissions/roles";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  storeName?: string;
  role?: Role;
}

const navItems = [
  {
    title: "Ringkasan",
    href: "/dashboard",
    icon: LayoutDashboard,
    ownerOnly: false,
  },
  {
    title: "Produk",
    href: "/dashboard/products",
    icon: Package,
    ownerOnly: false,
  },
  {
    title: "Inventaris",
    href: "/dashboard/inventory",
    icon: Warehouse,
    ownerOnly: false,
  },
  {
    title: "Penjualan",
    href: "/dashboard/sales",
    icon: ShoppingCart,
    ownerOnly: false,
  },
  {
    title: "Analisis AI",
    href: "/dashboard/ai-analysis",
    icon: BrainCircuit,
    ownerOnly: true,
  },
  {
    title: "Asisten AI",
    href: "/dashboard/assistant",
    icon: Bot,
    ownerOnly: true,
  },
  {
    title: "Laporan",
    href: "/dashboard/reports",
    icon: BarChart3,
    ownerOnly: true,
  },
  {
    title: "Pengaturan",
    href: "/dashboard/settings",
    icon: Settings,
    ownerOnly: true,
  },
];

export function Sidebar({ isOpen = false, onClose, storeName = "Toko Saya", role = "OWNER" }: SidebarProps) {
  const pathname = usePathname();
  const visibleNavItems = navItems.filter((item) => !item.ownerOnly || role === "OWNER");

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Navigasi Utama"
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold text-slate-900 hover:opacity-90">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-base shadow-xs">
              SC
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-slate-900">{siteConfig.name}</span>
              <span className="text-[11px] font-normal text-slate-500">Manajemen Stok UMKM</span>
            </div>
          </Link>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Tutup menu navigasi"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Store Context Badge */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Store className="h-4 w-4 text-blue-600 shrink-0" aria-hidden="true" />
            <span className="font-medium text-slate-900 truncate">{storeName}</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors select-none",
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-blue-700" : "text-slate-400"
                  )}
                  aria-hidden="true"
                />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-200 p-4 text-xs text-slate-500">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Mode Akses:</span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[11px] font-semibold",
                role === "OWNER"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              )}
            >
              {role === "OWNER" ? "Owner (Penuh)" : "Staf (Kasir)"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">© 2026 {siteConfig.name}</p>
        </div>
      </aside>
    </>
  );
}

