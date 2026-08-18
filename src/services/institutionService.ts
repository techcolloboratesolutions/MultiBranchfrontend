import api, { unwrapList } from "./api";
import { Institution, MainInstitution } from "../types/institution";

export const listMainInstitutions = async (): Promise<MainInstitution[]> => {
  const response = await api.get("/main-institutions/", { params: { page_size: 200 } });
  return unwrapList<MainInstitution>(response.data);
};

export const createMainInstitution = async (payload: Partial<MainInstitution>) => {
  const response = await api.post<MainInstitution>("/main-institutions/", payload);
  return response.data;
};

export const updateMainInstitution = async (id: number, payload: Partial<MainInstitution>) => {
  const response = await api.patch<MainInstitution>(`/main-institutions/${id}/`, payload);
  return response.data;
};

export const listInstitutions = async (institutionId?: number | "all"): Promise<Institution[]> => {
  const params: Record<string, string | number> = { page_size: 200 };
  if (institutionId && institutionId !== "all") {
    params.institution_id = institutionId;
  }
  const response = await api.get("/institutions/", { params });
  return unwrapList<Institution>(response.data);
};

export const createInstitution = async (payload: Partial<Institution>) => {
  const response = await api.post<Institution>("/institutions/", payload);
  return response.data;
};

export const updateInstitution = async (id: number, payload: Partial<Institution>) => {
  const response = await api.patch<Institution>(`/institutions/${id}/`, payload);
  return response.data;
};
