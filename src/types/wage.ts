export interface WagePartnerRow {
  partner_id: number;
  partner_name: string;
  share_percent: string;
  partner_wage_amount: string;
}

export interface WagePreview {
  institution_id: number;
  year: number;
  month: number;
  total_receipt: string;
  total_payment: string;
  total_business: string;
  share_total: string;
  partners: WagePartnerRow[];
  saved?: boolean;
}
