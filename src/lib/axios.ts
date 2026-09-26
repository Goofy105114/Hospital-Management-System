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
    let mockRole = localStorage.getItem("mockRole");
    if (!mockRole && !token) {
      const path = window.location.pathname;
      if (path.startsWith("/pharmacist") || path.startsWith("/pharmacy")) mockRole = "PHARMACIST";
      else if (path.startsWith("/inventory-manager") || path.startsWith("/inventory")) mockRole = "INVENTORY_MANAGER";
      else if (path.startsWith("/admin")) mockRole = "ADMIN";
      else if (path.startsWith("/doctor")) mockRole = "DOCTOR";
      else if (path.startsWith("/nurse")) mockRole = "NURSE";
      else if (path.startsWith("/receptionist")) mockRole = "RECEPTIONIST";
      else if (path.startsWith("/billing-staff")) mockRole = "BILLING_STAFF";
      else if (path.startsWith("/patient")) mockRole = "PATIENT";
    }
    if (mockRole) {
      config.headers["X-Mock-Role"] = mockRole;
    }
    const mockUserId = localStorage.getItem("mockUserId") || (mockRole ? "session-desk-user" : null);
    if (mockUserId) {
      config.headers["X-Mock-User-Id"] = mockUserId;
    }
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
