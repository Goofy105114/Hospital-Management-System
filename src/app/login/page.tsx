"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { UserRole } from "@prisma/client";
import api from "@/lib/axios";
import { signInWithSupabase } from "@/lib/supabase";

interface PortalRole {
  role: UserRole;
  title: string;
  subtitle: string;
  badge: string;
  category: "Clinical Care" | "Front Office & Ops" | "Pharmacy & Supply" | "Diagnostics" | "Administration & Security";
  icon: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  iconBg: string;
  description: string;
  features: string[];
  defaultHref: string;
  dedicatedLoginHref?: string;
  registerHref?: string;
  registerLabel?: string;
}

const allPortalRoles: PortalRole[] = [
  {
    role: "PATIENT",
    title: "Patient Portal",
    subtitle: "Personal Health Records & Care",
    badge: "Self-Service",
    category: "Clinical Care",
    icon: "personal_injury",
    accentBg: "hover:bg-teal-500/[0.04]",
    accentBorder: "hover:border-teal-500/60",
    accentText: "text-teal-700",
    iconBg: "bg-teal-500/10 text-teal-700",
    description:
      "Access personal medical charts, view active prescriptions, track live OPD queue tickets, and settle co-pay invoices.",
    features: [
      "Electronic Health Records",
      "Live OPD Queue Pass",
      "Lab Diagnostics & Tests",
      "Online Bill Settlement",
    ],
    defaultHref: "/patient",
    dedicatedLoginHref: "/patient/login",
    registerHref: "/patient/register",
    registerLabel: "New Patient? Create Account",
  },
  {
    role: "DOCTOR",
    title: "Doctor Desk",
    subtitle: "Clinical EMR & Consultation",
    badge: "Clinician Workstation",
    category: "Clinical Care",
    icon: "stethoscope",
    accentBg: "hover:bg-sky-500/[0.04]",
    accentBorder: "hover:border-sky-500/60",
    accentText: "text-sky-600",
    iconBg: "bg-sky-500/10 text-sky-600",
    description:
      "Review patient charts, document SOAP clinical notes, issue validated e-prescriptions, and order diagnostic lab assays.",
    features: [
      "Clinical SOAP Editor",
      "ICD-10 Diagnostics",
      "Drug Interaction Checker",
      "OPD Consultation Queue",
    ],
    defaultHref: "/doctor/dashboard",
    dedicatedLoginHref: "/doctor/login",
    registerHref: "/doctor/register",
    registerLabel: "Doctor Onboarding",
  },
  {
    role: "NURSE",
    title: "Nursing Station",
    subtitle: "Inpatient Wards & Vitals Triage",
    badge: "Ward & Triage",
    category: "Clinical Care",
    icon: "vaccines",
    accentBg: "hover:bg-emerald-500/[0.04]",
    accentBorder: "hover:border-emerald-500/60",
    accentText: "text-emerald-700",
    iconBg: "bg-emerald-500/10 text-emerald-700",
    description:
      "Record patient triage vitals, monitor inpatient bed allocations, and manage ward medication schedules.",
    features: [
      "Inpatient Bed Management",
      "Vital Signs Charting",
      "Medication Intake Schedule",
      "Triage & Acuity Scoring",
    ],
    defaultHref: "/nurse",
  },
  {
    role: "RECEPTIONIST",
    title: "Reception & Kiosk",
    subtitle: "Front Desk, Triage & Token Desk",
    badge: "Front Desk & Kiosk",
    category: "Front Office & Ops",
    icon: "desk",
    accentBg: "hover:bg-amber-500/[0.04]",
    accentBorder: "hover:border-amber-500/60",
    accentText: "text-amber-700",
    iconBg: "bg-amber-500/10 text-amber-700",
    description:
      "Register walk-in patients, dispense queue tokens, schedule doctor appointments, and manage waiting room displays.",
    features: [
      "Patient Walk-in Registration",
      "OPD Token Dispensation",
      "Doctor Schedules & Rosters",
      "Waiting Room Display Kiosk",
    ],
    defaultHref: "/receptionist",
    dedicatedLoginHref: "/receptionist/login",
    registerHref: "/receptionist/register",
    registerLabel: "Receptionist Registration",
  },
  {
    role: "BILLING_STAFF",
    title: "Billing & Cashier",
    subtitle: "Invoicing, Receipts & Insurance",
    badge: "Finance & Cashier",
    category: "Front Office & Ops",
    icon: "receipt_long",
    accentBg: "hover:bg-violet-500/[0.04]",
    accentBorder: "hover:border-violet-500/60",
    accentText: "text-violet-700",
    iconBg: "bg-violet-500/10 text-violet-700",
    description:
      "Generate patient tax invoices, record co-pay settlements, process insurance pre-authorizations, and review financial ledgers.",
    features: [
      "Tax Invoicing & Receipts",
      "Insurance Pre-Authorization",
      "Co-Pay Balance Collection",
      "Department Billing Ledgers",
    ],
    defaultHref: "/billing-staff",
  },
  {
    role: "PHARMACIST",
    title: "Pharmacy Dispensary",
    subtitle: "Medication Formulary & Dispensing",
    badge: "Dispensary Station",
    category: "Pharmacy & Supply",
    icon: "medication",
    accentBg: "hover:bg-cyan-500/[0.04]",
    accentBorder: "hover:border-cyan-500/60",
    accentText: "text-cyan-700",
    iconBg: "bg-cyan-500/10 text-cyan-700",
    description:
      "Validate electronic doctor prescriptions, dispense formulary medications, check batch numbers, and audit narcotics.",
    features: [
      "Digital Rx Queue Validation",
      "Formulary & ATC Directory",
      "Barcode Dispense Verification",
      "Safety Stock Reorder Alerts",
    ],
    defaultHref: "/pharmacist",
  },
  {
    role: "INVENTORY_MANAGER",
    title: "Supply & Inventory",
    subtitle: "Procurement, Stock & Batches",
    badge: "Supply Chain",
    category: "Pharmacy & Supply",
    icon: "inventory_2",
    accentBg: "hover:bg-orange-500/[0.04]",
    accentBorder: "hover:border-orange-500/60",
    accentText: "text-orange-700",
    iconBg: "bg-orange-500/10 text-orange-700",
    description:
      "Manage hospital supplies, track FIFO batch expiration, issue supplier purchase orders, and audit stock transfer ledgers.",
    features: [
      "Purchase Order Intake",
      "FIFO Valuation & Batches",
      "Batch Expiry Tracking",
      "Stock Transfer Ledgers",
    ],
    defaultHref: "/inventory-manager",
  },
  {
    role: "LAB_TECH",
    title: "Diagnostic Pathology",
    subtitle: "Laboratory Assays & Blood Tests",
    badge: "Diagnostic Lab",
    category: "Diagnostics",
    icon: "biotech",
    accentBg: "hover:bg-teal-600/[0.04]",
    accentBorder: "hover:border-teal-600/60",
    accentText: "text-teal-800",
    iconBg: "bg-teal-600/10 text-teal-800",
    description:
      "Access incoming laboratory orders, record quantitative test assay values, verify specimens, and dispatch diagnostic findings.",
    features: [
      "Diagnostic Test Catalog",
      "Specimen Barcode Tracking",
      "Assay Reference Ranges",
      "Electronic Report Release",
    ],
    defaultHref: "/lab",
  },
  {
    role: "RADIOLOGIST",
    title: "Radiology & Imaging",
    subtitle: "X-Ray, CT, MRI & Medical Scans",
    badge: "Imaging Suite",
    category: "Diagnostics",
    icon: "radiology",
    accentBg: "hover:bg-indigo-500/[0.04]",
    accentBorder: "hover:border-indigo-500/60",
    accentText: "text-indigo-700",
    iconBg: "bg-indigo-500/10 text-indigo-700",
    description:
      "Review diagnostic imaging requests, interpret modality studies (CT/MRI/X-Ray), and publish verified radiological impressions.",
    features: [
      "Modality Imaging Worklist",
      "Diagnostic Scan Uploads",
      "Structured Radiology Notes",
      "DICOM & Report Dispatch",
    ],
    defaultHref: "/lab",
  },
  {
    role: "ADMIN",
    title: "Hospital Admin",
    subtitle: "Facility Governance & Staff IAM",
    badge: "Hospital Ops",
    category: "Administration & Security",
    icon: "admin_panel_settings",
    accentBg: "hover:bg-slate-700/[0.04]",
    accentBorder: "hover:border-slate-700/60",
    accentText: "text-slate-800",
    iconBg: "bg-slate-700/10 text-slate-800",
    description:
      "Govern facility operations, manage staff IAM roles, configure hospital departments, and audit clinical compliance.",
    features: [
      "Staff Access IAM & RBAC",
      "Hospital Departments & Wards",
      "Master Bed Configuration",
      "HIPAA Compliance Audits",
    ],
    defaultHref: "/admin",
    dedicatedLoginHref: "/admin/login",
    registerHref: "/admin/register",
    registerLabel: "Admin Onboarding",
  },
  {
    role: "MANAGEMENT",
    title: "Executive Management",
    subtitle: "Enterprise Analytics & Governance",
    badge: "Leadership",
    category: "Administration & Security",
    icon: "analytics",
    accentBg: "hover:bg-blue-600/[0.04]",
    accentBorder: "hover:border-blue-600/60",
    accentText: "text-blue-700",
    iconBg: "bg-blue-600/10 text-blue-700",
    description:
      "Review high-level executive dashboards, track bed occupancy percentages, monitor hospital revenue streams, and analyze throughput.",
    features: [
      "Executive KPI Dashboard",
      "Bed Occupancy Trends",
      "Revenue Stream Analytics",
      "Clinical Throughput Metrics",
    ],
    defaultHref: "/admin",
  },
  {
    role: "SUPER_ADMIN",
    title: "Super Administrator",
    subtitle: "Security, Audits & Emergency Controls",
    badge: "System Security",
    category: "Administration & Security",
    icon: "shield_person",
    accentBg: "hover:bg-rose-600/[0.04]",
    accentBorder: "hover:border-rose-600/60",
    accentText: "text-rose-700",
    iconBg: "bg-rose-600/10 text-rose-700",
    description:
      "Root security administration with disaster recovery, immutable HIPAA audit review, emergency glass break access, and DB backups.",
    features: [
      "Emergency Glass Break Override",
      "Zero-Loss Backup / Restore",
      "Immutable Audit Log Viewer",
      "System Security Controls",
    ],
    defaultHref: "/admin",
  },
];

