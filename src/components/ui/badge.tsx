import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "bg-blue-50 text-blue-700 border border-blue-200",
        secondary:
          "bg-slate-100 text-slate-700 border border-slate-200",
        outline:
          "text-slate-700 border border-slate-300 bg-white",
        success:
          "bg-green-50 text-green-700 border border-green-200",
        warning:
          "bg-amber-50 text-amber-700 border border-amber-200",
        critical:
          "bg-red-50 text-red-700 border border-red-200",
        info:
          "bg-blue-50 text-blue-700 border border-blue-200",
        waiting:
          "bg-slate-100 text-slate-600 border border-slate-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

