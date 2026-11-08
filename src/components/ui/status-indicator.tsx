import * as React from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { StockStatus } from "@/types/database.types";

interface StatusIndicatorProps {
  status: StockStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  StockStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  WAITING: {
    label: "Menunggu Data Penjualan",
    variant: "waiting",
  },
  COLLECTING: {
    label: "Pengumpulan Data",
    variant: "info",
  },
  NORMAL: {
    label: "Stok Aman",
    variant: "success",
  },
  LOW: {
    label: "Stok Menipis",
    variant: "warning",
  },
  CRITICAL: {
    label: "Stok Kritis",
    variant: "critical",
  },
};

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    variant: "secondary",
  };

  return (
    <Badge variant={config.variant} className={className}>
      <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" aria-hidden="true" />
      <span>{config.label}</span>
    </Badge>
  );
}

