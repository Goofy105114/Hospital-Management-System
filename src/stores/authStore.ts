import { create } from "zustand";
import { UserRole } from "@prisma/client";

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
  setAuth: (user: AuthUser, token: string) => void;
  setActiveRole: (role: UserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Initialize from localStorage if client-side
  let initialRole: UserRole = "PATIENT";
  let initialUser: AuthUser | null = null;
  let initialToken: string | null = null;
  let isAuth = false;

  if (typeof window !== "undefined") {
    const isLoggedOut = localStorage.getItem("isLoggedOut") === "true";
    if (!isLoggedOut) {
      initialToken = localStorage.getItem("accessToken");
      const storedRole = localStorage.getItem("mockRole") as UserRole | null;
      if (storedRole) {
        initialRole = storedRole;
      }
      const storedUser = localStorage.getItem("authUser");
      if (storedUser) {
        try {
          initialUser = JSON.parse(storedUser);
          if (initialUser) {
            isAuth = true;
            if (!storedRole) {
              initialRole = initialUser.role;
            }
          }
        } catch {
          // ignore
        }
      }
    }
  }

  return {
    user: initialUser,
    token: initialToken,
    activeRole: initialRole,
    isAuthenticated: isAuth,
    setAuth: (user, token) => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("isLoggedOut");
        localStorage.setItem("accessToken", token);
        localStorage.setItem("authUser", JSON.stringify(user));
        localStorage.setItem("mockRole", user.role);
        localStorage.setItem("mockUserId", user.id);
      }
      set({ user, token, activeRole: user.role, isAuthenticated: true });
    },
    setActiveRole: (role) => {
      let roleUser: AuthUser = {
        id: `user-${role.toLowerCase()}-id`,
        name:
          role === "DOCTOR"
            ? "Dr. Marcus Vance, MD"
            : role === "RECEPTIONIST"
              ? "Sarah Connor"
              : role === "PHARMACIST"
                ? "David Miller, RPh"
                : role === "NURSE"
                  ? "Rachel Adams, RN"
                  : role === "ADMIN" || role === "SUPER_ADMIN" || role === "MANAGEMENT"
                    ? "Hospital Administrator"
                    : role === "BILLING_STAFF"
                      ? "Emily Watson"
                      : role === "INVENTORY_MANAGER"
                        ? "Alex Chen"
                        : "Eleanor Vance",
        email: `${role.toLowerCase()}@goingmerry.hms`,
        role: role,
        mrn: role === "PATIENT" ? "GM-84920" : undefined,
        doctorId: role === "DOCTOR" ? "doc-vance-id" : undefined,
      };

      if (typeof window !== "undefined") {
        localStorage.removeItem("isLoggedOut");
        localStorage.setItem("mockRole", role);
        localStorage.setItem("authUser", JSON.stringify(roleUser));
      }

      set({
        activeRole: role,
        user: roleUser,
        isAuthenticated: true,
      });
    },
    logout: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("authUser");
        localStorage.removeItem("mockRole");
        localStorage.removeItem("mockUserId");
        localStorage.setItem("isLoggedOut", "true");
      }
      set({ user: null, token: null, isAuthenticated: false, activeRole: "PATIENT" });
    },
  };
});
