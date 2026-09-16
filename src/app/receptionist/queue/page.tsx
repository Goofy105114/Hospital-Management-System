"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  status: "WAITING" | "CALLED" | "IN_CONSULTATION" | "COMPLETED";
  issuedAt: string;
}

const INITIAL_FRONT_DESK_TOKENS: TokenEntry[] = [
  {
    id: "rec-1",
    tokenNumber: "#A-21",
    patientName: "Arthur Pendelton",
    mrn: "GM-84920",
    doctorName: "Dr. Marcus Vance",
    department: "Cardiology",
    room: "Room 304",
    priorityTier: "NORMAL",
    type: "APPOINTMENT",
    status: "IN_CONSULTATION",
    issuedAt: "09:30 AM",
  },
  {
    id: "rec-2",
    tokenNumber: "#A-22",
    patientName: "Sofia Rodriguez",
    mrn: "GM-99120",
    doctorName: "Dr. Marcus Vance",
    department: "Cardiology",
    room: "Room 304",
    priorityTier: "PRIORITY",
    type: "APPOINTMENT",
    status: "CALLED",
    issuedAt: "09:45 AM",
  },
  {
    id: "rec-3",
    tokenNumber: "#EMG-04",
    patientName: "James Wilson",
    mrn: "GM-10492",
    doctorName: "Dr. Marcus Vance",
    department: "Cardiology",
    room: "Room 304",
    priorityTier: "EMERGENCY",
    type: "WALK_IN",
    status: "WAITING",
    issuedAt: "10:15 AM",
  },
  {
    id: "rec-4",
    tokenNumber: "#B-08",
    patientName: "Sarah Jenkins",
    mrn: "GM-39182",
    doctorName: "Dr. Aisha Patel",
    department: "Neurology",
    room: "Room 202",
    priorityTier: "NORMAL",
    type: "WALK_IN",
    status: "WAITING",
    issuedAt: "10:20 AM",
  },
  {
    id: "rec-5",
    tokenNumber: "#C-14",
    patientName: "Emma Davis",
    mrn: "GM-23841",
    doctorName: "Dr. David Chen",
    department: "Pediatrics",
    room: "Room 105",
    priorityTier: "NORMAL",
    type: "APPOINTMENT",
    status: "WAITING",
    issuedAt: "10:25 AM",
  },
];

export default function ReceptionistQueuePage() {
  const [tokens, setTokens] = useState<TokenEntry[]>(INITIAL_FRONT_DESK_TOKENS);
  const [newPatientName, setNewPatientName] = useState("");
  const [newMrn, setNewMrn] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("Dr. Marcus Vance");
  const [selectedDepartment, setSelectedDepartment] = useState("Cardiology");
  const [priorityTier, setPriorityTier] = useState<"NORMAL" | "PRIORITY" | "EMERGENCY">("NORMAL");
  const [visitType, setVisitType] = useState<"WALK_IN" | "APPOINTMENT">("WALK_IN");
  const [issuedMessage, setIssuedMessage] = useState<string | null>(null);

  const handleIssueToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    const prefix =
      priorityTier === "EMERGENCY"
        ? "EMG"
        : selectedDepartment === "Cardiology"
          ? "A"
          : selectedDepartment === "Neurology"
            ? "B"
            : "C";
    const nextNum = Math.floor(25 + Math.random() * 50);
    const tokenNumber = `#${prefix}-${nextNum}`;
    const mrn = newMrn.trim() || `GM-${Math.floor(10000 + Math.random() * 90000)}`;

    const newToken: TokenEntry = {
      id: `rec-tok-${Date.now()}`,
      tokenNumber,
      patientName: newPatientName,
      mrn,
      doctorName: selectedDoctor,
      department: selectedDepartment,
      room: selectedDoctor.includes("Vance")
        ? "Room 304"
        : selectedDoctor.includes("Patel")
          ? "Room 202"
          : "Room 105",
      priorityTier,
      type: visitType,
      status: "WAITING",
      issuedAt: "Just now",
    };

    setTokens((prev) => [newToken, ...prev]);
    setIssuedMessage(
      `Token ${tokenNumber} successfully issued for ${newPatientName} (${selectedDoctor})`
    );
    setNewPatientName("");
    setNewMrn("");
    setTimeout(() => setIssuedMessage(null), 5000);
  };

  const handleCancelToken = (id: string) => {
    setTokens((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-600/10 text-emerald-700 border border-emerald-600/20">
                Front Desk Station A-1 • Sarah Connor
              </span>
              <span className="text-xs text-outline">• Central Intake Triage</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight mt-1">
              Reception Queue & Token Dispatch
            </h1>
            <p className="text-xs text-outline mt-0.5">
              Issue walk-in tokens, manage clinic waiting lines, check in appointment arrivals, and
              monitor waiting room TVs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/queue/display" target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold">
                <span className="material-symbols-outlined text-[16px]">tv</span>
                <span>Open TV Board</span>
              </Button>
            </Link>
            <Link href="/queue/kiosk" target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold">
                <span className="material-symbols-outlined text-[16px]">touch_app</span>
                <span>Launch Kiosk</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Issued Alert */}
        {issuedMessage && (
          <div className="p-3.5 rounded-2xl bg-success/10 border border-success/30 text-success text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
              <span>{issuedMessage}</span>
            </div>
            <button
              onClick={() => setIssuedMessage(null)}
              className="text-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Issue Token Form Panel */}
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
                  Patient Full Name
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
                    onChange={(e) => {
                      setSelectedDepartment(e.target.value);
                      if (e.target.value === "Cardiology") setSelectedDoctor("Dr. Marcus Vance");
                      else if (e.target.value === "Neurology") setSelectedDoctor("Dr. Aisha Patel");
                      else setSelectedDoctor("Dr. David Chen");
                    }}
                    className="w-full h-10 px-2.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 text-xs"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Pediatrics">Pediatrics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                    Doctor
                  </label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full h-10 px-2.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 text-xs"
                  >
                    {selectedDepartment === "Cardiology" && (
                      <option value="Dr. Marcus Vance">Dr. Marcus Vance (304)</option>
                    )}
                    {selectedDepartment === "Neurology" && (
                      <option value="Dr. Aisha Patel">Dr. Aisha Patel (202)</option>
                    )}
                    {selectedDepartment === "Pediatrics" && (
                      <option value="Dr. David Chen">Dr. David Chen (105)</option>
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
                Live QStash Synced
              </span>
            </div>

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
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
