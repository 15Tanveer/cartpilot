import { httpApi } from "./Http.api";
import { ICartListApiResponse } from "../pages/carts/cart.types";

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
    },
  });
  return response.data;
};
