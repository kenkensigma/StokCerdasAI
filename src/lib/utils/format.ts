/**
 * Format a numeric amount to Indonesian Rupiah (IDR).
 * Example: 25000 -> "Rp 25.000"
 */
export function formatRupiah(amount: number | string): string {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return "Rp 0";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

/**
 * Format a quantity with optional unit.
 * Example: 15, "pcs" -> "15 pcs"
 */
export function formatQuantity(quantity: number | string, unit?: string): string {
  const num = typeof quantity === "string" ? parseFloat(quantity) : quantity;
  if (isNaN(num)) return `0 ${unit ?? ""}`.trim();

  const formattedNum = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 3,
  }).format(num);

  return unit ? `${formattedNum} ${unit}` : formattedNum;
}

/**
 * Format a date string to Indonesian localized format.
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  };

  return new Intl.DateTimeFormat("id-ID", defaultOptions).format(d);
}

/**
 * Format date with time.
 * Example: "7 Nov 2026, 14:30 WIB"
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

