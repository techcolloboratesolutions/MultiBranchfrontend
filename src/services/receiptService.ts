import api, { unwrapList } from "./api";
import { DailyReceipt, ReceiptHead } from "../types/receipt";

export const listReceiptHeads = async (active?: "Y" | "N"): Promise<ReceiptHead[]> => {
  const params: Record<string, string | number> = { page_size: 200 };
  if (active) {
    params.active = active;
  }
  const response = await api.get("/receipt-heads/", { params });
  return unwrapList<ReceiptHead>(response.data);
};

export const createReceiptHead = async (payload: Partial<ReceiptHead>) => {
  const response = await api.post<ReceiptHead>("/receipt-heads/", payload);
  return response.data;
};

export const updateReceiptHead = async (id: number, payload: Partial<ReceiptHead>) => {
  const response = await api.patch<ReceiptHead>(`/receipt-heads/${id}/`, payload);
  return response.data;
};

export interface ReceiptEntryRow {
  receipt_head: number;
  code: string;
  description: string;
  amount: string;
  receipt_id: number | null;
  entered_by_name: string | null;
}

export const getReceiptEntrySheet = async (params: {
  business_date: string;
  institution_id?: number;
}) => {
  const response = await api.get<{
    institution_id: number | null;
    business_date: string;
    rows: ReceiptEntryRow[];
  }>("/receipts/entry-sheet/", { params });
  return response.data;
};

export const listReceipts = async (params: Record<string, string | number | undefined>) => {
  const response = await api.get("/receipts/", { params: { page_size: 200, ...params } });
  return unwrapList<DailyReceipt>(response.data);
};

export const createReceipt = async (payload: Partial<DailyReceipt>) => {
  const response = await api.post<DailyReceipt>("/receipts/", payload);
  return response.data;
};

export const updateReceipt = async (id: number, payload: Partial<DailyReceipt>) => {
  const response = await api.patch<DailyReceipt>(`/receipts/${id}/`, payload);
  return response.data;
};

export const deactivateReceipt = async (id: number) => {
  const response = await api.post<DailyReceipt>(`/receipts/${id}/deactivate/`);
  return response.data;
};

export interface BulkReceiptLine {
  receipt_head: number;
  amount: string;
}

export const bulkSaveReceipts = async (payload: {
  institution: number;
  business_date: string;
  lines: BulkReceiptLine[];
}) => {
  const response = await api.post<DailyReceipt[]>("/receipts/bulk/", payload);
  return response.data;
};

