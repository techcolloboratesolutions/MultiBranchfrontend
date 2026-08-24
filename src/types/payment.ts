export type RecurringType = "Daily" | "Monthly";

export interface PaymentHead {
  id: number;
  code: string;
  description: string;
  is_active: boolean;
  recurring_type: RecurringType;
}

export interface DailyPayment {
  id: number;
  payment_head: number;
  payment_head_name: string;
  amount: string;
  business_date: string;
  transaction_date: string;
  institution: number;
  institution_name: string;
  entered_by: number | null;
  entered_by_name: string | null;
  is_active: boolean;
}
