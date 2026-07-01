import axios, { AxiosError } from "axios";
import { ApiError } from "./ApiError";
import { readToken } from "./localStorage.service";

export const BY_PASS_401 = ["/users/login"];

export interface ApiResponse<T> {
  data: T;
}

export interface ApiErrorData {
  message: string;
}

export const httpApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

export const logoutHandler = () => {
  localStorage.clear();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
httpApi.interceptors.request.use((config: any) => {
  const token = readToken() || process.env.REACT_APP_TOKEN;
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Basic ${token}`,
    };
  }
  config.headers = {
    ...config.headers,
    "Znode-PortalCode": process.env.REACT_APP_ZNODE_PORTAL_CODE,
    "Znode-LocaleCode": process.env.REACT_APP_ZNODE_LOCALE_CODE,
    "Znode-PublishState": process.env.REACT_APP_ZNODE_PUBLISH_STATE,
  };
  config.validateStatus = () => {
    return true;
  };
  return config;
});

httpApi.interceptors.response.use(
  (response) => {
    //prevent Forgot Password API to check the below error condition
    const isForgotPasswordURL = response?.config?.url == "/users/getbyusername";
    //redirect to main page if token is not present in request
    if (
      response?.status == 500 &&
      response?.data?.ErrorCode == 52 &&
      !isForgotPasswordURL
    ) {
      const redirectToLandingPageURL = process.env.REACT_APP_REDIRECT_URL;
      window.location.href = redirectToLandingPageURL || "";
    }
    if (
      response?.status === 401 &&
      !BY_PASS_401?.includes(response?.config?.url || "")
    ) {
      logoutHandler();
    }
    return response;
  },
  (error: AxiosError<ApiErrorData>) => {
    if (
      error?.response?.status === 401 &&
      !BY_PASS_401?.includes(error?.config?.url || "")
    ) {
      logoutHandler();
    }
    throw new ApiError<ApiErrorData>(
      error && error.response?.data?.message
        ? error.response?.data?.message
        : error.message,
    );
  },
);
