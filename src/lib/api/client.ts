import axios from "axios";
import { appConfig } from "@/lib/config";
import { authStorage } from "@/lib/auth-storage";

export const api = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      authStorage.clearToken();
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        const reason = status === 403 ? "?error=admin_required" : "";
        window.location.href = `/login${reason}`;
      }
    }
    return Promise.reject(error);
  }
);
