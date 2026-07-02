import { ICart } from "./cart.types";
import { STATUS_LABELS } from "./cart.utils";

export type FilterFieldType = "text" | "number" | "status" | "date";

export interface ICartFilterColumn {
  /** Key on ICart this column filters. */
  field: keyof ICart;
  /** Label shown in the column dropdown. */
  label: string;
  type: FilterFieldType;
}

export interface IFilterCondition {
  columnName: string;
  operator: string;
  value: string;
}

/** Operator codes, kept short to mirror the Znode-style convention. */
export const OPERATOR_OPTIONS: { label: string; value: string }[] = [
  { label: "Contains", value: "cn" },
  { label: "Equals", value: "eq" },
  { label: "Starts with", value: "sw" },
  { label: "Ends with", value: "ew" },
];

export const NUMBER_OPERATOR_OPTIONS: { label: string; value: string }[] = [
  { label: "Equals", value: "eq" },
  { label: "Greater than", value: "gt" },
  { label: "Less than", value: "lt" },
];

export const DATE_OPERATOR_OPTIONS: { label: string; value: string }[] = [
  { label: "On", value: "eq" },
  { label: "After", value: "gt" },
  { label: "Before", value: "lt" },
];

export const STATUS_OPERATOR_OPTIONS: { label: string; value: string }[] = [
  { label: "Is", value: "is" },
];

/** Columns the cart table allows filtering on (mirrors the visible columns). */
export const CART_FILTER_COLUMNS: ICartFilterColumn[] = [
  { field: "cartNumber", label: "Cart Number", type: "text" },
  { field: "userName", label: "User Name", type: "text" },
  { field: "userId", label: "User ID", type: "text" },
  { field: "email", label: "Email", type: "text" },
  { field: "itemCount", label: "Items", type: "number" },
  { field: "cartTotal", label: "Cart Total", type: "number" },
  { field: "status", label: "Status", type: "status" },
  { field: "lastModifiedDate", label: "Last Modified", type: "date" },
];

export const STATUS_VALUE_OPTIONS = (
  Object.keys(STATUS_LABELS) as ICart["status"][]
).map((value) => ({ label: STATUS_LABELS[value], value }));

export const getColumnType = (columnName: string): FilterFieldType =>
  CART_FILTER_COLUMNS.find((c) => c.field === columnName)?.type ?? "text";

export const getOperatorsForType = (type: FilterFieldType) => {
  switch (type) {
    case "number":
      return NUMBER_OPERATOR_OPTIONS;
    case "date":
      return DATE_OPERATOR_OPTIONS;
    case "status":
      return STATUS_OPERATOR_OPTIONS;
    default:
      return OPERATOR_OPTIONS;
  }
};

/** Default operator when a column is (re)selected. */
export const getDefaultOperator = (type: FilterFieldType): string =>
  getOperatorsForType(type)[0].value;

/** Applies one filter condition to a cart. */
const matchesCondition = (cart: ICart, cond: IFilterCondition): boolean => {
  const type = getColumnType(cond.columnName);
  const raw = cart[cond.columnName as keyof ICart];

  if (type === "status") {
    return String(raw) === cond.value;
  }

  if (type === "number") {
    const a = Number(raw);
    const b = Number(cond.value);
    if (Number.isNaN(b)) return true;
    if (cond.operator === "gt") return a > b;
    if (cond.operator === "lt") return a < b;
    return a === b;
  }

  if (type === "date") {
    const a = new Date(String(raw)).getTime();
    const b = new Date(cond.value).getTime();
    if (Number.isNaN(a) || Number.isNaN(b)) return false;
    if (cond.operator === "gt") return a > b;
    if (cond.operator === "lt") return a < b;
    // "On" == same calendar day
    const da = new Date(String(raw)).toDateString();
    const db = new Date(cond.value).toDateString();
    return da === db;
  }

  // text
  const a = String(raw ?? "").toLowerCase();
  const b = cond.value.toLowerCase();
  if (cond.operator === "eq") return a === b;
  if (cond.operator === "sw") return a.startsWith(b);
  if (cond.operator === "ew") return a.endsWith(b);
  return a.includes(b);
};

/** Returns carts matching ALL provided filter conditions. */
export const applyCartFilters = (
  carts: ICart[],
  filters: IFilterCondition[],
): ICart[] => {
  const active = filters.filter((f) => f.columnName && f.operator && f.value);
  if (active.length === 0) return carts;
  return carts.filter((cart) => active.every((f) => matchesCondition(cart, f)));
};
