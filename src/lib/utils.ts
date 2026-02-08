import clsx from "clsx";

export function cn(...args: any[]) {
  return clsx(args);
}

export function formatMoney(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}
