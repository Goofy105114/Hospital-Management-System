import { create } from "zustand";
import { UserRole } from "@prisma/client";
import api from "@/lib/axios";

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  mrn?: string;
  doctorId?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  activeRole: UserRole;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  setActiveRole: (role: UserRole) => Promise<void>;
  hydrate: () => void;
  logout: () => void;
}

export const ROLE_CREDENTIALS: Partial<Record<UserRole, { identifier: string; password: string }>> = {
  DOCTOR: { identifier: "dr.vance@goingmerry.hms", password: "Password123!" },
  PATIENT: { identifier: "eleanor.vance@example.com", password: "Password123!" },
  RECEPTIONIST: { identifier: "reception@goingmerry.org", password: "Password123!" },
  ADMIN: { identifier: "admin@goingmerry.hms", password: "Password123!" },
  SUPER_ADMIN: { identifier: "admin@goingmerry.hms", password: "Password123!" },
  PHARMACIST: { identifier: "pharmacy@goingmerry.org", password: "Password123!" },
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  activeRole: "PATIENT",
  isAuthenticated: false,
  isHydrated: false,

  hydrate: () => {
    if (typeof window === "undefined" || get().isHydrated) return;
    try {
      const isLoggedOut = localStorage.getItem("isLoggedOut") === "true";
      if (isLoggedOut) {
        set({ isHydrated: true });
        return;
      }
      const token = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("authUser");
      const storedRole = localStorage.getItem("mockRole") as UserRole | null;

      if (token && storedUser) {
        const parsedUser: AuthUser = JSON.parse(storedUser);
        set({
          user: parsedUser,
          token,
          activeRole: storedRole || parsedUser.role || "PATIENT",
          isAuthenticated: true,
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },

  setAuth: (user: AuthUser, token: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("isLoggedOut");
      localStorage.setItem("accessToken", token);
      localStorage.setItem("authUser", JSON.stringify(user));
      localStorage.setItem("mockRole", user.role);
      localStorage.setItem("mockUserId", user.id);
    }
    set({
      user,
      token,
      activeRole: user.role,
      isAuthenticated: true,
      isHydrated: true,
    });
  },

  setActiveRole: async (role: UserRole) => {
    const creds = ROLE_CREDENTIALS[role];
    if (creds) {
      try {
        const res = await api.post("/auth/login", {
          identifier: creds.identifier,
          password: creds.password,
        });
        if (res.data?.data) {
          const { user, accessToken } = res.data.data;
          get().setAuth(user, accessToken);
          return;
        }
      } catch (e) {
        console.error("Failed to switch role via real auth login:", e);
      }
    }
    // Fallback role switch if credentials not available for role
    set((state) => ({
      activeRole: role,
      user: state.user ? { ...state.user, role } : null,
    }));
    if (typeof window !== "undefined") {
      localStorage.setItem("mockRole", role);
    }
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("authUser");
      localStorage.removeItem("mockRole");
      localStorage.removeItem("mockUserId");
      localStorage.setItem("isLoggedOut", "true");
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      activeRole: "PATIENT",
      isHydrated: true,
    });
  },
}));
