import api, { unwrapList } from "./api";
import { AuthUser, LoginRequest, LoginResponse } from "../types/auth";

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/login/", data);
  return response.data;
};

export const getCurrentUser = async (): Promise<AuthUser> => {
  const response = await api.get<AuthUser>("/auth/me/");
  return response.data;
};

export const lookupUser = async (username: string): Promise<AuthUser> => {
  const response = await api.get<AuthUser>("/auth/lookup/", { params: { username } });
  return response.data;
};

export const refreshToken = async (refresh: string) => {
  const response = await api.post("/auth/refresh/", { refresh });
  return response.data;
};

export const logout = async () => {
  await api.post("/auth/logout/");
};

export { unwrapList };
