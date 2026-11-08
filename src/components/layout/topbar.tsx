"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Menu, User, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Role } from "@/lib/permissions/roles";

interface TopbarProps {
  onMenuToggle?: () => void;
  title?: string;
  userEmail?: string;
  role?: Role;
}

export function Topbar({
  onMenuToggle,
  title = "Dashboard",
  userEmail = "owner@toko.com",
  role = "OWNER",
}: TopbarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 md:px-6 backdrop-blur-xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Buka navigasi menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        <h1 className="text-base md:text-lg font-semibold text-slate-900 tracking-tight">
          {title}
        </h1>
      </div>

      {/* Right: User Information, Role & Logout */}
      <div className="flex items-center gap-3">
        <Badge variant={role === "OWNER" ? "default" : "secondary"} className="hidden sm:inline-flex">
          {role === "OWNER" ? "Pemilik (Owner)" : "Staf (Staff)"}
        </Badge>

        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-semibold text-xs border border-slate-200">
            <User className="h-4 w-4 text-slate-500" aria-hidden="true" />
          </div>
          <span className="hidden md:inline-block text-xs font-medium text-slate-700 max-w-[150px] truncate">
            {userEmail}
          </span>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="ml-2 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-red-600 transition-colors"
            title="Keluar dari akun"
            aria-label="Keluar dari akun"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
