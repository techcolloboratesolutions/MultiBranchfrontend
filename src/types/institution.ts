export interface MainInstitution {
  id: number;
  name: string;
  place: string;
  address: string;
  po_box: string;
  phone: string;
  fax: string;
  email: string;
  legal_name: string;
  country: string;
  state: string;
  city: string;
  district: string;
  is_active: boolean;
}

export interface Institution {
  id: number;
  name: string;
  main_institution: number;
  main_institution_name: string;
  address: string;
  po_box: string;
  phone1: string;
  mobile: string;
  fax: string;
  email: string;
  contact_person: string;
  contact_number: string;
  country: string;
  state: string;
  city: string;
  district: string;
  longitude: string | null;
  latitude: string | null;
  is_active: boolean;
}

export interface Role {
  id: number;
  role_code: string;
  role_description: string;
  institution: number | null;
  institution_name: string | null;
  is_active: boolean;
}

export interface AppUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  mobile: string;
  address: string;
  institution: number;
  institution_name: string;
  role: number;
  role_code: string;
  status: string;
  is_active: boolean;
}
