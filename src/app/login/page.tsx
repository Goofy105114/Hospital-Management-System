"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { UserRole } from "@prisma/client";

interface PortalCard {
  id: string;
  role: UserRole;
  title: string;
  subtitle: string;
  badge: string;
  icon: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  iconBg: string;
  description: string;
  features: string[];
  loginHref: string;
  registerHref: string;
  registerLabel: string;
  demoAccount: string;
}

const portals: PortalCard[] = [
  {
    id: "patient",
    role: "PATIENT",
    title: "Patient Portal",
    subtitle: "Personal Care & Health Records",
    badge: "Self-Service",
    icon: "personal_injury",
    accentBg: "hover:bg-primary/[0.03]",
    accentBorder: "hover:border-primary/60",
    accentText: "text-primary",
    iconBg: "bg-primary/10 text-primary",
    description:
      "Access medical records, view active prescriptions, monitor live queue tokens, and pay clinic co-pays securely.",
    features: [
      "Personal Health Records",
      "Live Queue Tracking",
      "Lab Diagnostics",
      "Online Billing",
    ],
    loginHref: "/patient/login",
    registerHref: "/patient/register",
    registerLabel: "New Patient? Create Account",
    demoAccount: "eleanor.vance@example.com",
  },
  {
    id: "doctor",
    role: "DOCTOR",
    title: "Doctor Desk",
    subtitle: "Clinical EMR & Consultation",
    badge: "Clinician Workstation",
    icon: "stethoscope",
    accentBg: "hover:bg-sky-500/[0.03]",
    accentBorder: "hover:border-sky-500/60",
    accentText: "text-sky-600",
    iconBg: "bg-sky-500/10 text-sky-600",
    description:
      "Review patient charts, document SOAP clinical notes, issue validated e-prescriptions, and order diagnostic labs.",
    features: [
      "Clinical SOAP Editor",
      "ICD-10 Diagnostics",
      "Drug Interaction Check",
      "OPD Queue Board",
    ],
    loginHref: "/doctor/login",
    registerHref: "/doctor/register",
    registerLabel: "Doctor Onboarding",
    demoAccount: "dr.vance@goingmerry.hms",
  },
  {
    id: "admin",
    role: "ADMIN",
    title: "Admin Console",
    subtitle: "Governance, IAM & Operations",
    badge: "Administration",
    icon: "admin_panel_settings",
    accentBg: "hover:bg-slate-700/[0.03]",
    accentBorder: "hover:border-slate-700/60",
    accentText: "text-slate-800",
    iconBg: "bg-slate-700/10 text-slate-800",
    description:
      "Manage staff IAM roles, monitor immutable HIPAA audit logs, configure hospital departments, and view enterprise reports.",
    features: [
      "Staff IAM & RBAC",
      "Immutable Audit Logs",
      "Department Control",
      "OpenAPI Explorer",
    ],
    loginHref: "/admin/login",
    registerHref: "/admin/register",
    registerLabel: "Admin Onboarding",
    demoAccount: "admin@goingmerry.hms",
  },
  {
    id: "receptionist",
    role: "RECEPTIONIST",
    title: "Reception Desk",
    subtitle: "Front Office, Triage & Kiosks",
    badge: "Front Desk & Triage",
    icon: "desk",
    accentBg: "hover:bg-emerald-600/[0.03]",
    accentBorder: "hover:border-emerald-600/60",
    accentText: "text-emerald-700",
    iconBg: "bg-emerald-600/10 text-emerald-700",
    description:
      "Register walk-in patients, dispense queue tokens, schedule appointments, and coordinate waiting room displays.",
    features: [
      "Patient Walk-in Triage",
      "Queue Token Dispense",
      "Doctor Rosters",
      "Waiting Room TV",
    ],
    loginHref: "/receptionist/login",
    registerHref: "/receptionist/register",
    registerLabel: "Receptionist Registration",
    demoAccount: "receptionist@goingmerry.hms",
  },
];

export default function LoginPortalSelectionPage() {
  const router = useRouter();
  const { setActiveRole } = useAuthStore();

  const handleDirectRoleSelect = (role: UserRole, loginHref: string) => {
    setActiveRole(role);
    router.push(loginHref);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-surface-container-lowest flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="max-w-4xl mx-auto text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/40 mb-6 hover:shadow transition-shadow"
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

        <h1 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight">
          Select Your Healthcare Portal
        </h1>
        <p className="mt-3 text-base text-outline max-w-2xl mx-auto">
          Please choose your authorized portal below to securely sign in with role-tailored
          permissions, audit compliance, and personalized workstations.
        </p>
      </div>

      {/* 4 Rounded Square Portal Cards */}
      <div className="max-w-6xl mx-auto w-full my-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {portals.map((portal) => (
            <div
              key={portal.id}
              className={`flex flex-col justify-between rounded-3xl bg-surface-container-lowest border-2 border-outline-variant/40 p-6 shadow-sm transition-all duration-200 hover:shadow-xl hover:-translate-y-1 ${portal.accentBg} ${portal.accentBorder}`}
            >
              <div>
                {/* Header with Icon and Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs ${portal.iconBg}`}
                  >
                    <span className="material-symbols-outlined text-[32px]">{portal.icon}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant border border-outline-variant/30">
                    {portal.badge}
                  </span>
                </div>

                {/* Titles */}
                <h2 className="text-xl font-black text-on-surface tracking-tight">
                  {portal.title}
                </h2>
                <p className={`text-xs font-bold mt-0.5 ${portal.accentText}`}>{portal.subtitle}</p>

                {/* Description */}
                <p className="text-xs text-outline leading-relaxed mt-3">{portal.description}</p>

                {/* Features List */}
                <ul className="mt-4 space-y-1.5 border-t border-outline-variant/20 pt-4">
                  {portal.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-center gap-2 text-xs text-on-surface-variant font-medium"
                    >
                      <span
                        className={`material-symbols-outlined text-[16px] ${portal.accentText}`}
                      >
                        check_circle
                      </span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-outline-variant/20 space-y-2.5">
                <button
                  onClick={() => handleDirectRoleSelect(portal.role, portal.loginHref)}
                  className="w-full py-3 px-4 rounded-xl bg-primary text-white font-bold text-sm shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span>{portal.title} Sign In</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>

                <Link
                  href={portal.registerHref}
                  className="block text-center text-xs font-semibold text-outline hover:text-primary transition-colors py-1"
                >
                  {portal.registerLabel} &rarr;
                </Link>

                <div className="text-center pt-1">
                  <span className="text-[10px] font-mono text-outline">
                    Demo: {portal.demoAccount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Support Info */}
      <div className="max-w-3xl mx-auto text-center text-xs text-outline space-y-2">
        <p className="flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary">security</span>
          <span>
            Protected by Going Merry HIPAA-Grade Security, Distributed Upstash Concurrency &
            Supabase Authentication.
          </span>
        </p>
        <p>
          Need assistance accessing your clinical account? Contact Hospital IT Support at{" "}
          <a
            href="mailto:support@goingmerry.hms"
            className="text-primary font-semibold hover:underline"
          >
            support@goingmerry.hms
          </a>{" "}
          or dial Ext. 4400.
        </p>
      </div>
    </div>
  );
}
