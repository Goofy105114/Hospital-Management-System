"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/axios";

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Doctor {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  roomNumber: string;
}

export default function QueueKioskPage() {
  const [lookupType, setLookupType] = useState<"appointment" | "walkin">("appointment");
  const [searchQuery, setSearchQuery] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [walkinName, setWalkinName] = useState("");
  const [walkinUrgency, setWalkinUrgency] = useState<"NORMAL" | "PRIORITY" | "EMERGENCY">("NORMAL");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generated Slip State
  const [generatedSlip, setGeneratedSlip] = useState<{
    tokenNumber: string;
    patientName: string;
    doctorName: string;
    roomNumber: string;
    estimatedWaitMinutes: number;
    checkInTime: string;
    priorityTier: string;
    source: string;
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [deptRes, docRes] = await Promise.all([
          api.get("/departments"),
          api.get("/doctors"),
        ]);
        if (deptRes.data?.success && Array.isArray(deptRes.data.data)) {
          setDepartments(deptRes.data.data);
          if (deptRes.data.data.length > 0) {
            setSelectedDeptId(deptRes.data.data[0].id);
          }
        }
        if (docRes.data?.success && Array.isArray(docRes.data.data)) {
          setDoctors(docRes.data.data);
          if (docRes.data.data.length > 0) {
            setSelectedDoctorId(docRes.data.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load departments or doctors", err);
      }
    }
    loadData();
  }, []);

  // Update selected doctor when department changes
  useEffect(() => {
    if (!selectedDeptId) return;
    const deptDoctors = doctors.filter((d) => d.departmentId === selectedDeptId);
    if (deptDoctors.length > 0) {
      setSelectedDoctorId(deptDoctors[0].id);
    }
  }, [selectedDeptId, doctors]);

  const handleAppointmentCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await api.post("/queue/check-in", {
        appointmentId: searchQuery.trim(),
        allowOverride: true,
      });

      if (res.data?.success && res.data.data) {
        const token = res.data.data;
        setGeneratedSlip({
          tokenNumber: token.tokenNumber,
          patientName: token.patient?.user?.name || "Patient",
          doctorName: token.doctor?.user?.name || "Attending Physician",
          roomNumber: token.doctor?.roomNumber || "OPD Suite",
          estimatedWaitMinutes: token.estimatedWaitMinutes || 15,
          checkInTime: new Date(token.checkedInAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          priorityTier: token.priorityTier || "NORMAL",
          source: token.source || "APPOINTMENT",
        });
      } else {
        setErrorMessage("Check-in failed. Please verify your appointment number or MRN.");
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "No matching appointment found or already checked in. Please see reception.";
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWalkinCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Find or create patient for walk-in
      let patientId: string | undefined;

      try {
        const patientsRes = await api.get("/patients?query=walk-in");
        if (patientsRes.data?.data && patientsRes.data.data.length > 0) {
          patientId = patientsRes.data.data[0].id;
        }
      } catch {
        // Fallback to new patient
      }

      if (!patientId) {
        const newPatientRes = await api.post("/patients", {
          name: walkinName.trim() || "Walk-in Patient",
          gender: "OTHER",
          phone: "+1-555-0100",
          email: `walkin.${Date.now()}@goingmerry.org`,
        });
        if (newPatientRes.data?.data?.id) {
          patientId = newPatientRes.data.data.id;
        }
      }

      // Resolve a doctor
      const targetDoctorId =
        selectedDoctorId || (doctors.length > 0 ? doctors[0].id : undefined);

      if (!targetDoctorId || !patientId) {
        setErrorMessage("Could not assign a physician. Please see OPD Counter #1.");
        setIsProcessing(false);
        return;
      }

      const res = await api.post("/queue/check-in", {
        doctorId: targetDoctorId,
        patientId,
        isWalkIn: true,
        priorityTier: walkinUrgency,
        allowOverride: true,
      });

      if (res.data?.success && res.data.data) {
        const token = res.data.data;
        setGeneratedSlip({
          tokenNumber: token.tokenNumber,
          patientName: token.patient?.user?.name || walkinName || "Walk-in Patient",
          doctorName: token.doctor?.user?.name || "Attending Physician",
          roomNumber: token.doctor?.roomNumber || "OPD Suite",
          estimatedWaitMinutes: token.estimatedWaitMinutes || 20,
          checkInTime: new Date(token.checkedInAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          priorityTier: walkinUrgency,
          source: "WALK_IN",
        });
      } else {
        setErrorMessage("Failed to issue queue token. Please contact the front desk.");
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error?.message ||
          "Could not generate walk-in token. Please see reception."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setGeneratedSlip(null);
    setSearchQuery("");
    setWalkinName("");
    setErrorMessage(null);
  };

  const availableDoctors = selectedDeptId
    ? doctors.filter((d) => d.departmentId === selectedDeptId)
    : doctors;

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col justify-between p-space-6 sm:p-space-12 select-none">
      {/* Kiosk Header */}
      <header className="flex items-center justify-between border-b border-outline-variant/30 pb-space-6">
        <div className="flex items-center gap-space-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-headline-sm">
            <span className="material-symbols-outlined text-[36px]">local_hospital</span>
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg font-extrabold text-primary tracking-tight">
              Going Merry Hospital
            </h1>
            <span className="font-title-sm text-outline font-semibold uppercase tracking-widest text-label-sm">
              Self-Service Check-In Kiosk
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-3">
          <Link href="/queue">
            <Button variant="outline" size="sm" className="gap-space-1">
              <span className="material-symbols-outlined text-[18px]">view_kanban</span>
              Staff Board
            </Button>
          </Link>
          <Link href="/queue/display">
            <Button variant="secondary" size="sm" className="gap-space-1">
              <span className="material-symbols-outlined text-[18px]">tv</span>
              Live TV Board
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center py-space-8">
        {!generatedSlip ? (
          <div className="w-full max-w-2xl space-y-space-8">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-space-4 p-space-2 bg-surface-container rounded-2xl border border-outline-variant/30">
              <button
                type="button"
                onClick={() => {
                  setLookupType("appointment");
                  setErrorMessage(null);
                }}
                className={`py-space-4 px-space-6 rounded-xl font-headline-sm font-bold transition-all flex items-center justify-center gap-space-3 ${
                  lookupType === "appointment"
                    ? "bg-primary text-on-primary shadow-lg scale-[1.01]"
                    : "text-outline hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-[28px]">event_available</span>
                I Have an Appointment
              </button>
              <button
                type="button"
                onClick={() => {
                  setLookupType("walkin");
                  setErrorMessage(null);
                }}
                className={`py-space-4 px-space-6 rounded-xl font-headline-sm font-bold transition-all flex items-center justify-center gap-space-3 ${
                  lookupType === "walkin"
                    ? "bg-primary text-on-primary shadow-lg scale-[1.01]"
                    : "text-outline hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-[28px]">person_add</span>
                Walk-in Triage
              </button>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="p-space-4 rounded-2xl bg-error/10 border border-error/30 text-error flex items-center gap-3">
                <span className="material-symbols-outlined text-[24px]">error</span>
                <span className="font-semibold text-body-md flex-1">{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="hover:opacity-75"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}

            {/* FORM A: Appointment Lookup */}
            {lookupType === "appointment" && (
              <form onSubmit={handleAppointmentCheckIn} className="space-y-space-6">
                <div className="p-space-8 bg-surface-container-lowest rounded-3xl border-2 border-outline-variant/40 shadow-xl space-y-space-6">
                  <div className="text-center space-y-space-2">
                    <h2 className="font-headline-md font-extrabold text-on-surface">
                      Welcome! Please Check In
                    </h2>
                    <p className="text-body-lg text-outline">
                      Enter your Appointment Number (e.g. APT-2026...), Patient MRN, or ID.
                    </p>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      autoFocus
                      required
                      placeholder="e.g. APT-2026... or MRN-2026..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-center text-headline-sm font-semibold tracking-wide py-space-5 px-space-6 bg-surface-container rounded-2xl border-2 border-outline-variant/50 focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isProcessing || !searchQuery.trim()}
                    className="w-full py-space-6 text-headline-sm font-bold rounded-2xl shadow-xl gap-space-3"
                  >
                    {isProcessing ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[28px]">
                          progress_activity
                        </span>
                        Validating Appointment...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[28px]">how_to_reg</span>
                        Check In &amp; Print Token
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* FORM B: Walk-in Check-in */}
            {lookupType === "walkin" && (
              <form onSubmit={handleWalkinCheckIn} className="space-y-space-6">
                <div className="p-space-8 bg-surface-container-lowest rounded-3xl border-2 border-outline-variant/40 shadow-xl space-y-space-6">
                  <div className="text-center space-y-space-2">
                    <h2 className="font-headline-md font-extrabold text-on-surface">
                      Walk-in Outpatient Arrival
                    </h2>
                    <p className="text-body-lg text-outline">
                      Select your target clinical service and urgency level to join the live queue.
                    </p>
                  </div>

                  <div className="space-y-space-4">
                    <div>
                      <label className="block text-title-sm font-bold text-on-surface mb-space-2">
                        Patient Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={walkinName}
                        onChange={(e) => setWalkinName(e.target.value)}
                        className="w-full py-space-3 px-space-4 bg-surface-container rounded-xl border border-outline-variant/50 text-body-md font-semibold focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-title-sm font-bold text-on-surface mb-space-2">
                        Target Department / Clinic
                      </label>
                      <select
                        value={selectedDeptId}
                        onChange={(e) => setSelectedDeptId(e.target.value)}
                        className="w-full py-space-3 px-space-4 bg-surface-container rounded-xl border border-outline-variant/50 text-title-md font-semibold focus:border-primary focus:outline-none"
                      >
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-title-sm font-bold text-on-surface mb-space-2">
                        Assigned Physician
                      </label>
                      <select
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        className="w-full py-space-3 px-space-4 bg-surface-container rounded-xl border border-outline-variant/50 text-body-md font-semibold focus:border-primary focus:outline-none"
                      >
                        {availableDoctors.length > 0 ? (
                          availableDoctors.map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.name} • {doc.roomNumber || "OPD"}
                            </option>
                          ))
                        ) : (
                          <option value="">Any Available Physician</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-title-sm font-bold text-on-surface mb-space-2">
                        Urgency / Triage Category
                      </label>
                      <div className="grid grid-cols-3 gap-space-3">
                        <button
                          type="button"
                          onClick={() => setWalkinUrgency("NORMAL")}
                          className={`py-space-3 rounded-xl border-2 font-bold transition-all ${
                            walkinUrgency === "NORMAL"
                              ? "bg-primary/10 border-primary text-primary"
                              : "border-outline-variant/40 text-outline hover:border-on-surface"
                          }`}
                        >
                          Normal
                        </button>
                        <button
                          type="button"
                          onClick={() => setWalkinUrgency("PRIORITY")}
                          className={`py-space-3 rounded-xl border-2 font-bold transition-all ${
                            walkinUrgency === "PRIORITY"
                              ? "bg-warning/15 border-warning text-warning"
                              : "border-outline-variant/40 text-outline hover:border-on-surface"
                          }`}
                        >
                          Priority (Senior/Child)
                        </button>
                        <button
                          type="button"
                          onClick={() => setWalkinUrgency("EMERGENCY")}
                          className={`py-space-3 rounded-xl border-2 font-bold transition-all ${
                            walkinUrgency === "EMERGENCY"
                              ? "bg-error/15 border-error text-error"
                              : "border-outline-variant/40 text-outline hover:border-on-surface"
                          }`}
                        >
                          Urgent Triage
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isProcessing}
                    className="w-full py-space-6 text-headline-sm font-bold rounded-2xl shadow-xl gap-space-3"
                  >
                    {isProcessing ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[28px]">
                          progress_activity
                        </span>
                        Issuing Token...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[28px]">
                          confirmation_number
                        </span>
                        Generate Queue Token
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* Thermal Token Slip Preview */
          <div className="w-full max-w-md space-y-space-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-surface-container-lowest border-2 border-outline-variant/40 rounded-3xl p-space-8 shadow-2xl space-y-space-6 text-center font-mono">
              <div className="border-b border-dashed border-outline-variant/60 pb-space-4 space-y-space-1">
                <span className="font-extrabold text-title-md font-sans text-primary uppercase tracking-widest block">
                  Going Merry Hospital
                </span>
                <span className="text-label-sm text-outline">OUTPATIENT QUEUE SLIP</span>
              </div>

              {/* Huge Token Number */}
              <div className="space-y-space-1">
                <span className="text-label-sm uppercase font-bold text-outline">
                  Your Token Number
                </span>
                <div className="text-[52px] font-extrabold text-primary leading-none tracking-tight">
                  {generatedSlip.tokenNumber}
                </div>
                {generatedSlip.priorityTier !== "NORMAL" && (
                  <Badge variant="danger" className="text-label-xs mt-space-1">
                    {generatedSlip.priorityTier} TIER
                  </Badge>
                )}
              </div>

              {/* Details List */}
              <div className="border-y border-dashed border-outline-variant/60 py-space-4 text-left space-y-space-2 text-body-sm">
                <div className="flex justify-between">
                  <span className="text-outline">Patient:</span>
                  <span className="font-bold text-on-surface">{generatedSlip.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Clinician:</span>
                  <span className="font-bold text-on-surface">{generatedSlip.doctorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Location:</span>
                  <span className="font-bold text-on-surface">{generatedSlip.roomNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Est. Wait:</span>
                  <span className="font-bold text-primary">
                    ~{generatedSlip.estimatedWaitMinutes} mins
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Check-In Time:</span>
                  <span className="text-on-surface">{generatedSlip.checkInTime}</span>
                </div>
              </div>

              {/* Barcode representation */}
              <div className="space-y-space-1 pt-space-2">
                <div className="text-label-md font-mono tracking-widest text-outline">
                  ||||| ||| || |||| ||| |||||
                </div>
                <span className="text-label-xs text-outline block">
                  Please proceed to Waiting Area. Watch TV screens for your turn.
                </span>
              </div>
            </div>

            {/* Kiosk Controls */}
            <div className="grid grid-cols-2 gap-space-3">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="py-space-4 rounded-xl gap-space-2 font-bold"
              >
                <span className="material-symbols-outlined text-[20px]">print</span>
                Print Slip
              </Button>
              <Button
                variant="primary"
                onClick={handleReset}
                className="py-space-4 rounded-xl gap-space-2 font-bold"
              >
                <span className="material-symbols-outlined text-[20px]">check</span>
                Done / Next
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Kiosk Footer */}
      <footer className="text-center text-label-sm text-outline border-t border-outline-variant/20 pt-space-4">
        Need assistance? Please contact OPD Reception Counter #1 or call extension 4100.
      </footer>
    </div>
  );
}