const categories = [
  "All Roles",
  "Clinical Care",
  "Front Office & Ops",
  "Pharmacy & Supply",
  "Diagnostics",
  "Administration & Security",
] as const;

export default function LoginPortalSelectionPage() {
  const router = useRouter();
  const { setAuth, setActiveRole } = useAuthStore();

  const [selectedCategory, setSelectedCategory] = useState<string>("All Roles");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Login Modal / Drawer State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeLoginRole, setActiveLoginRole] = useState<UserRole>("PATIENT");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const filteredRoles = allPortalRoles.filter((p) => {
    const matchesCategory =
      selectedCategory === "All Roles" || p.category === selectedCategory;
    const matchesQuery =
      searchQuery === "" ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const openLoginForRole = (role: UserRole) => {
    setActiveLoginRole(role);
    setIdentifier("");
    setPassword("");
    setErrorMsg("");
    setIsLoginModalOpen(true);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMsg("Please enter both identifier and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      try {
        await signInWithSupabase(identifier.trim(), password);
      } catch {
        // Non-blocking if offline
      }

      const res = await api.post("/auth/login", {
        identifier: identifier.trim(),
        password,
      });

      if (!res.data?.success || !res.data?.data?.user) {
        throw new Error(res.data?.error?.message || "Invalid credentials.");
      }

      const authUser = res.data.data.user;
      const token = res.data.data.accessToken;

      setAuth(authUser, token);
      await setActiveRole(activeLoginRole);

      const targetRoleConfig = allPortalRoles.find((p) => p.role === activeLoginRole);
      const destination = targetRoleConfig ? targetRoleConfig.defaultHref : "/";

      setIsLoginModalOpen(false);
      router.push(destination);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        "Invalid credentials. Please verify your email/ID and password.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentRoleConfig =
    allPortalRoles.find((p) => p.role === activeLoginRole) || allPortalRoles[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-surface-container-lowest flex flex-col justify-between py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="max-w-4xl mx-auto text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-surface-container-lowest shadow-xs border border-outline-variant/40 mb-6 hover:shadow transition-shadow"
        >
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-xs">
            <span className="material-symbols-outlined text-[22px]">local_hospital</span>
          </div>
          <div className="text-left">
            <span className="font-heading-md text-title-md font-black text-on-surface tracking-tight block">
              Going Merry HMS
            </span>
            <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider block font-semibold">
              Enterprise Healthcare Cloud
            </span>
          </div>
        </Link>

        <h1 className="text-2xl sm:text-4xl font-black text-on-surface tracking-tight">
          Select Your Healthcare Workspace Role
        </h1>
        <p className="mt-2.5 text-sm sm:text-base text-outline max-w-2xl mx-auto">
          Choose from all 12 authorized clinical and administrative workspaces to securely sign in with
          tailored permissions, clinical audit compliance, and dedicated workstations.
        </p>

        {/* Global Fast Actions: Search & Direct Sign-in */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Filter by role, department, or feature..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-white border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-outline hover:text-on-surface"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => openLoginForRole(activeLoginRole)}
            className="w-full sm:w-auto h-11 px-5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90 flex items-center justify-center gap-2 shrink-0 transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">lock_open</span>
            <span>Direct Sign In</span>
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="mt-6 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap max-w-4xl mx-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white/80 text-outline hover:bg-white hover:text-on-surface border border-outline-variant/40"
              }`}
            >
              {cat}
              {cat === "All Roles" ? ` (${allPortalRoles.length})` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of All 12 Roles */}
      <div className="max-w-7xl mx-auto w-full my-8">
        {filteredRoles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-outline-variant/40 p-8 max-w-md mx-auto">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">search_off</span>
            <h3 className="font-bold text-on-surface">No matching workspace roles</h3>
            <p className="text-xs text-outline mt-1">Try clearing your search query or choosing another category.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All Roles");
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredRoles.map((portal) => (
              <div
                key={portal.role}
                className={`flex flex-col justify-between rounded-3xl bg-white border-2 border-outline-variant/40 p-5 sm:p-6 shadow-xs transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${portal.accentBg} ${portal.accentBorder}`}
              >
                <div>
                  {/* Header: Icon, Role Badge & Category */}
                  <div className="flex items-start justify-between mb-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xs ${portal.iconBg}`}
                    >
                      <span className="material-symbols-outlined text-[28px]">{portal.icon}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {portal.badge}
                      </span>
                      <span className="text-[9px] font-mono text-outline font-semibold">
                        {portal.role}
                      </span>
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <h2 className="text-lg font-black text-on-surface tracking-tight">
                    {portal.title}
                  </h2>
                  <p className={`text-xs font-bold mt-0.5 ${portal.accentText}`}>
                    {portal.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-xs text-outline leading-relaxed mt-2.5 line-clamp-3">
                    {portal.description}
                  </p>

                  {/* Core Features */}
                  <ul className="mt-3.5 space-y-1 border-t border-outline-variant/20 pt-3">
                    {portal.features.slice(0, 3).map((feat) => (
                      <li
                        key={feat}
                        className="flex items-center gap-1.5 text-[11px] text-on-surface-variant font-medium"
                      >
                        <span
                          className={`material-symbols-outlined text-[15px] shrink-0 ${portal.accentText}`}
                        >
                          check_circle
                        </span>
                        <span className="truncate">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Role Actions */}
                <div className="mt-5 pt-3.5 border-t border-outline-variant/20 space-y-2">
                  <button
                    type="button"
                    onClick={() => openLoginForRole(portal.role)}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-primary text-white font-bold text-xs sm:text-sm shadow-xs hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Sign In to {portal.title}</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>

                  {portal.dedicatedLoginHref && (
                    <div className="flex items-center justify-between text-[11px] text-outline pt-1">
                      <Link
                        href={portal.dedicatedLoginHref}
                        className="hover:text-primary transition-colors font-medium hover:underline"
                      >
                        Direct Desk Login
                      </Link>
                      {portal.registerHref && (
                        <Link
                          href={portal.registerHref}
                          className="hover:text-primary transition-colors font-semibold text-slate-700"
                        >
                          Register &rarr;
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Direct Role Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-outline-variant/30 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${currentRoleConfig.iconBg}`}
                >
                  <span className="material-symbols-outlined text-[28px]">
                    {currentRoleConfig.icon}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-on-surface">
                    {currentRoleConfig.title} Login
                  </h3>
                  <p className="text-xs text-outline font-medium">
                    Authenticate to enter workspace
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                aria-label="Close login dialog"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Error Notice */}
            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Role Selection Dropdown */}
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Selected Workspace Role
                </label>
                <select
                  value={activeLoginRole}
                  onChange={(e) => {
                    const newRole = e.target.value as UserRole;
                    setActiveLoginRole(newRole);
                    setErrorMsg("");
                  }}
                  className="w-full h-11 px-3.5 bg-slate-50 text-on-surface rounded-xl border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary text-sm font-semibold"
                >
                  {allPortalRoles.map((p) => (
                    <option key={p.role} value={p.role}>
                      {p.title} ({p.role}) — {p.category}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-outline mt-1 font-medium">
                  Switching role changes your authorized workstation permissions.
                </p>
              </div>

              {/* Email / Staff ID - Empty by default, no autofill */}
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Hospital Email / Staff or Patient ID
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. clinician@goingmerry.hms"
                  required
                  className="w-full h-11 px-3.5 bg-slate-50 text-on-surface rounded-xl border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary text-sm font-medium"
                />
              </div>

              {/* Password - Empty by default, no autofill */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    onClick={() => setIsLoginModalOpen(false)}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    Forgot?
                  </Link>
                </div>
                <input
                  type="password"
                  autoComplete="off"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full h-11 px-3.5 bg-slate-50 text-on-surface rounded-xl border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary text-sm font-medium"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 font-bold rounded-xl bg-primary hover:bg-primary/90 text-white text-sm shadow-xs transition-transform active:scale-98 flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Enter {currentRoleConfig.title}</span>
                    <span className="material-symbols-outlined text-[18px]">login</span>
                  </>
                )}
              </button>
            </form>

            {/* Modal Footer Assistance */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-outline">
              <span className="font-mono text-[11px]">HIPAA & 21 CFR Part 11</span>
              {currentRoleConfig.dedicatedLoginHref && (
                <Link
                  href={currentRoleConfig.dedicatedLoginHref}
                  onClick={() => setIsLoginModalOpen(false)}
                  className="text-primary hover:underline font-semibold"
                >
                  Open Dedicated Page &rarr;
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Support Info */}
      <div className="max-w-3xl mx-auto text-center text-xs text-outline space-y-2 mt-6">
        <p className="flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary">security</span>
          <span>
            Protected by Going Merry HIPAA-Grade Security, Distributed Upstash Concurrency &
            Supabase IAM Authentication.
          </span>
        </p>
        <p>
          Need access assistance or role assignment? Contact Hospital IT Administration at{" "}
          <a
            href="mailto:support@goingmerry.hms"
            className="text-primary font-semibold hover:underline"
          >
            support@goingmerry.hms
          </a>{" "}
          or internal extension 4400.
        </p>
      </div>
    </div>
  );
}
