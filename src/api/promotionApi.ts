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
