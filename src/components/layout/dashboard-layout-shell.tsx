"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { Role } from "@/lib/permissions/roles";

interface DashboardLayoutShellProps {
  children: React.ReactNode;
  pageTitle?: string;
  storeName?: string;
  userEmail?: string;
  role?: Role;
}

export function DashboardLayoutShell({
  children,
  pageTitle = "Dashboard",
  storeName = "Toko Berkah Retail",
  userEmail = "owner@stokcerdas.id",
  role = "OWNER",
}: DashboardLayoutShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar (Desktop persistent, mobile drawer) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        storeName={storeName}
        role={role}
      />

      {/* Main Column */}
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
          title={pageTitle}
          userEmail={userEmail}
          role={role}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

