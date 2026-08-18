export interface Partner {
  id: number;
  name: string;
  mobile: string;
  email: string;
  address: string;
  is_active: boolean;
}

export interface PartnerGroup {
  id: number;
  name: string;
  is_active: boolean;
  whatsapp_group: string;
  is_profit_sharing: boolean;
}

export interface PartnerGroupEntry {
  id: number;
  partner_group: number;
  group_name: string;
  institution: number;
  institution_name: string;
  partner: number;
  partner_name: string;
  share_percent: string;
  is_active: boolean;
}
