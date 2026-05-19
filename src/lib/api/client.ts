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
    if (error?.response?.status === 401) {
      authStorage.clearToken();
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
