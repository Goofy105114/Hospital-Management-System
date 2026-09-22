"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  Stethoscope,
  Clock,
  Users,
  Calendar,
  CalendarClock,
  BedDouble,
  Bed,
  FlaskConical,
  Syringe,
  Bell,
  User,
  LayoutDashboard,
  UserPlus,
  PlusCircle,
  Tablet,
  Monitor,
  Receipt,
  ShieldAlert,
  Gauge,
  UserCog,
  Building2,
  BarChart3,
  Code2,
  Package,
  FileCheck,
  Pill,
  ShoppingCart,
  CalendarX,
  Activity,
  TestTube2,
  ListOrdered,
  CreditCard,
  Boxes,
  LayoutGrid,
  CalendarDays,
  FolderGit2,
  ReceiptText,
  Headphones,
  LogOut,
  ArrowLeftRight,
  ShieldCheck,
  LucideIcon,
} from "lucide-react";

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

const ICON_MAP: Record<string, LucideIcon> = {
  stethoscope: Stethoscope,
  timelapse: Clock,
  group: Users,
  calendar_month: Calendar,
  schedule: CalendarClock,
  hotel: BedDouble,
  bed: Bed,
  biotech: FlaskConical,
  vaccines: Syringe,
  notifications: Bell,
  person: User,
  desk: LayoutDashboard,
  person_add: UserPlus,
  add_circle: PlusCircle,
  touch_app: Tablet,
  tv: Monitor,
  receipt_long: Receipt,
  shield_person: ShieldAlert,
  speed: Gauge,
  manage_accounts: UserCog,
  domain: Building2,
  analytics: BarChart3,
  api: Code2,
  inventory_2: Package,
  policy: FileCheck,
  medication: Pill,
  shopping_cart: ShoppingCart,
  event_busy: CalendarX,
  local_hospital: Activity,
  science: TestTube2,
  format_list_bulleted: ListOrdered,
  point_of_sale: CreditCard,
  warehouse: Boxes,
  grid_view: LayoutGrid,
  calendar_today: CalendarDays,
  folder_shared: FolderGit2,
  receipt: ReceiptText,
  support_agent: Headphones,
};

function NavIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = ICON_MAP[name] || Activity;
  return <IconComponent className={className || "w-4 h-4 shrink-0"} />;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeRole, user, isAuthenticated, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUiStore();

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
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-white shadow-xs z-50 flex flex-col justify-between border-r border-slate-200/80 transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-64" : "w-[68px]"
      )}
    >
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden p-3">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2.5 group overflow-hidden transition-all",
              !sidebarOpen && "justify-center w-full"
            )}
            title="Going Merry Hospital"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 flex items-center justify-center font-bold shrink-0 group-hover:bg-teal-100 transition-colors shadow-2xs">
              <Activity className="w-5 h-5 text-teal-700" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col min-w-0 transition-opacity duration-200">
                <span className="text-sm font-bold text-slate-900 leading-tight truncate">
                  Going Merry
                </span>
                <span className="text-[10px] text-teal-700 font-semibold tracking-wide uppercase truncate mt-0.5">
                  {getRoleLabel()}
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Sections */}
        <nav className="flex flex-col gap-3">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-0.5">
              {sidebarOpen ? (
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  {section.title}
                </span>
              ) : (
                sIdx > 0 && <div className="my-1 border-t border-slate-100 mx-2" />
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = item.href === activeHref;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={!sidebarOpen ? item.label : undefined}
                      className={cn(
                        "flex items-center rounded-xl transition-all group",
                        sidebarOpen
                          ? "gap-2.5 px-2.5 py-1.5 text-xs font-medium"
                          : "justify-center w-10 h-10 mx-auto",
                        isActive
                          ? "bg-teal-50 text-teal-800 font-semibold ring-1 ring-teal-600/20 shadow-2xs"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <NavIcon
                        name={item.icon}
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive
                            ? "text-teal-700"
                            : "text-slate-400 group-hover:text-slate-700"
                        )}
                      />
                      {sidebarOpen && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User Auth & Session Footer */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 space-y-2">
        {sidebarOpen ? (
          <>
            {/* User Card */}
            <div className="bg-white rounded-xl p-2 border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 border border-teal-200/60 flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.name ? user.name.charAt(0) : "U"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                    {user?.name || "Active Session"}
                  </p>
                  <p className="text-[10px] text-teal-700 font-semibold truncate leading-tight">
                    {activeRole} {user?.mrn ? `• ${user.mrn}` : ""}
                  </p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Auth Action Buttons */}
            {isAuthenticated ? (
              <div className="grid grid-cols-2 gap-1.5">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[11px] font-medium bg-white text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition-colors border border-slate-200/80 shadow-2xs"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  <span>Portals</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[11px] font-medium bg-white text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-slate-200/80 shadow-2xs"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[11px] font-medium bg-white text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition-colors border border-slate-200/80 shadow-2xs"
                >
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[11px] font-medium bg-teal-700 text-white hover:bg-teal-800 transition-colors shadow-2xs"
                >
                  <span>Sign Up</span>
                </Link>
              </div>
            )}

            {/* 24/7 Hotline Strip */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1 border-t border-slate-200/40">
              <span className="font-semibold text-teal-700">24/7: +1 (800) 555-MERRY</span>
              <span className="flex items-center gap-0.5 text-slate-400">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                HIPAA
              </span>
            </div>
          </>
        ) : (
          /* Collapsed mini footer */
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 border border-teal-200/60 flex items-center justify-center font-bold text-xs shrink-0 cursor-default"
              title={`${user?.name || "Active Session"} (${activeRole})`}
            >
              {user?.name ? user.name.charAt(0) : "U"}
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
