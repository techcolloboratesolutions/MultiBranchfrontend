import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "https://multi-branchbackend.vercel.app/api").replace(
  /\/$/,
  "",
);

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const url = config.url ?? "";
  if (url.includes("/auth/lookup/") || url.includes("/auth/login/")) {
    return config;
  }
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ detail?: string }>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? "";

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !url.includes("/auth/login/") &&
      !url.includes("/auth/refresh/") &&
      !url.includes("/auth/logout/") &&
      !url.includes("/auth/lookup/")
    ) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh");
      if (!refresh) {
        clearSession();
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh/`, {
          refresh,
        });
        localStorage.setItem("access", data.access);
        if (data.refresh) {
          localStorage.setItem("refresh", data.refresh);
        }
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        clearSession();
      }
    }
    return Promise.reject(error);
  },
);

export function clearSession(): void {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  const axiosError = error as AxiosError<{ detail?: string }>;
  return axiosError.response?.data?.detail || fallback;
}

export function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }
  if (data && typeof data === "object" && "results" in data) {
    return ((data as { results: T[] }).results ?? []) as T[];
  }
  return [];
}

export default api;
