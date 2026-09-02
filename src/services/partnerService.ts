import api, { unwrapList } from "./api";
import { Partner, PartnerGroup, PartnerGroupEntry } from "../types/partner";

export const listPartners = async (params?: {
  institution_id?: number;
  in_group?: boolean;
}): Promise<Partner[]> => {
  const query: Record<string, string | number> = { page_size: 200 };
  if (params?.institution_id) {
    query.institution_id = params.institution_id;
  }
  if (params?.in_group) {
    query.in_group = "true";
  }
  const response = await api.get("/partners/", { params: query });
  return unwrapList<Partner>(response.data);
};

export const createPartner = async (payload: Partial<Partner>) => {
  const response = await api.post<Partner>("/partners/", payload);
  return response.data;
};

export const updatePartner = async (id: number, payload: Partial<Partner>) => {
  const response = await api.patch<Partner>(`/partners/${id}/`, payload);
  return response.data;
};

export const listPartnerGroups = async (): Promise<PartnerGroup[]> => {
  const response = await api.get("/partner-groups/", { params: { page_size: 200 } });
  return unwrapList<PartnerGroup>(response.data);
};

export const createPartnerGroup = async (payload: Partial<PartnerGroup>) => {
  const response = await api.post<PartnerGroup>("/partner-groups/", payload);
  return response.data;
};

export const updatePartnerGroup = async (id: number, payload: Partial<PartnerGroup>) => {
  const response = await api.patch<PartnerGroup>(`/partner-groups/${id}/`, payload);
  return response.data;
};

export const listPartnerGroupEntries = async (institutionId?: number) => {
  const params: Record<string, string | number> = { page_size: 500 };
  if (institutionId) {
    params.institution_id = institutionId;
  }
  const response = await api.get("/partner-group-entries/", { params });
  return unwrapList<PartnerGroupEntry>(response.data);
};

export const createPartnerGroupEntry = async (payload: Partial<PartnerGroupEntry>) => {
  const response = await api.post<PartnerGroupEntry>("/partner-group-entries/", payload);
  return response.data;
};

export const updatePartnerGroupEntry = async (id: number, payload: Partial<PartnerGroupEntry>) => {
  const response = await api.patch<PartnerGroupEntry>(`/partner-group-entries/${id}/`, payload);
  return response.data;
};

export const deletePartnerGroupEntry = async (id: number) => {
  await api.delete(`/partner-group-entries/${id}/`);
};
