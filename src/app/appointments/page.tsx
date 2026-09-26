"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import api from "@/lib/axios";
import {
  Download,
  Plus,
  Info,
  RefreshCw,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  History,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface AppointmentItem {
  id: string;
  appointmentNumber: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  doctorId: string;
  doctorName: string;
  doctorPhoto?: string | null;
  doctorSpecialization: string;
  roomNumber?: string;
  departmentName: string;
  appointmentType: string;
  slotStart: string;
  slotEnd: string;
  status: "CONFIRMED" | "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED";
  notes?: string;
  queueToken?: {
    id: string;
    tokenNumber: string;
    status: string;
    position?: number;
    estimatedWaitMinutes?: number;
  } | null;
}

export default function AppointmentsListPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/appointments");
      const list: AppointmentItem[] = res.data?.data || [];
      setAppointments(list);
    } catch (err) {
      console.error("Failed to load appointments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (id: string) => {
    try {
      await api.patch(`/appointments/${id}`, {
        action: "CANCEL",
        reason: cancelReason || "Cancelled by patient via portal",
      });
      setCancellingId(null);
      setCancelReason("");
      setActionMessage("Appointment successfully cancelled.");
      fetchAppointments();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to cancel appointment");
    }
  };

  // Filter appointments by tab, search, and department
  const now = new Date();

  const filteredByTab = useMemo(() => {
    return appointments.filter((apt) => {
      const start = new Date(apt.slotStart);
      if (activeTab === "upcoming") {
        return (
          apt.status === "CONFIRMED" ||
          apt.status === "CHECKED_IN" ||
          apt.status === "IN_PROGRESS" ||
          (start >= now && apt.status !== "CANCELLED" && apt.status !== "NO_SHOW" && apt.status !== "COMPLETED")
        );
      }
      if (activeTab === "past") {
        return (
          apt.status === "COMPLETED" ||
          (start < now && apt.status !== "CANCELLED" && apt.status !== "NO_SHOW")
        );
      }
      if (activeTab === "cancelled") {
        return apt.status === "CANCELLED" || apt.status === "NO_SHOW";
      }
      return true;
    });
  }, [appointments, activeTab, now]);

  const finalAppointments = useMemo(() => {
    return filteredByTab.filter((apt) => {
      const matchesSearch =
        !searchQuery ||
        apt.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.appointmentNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept =
        departmentFilter === "ALL" ||
        apt.departmentName.toLowerCase().includes(departmentFilter.toLowerCase());

      return matchesSearch && matchesDept;
    });
  }, [filteredByTab, searchQuery, departmentFilter]);

  const counts = useMemo(() => {
    let upcoming = 0;
    let past = 0;
    let cancelled = 0;

    appointments.forEach((apt) => {
      const start = new Date(apt.slotStart);
      if (apt.status === "CANCELLED" || apt.status === "NO_SHOW") {
        cancelled++;
      } else if (
        apt.status === "COMPLETED" ||
        start < now
      ) {
        past++;
      } else {
        upcoming++;
      }
    });

    return { upcoming, past, cancelled };
  }, [appointments, now]);

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return {
        date: d.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        time: d.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      };
    } catch {
      return { date: isoString, time: "" };
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col w-full pb-12 space-y-5 max-w-7xl mx-auto">
        {/* Breadcrumb & Header */}
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <span>Appointments</span>
            <span>/</span>
            <span className="text-teal-700 font-bold">All Visits</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                My Appointments
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Review, manage, reschedule, or cancel your clinic visits. Synchronized directly with hospital EMR.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={fetchAppointments}
                className="h-9 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 shadow-2xs flex-1 sm:flex-initial"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? "animate-spin" : ""}`} />
                <span>Sync</span>
              </button>
              <Link
                href="/appointments/book"
                className="h-9 px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs flex-1 sm:flex-initial"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book Appointment</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Action / Success Banner */}
        {actionMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Arrival Notice Banner */}
        {!noticeDismissed && (
          <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-teal-700 shrink-0" />
              <p className="text-xs text-teal-900 leading-relaxed">
                <span className="font-bold">Arrival Notice:</span> Contactless queue check-in is available 15 minutes prior to your scheduled time slot at the OPD Kiosk.
              </p>
            </div>
            <button
              onClick={() => setNoticeDismissed(true)}
              className="text-[11px] text-teal-700 hover:text-teal-900 uppercase tracking-wider font-bold shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filter Bar & Tabs */}
        <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto no-scrollbar max-w-full">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === "upcoming"
                    ? "bg-white text-teal-800 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Upcoming</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === "upcoming" ? "bg-teal-100 text-teal-800" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {counts.upcoming}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("past")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === "past"
                    ? "bg-white text-teal-800 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Past Visits</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                  {counts.past}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("cancelled")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === "cancelled"
                    ? "bg-white text-teal-800 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Cancelled</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                  {counts.cancelled}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>{appointments.length} Total Appointments</span>
            </div>
          </div>

          {/* Search & Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-8 relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by physician, department, or appointment #..."
                className="w-full h-9 pl-9 pr-3 bg-slate-50 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:border-teal-600"
              />
            </div>
            <div className="sm:col-span-4">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full h-9 px-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-200 focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                <option value="cardio">Cardiology</option>
                <option value="general">General Medicine</option>
                <option value="neuro">Neurology</option>
                <option value="ortho">Orthopedics</option>
                <option value="derm">Dermatology</option>
                <option value="pedi">Pediatrics</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointment Cards List */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            <span>Loading appointments from hospital database...</span>
          </div>
        ) : finalAppointments.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-6">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No {activeTab} appointments found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {activeTab === "upcoming"
                ? "You have no upcoming consultations scheduled. Book a new appointment to consult with a specialist."
                : `No appointments match the current ${activeTab} filter.`}
            </p>
            {activeTab === "upcoming" && (
              <Link
                href="/appointments/book"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book New Appointment</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {finalAppointments.map((apt) => {
              const { date, time } = formatDateTime(apt.slotStart);
              const isCancelling = cancellingId === apt.id;

              return (
                <div
                  key={apt.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 shadow-2xs border border-slate-200/80 relative"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          apt.status === "CONFIRMED"
                            ? "bg-teal-600"
                            : apt.status === "CHECKED_IN"
                              ? "bg-blue-600 animate-pulse"
                              : apt.status === "COMPLETED"
                                ? "bg-slate-400"
                                : "bg-rose-500"
                        }`}
                      ></span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                        {apt.status.replace("_", " ")} • {apt.appointmentType}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      Ref: <span className="text-slate-800 font-mono font-bold">{apt.appointmentNumber}</span>
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-4">
                    <div className="flex items-start gap-3.5">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        {apt.doctorPhoto ? (
                          <Image
                            src={apt.doctorPhoto}
                            alt={apt.doctorName}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined text-[28px]">person</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-800">
                          {apt.doctorName}
                        </h3>
                        <p className="text-xs text-primary font-medium mt-0.5">
                          {apt.departmentName} • {apt.doctorSpecialization}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Patient: <span className="font-semibold text-slate-700">{apt.patientName}</span> ({apt.patientMrn})
                        </p>
                      </div>
                    </div>

                    {/* Queue Token if available */}
                    {apt.queueToken && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 shrink-0 text-center w-full sm:w-auto min-w-[130px]">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">
                          Queue Token
                        </p>
                        <p className="text-lg text-primary font-bold font-mono my-0.5">
                          #{apt.queueToken.tokenNumber}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Status: <span className="font-semibold">{apt.queueToken.status}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Date, Location, Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Date &amp; Time
                        </span>
                        <p className="font-bold text-slate-800 mt-0.5">{date}</p>
                        <p className="text-slate-500">{time}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Facility &amp; Room
                        </span>
                        <p className="font-bold text-slate-800 mt-0.5">Central Hospital</p>
                        <p className="text-slate-500">{apt.roomNumber || "Outpatient Clinic"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Notes / Reason
                        </span>
                        <p className="text-slate-700 mt-0.5 line-clamp-2">
                          {apt.notes || "Standard clinical consultation"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cancel Modal / Expand */}
                  {isCancelling && (
                    <div className="mt-3 p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs space-y-2">
                      <p className="font-bold text-rose-900">Are you sure you want to cancel this appointment?</p>
                      <input
                        type="text"
                        placeholder="Reason for cancellation (optional)"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg bg-white border border-rose-300 text-slate-800"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setCancellingId(null)}
                          className="px-3 py-1 rounded-lg bg-white text-slate-600 border border-slate-200 text-xs"
                        >
                          Keep Appointment
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancel(apt.id)}
                          className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
                        >
                          Confirm Cancellation
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions footer */}
                  {!isCancelling && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        {apt.status === "CONFIRMED" && (
                          <span className="text-teal-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active in doctor schedule
                          </span>
                        )}
                        {apt.status === "CANCELLED" && (
                          <span className="text-rose-600 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Cancelled visit
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {apt.status === "CONFIRMED" && (
                          <button
                            type="button"
                            onClick={() => setCancellingId(apt.id)}
                            className="h-8 px-3 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors flex-1 sm:flex-initial"
                          >
                            Cancel Visit
                          </button>
                        )}
                        <Link
                          href={`/patient/queue`}
                          className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1 flex-1 sm:flex-initial"
                        >
                          <span>Live Queue</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
