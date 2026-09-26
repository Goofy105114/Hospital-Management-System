"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/axios";

interface TokenEntry {
  id: string;
  tokenNumber: string;
  patientName: string;
  mrn: string;
  doctorName: string;
  department: string;
  room: string;
  priorityTier: "NORMAL" | "PRIORITY" | "EMERGENCY";
  type: "WALK_IN" | "APPOINTMENT";
  status: "WAITING" | "CALLED" | "IN_CONSULTATION" | "COMPLETED" | "CANCELLED";
  issuedAt: string;
}

interface DoctorOption {
  id: string;
  name: string;
  department: string;
  room: string;
}

export default function ReceptionistQueuePage() {
  const [tokens, setTokens] = useState<TokenEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);

  const [newPatientName, setNewPatientName] = useState("");
  const [newMrn, setNewMrn] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [priorityTier, setPriorityTier] = useState<"NORMAL" | "PRIORITY" | "EMERGENCY">("NORMAL");
  const [visitType, setVisitType] = useState<"WALK_IN" | "APPOINTMENT">("WALK_IN");
  const [issuedMessage, setIssuedMessage] = useState<string | null>(null);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const res = await api.get("/queue/tokens");
      const list = res.data?.data;
      if (Array.isArray(list)) {
        const mapped: TokenEntry[] = list.map((tok: any) => ({
          id: tok.id,
          tokenNumber: tok.tokenNumber,
          patientName: tok.patientName || "Patient",
          mrn: tok.patientMrn || "MRN-000",
          doctorName: tok.doctorName || "Attending Physician",
          department: tok.department || "Outpatient Clinic",
          room: tok.roomNumber || "Consultation Room",
          priorityTier:
            tok.priorityTier === "EMERGENCY"
              ? "EMERGENCY"
              : tok.priorityTier === "PRIORITY"
                ? "PRIORITY"
                : "NORMAL",
          type: tok.source === "WALK_IN" ? "WALK_IN" : "APPOINTMENT",
          status: tok.status === "IN_PROGRESS" ? "IN_CONSULTATION" : tok.status,
          issuedAt: tok.checkedInAt
            ? new Date(tok.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Today",
        }));
        setTokens(mapped);
      } else {
        setTokens([]);
      }
    } catch {
      setTokens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();

    // Fetch live doctors & departments
    api.get("/doctors").then((res) => {
      const docList = res.data?.data;
      if (Array.isArray(docList) && docList.length > 0) {
        const mappedDocs: DoctorOption[] = docList.map((d: any, idx: number) => ({
          id: d.id,
          name: d.user?.name || `Dr. ${d.specialization}`,
          department: d.department?.name || "General Medicine",
          room: d.roomNumber || `Room ${300 + idx + 1}`,
        }));
        setDoctors(mappedDocs);
        if (mappedDocs.length > 0) {
          setSelectedDoctorId(mappedDocs[0].id);
          setSelectedDoctor(mappedDocs[0].name);
          setSelectedDepartment(mappedDocs[0].department);
        }
      }
    }).catch(() => {});

    api.get("/departments").then((res) => {
      const deptList = res.data?.data;
      if (Array.isArray(deptList) && deptList.length > 0) {
        setDepartments(deptList.map((d: any) => d.name));
      }
    }).catch(() => {});

    const interval = setInterval(fetchTokens, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleIssueToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    try {
      let patientId: string | undefined;

      // 1. Resolve or register patient in database
      const searchQuery = newMrn.trim() || newPatientName.trim();
      const patRes = await api.get(`/patients?query=${encodeURIComponent(searchQuery)}`);
      if (patRes.data?.data && Array.isArray(patRes.data.data) && patRes.data.data.length > 0) {
        patientId = patRes.data.data[0].id;
      } else {
        const createRes = await api.post("/patients", {
          name: newPatientName.trim(),
          gender: "OTHER",
          phone: "+1-555-0100",
          email: `walkin.${Date.now()}@goingmerry.org`,
        });
        patientId = createRes.data?.data?.id;
      }

      // 2. Resolve selected doctor ID
      const doctorId = selectedDoctorId || doctors[0]?.id;

      if (!patientId || !doctorId) {
        setIssuedMessage("Please select a doctor and provide valid patient information.");
        setTimeout(() => setIssuedMessage(null), 5000);
        return;
      }

      // 3. Persist queue check-in to database
      const res = await api.post("/queue/check-in", {
        patientId,
        doctorId,
        isWalkIn: visitType === "WALK_IN",
        priorityTier,
        allowOverride: true,
      });

      if (res.data?.success) {
        const tokenNumber = res.data.data?.tokenNumber || "Token";
        setIssuedMessage(`Token ${tokenNumber} issued successfully for ${newPatientName}`);
        setNewPatientName("");
        setNewMrn("");
        await fetchTokens();
      } else {
        setIssuedMessage(res.data?.error?.message || "Failed to dispense token.");
      }
      setTimeout(() => setIssuedMessage(null), 5000);
    } catch (err: any) {
      setIssuedMessage(
        err.response?.data?.error?.message || "Failed to dispense token. Please check queue service."
      );
      setTimeout(() => setIssuedMessage(null), 5000);
    }
  };

  const handleCancelToken = async (id: string) => {
    try {
      await api.post(`/queue/tokens/${id}/cancel`);
      await fetchTokens();
    } catch {
      setTokens((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const activeWaiting = tokens.filter((t) => t.status === "WAITING");
  const inConsult = tokens.filter((t) => t.status === "IN_CONSULTATION");

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                Front Desk Counter 01
              </span>
              <span className="text-xs text-outline">• Central OPD Reception</span>
            </div>
            <h1 className="text-xl font-bold text-on-surface tracking-tight mt-1">
              Reception Queue & Token Dispenser (OPD-01)
            </h1>
            <p className="text-xs text-outline mt-0.5">
              Rapid intake, appointment check-in, walk-in token issuance, and live clinic load balancing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/queue/kiosk">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                <span className="material-symbols-outlined text-[16px]">touch_app</span>
                Self-Service Kiosk
              </Button>
            </Link>
            <Link href="/queue/display" target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                <span className="material-symbols-outlined text-[16px]">tv</span>
                Waiting Room TV
              </Button>
            </Link>
          </div>
        </div>

        {issuedMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
              <span>{issuedMessage}</span>
            </div>
            <button onClick={() => setIssuedMessage(null)} className="text-emerald-600 hover:text-emerald-900">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Counter Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl">
            <span className="text-xs text-outline uppercase font-semibold block">Total Issued Today</span>
            <span className="text-xl font-bold text-on-surface font-mono mt-1 block">{tokens.length}</span>
          </div>
          <div className="p-4 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl">
            <span className="text-xs text-outline uppercase font-semibold block">Currently Waiting</span>
            <span className="text-xl font-bold text-warning font-mono mt-1 block">{activeWaiting.length}</span>
          </div>
          <div className="p-4 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl">
            <span className="text-xs text-outline uppercase font-semibold block">In Consultation</span>
            <span className="text-xl font-bold text-primary font-mono mt-1 block">{inConsult.length}</span>
          </div>
          <div className="p-4 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl">
            <span className="text-xs text-outline uppercase font-semibold block">Est. Avg Turnaround</span>
            <span className="text-xl font-bold text-secondary font-mono mt-1 block">14 mins</span>
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Token Generation Form */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/40 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/15 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">add_task</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">Dispense New Token</h3>
                <p className="text-[11px] text-outline">Walk-in or pre-booked appointment</p>
              </div>
            </div>

            <form onSubmit={handleIssueToken} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                  Patient Full Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  placeholder="e.g. Jonathan Smith"
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 text-xs font-medium focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                  MRN (Optional)
                </label>
                <input
                  type="text"
                  value={newMrn}
                  onChange={(e) => setNewMrn(e.target.value)}
                  placeholder="Leave blank to auto-generate"
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 text-xs font-mono focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                    Department
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full h-10 px-2.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 text-xs"
                  >
                    {departments.length > 0 ? (
                      departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="General Medicine">General Medicine</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                    Doctor
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => {
                      setSelectedDoctorId(e.target.value);
                      const doc = doctors.find((d) => d.id === e.target.value);
                      if (doc) setSelectedDoctor(doc.name);
                    }}
                    className="w-full h-10 px-2.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 text-xs"
                  >
                    {doctors.length > 0 ? (
                      doctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name} ({doc.room})
                        </option>
                      ))
                    ) : (
                      <option value="">No doctors available</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                    Priority Tier
                  </label>
                  <select
                    value={priorityTier}
                    onChange={(e) => setPriorityTier(e.target.value as any)}
                    className="w-full h-10 px-2.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 text-xs"
                  >
                    <option value="NORMAL">Normal (Standard)</option>
                    <option value="PRIORITY">Priority (Elderly/Urgent)</option>
                    <option value="EMERGENCY">Emergency (STAT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                    Visit Type
                  </label>
                  <select
                    value={visitType}
                    onChange={(e) => setVisitType(e.target.value as any)}
                    className="w-full h-10 px-2.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 text-xs"
                  >
                    <option value="WALK_IN">Walk-in Intake</option>
                    <option value="APPOINTMENT">Pre-Booked</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 font-bold rounded-xl mt-3 bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                Print & Dispense Token
              </Button>
            </form>
          </div>

          {/* Active Queue Board Table */}
          <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/40 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div>
                <h3 className="text-sm font-bold text-on-surface">
                  Active Clinic Tokens ({tokens.length})
                </h3>
                <p className="text-[11px] text-outline">
                  Real-time status across all active OPD lanes
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                Live Queue Synced
              </span>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-outline">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-body-sm font-medium">Loading queue board...</p>
              </div>
            ) : tokens.length === 0 ? (
              <div className="py-12 text-center text-outline border border-dashed border-outline-variant/20 rounded-2xl">
                <span className="material-symbols-outlined text-[40px] text-outline/40 mb-2">confirmation_number</span>
                <p className="font-semibold text-on-surface">No active tokens in queue</p>
                <p className="text-body-sm text-outline mt-1">
                  Use the left form to dispense new tokens for arriving patients.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/20 overflow-x-auto">
                {tokens.map((token) => (
                  <div key={token.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-base font-black text-primary w-16 shrink-0">
                        {token.tokenNumber}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-on-surface">
                            {token.patientName}
                          </span>
                          <span className="text-[10px] text-outline font-mono">({token.mrn})</span>
                          <Badge
                            variant={
                              token.priorityTier === "EMERGENCY"
                                ? "error"
                                : token.priorityTier === "PRIORITY"
                                  ? "warning"
                                  : "outline"
                            }
                          >
                            {token.priorityTier}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-outline truncate">
                          {token.doctorName} • {token.department} ({token.room}) • {token.type}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          token.status === "IN_CONSULTATION"
                            ? "bg-primary/15 text-primary"
                            : token.status === "CALLED"
                              ? "bg-warning/15 text-warning"
                              : "bg-surface-container-high text-outline"
                        }`}
                      >
                        {token.status.replace("_", " ")}
                      </span>
                      <button
                        onClick={() => handleCancelToken(token.id)}
                        title="Cancel Token"
                        className="p-1 rounded text-outline hover:text-error hover:bg-error/10 text-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
