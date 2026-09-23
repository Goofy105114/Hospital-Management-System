"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/shared/AppLayout";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/authStore";

interface Department {
  id: string;
  name: string;
  code: string;
  doctorsCount?: number;
  description?: string;
}

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  departmentId: string;
  departmentName: string;
  specialization: string;
  qualifications?: string;
  consultationFee: number;
  roomNumber?: string;
  photoUrl?: string | null;
  bio?: string;
}

interface Slot {
  start: string;
  end: string;
  available: boolean;
}

const DEPT_ICONS: Record<string, string> = {
  CARD: "favorite",
  NEUR: "psychology",
  NEURO: "psychology",
  DERM: "healing",
  ORTH: "accessible",
  ORTHO: "accessible",
  GEN: "stethoscope",
  PEDI: "child_care",
  PED: "child_care",
  ONCO: "biotech",
};

export default function BookAppointmentPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");

  // Default to today in YYYY-MM-DD
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedSuccess, setConfirmedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate 7 upcoming day chips starting from today
  const upcomingDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      return {
        iso,
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: d.getDate(),
        month: d.toLocaleDateString("en-US", { month: "short" }),
        full: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      };
    });
  }, []);

  // 1. Fetch departments
  useEffect(() => {
    let isMounted = true;
    api
      .get("/departments")
      .then((res) => {
        if (!isMounted) return;
        const list: Department[] = res.data?.data || [];
        setDepartments(list);
        if (list.length > 0 && !selectedDeptId) {
          setSelectedDeptId(list[0].id);
        }
      })
      .catch(() => {
        // Handled gracefully
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch doctors (filtered by department)
  useEffect(() => {
    let isMounted = true;
    const url = selectedDeptId ? `/doctors?departmentId=${selectedDeptId}` : "/doctors";
    api
      .get(url)
      .then((res) => {
        if (!isMounted) return;
        const list: Doctor[] = res.data?.data || [];
        setDoctors(list);
        if (list.length > 0) {
          // If previous selection isn't in current list, pick first
          if (!list.some((d) => d.id === selectedDoctorId)) {
            setSelectedDoctorId(list[0].id);
          }
        } else {
          setSelectedDoctorId("");
        }
      })
      .catch(() => {
        // Handled gracefully
      });
    return () => {
      isMounted = false;
    };
  }, [selectedDeptId]);

  // 3. Fetch availability slots when doctor and date change
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    let isMounted = true;
    setIsLoadingSlots(true);
    setSelectedSlot(null);
    setErrorMessage(null);

    api
      .get(`/appointments/availability?doctorId=${selectedDoctorId}&date=${selectedDate}`)
      .then((res) => {
        if (!isMounted) return;
        const rawSlots: Slot[] = res.data?.data?.slots || [];
        setSlots(rawSlots);
        // Auto-select first available slot if any
        const firstAvail = rawSlots.find((s) => s.available);
        if (firstAvail) {
          setSelectedSlot(firstAvail);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Availability error:", err);
        setSlots([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDoctorId, selectedDate]);

  // Split slots into morning and afternoon
  const { morningSlots, afternoonSlots } = useMemo(() => {
    const morning: Slot[] = [];
    const afternoon: Slot[] = [];

    slots.forEach((s) => {
      const hour = new Date(s.start).getHours();
      if (hour < 12) {
        morning.push(s);
      } else {
        afternoon.push(s);
      }
    });

    return { morningSlots: morning, afternoonSlots: afternoon };
  }, [slots]);

  const selectedDoctor = useMemo(() => {
    return doctors.find((d) => d.id === selectedDoctorId) || doctors[0];
  }, [doctors, selectedDoctorId]);

  const selectedDepartment = useMemo(() => {
    return departments.find((d) => d.id === selectedDeptId) || departments[0];
  }, [departments, selectedDeptId]);

  const formatSlotTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    } catch {
      return isoString;
    }
  };

  const formattedSelectedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const handleBooking = async () => {
    if (!selectedDoctorId || !selectedSlot) {
      setErrorMessage("Please select a doctor, date, and available time slot.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await api.post("/appointments", {
        doctorId: selectedDoctorId,
        slotStart: selectedSlot.start,
        slotEnd: selectedSlot.end,
        appointmentType: "NEW",
        notes: notes || "Booked via Patient Portal online scheduling.",
      });

      setConfirmedSuccess(true);
      setTimeout(() => {
        router.push("/appointments");
      }, 1600);
    } catch (err: any) {
      console.error("Booking error:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.response?.data?.code ||
        "Failed to confirm appointment. The slot may have just been booked.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col w-full pb-12 space-y-6 max-w-7xl mx-auto">
        {/* Breadcrumb & Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <Link href="/appointments" className="hover:underline">
              Appointments
            </Link>
            <span>/</span>
            <span className="text-primary font-bold">New Booking</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Book an Appointment
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Select clinical department, choose an attending physician, and schedule your visit.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm border border-slate-200 text-primary text-xs font-semibold self-start md:self-auto">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>Direct Database Integration</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
            <span className="material-symbols-outlined text-red-600 text-[22px] shrink-0 mt-0.5">
              error
            </span>
            <div className="text-sm">
              <p className="font-bold">Unable to complete appointment reservation</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {confirmedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 animate-in fade-in">
            <span className="material-symbols-outlined text-emerald-600 text-[24px]">
              check_circle
            </span>
            <div>
              <p className="font-bold">Appointment Confirmed Successfully!</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Your appointment is recorded in the database. Redirecting to your schedule...
              </p>
            </div>
          </div>
        )}

        {/* Main Grid: 8 Cols Left / 4 Cols Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Canvas */}
          <div className="lg:col-span-8 flex flex-col space-y-6">
            {/* Step 1: Select Department */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Select Department</h2>
                    <p className="text-xs text-slate-500">Choose medical specialty</p>
                  </div>
                </div>
                {selectedDepartment && (
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {selectedDepartment.name}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {departments.map((dept) => {
                  const isSelected = selectedDeptId === dept.id;
                  const icon = DEPT_ICONS[dept.code] || "local_hospital";
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => setSelectedDeptId(dept.id)}
                      className={`p-3.5 rounded-xl text-left transition-all border ${
                        isSelected
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="material-symbols-outlined text-[22px]">{icon}</span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[18px]">
                            check_circle
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold leading-snug line-clamp-1">{dept.name}</h4>
                      <p
                        className={`text-xs mt-1 ${isSelected ? "text-blue-100" : "text-slate-500"}`}
                      >
                        {dept.doctorsCount !== undefined
                          ? `${dept.doctorsCount} Doctor${dept.doctorsCount === 1 ? "" : "s"}`
                          : dept.code}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Select Specialist Doctor */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Select Physician</h2>
                    <p className="text-xs text-slate-500">
                      Physicians available in {selectedDepartment?.name || "department"}
                    </p>
                  </div>
                </div>
              </div>

              {doctors.length === 0 ? (
                <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm">
                  No active doctors found in this department.
                </div>
              ) : (
                <div className="space-y-3">
                  {doctors.map((doc) => {
                    const isSelected = selectedDoctorId === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoctorId(doc.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-50/60 border-primary shadow-sm"
                            : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                              {doc.photoUrl ? (
                                <Image
                                  src={doc.photoUrl}
                                  alt={doc.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <span className="material-symbols-outlined text-[28px]">
                                    person
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                                {isSelected && (
                                  <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[11px] font-semibold">
                                    Selected
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-primary font-medium mt-0.5">
                                {doc.specialization}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                                <span>{doc.roomNumber || "Outpatient Clinic"}</span>
                                <span>•</span>
                                <span className="font-semibold text-slate-700">
                                  ${doc.consultationFee.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center self-end sm:self-center shrink-0">
                            <span
                              className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${
                                isSelected ? "bg-primary text-white" : "bg-white text-slate-700 border"
                              }`}
                            >
                              {isSelected ? "Active Choice" : "Select Doctor"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 3: Date & Time Slot Selection */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Select Date &amp; Time</h2>
                    <p className="text-xs text-slate-500">Pick any upcoming clinic day</p>
                  </div>
                </div>

                {/* Interactive Date Picker */}
                <div className="flex items-center gap-2">
                  <label htmlFor="booking-date" className="text-xs font-semibold text-slate-600">
                    Pick Date:
                  </label>
                  <input
                    id="booking-date"
                    type="date"
                    min={todayIso}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800 bg-white"
                  />
                </div>
              </div>

              {/* 7-Day Quick Selection Chips */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-5">
                {upcomingDays.map((d) => {
                  const isSelected = selectedDate === d.iso;
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => setSelectedDate(d.iso)}
                      className={`p-2.5 rounded-xl flex flex-col items-center justify-center transition-all border ${
                        isSelected
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      <span className="text-[11px] uppercase font-semibold">{d.day}</span>
                      <span className="text-base font-bold my-0.5">{d.date}</span>
                      <span className="text-[10px] opacity-80">{d.month}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Day Status */}
              <div className="flex items-center justify-between pb-3 text-xs font-medium text-slate-600 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                  <span className="material-symbols-outlined text-primary text-[20px]">event</span>
                  <span>{formattedSelectedDate}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary"></span> Available
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-300"></span> Booked
                  </span>
                </div>
              </div>

              {/* Slots List */}
              {isLoadingSlots ? (
                <div className="py-10 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-[20px]">
                    progress_activity
                  </span>
                  <span>Loading available doctor slots...</span>
                </div>
              ) : slots.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-4">
                  <span className="material-symbols-outlined text-slate-400 text-[32px]">
                    event_busy
                  </span>
                  <p className="text-sm font-semibold text-slate-700 mt-1">
                    No clinic slots on {formattedSelectedDate}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
                    The physician holds clinic sessions on weekdays (Monday - Friday). Please select
                    an upcoming weekday.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  {morningSlots.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Morning Slots
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {morningSlots.map((s) => {
                          const isSelected = selectedSlot?.start === s.start;
                          return (
                            <button
                              key={s.start}
                              type="button"
                              disabled={!s.available}
                              onClick={() => setSelectedSlot(s)}
                              className={`h-10 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                                !s.available
                                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through"
                                  : isSelected
                                    ? "bg-primary text-white border-primary shadow-sm"
                                    : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[15px]">schedule</span>
                              <span>{formatSlotTime(s.start)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {afternoonSlots.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Afternoon Slots
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {afternoonSlots.map((s) => {
                          const isSelected = selectedSlot?.start === s.start;
                          return (
                            <button
                              key={s.start}
                              type="button"
                              disabled={!s.available}
                              onClick={() => setSelectedSlot(s)}
                              className={`h-10 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                                !s.available
                                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through"
                                  : isSelected
                                    ? "bg-primary text-white border-primary shadow-sm"
                                    : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[15px]">schedule</span>
                              <span>{formatSlotTime(s.start)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Consultation Notes */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <label
                  htmlFor="appointment-notes"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Consultation Notes / Reason for Visit (Optional)
                </label>
                <textarea
                  id="appointment-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Follow-up consultation, chest tightness check, recurring prescription review..."
                  className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Right Rail: Summary */}
          <div className="lg:col-span-4 flex flex-col space-y-4 sticky top-20">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    summarize
                  </span>
                  <h3 className="text-base font-bold text-slate-900">Appointment Summary</h3>
                </div>
              </div>

              {/* Facility */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  Facility
                </p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  Going Merry Central Hospital
                </p>
                <p className="text-slate-500 mt-0.5">
                  {selectedDoctor?.roomNumber || "Main Outpatient Clinic"}
                </p>
              </div>

              {/* Physician */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  Specialist &amp; Specialty
                </p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {selectedDoctor?.name || "Select a doctor"}
                </p>
                <p className="text-primary font-medium mt-0.5">
                  {selectedDoctor?.specialization || selectedDepartment?.name}
                </p>
              </div>

              {/* Date & Time */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  Date &amp; Time
                </p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{formattedSelectedDate}</p>
                <p className="text-slate-600 mt-0.5">
                  {selectedSlot ? `${formatSlotTime(selectedSlot.start)} (15 mins)` : "Slot not selected"}
                </p>
              </div>

              {/* Patient */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  Patient Account
                </p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {user?.name || "Authenticated Patient"}
                </p>
                <p className="text-slate-500 mt-0.5">{user?.email || "Current User"}</p>
              </div>

              {/* Fee */}
              <div className="pt-2 space-y-1.5 border-t border-slate-100 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Standard Consultation Fee</span>
                  <span className="font-semibold text-slate-900">
                    ${selectedDoctor?.consultationFee ? selectedDoctor.consultationFee.toFixed(2) : "120.00"}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Hospital Co-pay Coverage</span>
                  <span>-$100.00</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-100">
                  <span>Patient Co-Pay Due</span>
                  <span className="text-primary text-base">
                    ${Math.max(0, (selectedDoctor?.consultationFee || 120) - 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                type="button"
                disabled={isSubmitting || !selectedSlot}
                onClick={handleBooking}
                className="w-full h-11 bg-primary text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {confirmedSuccess ? "check_circle" : "event_available"}
                </span>
                <span>
                  {confirmedSuccess
                    ? "Appointment Confirmed!"
                    : isSubmitting
                      ? "Recording in Database..."
                      : "Confirm Appointment"}
                </span>
              </button>

              <div className="text-center">
                <Link
                  href="/appointments"
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Cancel / Return to Appointments
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
