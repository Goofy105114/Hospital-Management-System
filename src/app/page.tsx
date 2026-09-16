"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/axios";

export default function DashboardPage() {
  const router = useRouter();
  const { activeRole, user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [copayPaid, setCopayPaid] = useState(false);
  const [takenDoses, setTakenDoses] = useState<Record<string, boolean>>({
    "med-01": true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.replace("/login");
    } else if (activeRole === "DOCTOR") {
      router.replace("/doctor/dashboard");
    } else if (activeRole === "RECEPTIONIST") {
      router.replace("/receptionist");
    } else if (
      activeRole === "ADMIN" ||
      activeRole === "SUPER_ADMIN" ||
      activeRole === "MANAGEMENT"
    ) {
      router.replace("/admin");
    } else if (activeRole === "PHARMACIST") {
      router.replace("/pharmacist");
    } else if (activeRole === "NURSE") {
      router.replace("/nurse");
    } else if (activeRole === "LAB_TECH" || activeRole === "RADIOLOGIST") {
      router.replace("/lab");
    } else if (activeRole === "BILLING_STAFF") {
      router.replace("/billing-staff");
    } else if (activeRole === "INVENTORY_MANAGER") {
      router.replace("/inventory-manager");
    }
  }, [mounted, isAuthenticated, activeRole, router]);

  // Dynamic fetch from Database via React Query & Axios
  const {
    data: dashboard,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["patient-dashboard", user?.id],
    queryFn: async () => {
      const res = await api.get("/dashboard/patient");
      return res.data?.data;
    },
    enabled: isAuthenticated && activeRole === "PATIENT",
    staleTime: 30 * 1000,
  });

  const appt = dashboard?.upcomingAppointments?.[0];
  const queue = dashboard?.activeQueueToken;
  const vitals = dashboard?.vitalsSnapshot;
  const billing = dashboard?.billingSummary;
  const prescriptions = dashboard?.recentPrescriptions || [];

  const handleMarkDose = (id: string) => {
    setTakenDoses((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!mounted || !isAuthenticated || activeRole !== "PATIENT") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs font-semibold text-outline">Directing to authorized portal...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col w-full pb-space-12 space-y-space-6">
        {/* Staff workspace banner when non-patient is viewing */}
        {activeRole !== "PATIENT" && (
          <div className="p-space-4 rounded-2xl bg-secondary-container text-on-secondary-container border border-secondary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-space-3 shadow-xs">
            <div className="flex items-center gap-space-3">
              <span className="material-symbols-outlined text-[26px] text-secondary shrink-0">
                badge
              </span>
              <div>
                <span className="font-bold text-label-md block">
                  Active Clinical Session: {activeRole} Desk
                </span>
                <span className="text-body-sm text-on-secondary-fixed-variant">
                  You are viewing the patient-facing clinical care portal. Jump to your operational
                  console anytime.
                </span>
              </div>
            </div>
            <Link
              href={
                activeRole === "DOCTOR"
                  ? "/doctor/dashboard"
                  : activeRole === "PHARMACIST"
                    ? "/pharmacist"
                    : activeRole === "ADMIN" || activeRole === "SUPER_ADMIN"
                      ? "/admin"
                      : "/receptionist"
              }
              className="shrink-0"
            >
              <Button variant="primary" size="sm" className="font-bold gap-1.5 shadow-sm">
                <span>
                  Go to{" "}
                  {activeRole === "DOCTOR"
                    ? "Doctor Workspace"
                    : activeRole === "PHARMACIST"
                      ? "Pharmacy Queue"
                      : activeRole === "ADMIN"
                        ? "Admin Console"
                        : "Clinical Desk"}
                </span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Button>
            </Link>
          </div>
        )}

        {/* Welcome & Date Header Strip */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-4 pt-space-2">
          <div>
            <div className="flex items-center gap-space-2 mb-space-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
              <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest font-bold">
                Live Clinical Care Portal • {activeRole} View
              </span>
            </div>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-9 w-72" />
                <Skeleton className="h-4 w-96" />
              </div>
            ) : (
              <>
                <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
                  Good morning,{" "}
                  {dashboard?.patient?.name?.split(" ")[0] ||
                    user?.name?.split(" ")[0] ||
                    "Eleanor"}
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                  MRN:{" "}
                  <span className="font-mono font-bold text-primary">
                    {dashboard?.patient?.mrn || user?.mrn || "GM-84920"}
                  </span>{" "}
                  • Here is your real-time health overview and queue status.
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-space-3 self-start md:self-auto">
            <div className="flex items-center gap-space-2 px-space-3 py-space-2 rounded-lg bg-surface-container-lowest shadow-sm border border-outline-variant/30">
              <span className="material-symbols-outlined text-primary text-[20px]">
                calendar_month
              </span>
              <span className="font-label-md text-label-md text-on-surface font-semibold">
                Thursday, Oct 24, 2026
              </span>
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-space-2 px-space-3 py-space-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest transition-colors text-on-surface border border-outline-variant/20"
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
              <span className="font-label-md text-label-md">Refresh</span>
            </button>
          </div>
        </div>

        {/* Top Hero Duo: Primary Appointment & Live Queue Monitor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-6">
          {/* 1. Upcoming Appointment Card (7 cols) */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-space-6 shadow-sm flex flex-col justify-between relative overflow-hidden border border-outline-variant/30">
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-primary/10 via-transparent to-transparent pointer-events-none rounded-tr-xl"></div>
            {isLoading ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <div className="flex gap-4 items-center">
                  <Skeleton className="h-16 w-16 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between gap-space-2 pb-space-4">
                    <div className="flex items-center gap-space-2">
                      <span className="material-symbols-outlined text-primary text-[22px]">
                        event_available
                      </span>
                      <span className="font-label-md text-label-md text-outline uppercase tracking-wider font-semibold">
                        Next Confirmed Visit
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-space-3 py-1 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                      {appt?.status || "Confirmed"} • In 2 Hours
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-space-4 my-space-2">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-surface-container shrink-0 border border-outline-variant/40">
                      <Image
                        className="object-cover"
                        src={
                          appt?.doctorPhoto ||
                          "https://lh3.googleusercontent.com/aida-public/AB6AXuASMiD_yIVTlPeVGR7BMhyNEBY4UL5xU-OoFzIFeJzBj4GmKdxC0eh0O4xcyAS3CeXQ8NnQ0gvEJtDPR7t5t1JjDePFWPhcRLZp7XojtXi3GXzaHG2TEhrMGeUo60Zagx_dPuYjl9yycKazLAPMm422VDhdlpJWf5p52tJw9hokXGmV5eJKYysRs8n32VNtjWqaxUdA2CEbErmKL4Y7-Qo8a6D-QSVTBbeSyA9KcMLyiD4Dunv2el8b"
                        }
                        alt="Doctor Photo"
                        fill
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-space-2">
                        <h3 className="font-headline-md text-headline-md text-on-surface font-semibold truncate">
                          {appt?.doctorName || "Dr. Marcus Vance, MD"}
                        </h3>
                        <span
                          className="material-symbols-outlined text-primary text-[18px]"
                          title="Board Certified Cardiologist"
                        >
                          verified
                        </span>
                      </div>
                      <p className="font-label-md text-label-md text-primary font-medium">
                        {appt?.doctorSpecialization ||
                          "Department of Cardiology • Senior Specialist"}
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[16px] text-outline">
                          location_on
                        </span>
                        {appt?.roomNumber || "Consultation Room 304, East Wing (3rd Floor)"}
                      </p>
                    </div>
                  </div>

                  {/* Consultation Time Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-3 my-space-4 p-space-3 rounded-lg bg-surface-container-low border border-outline-variant/20">
                    <div className="flex items-center gap-space-3">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        schedule
                      </span>
                      <div>
                        <span className="text-[11px] text-outline uppercase font-semibold block">
                          Slot Time
                        </span>
                        <span className="font-label-md text-label-md text-on-surface font-semibold">
                          11:30 AM – 12:15 PM
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-3">
                      <span className="material-symbols-outlined text-secondary text-[20px]">
                        medical_services
                      </span>
                      <div>
                        <span className="text-[11px] text-outline uppercase font-semibold block">
                          Visit Type
                        </span>
                        <span className="font-label-md text-label-md text-on-surface font-semibold">
                          {appt?.appointmentType || "Follow-up Consultation"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-space-3 pt-space-3 border-t border-outline-variant/20">
                  <div className="flex items-center gap-space-2 text-primary font-label-md text-label-md">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span className="font-semibold">
                      {appt?.preVisitStatus || "Checked In Online"}
                    </span>
                  </div>
                  <div className="flex items-center gap-space-2 w-full sm:w-auto">
                    <Link href="/queue" className="w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="primary"
                        className="w-full font-semibold gap-1.5 shadow-xs"
                      >
                        <span>Open Live Queue Pass</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 2. Live Queue Pass Tracker (5 cols) */}
          <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-space-6 shadow-sm flex flex-col justify-between border border-outline-variant/30">
            {isLoading ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="text-center py-6 space-y-2">
                  <Skeleton className="h-12 w-32 mx-auto" />
                  <Skeleton className="h-4 w-48 mx-auto" />
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between gap-space-2 pb-space-3">
                    <div className="flex items-center gap-space-2">
                      <span className="material-symbols-outlined text-primary text-[22px]">
                        timelapse
                      </span>
                      <span className="font-label-md text-label-md text-outline uppercase tracking-wider font-semibold">
                        Live OPD Queue Pass
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                      {queue?.stationName || "Station 4 Active"}
                    </span>
                  </div>

                  {/* Token Number Hero Display */}
                  <div className="text-center py-space-3 bg-surface-container-low rounded-xl border border-outline-variant/20 my-space-2">
                    <span className="text-[11px] uppercase font-bold text-outline tracking-wider block">
                      Your Queue Token
                    </span>
                    <span className="font-mono text-[42px] font-black text-primary leading-tight block">
                      {queue?.tokenNumber || "#A-24"}
                    </span>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-on-surface">
                        Currently Serving:{" "}
                        <span className="font-mono text-primary font-bold">
                          {queue?.nowServing || "#A-21"}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Queue Details List */}
                  <div className="space-y-2 my-3 text-xs">
                    <div className="flex justify-between py-1 border-b border-outline-variant/20">
                      <span className="text-outline">Patients Ahead:</span>
                      <span className="font-bold text-on-surface">
                        {queue?.positionAhead ?? 3} Patients
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-outline-variant/20">
                      <span className="text-outline">Estimated Wait:</span>
                      <span className="font-bold text-primary">
                        ~{queue?.estimatedWaitMinutes ?? 18} Minutes
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-outline">Assigned Doctor:</span>
                      <span className="font-semibold text-on-surface">
                        {queue?.doctorName || "Dr. Marcus Vance"}
                      </span>
                    </div>
                  </div>
                </div>

                <Link href="/queue" className="w-full">
                  <Button variant="outline" size="sm" className="w-full font-semibold gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">
                      notifications_active
                    </span>
                    <span>View Turn Alert & Chime</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Intake Vitals Ribbon */}
        <div className="bg-surface-container-lowest rounded-xl p-space-5 shadow-sm border border-outline-variant/30">
          <div className="flex items-center justify-between pb-space-3 border-b border-outline-variant/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">
                monitor_heart
              </span>
              <span className="font-label-md text-label-md font-bold text-on-surface">
                Baseline Intake Vitals
              </span>
            </div>
            <span className="text-xs text-outline">
              {vitals?.recordedAt || "Recorded Today, 08:30 AM"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 bg-surface-container-low rounded-lg space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))
            ) : (
              <>
                <div className="p-3 bg-surface-container-low rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-outline block">
                    Blood Pressure
                  </span>
                  <span className="font-mono font-bold text-sm text-on-surface block mt-0.5">
                    {vitals?.bloodPressure || "118/76 mmHg"}
                  </span>
                  <span className="text-[10px] text-success font-semibold">Optimal</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-outline block">
                    Heart Rate
                  </span>
                  <span className="font-mono font-bold text-sm text-on-surface block mt-0.5">
                    {vitals?.heartRate || "72 bpm"}
                  </span>
                  <span className="text-[10px] text-success font-semibold">Resting Normal</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-outline block">
                    SpO2 Oxygen
                  </span>
                  <span className="font-mono font-bold text-sm text-on-surface block mt-0.5">
                    {vitals?.oxygenSaturation || "99%"}
                  </span>
                  <span className="text-[10px] text-success font-semibold">Normal Room Air</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-outline block">
                    Temperature
                  </span>
                  <span className="font-mono font-bold text-sm text-on-surface block mt-0.5">
                    {vitals?.temperature || "98.2°F"}
                  </span>
                  <span className="text-[10px] text-success font-semibold">Afebrile</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-lg col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-outline block">BMI</span>
                  <span className="font-mono font-bold text-sm text-on-surface block mt-0.5">
                    {vitals?.bmi || "22.4"}
                  </span>
                  <span className="text-[10px] text-success font-semibold">Healthy Range</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Lower Grid: Daily Medication Adherence & Invoices / Copay */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-6">
          {/* Daily Medication Tracker (7 cols) */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-space-6 shadow-sm border border-outline-variant/30 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Daily Medication Adherence
                </h3>
                <p className="text-xs text-outline">
                  Active outpatient prescriptions &amp; dosing checklist
                </p>
              </div>
              <Link
                href="/prescriptions"
                className="text-xs font-semibold text-primary hover:underline"
              >
                View All Prescriptions
              </Link>
            </div>

            <div className="space-y-2">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-3 bg-surface-container-low rounded-lg space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-60" />
                    </div>
                  ))
                : prescriptions.map((med: any) => (
                    <div
                      key={med.id}
                      className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-[22px]">
                          medication
                        </span>
                        <div>
                          <span className="font-bold text-xs text-on-surface block">
                            {med.name}
                          </span>
                          <span className="text-[11px] text-outline block">
                            {med.dosage} • {med.sig}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={takenDoses[med.id] ? "secondary" : "outline"}
                        onClick={() => handleMarkDose(med.id)}
                        className="text-xs h-7 px-3 gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {takenDoses[med.id] ? "check" : "radio_button_unchecked"}
                        </span>
                        <span>{takenDoses[med.id] ? "Taken" : "Mark Taken"}</span>
                      </Button>
                    </div>
                  ))}
            </div>
          </div>

          {/* Outstanding Billing & Insurance Co-Pay (5 cols) */}
          <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-space-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    receipt_long
                  </span>
                  <span className="font-label-md text-label-md font-bold text-on-surface">
                    Co-Pay Responsibility
                  </span>
                </div>
                <span className="font-mono text-xs font-semibold text-outline">
                  {billing?.latestInvoiceNumber || "INV-20241024-0032"}
                </span>
              </div>

              {isLoading ? (
                <div className="py-6 space-y-3">
                  <Skeleton className="h-8 w-24 mx-auto" />
                  <Skeleton className="h-4 w-40 mx-auto" />
                </div>
              ) : (
                <div className="py-4 text-center">
                  <span className="text-xs text-outline uppercase font-semibold tracking-wider block">
                    Outstanding Balance Due
                  </span>
                  <span className="font-mono text-3xl font-black text-on-surface block mt-1">
                    ${copayPaid ? "0.00" : Number(billing?.totalOwing ?? 20.0).toFixed(2)}
                  </span>
                  <p className="text-[11px] text-success font-semibold mt-1">
                    Insurance Covered: ${Number(billing?.insuranceCovered ?? 100.0).toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                disabled={copayPaid || isLoading}
                onClick={() => setCopayPaid(true)}
                className="w-full font-bold gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">credit_card</span>
                <span>
                  {copayPaid
                    ? "Settled Successfully"
                    : `Pay Co-Pay ($${Number(billing?.totalOwing ?? 20.0).toFixed(2)})`}
                </span>
              </Button>
              <Link
                href="/billing"
                className="block text-center text-xs text-primary font-semibold hover:underline"
              >
                View Full Itemized Billing Statements
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
