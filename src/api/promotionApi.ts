import { httpApi } from "./Http.api";
import {
  IPromotion,
  IPromotionApiRecord,
  IPromotionListApiResponse,
} from "../pages/carts/promotion.types";

/**
 * Some Znode gateway endpoints return the payload as a double-encoded JSON
 * string. Axios parses only the outer layer, so parse again when needed.
 */
const parseGatewayResponse = <T>(data: unknown): T => {
  if (typeof data === "string") {
    return data !== "" ? (JSON.parse(data) as T) : ({} as T);
  }
  return data as T;
};

/**
 * GET /Promotion/List
 * Returns the store's configured promotions. Auth + base URL are applied by the
 * shared httpApi interceptor (see Http.api.ts).
 */
export const getPromotionListApi =
  async (): Promise<IPromotionListApiResponse> => {
    const response = await httpApi.get("/Promotion/List", {
      headers: {
        accept: "application/json",
        "Znode-PortalCode": process.env.REACT_APP_ZNODE_PORTAL_CODE,
        "Znode-LocaleCode": process.env.REACT_APP_ZNODE_LOCALE_CODE,
        "Znode-PublishState": process.env.REACT_APP_ZNODE_PUBLISH_STATE,
      },
    });
    return parseGatewayResponse<IPromotionListApiResponse>(response.data);
  };

/**
 * Pulls the promotion records out of the /Promotion/List response, tolerating
 * both the `PromotionList` wrapper and a bare array.
 */
export const extractPromotionListItems = (
  response: IPromotionListApiResponse | IPromotionApiRecord[] | null,
): IPromotionApiRecord[] => {
  if (Array.isArray(response)) return response;
  return response?.PromotionList || [];
};

/** Known promotion type ids → display labels (PromotionTypeName is often null). */
const PROMOTION_TYPE_LABELS: Record<number, string> = {
  1: "Percent Off Order",
};

const resolveDiscountType = (raw: IPromotionApiRecord): string => {
  if (raw.PromotionTypeName) return raw.PromotionTypeName;
  if (raw.PromotionType) return raw.PromotionType;
  if (raw.PromotionTypeId != null) {
    return PROMOTION_TYPE_LABELS[raw.PromotionTypeId] || `Type ${raw.PromotionTypeId}`;
  }
  return "";
};

/** How far a promotion's discount may sit from the target % and still match. */
const PROMOTION_MATCH_TOLERANCE = 2;

/**
 * Finds the promotion that matches a target discount percentage, so an
 * AI-suggested tier (e.g. 10%) can be turned into a real promotion + promo code.
 * Prefers an exact discount match, then the nearest one WITHIN a small tolerance;
 * beyond that returns undefined rather than snapping to a misleading code (e.g.
 * mapping a 5% tier onto a 30%-off promotion). Active promotions win ties.
 */
export const findPromotionForPercent = (
  promotions: IPromotion[],
  percent: number,
): IPromotion | undefined => {
  const pool = promotions.filter((p) => p.code);
  if (pool.length === 0) return undefined;

  // Prefer an exact discount match, favouring an active promotion.
  const exactMatches = pool.filter(
    (p) => Math.round(p.discountValue) === Math.round(percent),
  );
  if (exactMatches.length > 0) {
    return exactMatches.find((p) => p.active) || exactMatches[0];
  }

  // Otherwise the nearest promotion, but only if it's within tolerance.
  const nearest = pool.reduce((best, current) =>
    Math.abs(current.discountValue - percent) <
    Math.abs(best.discountValue - percent)
      ? current
      : best,
  );
  return Math.abs(nearest.discountValue - percent) <= PROMOTION_MATCH_TOLERANCE
    ? nearest
    : undefined;
};

/** Maps a raw /Promotion/List record onto the UI's IPromotion shape. */
export const mapApiPromotionToIPromotion = (
  raw: IPromotionApiRecord,
  index: number,
): IPromotion => {
  const code = raw.PromoCode || raw.Code || "";
  return {
    id: String(raw.PromotionId ?? code ?? index),
    code,
    name: raw.Name || code || "Promotion",
    description: raw.Description || "",
    discountType: resolveDiscountType(raw),
    discountValue: Number(raw.Discount ?? 0),
    orderMinimum: Number(raw.OrderMinimum ?? 0),
    couponRequired: Boolean(raw.IsCouponRequired),
    active: Boolean(raw.IsActive),
    startDate: raw.StartDate || "",
    endDate: raw.EndDate || "",
  };
};
