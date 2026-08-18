export interface InstitutionBrief {
  id: number;
  name: string;
}

export interface AuthUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  mobile: string;
  role: "ADMIN" | "MANAGER" | string;
  institution: InstitutionBrief;
  main_institution: InstitutionBrief;
  status: string;
  is_active: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}
