"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { UserRole } from "@prisma/client";
import { signOutFromSupabase } from "@/lib/supabase";

import { CommandPalette } from "./CommandPalette";

export function Header() {
  const router = useRouter();
  const { user, activeRole, setActiveRole, isAuthenticated, logout } = useAuthStore();
  const { facilityLocation, setSearchModalOpen } = useUiStore();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const roles: Array<{ role: UserRole; name: string; tag: string }> = [
    { role: "PATIENT", name: "Eleanor Vance", tag: "MRN: GM-84920" },
    { role: "DOCTOR", name: "Dr. Marcus Vance, MD", tag: "Cardiology Lead" },
    { role: "RECEPTIONIST", name: "Sarah Connor", tag: "Front Desk & Kiosk" },
    { role: "NURSE", name: "Rachel Adams, RN", tag: "Triage Station 4" },
    { role: "PHARMACIST", name: "David Miller, RPh", tag: "Central Pharmacy" },
    { role: "INVENTORY_MANAGER", name: "Alex Chen", tag: "Supply & Logistics" },
    { role: "LAB_TECH", name: "Dr. Sarah Jenkins", tag: "Pathology Diagnostics" },
    { role: "BILLING_STAFF", name: "Emily Watson", tag: "Cashier & Invoicing" },
    { role: "ADMIN", name: "Hospital Administrator", tag: "Facility Ops & Master Data" },
    { role: "SUPER_ADMIN", name: "Super Admin", tag: "Security & Full Access" },
  ];

  const currentRoleInfo = roles.find((r) => r.role === activeRole) || roles[0];

  const handleSignOut = async () => {
    await signOutFromSupabase();
    logout();
    setRoleDropdownOpen(false);
    router.push("/login");
  };

  return (
    <>
      <CommandPalette />
      <header className="fixed top-0 left-72 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-space-6 border-b border-outline-variant/30">
        {/* Search Bar & Cmd+K Trigger */}
        <div className="flex items-center gap-space-4 flex-1 max-w-lg">
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="relative w-full flex items-center h-10 pl-10 pr-3 bg-surface-container-low text-on-surface rounded-xl hover:bg-surface-container transition-all border border-outline-variant/30 hover:border-primary/40 text-left group"
          >
            <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] group-hover:text-primary transition-colors">
              search
            </span>
            <span className="text-outline font-body-md text-xs truncate flex-1">
              Search doctors, appointments, medical records, medicines...
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono bg-surface-container-high rounded border border-outline-variant/40 text-outline shrink-0">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-space-4">
          {/* Facility Location Pill */}
          <div className="hidden lg:flex items-center gap-space-2 px-space-3 py-space-1 bg-surface-container-low rounded-full border border-outline-variant/30">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="font-label-md text-label-md text-on-surface-variant font-medium">
              {facilityLocation}
            </span>
          </div>

          {/* Quick Nav to Login & Sign Up (Only shown when not authenticated) */}
          {!isAuthenticated && (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-outline-variant/40 hover:border-primary hover:text-primary transition-colors text-on-surface flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">login</span>
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-1 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                <span>Sign Up</span>
              </Link>
            </div>
          )}

          {/* Notifications Button */}
          <Link
            href={
              activeRole === "DOCTOR"
                ? "/doctor/notifications"
                : activeRole === "RECEPTIONIST"
                  ? "/receptionist/notifications"
                  : activeRole === "ADMIN" ||
                      activeRole === "SUPER_ADMIN" ||
                      activeRole === "MANAGEMENT"
                    ? "/admin/notifications"
                    : activeRole === "PHARMACIST"
                      ? "/pharmacist/notifications"
                      : activeRole === "NURSE"
                        ? "/nurse/notifications"
                        : activeRole === "LAB_TECH" || activeRole === "RADIOLOGIST"
                          ? "/lab/notifications"
                          : activeRole === "BILLING_STAFF"
                            ? "/billing-staff/notifications"
                            : activeRole === "INVENTORY_MANAGER"
                              ? "/inventory-manager/notifications"
                              : "/patient/notifications"
            }
            className="relative p-space-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            title="Clinical Notifications & Alerts"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error animate-ping"></span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error"></span>
          </Link>

          {/* User Profile & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-space-3 pl-space-3 py-1 pr-2 rounded-lg hover:bg-surface-container-low transition-colors text-left border border-outline-variant/30"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-surface-container shrink-0 border border-outline-variant/50">
                <Image
                  src={
                    activeRole === "DOCTOR"
                      ? "https://lh3.googleusercontent.com/aida-public/AB6AXuASMiD_yIVTlPeVGR7BMhyNEBY4UL5xU-OoFzIFeJzBj4GmKdxC0eh0O4xcyAS3CeXQ8NnQ0gvEJtDPR7t5t1JjDePFWPhcRLZp7XojtXi3GXzaHG2TEhrMGeUo60Zagx_dPuYjl9yycKazLAPMm422VDhdlpJWf5p52tJw9hokXGmV5eJKYysRs8n32VNtjWqaxUdA2CEbErmKL4Y7-Qo8a6D-QSVTBbeSyA9KcMLyiD4Dunv2el8b"
                      : "https://lh3.googleusercontent.com/aida-public/AB6AXuCVBCFEdd3BBOq2WOVO-opMzljRX6bUgWVtDXvQ9fn5Uc1oD57OOjexl__SZ1Qu776A8XqYl_CoYfXltVq-s6zojifRKuhUdlLDpEHV8zdrzB9WF1t-QDR6gr7ZGe4YSI7rMx1hdMDipfiUophtHTuVnYCSnrjfUdntLF4S6J8DSC0tsRV7OwCQkVxwkqOFErGuprtsNVTuWJLGIdec0kUlKB_Q9wI3C9b7pHzOo1u-7-Oea8zphnJd"
                  }
                  alt="Profile"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">
                  {user?.name || currentRoleInfo.name}
                </span>
                <span className="font-label-sm text-label-sm text-primary font-bold">
                  {activeRole} {user?.mrn ? `(${user.mrn})` : ""}
                </span>
              </div>
              <span className="material-symbols-outlined text-outline text-[18px]">
                expand_more
              </span>
            </button>

            {/* User Account & Role Switcher Dropdown */}
            {roleDropdownOpen && (
              <div className="absolute right-0 top-12 mt-2 w-80 bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/40 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Profile Card Header */}
                <div className="px-4 py-3 border-b border-outline-variant/20 bg-surface-container-low/50 rounded-t-2xl">
                  <p className="text-xs font-bold text-on-surface">
                    {user?.name || "Active Session"}
                  </p>
                  <p className="text-[11px] text-outline">{user?.email || "Signed in"}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary">
                      {activeRole}
                    </span>
                    {user?.mrn && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface-container-high text-on-surface">
                        {user.mrn}
                      </span>
                    )}
                  </div>
                </div>

                {/* Fast Auth Links */}
                <div className="p-2 border-b border-outline-variant/20 space-y-1">
                  <Link
                    href="/login"
                    onClick={() => setRoleDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      login
                    </span>
                    <span>Sign In with Another Account</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setRoleDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      person_add
                    </span>
                    <span>Register New Patient Account</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-error hover:bg-error/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-error">logout</span>
                    <span>Sign Out of System</span>
                  </button>
                </div>

                {/* Persona Switcher Section */}
                <div className="px-4 py-2 border-b border-outline-variant/20">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
                    One-Click Persona Switcher
                  </p>
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  {roles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        setActiveRole(r.role);
                        setRoleDropdownOpen(false);
                        const roleHome =
                          r.role === "DOCTOR"
                            ? "/doctor"
                            : r.role === "RECEPTIONIST"
                              ? "/receptionist"
                              : r.role === "ADMIN" ||
                                  r.role === "SUPER_ADMIN" ||
                                  r.role === "MANAGEMENT"
                                ? "/admin"
                                : r.role === "PHARMACIST"
                                  ? "/pharmacist"
                                  : r.role === "NURSE"
                                    ? "/nurse"
                                    : r.role === "LAB_TECH" || r.role === "RADIOLOGIST"
                                      ? "/lab"
                                      : r.role === "BILLING_STAFF"
                                        ? "/billing-staff"
                                        : r.role === "INVENTORY_MANAGER"
                                          ? "/inventory-manager"
                                          : "/patient";
                        router.push(roleHome);
                      }}
                      className={`w-full text-left px-4 py-2 flex items-center justify-between hover:bg-surface-container-low transition-colors ${
                        activeRole === r.role
                          ? "bg-primary-fixed/30 text-primary font-semibold"
                          : "text-on-surface"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-medium">{r.name}</p>
                        <p className="text-[10px] text-outline">
                          {r.role} • {r.tag}
                        </p>
                      </div>
                      {activeRole === r.role && (
                        <span className="material-symbols-outlined text-primary text-[16px]">
                          check_circle
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
