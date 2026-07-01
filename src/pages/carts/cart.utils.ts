import { CartStatus, ICart, ICartListApiRecord, ICartListApiResponse } from "./cart.types";

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

/** Extracts the list of raw cart records from the carts/list API response. */
export const extractCartListItems = (
  response: ICartListApiResponse,
): ICartListApiRecord[] => response?.CollectionDetails || [];

/** Extracts the total record count from the carts/list API response. */
export const extractCartListTotal = (
  response: ICartListApiResponse,
  fallback: number,
): number => response?.PaginationDetail?.TotalResults ?? fallback;

/** Maps the API's StatusCode to the UI's CartStatus vocabulary. */
const mapStatusCode = (statusCode: string): CartStatus => {
  const code = statusCode?.toUpperCase();
  if (code === "COMPLETED" || code === "RECOVERED") return "recovered";
  if (code === "REMINDED") return "reminded";
  return "abandoned";
};

/** Maps a raw carts/list API record to the ICart shape used by the UI. */
export const mapApiCartToICart = (raw: ICartListApiRecord): ICart => ({
  id: raw.ClassNumber,
  cartNumber: raw.ClassNumber,
  userName: raw.CustomerName || "",
  userId: raw.CustomerId ? String(raw.CustomerId) : "",
  email: raw.CustomerEmailId || "",
  status: mapStatusCode(raw.StatusCode),
  itemCount: Number(raw.Quantity ?? 0),
  cartTotal: Number(raw.Total ?? raw.SubTotal ?? 0),
  currency: raw.CurrencyCode || "USD",
  lastModifiedDate: raw.ModifiedDate || raw.CreatedDate || "",
  items: [],
});
