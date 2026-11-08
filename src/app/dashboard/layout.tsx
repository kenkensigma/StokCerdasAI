import * as React from "react";
import { DashboardLayoutShell } from "@/components/layout/dashboard-layout-shell";
import { getActiveStoreContext } from "@/lib/auth/session";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getActiveStoreContext().catch(() => null);

  return (
    <DashboardLayoutShell
      pageTitle="StokCerdas AI — Dashboard"
      storeName={context?.storeName || "Toko Berkah Retail (Demo)"}
      userEmail={context?.userEmail || "owner@stokcerdas.id"}
      role={context?.role || "OWNER"}
    >
      {children}
    </DashboardLayoutShell>
  );
}
