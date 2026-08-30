import api, { unwrapList } from "./api";
import { DailyExpense, ExpenseHead } from "../types/expense";

export const listExpenseHeads = async (active?: "Y" | "N"): Promise<ExpenseHead[]> => {
  const params: Record<string, string | number> = { page_size: 200 };
  if (active) {
    params.active = active;
  }
  const response = await api.get("/expense-heads/", { params });
  return unwrapList<ExpenseHead>(response.data);
};

export const createExpenseHead = async (payload: Partial<ExpenseHead>) => {
  const response = await api.post<ExpenseHead>("/expense-heads/", payload);
  return response.data;
};

export const updateExpenseHead = async (id: number, payload: Partial<ExpenseHead>) => {
  const response = await api.patch<ExpenseHead>(`/expense-heads/${id}/`, payload);
  return response.data;
};

export interface ExpenseEntryRow {
  expense_head: number;
  code: string;
  description: string;
  amount: string;
  expense_id: number | null;
  entered_by_name: string | null;
}

export const getExpenseEntrySheet = async (params: {
  business_date: string;
  institution_id?: number;
}) => {
  const response = await api.get<{
    institution_id: number | null;
    business_date: string;
    rows: ExpenseEntryRow[];
  }>("/expenses/entry-sheet/", { params });
  return response.data;
};

export const deactivateExpense = async (id: number) => {
  const response = await api.post<DailyExpense>(`/expenses/${id}/deactivate/`);
  return response.data;
};

export interface BulkExpenseLine {
  expense_head: number;
  amount: string;
}

export const bulkSaveExpenses = async (payload: {
  institution: number;
  business_date: string;
  lines: BulkExpenseLine[];
}) => {
  const response = await api.post<DailyExpense[]>("/expenses/bulk/", payload);
  return response.data;
};
