import api from "./api";

export interface ReportHead {
  id: number;
  code: string;
  description: string;
}

export interface MonthlyReportRow {
  date: string;
  receipts: Record<string, string>;
  payments: Record<string, string>;
  expenses: Record<string, string>;
  receipt: string;
  payment: string;
  expense: string;
  business: string;
  balance: string;
}

export interface DayByInstitutionRow {
  institution_id: number;
  institution_name: string;
  receipts: Record<string, string>;
  payments: Record<string, string>;
  expenses: Record<string, string>;
  receipt: string;
  payment: string;
  expense: string;
  business: string;
  balance: string;
}

export interface DayByInstitutionReport {
  date: string;
  receipt_heads: ReportHead[];
  payment_heads: ReportHead[];
  expense_heads: ReportHead[];
  rows: DayByInstitutionRow[];
  receipt_head_totals: Record<string, string>;
  payment_head_totals: Record<string, string>;
  expense_head_totals: Record<string, string>;
  total_receipt: string;
  total_payment: string;
  total_expense: string;
  total_business: string;
  total_balance: string;
}

export interface MonthlyReport {
  year: number;
  month: number;
  institution_id: number | null;
  receipt_heads: ReportHead[];
  payment_heads: ReportHead[];
  expense_heads: ReportHead[];
  rows: MonthlyReportRow[];
  receipt_head_totals: Record<string, string>;
  payment_head_totals: Record<string, string>;
  expense_head_totals: Record<string, string>;
  total_receipt: string;
  total_payment: string;
  total_expense: string;
  total_business: string;
  total_balance: string;
}

export interface DashboardData {
  role: string;
  institution: { id: number; name: string };
  today: { receipt: string; payment: string; expense: string; business: string; balance: string };
  month: { receipt: string; payment: string; expense: string; business: string; balance: string };
  daily_series: Array<{
    date: string;
    label?: string;
    receipt: number;
    payment: number;
    expense: number;
    business: number;
    balance: number;
  }>;
  monthly_series?: Array<{
    label: string;
    year: number;
    month: number;
    receipt: number;
    payment: number;
    expense: number;
    business: number;
    balance: number;
  }>;
  institutions_total?: number;
  institutions_active?: number;
  scope?: "all" | "institution";
  year?: number;
  institution_series?: Array<{
    id?: number;
    name: string;
    business: number;
    receipt: number;
    payment: number;
    expense: number;
    balance: number;
  }>;
  institution_today?: Array<{
    id?: number;
    name: string;
    business: number;
    receipt: number;
    payment: number;
    expense: number;
    balance: number;
  }>;
}

export const getDayByInstitutionReport = async (businessDate: string) => {
  const response = await api.get<DayByInstitutionReport>("/reports/monthly/by-institution/", {
    params: { date: businessDate },
  });
  return response.data;
};

export const getMonthlyReport = async (params: Record<string, string | number | undefined>) => {
  const response = await api.get<MonthlyReport>("/reports/monthly/", { params });
  return response.data;
};

export const exportMonthlyReport = async (params: Record<string, string | number | undefined>) => {
  const response = await api.get("/reports/monthly/export/", { params, responseType: "blob" });
  return response.data as Blob;
};

export const getDashboard = async (
  institutionId?: number | "all",
  year?: number,
  month?: number,
) => {
  const params: Record<string, string | number> = {};
  if (institutionId && institutionId !== "all") {
    params.institution_id = institutionId;
  }
  if (year) {
    params.year = year;
  }
  if (month) {
    params.month = month;
  }
  const response = await api.get<DashboardData>("/reports/dashboard/", { params });
  return response.data;
};
