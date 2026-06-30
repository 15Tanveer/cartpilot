import { httpApi } from "./Http.api";

/**
 * This function sets a header in Axios requests with a user ID.
 * @param {string} userId - The `userId` parameter is a string that
 * represents the unique identifier of
 * a user (Znode-UserId). This function sets a custom header called "Znode-UserId" in the
 * Axios HTTP client with the provided `userId` value.
 */
export const setAxiosHeader = (token: string): void => {
  httpApi.defaults.headers.common["Authorization"] = token
    ? `Bearer ${token}`
    : "";
};

export const LOCAL_STORAGE_KEYS = {
  PREVIEW_URL: "preview",
};

/**
 * Sets Data on LocalStorage on the basis of given key.
 * @param key
 * @param value
 */
export function setLocalStorageData(key: string, value: string) {
  if (key && value) {
    localStorage.setItem(key.toString(), value.toString());
  }
}

/**
 * Gets Data from LocalStorage on the basis of given key.
 * @param key
 * @returns
 */
export function getLocalStorageData(key: string): string {
  if (key) {
    return localStorage.getItem(key.toString()) || "";
  }
  return "";
}

/**
 * Remove Data from LocalStorage on the basis of given key.
 * @param key
 * @returns
 */
export function removeLocalStorageDataByKey(key: string) {
  if (key) {
    localStorage.removeItem(key.toString());
    return "";
  }
}

/**
 * Remove All The Data from LocalStorage
 */
export function clearLocalStorageData() {
  localStorage.clear();
}

export const readToken = (): string => {
  return localStorage.getItem("accessToken") || "";
};
