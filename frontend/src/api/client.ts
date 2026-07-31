import axios from "axios";

const TOKEN_KEY = "radar_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Use the same-origin API in local development; Render's static frontend can
// point at the separately deployed FastAPI service through this build variable.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";
export const api = axios.create({ baseURL: apiBaseUrl });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== "/login") {
      clearToken();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
