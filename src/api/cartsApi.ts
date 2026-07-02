import { httpApi } from "./Http.api";
import {
  ICartItemListApiResponse,
  ICartListApiRecord,
  ICartListApiResponse,
} from "../pages/carts/cart.types";
import { IUserDetail } from "./userApi";

/**
 * Some Znode gateway endpoints return the payload as a double-encoded JSON
 * string (a JSON string literal whose contents are themselves JSON). Axios
 * parses only the outer layer, so we parse a second time when that happens.
 */
const parseGatewayResponse = <T>(data: unknown): T => {
  if (typeof data === "string") {
    return data !== "" ? (JSON.parse(data) as T) : ({} as T);
  }
  return data as T;
};

export interface ICartListParams {
  pageIndex: number;
  pageSize: number;
}

export const getCartListApi = async (
  params: ICartListParams,
): Promise<ICartListApiResponse> => {
  const response = await httpApi.get("/commerceapi/v1/carts/list", {
    params: {
      pageIndex: params.pageIndex,
      pageSize: params.pageSize,
    },
    headers: {
      accept: "text/plain",
      "Znode-PortalCode": process.env.REACT_APP_ZNODE_PORTAL_CODE,
      "Znode-LocaleCode": process.env.REACT_APP_ZNODE_LOCALE_CODE,
      "Znode-PublishState": process.env.REACT_APP_ZNODE_PUBLISH_STATE,
    },
  });
  return response.data;
};

/**
 * Fetches a single cart record by its ClassNumber. The list API has no
 * by-id endpoint, so this pages through the list and matches locally; used
 * by the Manage page when it is opened directly (no router state to rely on).
 */
export const getCartByNumberApi = async (
  cartNumber: string,
  pageSize = 500,
): Promise<ICartListApiRecord | undefined> => {
  const response = await getCartListApi({ pageIndex: 1, pageSize });
  return (response?.CollectionDetails || []).find(
    (record) => record.ClassNumber === cartNumber,
  );
};

/**
 * GET /commerceapi/v1/Carts/item-list/{cartNumber}
 * Fetches the line items for a cart by its ClassNumber. Used to populate the
 * cart items table on the Manage/Edit page.
 */
export const getCartItemsApi = async (
  cartNumber: string,
  userDetail?: IUserDetail,
): Promise<ICartItemListApiResponse> => {
  const response = await httpApi.get(
    `/commerceapi/v1/Carts/item-list/${cartNumber}`,
    {
      headers: {
        accept: "application/json",
        "cache-control": "no-store",
        "Znode-PortalCode": process.env.REACT_APP_ZNODE_PORTAL_CODE,
        "Znode-LocaleCode": process.env.REACT_APP_ZNODE_LOCALE_CODE,
        "Znode-PublishState": process.env.REACT_APP_ZNODE_PUBLISH_STATE,
        "Znode-UserId": userDetail?.UserId.toString() || "",
        "Znode-ProfileId": userDetail?.PortalId?.toString() || "",
        "z-request-context": "/rFNSnWqScGjFmXxkEk8mxWH5Da0UpJULMGxrNKsmgCB4pUXQIh6IaF8jQ=='",
      },
    },
  );

  return parseGatewayResponse<ICartItemListApiResponse>(response.data);
};
