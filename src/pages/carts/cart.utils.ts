import { CartStatus } from "./cart.types";

/** Formats an ISO date string as e.g. "Jun 28, 2026, 2:32 PM". */
export const formatCartDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

/** Formats a number as a currency string, e.g. formatCurrency(184.97, "USD"). */
export const formatCurrency = (amount: number, currency = "USD"): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

export const STATUS_COLORS: Record<CartStatus, string> = {
  abandoned: "red",
  reminded: "gold",
  recovered: "green",
};

export const STATUS_LABELS: Record<CartStatus, string> = {
  abandoned: "Abandoned",
  reminded: "Reminder Sent",
  recovered: "Recovered",
};
