"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { UserRole } from "@prisma/client";
import { signOutFromSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  Search,
  Bell,
  ChevronDown,
  CheckCircle2,
  LogIn,
  UserPlus,
  LogOut,
  PanelLeft,
  PanelLeftClose,
} from "lucide-react";

import { CommandPalette } from "./CommandPalette";

export function Header() {
  const router = useRouter();
  const { user, activeRole, setActiveRole, isAuthenticated, logout } = useAuthStore();
  const { facilityLocation, setSearchModalOpen, sidebarOpen, toggleSidebar } = useUiStore();
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
      <header
        className={cn(
          "fixed top-0 right-0 h-16 bg-white/95 backdrop-blur-xl shadow-xs z-40 flex items-center justify-between px-4 sm:px-6 border-b border-slate-200/80 transition-all duration-300 ease-in-out",
          sidebarOpen ? "left-64" : "left-[68px]"
        )}
      >
        {/* Left: Sidebar Toggle & Search Bar */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <button
            type="button"
            onClick={toggleSidebar}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-slate-200/70 shrink-0"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeft className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="relative w-full flex items-center h-9 pl-9 pr-3 bg-slate-50 text-slate-800 rounded-xl hover:bg-slate-100/80 transition-all border border-slate-200/80 hover:border-teal-600/40 text-left group shadow-2xs"
          >
            <Search className="absolute left-3 w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
            <span className="text-slate-400 text-xs truncate flex-1 font-normal">
              Search doctors, appointments, medical records, medicines...
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-white rounded border border-slate-200 text-slate-500 shrink-0 shadow-2xs">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Facility Location Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200/80">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
            <span className="text-xs text-slate-600 font-medium">
              {facilityLocation}
            </span>
          </div>

          {/* Quick Nav to Login & Sign Up (Only shown when not authenticated) */}
          {!isAuthenticated && (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:border-teal-600 hover:text-teal-700 transition-colors text-slate-700 flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-700 text-white hover:bg-teal-800 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
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
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            title="Clinical Notifications & Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
          </Link>

          {/* User Profile & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2.5 pl-2.5 py-1 pr-2 rounded-xl hover:bg-slate-100 transition-colors text-left border border-slate-200/80"
            >
              <div className="relative w-7 h-7 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
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
                <span className="text-xs text-slate-800 font-semibold leading-tight">
                  {user?.name || currentRoleInfo.name}
                </span>
                <span className="text-[10px] text-teal-700 font-bold">
                  {activeRole} {user?.mrn ? `(${user.mrn})` : ""}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* User Account & Role Switcher Dropdown */}
            {roleDropdownOpen && (
              <div className="absolute right-0 top-11 mt-1.5 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Profile Card Header */}
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                  <p className="text-xs font-bold text-slate-800">
                    {user?.name || "Active Session"}
                  </p>
                  <p className="text-[11px] text-slate-500">{user?.email || "Signed in"}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200/60">
                      {activeRole}
                    </span>
                    {user?.mrn && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                        {user.mrn}
                      </span>
                    )}
                  </div>
                </div>

                {/* Fast Auth Links */}
                <div className="p-1.5 border-b border-slate-100 space-y-0.5">
                  <Link
                    href="/login"
                    onClick={() => setRoleDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5 text-teal-600" />
                    <span>Sign In with Another Account</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setRoleDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-teal-600" />
                    <span>Register New Patient Account</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600" />
                    <span>Sign Out of System</span>
                  </button>
                </div>

                {/* Persona Switcher Section */}
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                      className={`w-full text-left px-4 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        activeRole === r.role
                          ? "bg-teal-50 text-teal-800 font-semibold"
                          : "text-slate-700"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-medium">{r.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {r.role} • {r.tag}
                        </p>
                      </div>
                      {activeRole === r.role && (
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
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
