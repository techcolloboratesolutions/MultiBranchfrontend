import api from "./api";
import { WagePreview } from "../types/wage";

export const calculateWages = async (params: Record<string, string | number | undefined>) => {
  const response = await api.get<WagePreview>("/wages/calculate/", { params });
  return response.data;
};

export const saveWages = async (payload: { year: number; month: number; institution_id: number }) => {
  const response = await api.post<WagePreview>("/wages/save/", payload);
  return response.data;
};

export const exportWages = async (params: Record<string, string | number | undefined>) => {
  const response = await api.get("/wages/export/", { params, responseType: "blob" });
  return response.data as Blob;
};
