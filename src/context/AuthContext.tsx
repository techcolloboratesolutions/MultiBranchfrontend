import { createContext, ReactNode, useCallback, useMemo, useState } from "react";
import { AuthUser, LoginRequest } from "../types/auth";
import { login as loginRequest, logout as logoutRequest } from "../services/authService";
import { clearSession } from "../services/api";

interface AuthContextValue {
  user: AuthUser | null;
  isAdmin: boolean;
  isManager: boolean;
  operatingInstitutionId: number | "all";
  setOperatingInstitutionId: (id: number | "all") => void;
  login: (payload: LoginRequest) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem("user");
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  const login = useCallback(async (payload: LoginRequest) => {
    const data = await loginRequest(payload);
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Client-side logout still proceeds if the API is unreachable.
    }
    setUser(null);
    clearSession();
  }, []);

  const defaultInstitution: number | "all" = user?.role === "ADMIN" ? "all" : (user?.institution.id ?? "all");
  const [operatingInstitutionId, setOperatingInstitutionId] = useState<number | "all">(defaultInstitution);

  const value = useMemo(
    () => ({
      user,
      isAdmin: user?.role === "ADMIN",
      isManager: user?.role === "MANAGER",
      operatingInstitutionId: user?.role === "MANAGER" ? user.institution.id : operatingInstitutionId,
      setOperatingInstitutionId,
      login,
      logout,
    }),
    [user, operatingInstitutionId, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
