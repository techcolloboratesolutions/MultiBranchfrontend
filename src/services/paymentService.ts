import api, { unwrapList } from "./api";
import { DailyPayment, PaymentHead, RecurringType } from "../types/payment";

export const listPaymentHeads = async (active?: "Y" | "N"): Promise<PaymentHead[]> => {
  const params: Record<string, string | number> = { page_size: 200 };
  if (active) {
    params.active = active;
  }
  const response = await api.get("/payment-heads/", { params });
  return unwrapList<PaymentHead>(response.data);
};

export const createPaymentHead = async (payload: Partial<PaymentHead>) => {
  const response = await api.post<PaymentHead>("/payment-heads/", payload);
  return response.data;
};

export const updatePaymentHead = async (id: number, payload: Partial<PaymentHead>) => {
  const response = await api.patch<PaymentHead>(`/payment-heads/${id}/`, payload);
  return response.data;
};

export const listPayments = async (params: Record<string, string | number | undefined>) => {
  const response = await api.get("/payments/", { params: { page_size: 200, ...params } });
  return unwrapList<DailyPayment>(response.data);
};

export const createPayment = async (payload: Partial<DailyPayment>) => {
  const response = await api.post<DailyPayment>("/payments/", payload);
  return response.data;
};

export const updatePayment = async (id: number, payload: Partial<DailyPayment>) => {
  const response = await api.patch<DailyPayment>(`/payments/${id}/`, payload);
  return response.data;
};

export const deactivatePayment = async (id: number) => {
  const response = await api.post<DailyPayment>(`/payments/${id}/deactivate/`);
  return response.data;
};

export interface PaymentEntryRow {
  payment_head: number;
  code: string;
  description: string;
  recurring_type?: RecurringType;
  amount: string;
  payment_id: number | null;
  entered_by_name: string | null;
}

export interface PaymentEntrySheet {
  institution_id: number | null;
  business_date: string;
  layout?: "two_column";
  recurring_types?: RecurringType[];
  daily_selected?: boolean;
  monthly_selected?: boolean;
  daily_rows?: PaymentEntryRow[];
  monthly_rows?: PaymentEntryRow[];
  rows: PaymentEntryRow[];
}

export const getPaymentEntrySheet = async (params: {
  business_date: string;
  institution_id?: number;
  daily?: boolean;
  monthly?: boolean;
}): Promise<PaymentEntrySheet> => {
  const response = await api.get<PaymentEntrySheet>("/payments/entry-sheet/", {
    params: {
      business_date: params.business_date,
      institution_id: params.institution_id,
      daily: params.daily === false ? "false" : "true",
      monthly: params.monthly ? "true" : "false",
    },
  });
  return response.data;
};

export interface BulkPaymentLine {
  payment_head: number;
  amount: string;
}

export const bulkSavePayments = async (payload: {
  institution: number;
  business_date: string;
  lines: BulkPaymentLine[];
}) => {
  const response = await api.post<DailyPayment[]>("/payments/bulk/", payload);
  return response.data;
};

