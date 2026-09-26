import axios from "axios";

export const api = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const mockRole = localStorage.getItem("mockRole") || "PATIENT";
    config.headers["X-Mock-Role"] = mockRole;
    const mockUserId = localStorage.getItem("mockUserId") || "user-patient-id";
    config.headers["X-Mock-User-Id"] = mockUserId;
    // Section A.4.4 X-Request-Id header
    config.headers["X-Request-Id"] =
      (window.crypto?.randomUUID && window.crypto.randomUUID()) ||
      `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize error handling
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Token expired or invalid
      // Only clear if on a protected route
    }
    return Promise.reject(error);
  }
);

export default api;
