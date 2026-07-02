/**
 * Promotion shape used by the UI (Send Promotion modal, step 1).
 */
export interface IPromotion {
  id: string;
  /** Coupon / promotion code shown to the customer. */
  code: string;
  /** Human-readable name of the promotion. */
  name: string;
  /** Optional promotion description. */
  description: string;
  /** e.g. "Percent Off Order" (falls back to the raw type id when unnamed). */
  discountType: string;
  /** Discount amount (a percentage for percent-off promotions). */
  discountValue: number;
  /** Minimum order total required for the promotion to apply. */
  orderMinimum: number;
  /** Whether the customer must enter the coupon code at checkout. */
  couponRequired: boolean;
  active: boolean;
  startDate: string;
  endDate: string;
}

/**
 * Single record inside PromotionList from GET /Promotion/List. Only the fields
 * the UI consumes are typed; the endpoint returns many more (all optional here).
 */
export interface IPromotionApiRecord {
  PromotionId?: number | string;
  PromoCode?: string | null;
  Code?: string | null;
  Name?: string | null;
  Description?: string | null;
  PromotionTypeId?: number | null;
  PromotionTypeName?: string | null;
  PromotionType?: string | null;
  Discount?: number | string | null;
  OrderMinimum?: number | string | null;
  IsCouponRequired?: boolean | null;
  IsActive?: boolean | null;
  StartDate?: string | null;
  EndDate?: string | null;
}

/**
 * GET /Promotion/List response. The gateway returns this as a double-encoded
 * JSON string (parsed by the API layer) with the records under `PromotionList`.
 */
export interface IPromotionListApiResponse {
  PromotionList?: IPromotionApiRecord[];
  PageIndex?: number;
  PageSize?: number;
  TotalPages?: number;
  TotalResults?: number;
  HasError?: boolean;
  ErrorMessage?: string | null;
}
