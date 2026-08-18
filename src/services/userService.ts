import api, { unwrapList } from "./api";
import { AppUser, Role } from "../types/institution";

export const listUsers = async (): Promise<AppUser[]> => {
  const response = await api.get("/users/", { params: { page_size: 200 } });
  return unwrapList<AppUser>(response.data);
};

export const createUser = async (payload: Partial<AppUser> & { password?: string }) => {
  const response = await api.post<AppUser>("/users/", payload);
  return response.data;
};

export const updateUser = async (id: number, payload: Partial<AppUser> & { password?: string }) => {
  const response = await api.patch<AppUser>(`/users/${id}/`, payload);
  return response.data;
};

export const listRoles = async (): Promise<Role[]> => {
  const response = await api.get("/roles/", { params: { page_size: 200 } });
  return unwrapList<Role>(response.data);
};

export const createRole = async (payload: Partial<Role>) => {
  const response = await api.post<Role>("/roles/", payload);
  return response.data;
};

export const updateRole = async (id: number, payload: Partial<Role>) => {
  const response = await api.patch<Role>(`/roles/${id}/`, payload);
  return response.data;
};
