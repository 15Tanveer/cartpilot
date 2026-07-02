import {
  CartStatus,
  ICart,
  ICartChildItemApiRecord,
  ICartItem,
  ICartItemApiRecord,
  ICartItemAttribute,
  ICartListApiRecord,
  ICartListApiResponse,
} from "./cart.types";
import { IUserDetail } from "../../api/userApi";

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

/**
 * Whole days elapsed since the given ISO date, or NaN if the date is invalid.
 * Shared by the Cart Age column and the Cart Age filter.
 */
export const cartAgeInDays = (isoDate: string): number => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return NaN;
  const diffMs = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

/**
 * Returns how old a cart is as text, e.g. "Today", "1 day ago", "5 days ago".
 */
export const formatCartAge = (isoDate: string): string => {
  const days = cartAgeInDays(isoDate);
  if (Number.isNaN(days)) return "-";
  if (days === 0) return "Today";
  return `${days} day${days === 1 ? "" : "s"} ago`;
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


/**
 * Resolves an item's unit price. Configurable/bundled products carry 0 on the
 * parent record with the real prices on the ChildItemList entries, so when the
 * parent price is 0 we sum the (recursively resolved) child unit prices.
 */
const resolveUnitPrice = (raw: {
  UnitPrice: number;
  ChildItemList?: ICartChildItemApiRecord[] | null;
}): number => {
  const own = Number(raw.UnitPrice ?? 0);
  if (own) return own;
  return (raw.ChildItemList || []).reduce(
    (sum, child) => sum + resolveUnitPrice(child),
    0,
  );
};

/**
 * Resolves an item's product image URL from the "ProductImage" entry of its
 * Attributes, falling back to the first child item that carries one (the
 * attributes usually live on the ChildItemList entries).
 */
const resolveProductImage = (raw: {
  Attributes?: ICartItemAttribute[] | null;
  ChildItemList?: ICartChildItemApiRecord[] | null;
}): string | undefined => {
  const own = (raw.Attributes || []).find(
    (attribute) => attribute.AttributeCode === "ProductImage",
  )?.AttributeValue;
  if (own) return own;
  for (const child of raw.ChildItemList || []) {
    const childImage = resolveProductImage(child);
    if (childImage) return childImage;
  }
  return undefined;
};

/** Maps a raw item-list API record to the ICartItem shape used by the UI. */
export const mapApiItemToICartItem = (
  raw: ICartItemApiRecord,
): ICartItem => ({
  id: raw.ItemId,
  sku: raw.Sku || "",
  name: raw.ProductName || "",
  quantity: Number(raw.Quantity ?? 0),
  unitPrice: resolveUnitPrice(raw),
  image: resolveProductImage(raw),
});

/**
 * Builds an ICart for the Manage page out of the item-list response and the
 * user detail, for when no list record is at hand (cold direct link/refresh
 * without router state). Only the carts/list API carries status, modified
 * date and currency, so those fall back to "abandoned" / "" / USD here.
 */
export const buildCartFromItems = (
  cartNumber: string,
  items: ICartItem[],
  user: IUserDetail | null,
): ICart => ({
  id: cartNumber,
  cartNumber,
  userName: [user?.FirstName, user?.LastName].filter(Boolean).join(" "),
  userId: user ? String(user.UserId) : "",
  email: user?.Email || "",
  status: "abandoned",
  itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  cartTotal: items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  ),
  currency: "USD",
  lastModifiedDate: "",
  items,
});

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
