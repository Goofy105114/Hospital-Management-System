"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";

interface NavLinkItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavLinkItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeRole, user, isAuthenticated, logout } = useAuthStore();

  const getRoleLabel = () => {
    switch (activeRole) {
      case "DOCTOR":
        return "Clinician Desk";
      case "RECEPTIONIST":
        return "Front Desk & Triage";
      case "PHARMACIST":
        return "Pharmacy Dispensary";
      case "INVENTORY_MANAGER":
        return "Supply Chain Command";
      case "NURSE":
        return "Nursing & Wards";
      case "LAB_TECH":
      case "RADIOLOGIST":
        return "Diagnostic Center";
      case "BILLING_STAFF":
        return "Cashier & Billing";
      case "ADMIN":
      case "SUPER_ADMIN":
      case "MANAGEMENT":
        return "Hospital Administration";
      default:
        return "Patient Portal";
    }
  };

  const getSectionsForRole = (role: UserRole): NavSection[] => {
    switch (role) {
      case "DOCTOR":
        return [
          {
            title: "Clinical Core",
            items: [
              { label: "Doctor Workspace", href: "/doctor/dashboard", icon: "stethoscope" },
              { label: "Consultation Queue", href: "/doctor/queue", icon: "timelapse" },
              { label: "Patient Directory", href: "/doctor/patients", icon: "group" },
              { label: "Encounters & Visits", href: "/doctor/encounters", icon: "calendar_month" },
              { label: "Doctor Rosters", href: "/doctor/schedules", icon: "schedule" },
            ],
          },
          {
            title: "Inpatient & Diagnostic",
            items: [
              { label: "Inpatient Wards", href: "/doctor/inpatient", icon: "hotel" },
              { label: "Admissions & Beds", href: "/doctor/inpatient/admissions", icon: "bed" },
              { label: "Diagnostics & Labs", href: "/doctor/diagnostics", icon: "biotech" },
              { label: "Drug Formulary", href: "/doctor/medicines", icon: "vaccines" },
              { label: "Notifications", href: "/doctor/notifications", icon: "notifications" },
              { label: "Clinician Profile", href: "/doctor/profile", icon: "person" },
            ],
          },
        ];

      case "RECEPTIONIST":
        return [
          {
            title: "Front Desk Operations",
            items: [
              { label: "Front Desk Home", href: "/receptionist", icon: "desk" },
              { label: "Patient Directory", href: "/receptionist/patients", icon: "group" },
              {
                label: "Walk-in Registration",
                href: "/receptionist/patients/register",
                icon: "person_add",
              },
              {
                label: "Appointments Desk",
                href: "/receptionist/appointments",
                icon: "calendar_month",
              },
              {
                label: "Book New Visit",
                href: "/receptionist/appointments/book",
                icon: "add_circle",
              },
              { label: "Doctor Rosters", href: "/receptionist/schedules", icon: "schedule" },
            ],
          },
          {
            title: "Queue & Reception",
            items: [
              { label: "Reception Queue", href: "/receptionist/queue", icon: "timelapse" },
              { label: "Self-Service Kiosk", href: "/receptionist/kiosk", icon: "touch_app" },
              { label: "Waiting Room TV", href: "/receptionist/display", icon: "tv" },
              { label: "Cashier & Invoices", href: "/receptionist/billing", icon: "receipt_long" },
              {
                label: "Notifications",
                href: "/receptionist/notifications",
                icon: "notifications",
              },
              { label: "Staff Profile", href: "/receptionist/profile", icon: "person" },
            ],
          },
        ];

      case "ADMIN":
      case "SUPER_ADMIN":
      case "MANAGEMENT":
        return [
          {
            title: "System Governance",
            items: [
              { label: "Admin Console", href: "/admin", icon: "shield_person" },
              { label: "Queue SLA Monitor", href: "/admin/queue", icon: "speed" },
              { label: "Staff IAM & RBAC", href: "/admin/users", icon: "manage_accounts" },
              { label: "Hospital Facilities", href: "/admin/departments", icon: "domain" },
              { label: "Enterprise Reports", href: "/admin/reports", icon: "analytics" },
              { label: "API Docs (OpenAPI)", href: "/admin/api-docs", icon: "api" },
            ],
          },
          {
            title: "Operational Oversight",
            items: [
              { label: "Patient Directory", href: "/admin/patients", icon: "group" },
              { label: "Doctor Rosters", href: "/admin/schedules", icon: "schedule" },
              { label: "Inpatient Beds", href: "/admin/inpatient", icon: "hotel" },
              { label: "Inventory Ledger", href: "/admin/inventory", icon: "inventory_2" },
              { label: "Billing & Cashier", href: "/admin/billing", icon: "receipt_long" },
              { label: "TPA & Claims", href: "/admin/claims", icon: "policy" },
              { label: "Notifications", href: "/admin/notifications", icon: "notifications" },
              { label: "Admin Profile", href: "/admin/profile", icon: "person" },
            ],
          },
        ];

      case "PHARMACIST":
        return [
          {
            title: "Pharmacy Dispensary",
            items: [
              { label: "Pharmacy Dispense", href: "/pharmacist", icon: "medication" },
              { label: "Drug Formulary", href: "/pharmacist/medicines", icon: "vaccines" },
              { label: "Prescriptions", href: "/pharmacist/prescriptions", icon: "receipt" },
            ],
          },
          {
            title: "Supply Chain",
            items: [
              { label: "Inventory Ledger", href: "/pharmacist/inventory", icon: "inventory_2" },
              {
                label: "Purchase Orders",
                href: "/pharmacist/purchase-orders",
                icon: "shopping_cart",
              },
              { label: "Batch Lot Expiry", href: "/pharmacist/batches", icon: "event_busy" },
              { label: "Notifications", href: "/pharmacist/notifications", icon: "notifications" },
              { label: "Pharmacist Profile", href: "/pharmacist/profile", icon: "person" },
            ],
          },
        ];

      case "NURSE":
        return [
          {
            title: "Nursing & Care",
            items: [
              { label: "Nursing Station", href: "/nurse", icon: "local_hospital" },
              { label: "Inpatient Wards", href: "/nurse/inpatient", icon: "hotel" },
              { label: "Admissions & Beds", href: "/nurse/admissions", icon: "bed" },
              { label: "OPD Queue Board", href: "/nurse/queue", icon: "timelapse" },
              { label: "Patient Directory", href: "/nurse/patients", icon: "group" },
              { label: "Diagnostics & Labs", href: "/nurse/diagnostics", icon: "biotech" },
              { label: "Notifications", href: "/nurse/notifications", icon: "notifications" },
              { label: "Nurse Profile", href: "/nurse/profile", icon: "person" },
            ],
          },
        ];

      case "LAB_TECH":
      case "RADIOLOGIST":
        return [
          {
            title: "Diagnostic Center",
            items: [
              { label: "Diagnostics Hub", href: "/lab", icon: "biotech" },
              { label: "Diagnostics Orders", href: "/lab/diagnostics", icon: "science" },
              { label: "Test Catalog", href: "/lab/catalog", icon: "format_list_bulleted" },
              { label: "Lab Reports", href: "/lab/reports", icon: "analytics" },
              { label: "Notifications", href: "/lab/notifications", icon: "notifications" },
              { label: "Diagnostics Profile", href: "/lab/profile", icon: "person" },
            ],
          },
        ];

      case "BILLING_STAFF":
        return [
          {
            title: "Hospital Cashier",
            items: [
              { label: "Cashier Desk", href: "/billing-staff", icon: "point_of_sale" },
              { label: "Billing & Invoices", href: "/billing-staff/billing", icon: "receipt_long" },
              { label: "TPA & Claims", href: "/billing-staff/claims", icon: "policy" },
              { label: "Patient Directory", href: "/billing-staff/patients", icon: "group" },
              { label: "Financial Reports", href: "/billing-staff/reports", icon: "analytics" },
              {
                label: "Notifications",
                href: "/billing-staff/notifications",
                icon: "notifications",
              },
              { label: "Cashier Profile", href: "/billing-staff/profile", icon: "person" },
            ],
          },
        ];

      case "INVENTORY_MANAGER":
        return [
          {
            title: "Supply & Inventory",
            items: [
              { label: "Supply Console", href: "/inventory-manager", icon: "warehouse" },
              {
                label: "Inventory Ledger",
                href: "/inventory-manager/inventory",
                icon: "inventory_2",
              },
              {
                label: "Purchase Orders",
                href: "/inventory-manager/purchase-orders",
                icon: "shopping_cart",
              },
              { label: "Batch Lot Expiry", href: "/inventory-manager/batches", icon: "event_busy" },
              { label: "Drug Formulary", href: "/inventory-manager/medicines", icon: "vaccines" },
              {
                label: "Notifications",
                href: "/inventory-manager/notifications",
                icon: "notifications",
              },
              { label: "Manager Profile", href: "/inventory-manager/profile", icon: "person" },
            ],
          },
        ];

      case "PATIENT":
      default:
        return [
          {
            title: "Patient Care",
            items: [
              { label: "Dashboard", href: "/patient", icon: "grid_view" },
              { label: "Appointments", href: "/patient/appointments", icon: "calendar_today" },
              { label: "Book Visit", href: "/patient/appointments/book", icon: "add_circle" },
              { label: "Live Queue Pass", href: "/patient/queue", icon: "timelapse" },
              { label: "Medical Records", href: "/patient/records", icon: "folder_shared" },
              { label: "Prescriptions", href: "/patient/prescriptions", icon: "medication" },
              { label: "Lab Reports", href: "/patient/reports", icon: "science" },
            ],
          },
          {
            title: "Billing & Account",
            items: [
              { label: "Billing & Receipts", href: "/patient/billing", icon: "receipt_long" },
              { label: "Notifications", href: "/patient/notifications", icon: "notifications" },
              { label: "My Profile", href: "/patient/profile", icon: "person" },
              { label: "Help & Triage", href: "/patient/help", icon: "support_agent" },
            ],
          },
        ];
    }
  };

  const sections = getSectionsForRole(activeRole);

  // Compute the single best (longest) matching href in all current nav items to prevent multiple simultaneous highlights
  const allNavItems = sections.flatMap((s) => s.items);
  const bestMatch = allNavItems
    .filter((it) => {
      if (it.href === "/patient" && (pathname === "/patient" || pathname === "/")) return true;
      if (it.href === "/") return pathname === "/";
      return pathname === it.href || pathname.startsWith(it.href + "/");
    })
    .sort((a, b) => b.href.length - a.href.length)[0];

  const activeHref = bestMatch?.href ?? "";

  const handleSignOut = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between border-r border-outline-variant/30">
      <div className="flex flex-col flex-1 overflow-y-auto px-space-4 pt-space-6 pb-space-4">
        {/* Brand Header */}
        <Link
          href="/"
          className="flex items-center gap-space-3 px-space-2 pb-space-5 border-b border-outline-variant/20 mb-space-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0 group-hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-[24px]">local_hospital</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-headline-sm text-headline-sm text-primary leading-none font-bold truncate">
              Going Merry
            </span>
            <span className="font-label-sm text-label-sm text-outline tracking-wider uppercase mt-space-1 font-semibold">
              {getRoleLabel()}
            </span>
          </div>
        </Link>

        {/* Navigation Sections (strictly filtered by RBAC) */}
        <nav className="flex flex-col gap-space-4">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-space-1">
              <span className="px-space-3 text-[11px] font-bold uppercase tracking-wider text-outline/80 block">
                {section.title}
              </span>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = item.href === activeHref;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-space-2.5 px-space-3 py-1.5 rounded-lg transition-colors font-label-md text-label-md group",
                        isActive
                          ? "bg-primary-container text-on-primary-container font-semibold shadow-sm"
                          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                      )}
                    >
                      <span
                        className={cn(
                          "material-symbols-outlined text-[19px] shrink-0 transition-colors",
                          isActive
                            ? "text-primary font-bold"
                            : "text-outline group-hover:text-primary"
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User Auth & Session Footer */}
      <div className="p-space-3 border-t border-outline-variant/20 bg-surface-container-lowest space-y-2">
        {/* User Card */}
        <div className="bg-surface-container-low rounded-xl p-2.5 border border-outline-variant/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name ? user.name.charAt(0) : "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-on-surface truncate leading-tight">
                {user?.name || "Active Session"}
              </p>
              <p className="text-[10px] text-primary font-semibold truncate leading-tight">
                {activeRole} {user?.mrn ? `• ${user.mrn}` : ""}
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>

        {/* Auth Action Buttons */}
        {isAuthenticated ? (
          <div className="grid grid-cols-2 gap-1.5">
            <Link
              href="/login"
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold bg-surface-container-high text-on-surface hover:bg-primary/10 hover:text-primary transition-colors border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
              <span>Portals</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold bg-surface-container-high text-outline hover:text-error hover:bg-error/10 transition-colors border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[14px]">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            <Link
              href="/login"
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold bg-surface-container-high text-on-surface hover:bg-primary/10 hover:text-primary transition-colors border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[14px]">login</span>
              <span>Sign In</span>
            </Link>
            <Link
              href="/register"
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[14px]">person_add</span>
              <span>Sign Up</span>
            </Link>
          </div>
        )}

        {/* 24/7 Hotline Strip */}
        <div className="flex items-center justify-between text-[10px] text-outline px-1 pt-1 border-t border-outline-variant/15">
          <div className="flex items-center gap-1 text-primary">
            <span className="material-symbols-outlined text-[13px]">emergency</span>
            <span className="font-bold">24/7 Hotline: +1 (800) 555-MERRY</span>
          </div>
          <span>HIPAA</span>
        </div>
      </div>
    </aside>
  );
}
