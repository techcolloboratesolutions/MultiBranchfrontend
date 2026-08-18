export interface ReceiptHead {
  id: number;
  code: string;
  description: string;
  is_active: boolean;
}

export interface DailyReceipt {
  id: number;
  receipt_head: number;
  receipt_head_name: string;
  amount: string;
  business_date: string;
  transaction_date: string;
  institution: number;
  institution_name: string;
  entered_by: number | null;
  entered_by_name: string | null;
  is_active: boolean;
}
