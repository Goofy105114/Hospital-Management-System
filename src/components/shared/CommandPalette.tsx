"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Navigation" | "Patients" | "Doctors" | "Pharmacy" | "Actions";
  href: string;
  icon: string;
  badge?: string;
  action?: () => void;
}

const SEARCH_ITEMS: SearchResultItem[] = [
  // Navigation & Core Pages
  {
    id: "nav-patient-dash",
    title: "Patient Dashboard",
    subtitle: "Personal care overview, active vitals, queue tracker",
    category: "Navigation",
    href: "/",
    icon: "grid_view",
    badge: "Patient",
  },
  {
    id: "nav-doctor-workspace",
    title: "Doctor Clinical Workspace",
    subtitle: "Patient encounter queue, SOAP documentation, ICD-10",
    category: "Navigation",
    href: "/doctor",
    icon: "stethoscope",
    badge: "Doctor",
  },
  {
    id: "nav-queue-board",
    title: "OPD Queue Board",
    subtitle: "Real-time ticket display, station calling, acoustic chime",
    category: "Navigation",
    href: "/queue",
    icon: "timelapse",
  },
  {
    id: "nav-queue-tv",
    title: "Waiting Room TV Display",
    subtitle: "Full-screen ambient queue board for hospital waiting area",
    category: "Navigation",
    href: "/queue/display",
    icon: "tv",
    badge: "Kiosk/TV",
  },
  {
    id: "nav-queue-kiosk",
    title: "Self-Service Patient Kiosk",
    subtitle: "Touchscreen check-in and token ticket dispenser",
    category: "Navigation",
    href: "/queue/kiosk",
    icon: "touch_app",
    badge: "Kiosk/TV",
  },
  {
    id: "nav-patients-dir",
    title: "Patient Directory",
    subtitle: "Master patient index, demographics, clinical charts",
    category: "Navigation",
    href: "/patients",
    icon: "group",
  },
  {
    id: "nav-patient-reg",
    title: "Walk-in Patient Registration",
    subtitle: "Register intake walk-ins and generate permanent MRN",
    category: "Navigation",
    href: "/patients/register",
    icon: "person_add",
    badge: "Reception",
  },
  {
    id: "nav-appointments",
    title: "Appointments Desk",
    subtitle: "Scheduled clinic visits, provider calendar, slots",
    category: "Navigation",
    href: "/appointments",
    icon: "calendar_month",
  },
  {
    id: "nav-book-visit",
    title: "Book Clinic Visit",
    subtitle: "Schedule appointment slot with cardiologist or general doctor",
    category: "Navigation",
    href: "/appointments/book",
    icon: "add_circle",
  },
  {
    id: "nav-schedules",
    title: "Doctor Rosters & Schedules",
    subtitle: "Physician working shifts, room allocations, leave",
    category: "Navigation",
    href: "/schedules",
    icon: "schedule",
  },
  {
    id: "nav-inpatient",
    title: "Inpatient Wards & Beds",
    subtitle: "Interactive bed occupancy matrix across CCU, ICU & General",
    category: "Navigation",
    href: "/inpatient",
    icon: "hotel",
  },
  {
    id: "nav-admissions",
    title: "Admissions & Transfers",
    subtitle: "Inpatient bed assignments and ward transfer management",
    category: "Navigation",
    href: "/inpatient/admissions",
    icon: "bed",
  },
  {
    id: "nav-pharmacy",
    title: "Pharmacy Dispense Desk",
    subtitle: "Prescription dispense queue, drug-drug safety checker",
    category: "Navigation",
    href: "/pharmacy",
    icon: "medication",
    badge: "Pharmacy",
  },
  {
    id: "nav-medicines",
    title: "Drug Formulary & Catalog",
    subtitle: "Medication database, unit prices, ATC therapeutic class",
    category: "Navigation",
    href: "/pharmacy/medicines",
    icon: "vaccines",
    badge: "Pharmacy",
  },
  {
    id: "nav-inventory",
    title: "Supply Chain & Inventory Ledger",
    subtitle: "Stock levels, bin locations, automated reorder thresholds",
    category: "Navigation",
    href: "/inventory",
    icon: "inventory_2",
  },
  {
    id: "nav-purchase-orders",
    title: "Purchase Orders (PO)",
    subtitle: "Vendor orders, procurement receipts, approval workflow",
    category: "Navigation",
    href: "/inventory/purchase-orders",
    icon: "shopping_cart",
  },
  {
    id: "nav-batches",
    title: "Batch Lots & Expiry Tracking",
    subtitle: "FEFO batch dispatch, temperature-sensitive cold chain items",
    category: "Navigation",
    href: "/inventory/batches",
    icon: "event_busy",
  },
  {
    id: "nav-diagnostics",
    title: "Diagnostics & Lab Orders",
    subtitle: "Hematology, biochemistry, ECG, pathology work orders",
    category: "Navigation",
    href: "/diagnostics",
    icon: "biotech",
  },
  {
    id: "nav-diag-catalog",
    title: "Diagnostic Test Catalog",
    subtitle: "Standard diagnostic panels, specimen criteria, test pricing",
    category: "Navigation",
    href: "/diagnostics/catalog",
    icon: "format_list_bulleted",
  },
  {
    id: "nav-billing",
    title: "Cashier & Outpatient Invoicing",
    subtitle: "Itemized invoices, insurance co-pay settlement, receipts",
    category: "Navigation",
    href: "/billing",
    icon: "receipt_long",
  },
  {
    id: "nav-claims",
    title: "TPA & Insurance Claims",
    subtitle: "Claim submissions, pre-authorizations, settlement tracking",
    category: "Navigation",
    href: "/billing/claims",
    icon: "policy",
  },
  {
    id: "nav-admin",
    title: "Hospital Admin Console",
    subtitle: "Facility governance, immutable audit trail, system metrics",
    category: "Navigation",
    href: "/admin",
    icon: "shield_person",
    badge: "Admin",
  },
  {
    id: "nav-users",
    title: "Staff IAM & RBAC",
    subtitle: "User provisioning, role assignments, security policies",
    category: "Navigation",
    href: "/admin/users",
    icon: "manage_accounts",
    badge: "Admin",
  },
  {
    id: "nav-departments",
    title: "Hospital Facilities & Departments",
    subtitle: "Department hierarchy, rooms, inpatient ward configurations",
    category: "Navigation",
    href: "/admin/departments",
    icon: "domain",
  },
  {
    id: "nav-reports",
    title: "Clinical & Enterprise Reports",
    subtitle: "Financial analytics, patient outcomes, diagnostic reports",
    category: "Navigation",
    href: "/reports",
    icon: "analytics",
  },
  {
    id: "nav-openapi",
    title: "OpenAPI / Swagger API Docs",
    subtitle: "Interactive developer documentation for all HMS endpoints",
    category: "Navigation",
    href: "/api/docs",
    icon: "api",
    badge: "OpenAPI",
  },
  {
    id: "nav-notifications",
    title: "Clinical Notifications Center",
    subtitle: "Critical lab alerts, queue turn notifications, announcements",
    category: "Navigation",
    href: "/notifications",
    icon: "notifications",
  },

  // Patients (Database Records)
  {
    id: "pat-eleanor",
    title: "Eleanor Vance (Patient)",
    subtitle: "MRN: GM-84920 • DOB: 1992-08-14 • Cardiology Outpatient",
    category: "Patients",
    href: "/patients",
    icon: "person",
    badge: "MRN: GM-84920",
  },
  {
    id: "pat-robert",
    title: "Robert Chen (Patient)",
    subtitle: "MRN: GM-10492 • DOB: 1978-11-23 • Orthopedic Post-Op",
    category: "Patients",
    href: "/patients",
    icon: "person",
    badge: "MRN: GM-10492",
  },
  {
    id: "pat-sarah-p",
    title: "Sarah Jenkins (Patient)",
    subtitle: "MRN: GM-39182 • DOB: 2018-05-30 • Pediatrics",
    category: "Patients",
    href: "/patients",
    icon: "child_care",
    badge: "MRN: GM-39182",
  },
  {
    id: "pat-james",
    title: "James Wilson (Patient)",
    subtitle: "MRN: GM-99120 • DOB: 1965-02-19 • Neurology Consult",
    category: "Patients",
    href: "/patients",
    icon: "person",
    badge: "MRN: GM-99120",
  },
  {
    id: "pat-emma",
    title: "Emma Davis (Patient)",
    subtitle: "MRN: GM-23841 • DOB: 1985-09-04 • General Medicine",
    category: "Patients",
    href: "/patients",
    icon: "person",
    badge: "MRN: GM-23841",
  },

  // Doctors & Providers
  {
    id: "doc-vance",
    title: "Dr. Marcus Vance, MD, FACC",
    subtitle: "Interventional Cardiology • Clinic Room 304 • Ext: 4120",
    category: "Doctors",
    href: "/doctor",
    icon: "stethoscope",
    badge: "Cardiology Lead",
  },
  {
    id: "doc-patel",
    title: "Dr. Aisha Patel, MD",
    subtitle: "Neurology & Stroke Care • Clinic Room 202 • Ext: 4122",
    category: "Doctors",
    href: "/appointments",
    icon: "psychology",
    badge: "Neurology",
  },
  {
    id: "doc-chen",
    title: "Dr. David Chen, MD",
    subtitle: "Pediatric Medicine • Clinic Room 105 • Ext: 4118",
    category: "Doctors",
    href: "/appointments",
    icon: "medical_services",
    badge: "Pediatrics",
  },
  {
    id: "doc-rostova",
    title: "Dr. Elena Rostova, MD",
    subtitle: "Orthopedic Surgery • Clinic Room 401 • Ext: 4135",
    category: "Doctors",
    href: "/appointments",
    icon: "healing",
    badge: "Orthopedics",
  },

  // Medicines & Pharmacy
  {
    id: "med-amox",
    title: "Amoxicillin 500mg Capsule",
    subtitle: "Broad-spectrum beta-lactam antibiotic • Unit: $12.50 / Pack",
    category: "Pharmacy",
    href: "/pharmacy/medicines",
    icon: "pill",
    badge: "Antibiotic",
  },
  {
    id: "med-atorv",
    title: "Atorvastatin 20mg Tablet",
    subtitle: "HMG-CoA reductase inhibitor (Statin) • Unit: $18.00 / 30 Tab",
    category: "Pharmacy",
    href: "/pharmacy/medicines",
    icon: "pill",
    badge: "Cardiovascular",
  },
  {
    id: "med-metf",
    title: "Metformin 850mg Tablet",
    subtitle: "Biguanide antihyperglycemic agent • Unit: $8.50 / 60 Tab",
    category: "Pharmacy",
    href: "/pharmacy/medicines",
    icon: "pill",
    badge: "Diabetes",
  },
  {
    id: "med-lisin",
    title: "Lisinopril 10mg Tablet",
    subtitle: "ACE inhibitor for arterial hypertension • Unit: $9.00 / 30 Tab",
    category: "Pharmacy",
    href: "/pharmacy/medicines",
    icon: "pill",
    badge: "Antihypertensive",
  },
  {
    id: "med-para",
    title: "Paracetamol 650mg Tablet",
    subtitle: "Analgesic and antipyretic • Unit: $4.50 / 10 Tab",
    category: "Pharmacy",
    href: "/pharmacy/medicines",
    icon: "pill",
    badge: "Analgesic",
  },

  // Quick Actions
  {
    id: "act-portals",
    title: "Switch Login Portal",
    subtitle: "Open the 4-option role portal selection screen",
    category: "Actions",
    href: "/login",
    icon: "swap_horiz",
    badge: "Auth Hub",
  },
  {
    id: "act-new-appointment",
    title: "Schedule New Appointment",
    subtitle: "Book consultation slot for registered or new patient",
    category: "Actions",
    href: "/appointments/book",
    icon: "event_available",
  },
  {
    id: "act-view-openapi",
    title: "Explore OpenAPI 3.0 Specs",
    subtitle: "Review Swagger endpoints, request bodies, and auth headers",
    category: "Actions",
    href: "/api/docs",
    icon: "terminal",
  },
];

