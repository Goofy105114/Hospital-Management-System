"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/shared/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import api from "@/lib/axios";

interface AppointmentDetail {
  id: string;
  appointmentNumber: string;
  type: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string;
  endTime: string;
  durationMinutes: number;
  reason: string;
  notes: string;
  patient: {
    id: string;
    mrn: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    bloodGroup: string;
  };
  doctor: {
    id: string;
    name: string;
    specialty: string;
    qualification: string;
    roomNumber: string;
    department: {
      name: string;
      floor: string;
    };
  };
  queueToken?: {
    id: string;
    tokenNumber: string;
    status: string;
    position: number;
    estimatedWaitMinutes: number;
    currentServing: string;
  };
  vitals?: {
    bloodPressure: string;
    heartRate: string;
    oxygenSaturation: string;
    temperature: string;
    weightKg: string;
    bmi: string;
  };
  timeline?: Array<{
    title: string;
    timestamp: string;
    status: "COMPLETED" | "ACTIVE" | "PENDING" | "UPCOMING";
    description: string;
  }>;
  facility?: {
    name: string;
    building: string;
    floor: string;
    room: string;
    station: string;
    directions: string;
    parking: string;
  };
}

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = (params?.id as string) || "APT-2026-0042";

  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadAppointment() {
      try {
        setLoading(true);
        const res = await api.get(`/appointments/${appointmentId}`);
        if (res.data?.success && res.data.data) {
          setAppointment(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load appointment details", err);
      } finally {
        setLoading(false);
      }
    }
    loadAppointment();
  }, [appointmentId]);

  const handleCancelAppointment = async () => {
    try {
      await api.patch(`/appointments/${appointmentId}`, {
        action: "CANCEL",
        reason: "Patient requested cancellation via portal",
      });
      setActionSuccess("Appointment cancelled successfully.");
      setCancelModalOpen(false);
      if (appointment) {
        setAppointment({ ...appointment, status: "CANCELLED" });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to cancel appointment");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-space-3">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">
              progress_activity
            </span>
            <p className="font-label-lg text-outline">Loading clinical appointment record...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const appt = appointment;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-space-6 pb-space-12">
        {/* Top Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div className="flex items-center gap-space-2 text-sm text-outline">
            <Link
              href="/appointments"
              className="hover:text-primary transition-colors flex items-center gap-1 font-label-md"
            >
              <span className="material-symbols-outlined text-base">calendar_today</span>
              Appointments
            </Link>
            <span className="material-symbols-outlined text-sm text-outline/50">chevron_right</span>
            <span className="font-mono font-semibold text-on-surface">
              {appt?.appointmentNumber || appointmentId}
            </span>
            <span className="material-symbols-outlined text-sm text-outline/50">chevron_right</span>
            <span className="text-primary font-semibold font-label-md">Details</span>
          </div>

          <div className="flex items-center gap-space-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-space-1 border-outline-variant/50 text-on-surface-variant hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              Print Summary
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/appointments/book")}
              className="gap-space-1 border-outline-variant/50 text-on-surface hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-sm">edit_calendar</span>
              Reschedule
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(true)}
              className="gap-space-1 border-error/30 text-error hover:bg-error/10"
              disabled={appt?.status === "CANCELLED"}
            >
              <span className="material-symbols-outlined text-sm">cancel</span>
              Cancel
            </Button>
          </div>
        </div>

        {actionSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-space-4 py-space-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-space-2">
              <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              <span className="font-body-md font-medium">{actionSuccess}</span>
            </div>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Header Title & Status */}
        <div className="flex flex-wrap items-center justify-between gap-space-4">
          <div>
            <div className="flex items-center gap-space-3">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                {appt?.reason || "Cardiovascular Consultation"}
              </h1>
              <Badge
                variant={
                  appt?.status === "CONFIRMED"
                    ? "success"
                    : appt?.status === "CANCELLED"
                      ? "error"
                      : "secondary"
                }
                className="text-xs px-space-2 py-0.5"
              >
                {appt?.status || "CONFIRMED"}
              </Badge>
            </div>
            <p className="font-body-md text-on-surface-variant mt-1 flex items-center gap-space-2">
              <span className="material-symbols-outlined text-base text-primary">schedule</span>
              {appt?.scheduledDate} • {appt?.scheduledTime} - {appt?.endTime || "11:00 AM"} (
              {appt?.durationMinutes || 30} mins)
            </p>
          </div>

          <div className="text-right">
            <span className="font-label-sm text-outline block">Patient MRN</span>
            <span className="font-mono font-bold text-on-surface text-base">
              {appt?.patient.mrn || "MRN-2026-001842"}
            </span>
            <span className="text-xs text-outline block">
              {appt?.patient.firstName} {appt?.patient.lastName} (Blood Group:{" "}
              {appt?.patient.bloodGroup?.replace("_", "+") || "A+"})
            </span>
          </div>
        </div>

        {/* Figma Screen 4 Hero: Live Outpatient Queue Active Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#004d40] via-[#00685f] to-[#003830] text-white p-space-6 shadow-lg border border-teal-700/40">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-6">
            <div className="space-y-space-4">
              <div className="flex items-center gap-space-3">
                <span className="inline-flex items-center gap-space-2 px-space-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live Outpatient Queue Active
                </span>
                <span className="text-xs text-teal-200/80 font-mono">
                  Synced: Station 402B • Just now
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-space-8">
                <div>
                  <span className="text-xs uppercase tracking-wider text-teal-200 font-semibold block">
                    Your Queue Token
                  </span>
                  <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-white mt-1">
                    {appt?.queueToken?.tokenNumber || "#A-24"}
                  </div>
                </div>

                <div className="border-l border-teal-600/40 pl-space-6">
                  <span className="text-xs uppercase tracking-wider text-teal-200 font-semibold block">
                    Estimated Wait
                  </span>
                  <div className="text-3xl font-bold font-mono text-emerald-300 mt-1">
                    ~{appt?.queueToken?.estimatedWaitMinutes || 12} Mins
                  </div>
                </div>

                <div className="border-l border-teal-600/40 pl-space-6">
                  <span className="text-xs uppercase tracking-wider text-teal-200 font-semibold block">
                    Ahead in Queue
                  </span>
                  <div className="text-2xl font-bold font-mono text-white mt-1">
                    {appt?.queueToken?.position || 3} Patients
                  </div>
                </div>

                <div className="border-l border-teal-600/40 pl-space-6">
                  <span className="text-xs uppercase tracking-wider text-teal-200 font-semibold block">
                    Consultation Room
                  </span>
                  <div className="text-xl font-bold text-teal-100 mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-lg text-emerald-300">
                      meeting_room
                    </span>
                    {appt?.doctor.roomNumber || "Room 402B"}
                  </div>
                </div>
              </div>

              {/* Sub-status: Now Serving */}
              <div className="pt-space-2 flex items-center gap-space-3 text-sm text-teal-100/90">
                <span className="material-symbols-outlined text-base text-amber-300">sensors</span>
                <span>
                  Currently in Consultation:{" "}
                  <strong className="text-amber-200 font-mono font-bold">
                    {appt?.queueToken?.currentServing || "#A-21"}
                  </strong>{" "}
                  with Dr. Marcus Vance
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-space-3 shrink-0">
              <Link href="/queue">
                <Button className="w-full bg-white text-primary hover:bg-teal-50 font-bold shadow-md gap-space-2">
                  <span className="material-symbols-outlined text-base">tv</span>
                  Open Live Queue Board
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full border-teal-300/40 text-white hover:bg-teal-700/50 gap-space-2"
                onClick={() => {
                  if (appt?.queueToken) {
                    setAppointment({
                      ...appt,
                      queueToken: {
                        ...appt.queueToken,
                        estimatedWaitMinutes: Math.max(2, appt.queueToken.estimatedWaitMinutes - 1),
                      },
                    });
                  }
                }}
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                Refresh Status
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-6">
          {/* Left Column (2 Cols wide) */}
          <div className="lg:col-span-2 space-y-space-6">
            {/* Consultation Overview Card */}
            <Card className="border border-outline-variant/30 shadow-xs">
              <CardHeader className="pb-space-3 border-b border-outline-variant/20">
                <CardTitle className="font-title-md text-title-md text-on-surface flex items-center gap-space-2">
                  <span className="material-symbols-outlined text-primary">clinical_notes</span>
                  Consultation Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-space-4 space-y-space-4">
                {/* Doctor Bio Snippet */}
                <div className="flex items-start gap-space-4 p-space-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0">
                    <span className="material-symbols-outlined text-3xl">account_circle</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-title-md font-bold text-on-surface">
                      {appt?.doctor.name || "Dr. Marcus Vance"}
                    </h3>
                    <p className="font-label-md text-primary font-semibold">
                      {appt?.doctor.qualification || "MD, FACC - Chief of Cardiology"}
                    </p>
                    <p className="font-body-sm text-outline mt-0.5">
                      {appt?.doctor.department.name} • {appt?.doctor.department.floor}
                    </p>
                  </div>
                  <Link href="/doctor">
                    <Button variant="outline" size="sm" className="gap-1 text-xs">
                      <span className="material-symbols-outlined text-sm">stethoscope</span>
                      Doctor Profile
                    </Button>
                  </Link>
                </div>

                {/* Reason & Intake Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
                  <div className="p-space-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20">
                    <span className="font-label-sm text-outline uppercase tracking-wider block font-semibold">
                      Primary Service
                    </span>
                    <p className="font-body-md font-medium text-on-surface mt-1">
                      {appt?.reason || "Comprehensive Cardiovascular Review"}
                    </p>
                  </div>
                  <div className="p-space-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20">
                    <span className="font-label-sm text-outline uppercase tracking-wider block font-semibold">
                      Encounter Mode
                    </span>
                    <p className="font-body-md font-medium text-on-surface mt-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-primary">
                        apartment
                      </span>
                      In-Person Hospital Outpatient (OPD)
                    </p>
                  </div>
                </div>

                <div className="p-space-4 rounded-lg bg-surface-container-lowest border border-outline-variant/20">
                  <span className="font-label-sm text-outline uppercase tracking-wider block font-semibold">
                    Clinical Intake Notes & Symptoms
                  </span>
                  <p className="font-body-md text-on-surface-variant mt-1 leading-relaxed">
                    {appt?.notes ||
                      "Patient reports mild palpitations post-exertion over the last 14 days. Current medications: Lisinopril 10mg, Metoprolol 25mg."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Intake Baseline Vitals Ribbon */}
            <Card className="border border-outline-variant/30 shadow-xs">
              <CardHeader className="pb-space-3 border-b border-outline-variant/20 flex flex-row items-center justify-between">
                <CardTitle className="font-title-md text-title-md text-on-surface flex items-center gap-space-2">
                  <span className="material-symbols-outlined text-primary">monitor_heart</span>
                  Intake Baseline Vitals
                </CardTitle>
                <Badge variant="outline" className="text-xs text-outline font-mono">
                  Recorded at Triage • 10:18 AM
                </Badge>
              </CardHeader>
              <CardContent className="pt-space-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-space-3">
                  <div className="p-space-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-center">
                    <span className="font-label-sm text-outline block">Blood Pressure</span>
                    <span className="font-mono font-bold text-on-surface text-lg block mt-1">
                      {appt?.vitals?.bloodPressure || "128/82"}
                    </span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
                      Normal
                    </span>
                  </div>

                  <div className="p-space-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-center">
                    <span className="font-label-sm text-outline block">Heart Rate</span>
                    <span className="font-mono font-bold text-on-surface text-lg block mt-1">
                      {appt?.vitals?.heartRate || "72 bpm"}
                    </span>
                    <span className="text-[10px] text-outline font-medium">Resting</span>
                  </div>

                  <div className="p-space-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-center">
                    <span className="font-label-sm text-outline block">SpO2 Oxygen</span>
                    <span className="font-mono font-bold text-on-surface text-lg block mt-1">
                      {appt?.vitals?.oxygenSaturation || "98%"}
                    </span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
                      Room Air
                    </span>
                  </div>

                  <div className="p-space-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-center">
                    <span className="font-label-sm text-outline block">Body Temp</span>
                    <span className="font-mono font-bold text-on-surface text-lg block mt-1">
                      {appt?.vitals?.temperature || "98.4 °F"}
                    </span>
                    <span className="text-[10px] text-outline font-medium">Oral</span>
                  </div>

                  <div className="p-space-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-center col-span-2 sm:col-span-1">
                    <span className="font-label-sm text-outline block">Weight / BMI</span>
                    <span className="font-mono font-bold text-on-surface text-lg block mt-1">
                      {appt?.vitals?.weightKg || "74.2 kg"}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      BMI {appt?.vitals?.bmi || "23.8"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 6-Step Appointment Journey & Milestones */}
            <Card className="border border-outline-variant/30 shadow-xs">
              <CardHeader className="pb-space-3 border-b border-outline-variant/20">
                <CardTitle className="font-title-md text-title-md text-on-surface flex items-center gap-space-2">
                  <span className="material-symbols-outlined text-primary">route</span>
                  Appointment Journey & Milestones
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-space-6">
                <div className="relative pl-6 sm:pl-8 space-y-space-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/40">
                  {appt?.timeline?.map((step, idx) => {
                    const isCompleted = step.status === "COMPLETED";
                    const isActive = step.status === "ACTIVE";
                    const isPending = step.status === "PENDING";

                    return (
                      <div key={idx} className="relative group">
                        {/* Dot indicator */}
                        <div
                          className={`absolute -left-[1.65rem] sm:-left-[2.15rem] top-0.5 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            isCompleted
                              ? "bg-primary text-white"
                              : isActive
                                ? "bg-emerald-500 text-white ring-4 ring-emerald-100 animate-pulse"
                                : "bg-surface-container-high text-outline border border-outline-variant"
                          }`}
                        >
                          {isCompleted ? (
                            <span className="material-symbols-outlined text-sm">check</span>
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4
                            className={`font-title-sm font-semibold ${
                              isActive
                                ? "text-emerald-700 font-bold"
                                : isCompleted
                                  ? "text-on-surface"
                                  : "text-outline"
                            }`}
                          >
                            {step.title}
                          </h4>
                          <span className="font-mono text-xs text-outline">{step.timestamp}</span>
                        </div>
                        <p className="font-body-sm text-on-surface-variant mt-0.5">
                          {step.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (1 Col wide) */}
          <div className="space-y-space-6">
            {/* Facility & Location Card */}
            <Card className="border border-outline-variant/30 shadow-xs">
              <CardHeader className="pb-space-3 border-b border-outline-variant/20">
                <CardTitle className="font-title-md text-title-md text-on-surface flex items-center gap-space-2">
                  <span className="material-symbols-outlined text-primary">location_on</span>
                  Facility & Location
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-space-4 space-y-space-4">
                <div className="space-y-1">
                  <h4 className="font-title-sm font-bold text-on-surface">
                    {appt?.facility?.building || "West Wing Medical Pavilion"}
                  </h4>
                  <p className="font-body-sm text-primary font-semibold">
                    {appt?.facility?.floor || "Level 4, Suite 400"} •{" "}
                    {appt?.facility?.room || "Room 402B"}
                  </p>
                  <p className="font-body-sm text-outline">
                    Check-in Station: {appt?.facility?.station || "Station C"}
                  </p>
                </div>

                <div className="p-space-3 rounded-lg bg-surface-container-low border border-outline-variant/20 text-sm text-on-surface-variant flex items-start gap-space-2">
                  <span className="material-symbols-outlined text-primary text-lg shrink-0 mt-0.5">
                    directions_walk
                  </span>
                  <p className="leading-snug">
                    {appt?.facility?.directions ||
                      "Take North elevators to Level 4, turn right past Cardiology Reception."}
                  </p>
                </div>

                <div className="p-space-3 rounded-lg bg-surface-container-lowest border border-outline-variant/30">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-outline font-semibold">
                      Parking Voucher
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      Validated
                    </Badge>
                  </div>
                  <p className="font-body-sm text-on-surface font-medium mt-1">
                    {appt?.facility?.parking || "Parking Garage 2 (Level B)"}
                  </p>
                  <p className="font-mono text-xs text-outline mt-1 tracking-wider">
                    SCAN: VCH-2026-9921
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card className="border border-outline-variant/30 shadow-xs">
              <CardHeader className="pb-space-3 border-b border-outline-variant/20">
                <CardTitle className="font-title-md text-title-md text-on-surface flex items-center gap-space-2">
                  <span className="material-symbols-outlined text-primary">
                    notifications_active
                  </span>
                  Alert Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-space-4 space-y-space-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-label-md font-medium text-on-surface block">
                      SMS Live Queue Updates
                    </span>
                    <span className="text-xs text-outline block">Alert 2 tokens ahead</span>
                  </div>
                  <button
                    onClick={() => setSmsAlerts(!smsAlerts)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      smsAlerts ? "bg-primary" : "bg-surface-container-high"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        smsAlerts ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-outline-variant/20 pt-space-3">
                  <div className="space-y-0.5">
                    <span className="font-label-md font-medium text-on-surface block">
                      Email Clinical Summary
                    </span>
                    <span className="text-xs text-outline block">Dispatched post-visit</span>
                  </div>
                  <button
                    onClick={() => setEmailAlerts(!emailAlerts)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      emailAlerts ? "bg-primary" : "bg-surface-container-high"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        emailAlerts ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-outline-variant/20 pt-space-3">
                  <div className="space-y-0.5">
                    <span className="font-label-md font-medium text-on-surface block">
                      Push Notifications
                    </span>
                    <span className="text-xs text-outline block">Browser & mobile ping</span>
                  </div>
                  <button
                    onClick={() => setPushAlerts(!pushAlerts)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      pushAlerts ? "bg-primary" : "bg-surface-container-high"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        pushAlerts ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Clinical Notice & Emergency Warning */}
            <div className="rounded-2xl p-space-4 bg-amber-500/10 border border-amber-500/30 text-amber-950 space-y-space-2">
              <div className="flex items-center gap-space-2 font-title-sm font-bold text-amber-900">
                <span className="material-symbols-outlined text-amber-700">warning</span>
                Clinical Notice
              </div>
              <p className="font-body-sm text-amber-900/85 leading-relaxed">
                Fast for 4 hours prior if additional lipid panel is ordered. Bring previous ECG
                reports and current medication bottles.
              </p>
              <div className="pt-space-2 border-t border-amber-500/20 text-xs text-amber-900 font-medium">
                Emergency? If experiencing acute chest pain or severe shortness of breath, call{" "}
                <strong className="underline text-error">911</strong> or proceed directly to the ER.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-6 shadow-xl border border-outline-variant/30 space-y-space-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-space-3 text-error">
              <span className="material-symbols-outlined text-3xl">cancel</span>
              <h3 className="font-title-lg font-bold text-on-surface">Cancel Appointment</h3>
            </div>
            <p className="font-body-md text-on-surface-variant">
              Are you sure you wish to cancel this appointment with Dr. Marcus Vance on{" "}
              {appt?.scheduledDate}? This will release token{" "}
              <strong className="font-mono">{appt?.queueToken?.tokenNumber || "#A-24"}</strong> back
              to the clinic queue.
            </p>
            <div className="flex items-center justify-end gap-space-3 pt-space-2">
              <Button
                variant="outline"
                onClick={() => setCancelModalOpen(false)}
                className="font-medium"
              >
                Keep Appointment
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelAppointment}
                className="bg-error text-white hover:bg-error/90 font-medium"
              >
                Yes, Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
