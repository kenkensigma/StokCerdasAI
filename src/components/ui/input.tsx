import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, helperText, id, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined;
    const helperId = helperText && id ? `${id}-helper` : undefined;

    return (
      <div className="w-full space-y-1">
        <input
          type={type}
          id={id}
          className={cn(
            "flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500",
            className
          )}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={errorId || helperId}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-xs font-medium text-red-600" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-xs text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