export function CommandPalette() {
  const router = useRouter();
  const { searchModalOpen, setSearchModalOpen } = useUiStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen(!searchModalOpen);
      } else if (e.key === "Escape" && searchModalOpen) {
        e.preventDefault();
        setSearchModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchModalOpen, setSearchModalOpen]);

  // Focus input when opened
  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setSearchQuery("");
    }
  }, [searchModalOpen]);

  // Filter items based on query
  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return SEARCH_ITEMS.slice(0, 12);
    }
    const q = searchQuery.toLowerCase().trim();
    return SEARCH_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.badge?.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Handle arrow key navigation
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleSelectItem(filteredItems[selectedIndex]);
    }
  };

  const handleSelectItem = (item: SearchResultItem) => {
    setSearchModalOpen(false);
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  if (!searchModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={() => setSearchModalOpen(false)}
      />

      {/* Palette Modal */}
      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/40 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 border-b border-outline-variant/30 bg-surface-container-low/50">
          <span className="material-symbols-outlined text-outline text-[22px] shrink-0">
            search
          </span>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a command, patient MRN, doctor, medicine, or page..."
            className="w-full h-14 px-3 bg-transparent text-on-surface placeholder:text-outline text-sm font-medium focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1 rounded-lg text-outline hover:text-on-surface text-xs"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
          <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded bg-surface-container-high text-outline border border-outline-variant/40">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-outline-variant/10">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-outline text-[40px] block mb-2">
                find_in_page
              </span>
              <p className="text-sm font-bold text-on-surface">No matching records found</p>
              <p className="text-xs text-outline mt-1 max-w-sm mx-auto">
                No doctor, patient, medicine, or navigation page matched &ldquo;{searchQuery}
                &rdquo;. Try another keyword or check your spelling.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left flex items-center justify-between p-3 rounded-xl transition-colors ${
                      isSelected
                        ? "bg-primary/10 border border-primary/20 text-on-surface"
                        : "hover:bg-surface-container-low text-on-surface-variant border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-primary text-white shadow-xs"
                            : "bg-surface-container text-outline"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-on-surface truncate">{item.title}</p>
                          {item.badge && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-high text-on-surface-variant border border-outline-variant/30">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-outline truncate">{item.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-outline px-2 py-0.5 rounded bg-surface-container-low">
                        {item.category}
                      </span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-primary text-[18px]">
                          keyboard_return
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-surface-container-low/40 border-t border-outline-variant/30 flex items-center justify-between text-[11px] text-outline">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/40 font-mono text-[10px]">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/40 font-mono text-[10px]">
                ↓
              </kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/40 font-mono text-[10px]">
                ↵
              </kbd>
              <span>Select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/40 font-mono text-[10px]">
                ESC
              </kbd>
              <span>Close</span>
            </span>
          </div>
          <span className="font-semibold text-primary">Going Merry Clinical Search</span>
        </div>
      </div>
    </div>
  );
}
