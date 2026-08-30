export interface ExpenseHead {
  id: number;
  code: string;
  description: string;
  is_active: boolean;
}

export interface DailyExpense {
  id: number;
  expense_head: number;
  expense_head_name: string;
  amount: string;
  business_date: string;
  transaction_date: string;
  institution: number;
  institution_name: string;
  entered_by: number | null;
  entered_by_name: string | null;
  is_active: boolean;
}
