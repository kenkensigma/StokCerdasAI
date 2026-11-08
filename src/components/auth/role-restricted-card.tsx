"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoleRestrictedCardProps {
  title?: string;
  description?: string;
  requiredRole?: string;
}

export function RoleRestrictedCard({
  title = "Akses Dibatasi — Khusus Pemilik Toko",
  description = "Halaman ini memerlukan hak akses Pemilik Toko (OWNER). Akun Anda saat ini terdaftar sebagai Staf Toko (STAFF) dengan akses operasional kasir dan stok fisik.",
  requiredRole = "OWNER",
}: RoleRestrictedCardProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-200 shadow-xs mb-5">
          <ShieldAlert className="h-7 w-7" aria-hidden="true" />
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200 mb-3">
          Peran Diperlukan: {requiredRole}
        </div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
        <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {description}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1.5 text-xs">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Ringkasan
            </Button>
          </Link>
          <Link href="/dashboard/sales" className="w-full sm:w-auto">
            <Button size="sm" className="w-full flex items-center justify-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700">
              <ShoppingCart className="h-4 w-4" />
              Buka Kasir POS
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

