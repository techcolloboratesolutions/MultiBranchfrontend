export interface WagePartnerRow {
  partner_id: number;
  partner_name: string;
  group_name?: string;
  share_percent: string;
  partner_wage_amount: string;
  partner_mobile?: string;
}

export interface WagePreview {
  institution_id: number;
  year: number;
  month: number;
  total_sales: string;
  total_purchase: string;
  total_expense: string;
  total_business: string;
  total_balance: string;
  share_total: string;
  group_name?: string;
  partners: WagePartnerRow[];
  saved?: boolean;
}
