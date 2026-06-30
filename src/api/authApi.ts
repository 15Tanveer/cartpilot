import { httpApi } from "./Http.api";

export const loginApi = async (email: string, password: string) => {
  // Replace with your actual endpoint
  const response = await httpApi.post("/auth/login", { email, password });
  return response.data;
};

export const forgotPasswordApi = async (email: string) => {
  // Replace with your actual endpoint
  const response = await httpApi.post("/auth/forgot-password", { email });
  return response.data;
};
