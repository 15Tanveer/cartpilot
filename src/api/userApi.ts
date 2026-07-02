import { httpApi } from "./Http.api";
import environmentConfig from "../config/environment";

/**
 * Several Znode gateway endpoints (portals, user detail) return the payload as a
 * double-encoded JSON string: the response body is a JSON string literal whose
 * contents are themselves JSON. Axios parses only the outer layer, leaving a
 * string, so we parse a second time when that happens.
 */
const parseGatewayResponse = <T>(data: unknown): T => {
  if (typeof data === "string") {
    return data !== "" ? JSON.parse(data) as T : ({} as T);
  }
  return data as T;
};

/** Subset of GET /v2/portals/{storeCode} we care about. */
export interface IPortalResponse {
  PortalId: number;
  StoreCode: string;
  StoreName: string | null;
}

/** Subset of the User object returned by GetUserDetailById. */
export interface IUserDetail {
  UserId: number;
  Email: string | null;
  UserName: string | null;
  FirstName: string | null;
  LastName: string | null;
  PhoneNumber: string | null;
  IsActive: boolean;
  PortalId: number | null;
}

/** Envelope returned by GET /User/GetUserDetailById/{userId}/{portalId}. */
export interface IUserDetailResponse {
  User: IUserDetail | null;
  HasError: boolean;
  ErrorCode: number;
  ErrorMessage: string | null;
}

/**
 * GET /v2/portals/{storeCode}
 * Resolves the portal (and its PortalId) for a store code. Defaults to the
 * store code configured in the environment (REACT_APP_STORE_CODE).
 */
export const getPortalByStoreCode = async (
  storeCode: string = environmentConfig.storeCode,
): Promise<IPortalResponse> => {
  const response = await httpApi.get(`/v2/portals/${storeCode}`, {
    headers: { accept: "application/json" },
  });
  return parseGatewayResponse<IPortalResponse>(response.data);
};

/**
 * GET /User/GetUserDetailById/{userId}/{portalId}
 * Fetches the full user record for a user within a given portal.
 */
export const getUserDetailById = async (
  userId: string | number,
  portalId: string | number,
): Promise<IUserDetailResponse> => {
  const response = await httpApi.get(
    `/User/GetUserDetailById/${userId}/${portalId}`,
    { headers: { accept: "application/json" } },
  );
  return parseGatewayResponse<IUserDetailResponse>(response.data);
};

/**
 * Convenience helper for the "Manage" action: resolves the portalId from the
 * configured store code, then fetches that user's detail. Chains the two
 * gateway calls so callers only need the userId.
 */
export const getUserDetailByStoreCode = async (
  userId: string | number,
): Promise<IUserDetailResponse> => {
  const portal = await getPortalByStoreCode();
  if (portal?.PortalId == null) {
    throw new Error("Unable to resolve portalId for the configured store code.");
  }
  return getUserDetailById(userId, portal.PortalId);
};
