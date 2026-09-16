"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface DoctorQueueItem {
  id: string;
  tokenNumber: string;
  patientName: string;
  mrn: string;
  ageGender: string;
  chiefComplaint: string;
  vitals: {
    bp: string;
    hr: string;
    spo2: string;
    temp: string;
  };
  priorityTier: "NORMAL" | "PRIORITY" | "EMERGENCY";
  status: "IN_CONSULTATION" | "WAITING" | "CALLED" | "COMPLETED" | "SKIPPED";
  waitTimeMin: number;
}

const INITIAL_DOCTOR_QUEUE: DoctorQueueItem[] = [
  {
    id: "doc-tok-1",
    tokenNumber: "#A-21",
    patientName: "Arthur Pendelton",
    mrn: "GM-84920",
    ageGender: "58y / Male",
    chiefComplaint: "Follow-up for post-angioplasty stent check and mild exertional dyspnea",
    vitals: { bp: "135/85 mmHg", hr: "76 bpm", spo2: "98%", temp: "98.4°F" },
    priorityTier: "NORMAL",
    status: "IN_CONSULTATION",
    waitTimeMin: 0,
  },
  {
    id: "doc-tok-2",
    tokenNumber: "#A-22",
    patientName: "Sofia Rodriguez",
    mrn: "GM-99120",
    ageGender: "44y / Female",
    chiefComplaint: "Substernal chest tightness radiating to left arm upon climbing stairs",
    vitals: { bp: "142/90 mmHg", hr: "88 bpm", spo2: "97%", temp: "98.8°F" },
    priorityTier: "PRIORITY",
    status: "CALLED",
    waitTimeMin: 4,
  },
  {
    id: "doc-tok-3",
    tokenNumber: "#EMG-04",
    patientName: "James Wilson (Triage Chest Pain)",
    mrn: "GM-10492",
    ageGender: "62y / Male",
    chiefComplaint: "Acute onset diaphoresis and severe pressure-like central chest pain",
    vitals: { bp: "160/98 mmHg", hr: "104 bpm", spo2: "94%", temp: "99.1°F" },
    priorityTier: "EMERGENCY",
    status: "WAITING",
    waitTimeMin: 1,
  },
  {
    id: "doc-tok-4",
    tokenNumber: "#A-23",
    patientName: "David Chen",
    mrn: "GM-39182",
    ageGender: "36y / Male",
    chiefComplaint: "Routine hypertension screening and medication refill review",
    vitals: { bp: "128/82 mmHg", hr: "72 bpm", spo2: "99%", temp: "98.6°F" },
    priorityTier: "NORMAL",
    status: "WAITING",
    waitTimeMin: 12,
  },
  {
    id: "doc-tok-5",
    tokenNumber: "#A-24",
    patientName: "Eleanor Vance",
    mrn: "GM-84920",
    ageGender: "32y / Female",
    chiefComplaint: "Palpitations during exercise, requesting Holter monitor evaluation",
    vitals: { bp: "118/76 mmHg", hr: "72 bpm", spo2: "99%", temp: "98.2°F" },
    priorityTier: "NORMAL",
    status: "WAITING",
    waitTimeMin: 22,
  },
];

export default function DoctorQueuePage() {
  const [queue, setQueue] = useState<DoctorQueueItem[]>(INITIAL_DOCTOR_QUEUE);
  const [currentConsultation, setCurrentConsultation] = useState<DoctorQueueItem | null>(
    INITIAL_DOCTOR_QUEUE[0]
  );
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleCallPatient = (item: DoctorQueueItem) => {
    setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "CALLED" } : q)));
    setActionNotice(`Called token ${item.tokenNumber} (${item.patientName}) to Room 304`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleStartConsultation = (item: DoctorQueueItem) => {
    setQueue((prev) =>
      prev.map((q) =>
        q.id === item.id
          ? { ...q, status: "IN_CONSULTATION" }
          : q.status === "IN_CONSULTATION"
            ? { ...q, status: "COMPLETED" }
            : q
      )
    );
    setCurrentConsultation(item);
    setActionNotice(`Started clinical consultation for ${item.patientName} (${item.tokenNumber})`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleCompleteConsultation = (id: string) => {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, status: "COMPLETED" } : q)));
    setCurrentConsultation(null);
    setActionNotice("Consultation marked completed. Ready for next patient.");
    setTimeout(() => setActionNotice(null), 4000);
  };

  const waitingPatients = queue.filter((q) => q.status === "WAITING" || q.status === "CALLED");
  const completedPatients = queue.filter((q) => q.status === "COMPLETED");

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-600 border border-sky-500/20">
                Dr. Marcus Vance, MD • Clinic Room 304
              </span>
              <span className="text-xs text-outline">• Cardiology OPD</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight mt-1">
              Doctor Consultation Queue
            </h1>
            <p className="text-xs text-outline mt-0.5">
              Manage patient turn calling, triage priorities, live vitals preview, and SOAP
              encounters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/doctor">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold">
                <span className="material-symbols-outlined text-[16px]">stethoscope</span>
                <span>Doctor Workspace</span>
              </Button>
            </Link>
            <Link href="/queue/display" target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold">
                <span className="material-symbols-outlined text-[16px]">tv</span>
                <span>Waiting Room TV</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div className="p-3 rounded-xl bg-primary/15 border border-primary/30 text-primary text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">notifications_active</span>
              <span>{actionNotice}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              className="text-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Active Consultation Hero Card */}
        {currentConsultation ? (
          <div className="rounded-3xl bg-surface-container-lowest border-2 border-primary/40 p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 px-4 py-1 rounded-bl-2xl bg-primary text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              <span>In Consultation Now</span>
            </div>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-3xl font-black text-primary">
                    {currentConsultation.tokenNumber}
                  </span>
                  <div>
                    <h2 className="text-xl font-black text-on-surface">
                      {currentConsultation.patientName}
                    </h2>
                    <p className="text-xs text-outline font-mono">
                      MRN: {currentConsultation.mrn} • {currentConsultation.ageGender}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-on-surface bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                  <span className="font-bold text-outline uppercase text-[10px] block mb-0.5">
                    Chief Complaint / Intake Reason
                  </span>
                  {currentConsultation.chiefComplaint}
                </p>

                {/* Vitals Snapshot */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="bg-surface-container-low p-2 rounded-xl border border-outline-variant/20 text-center">
                    <span className="text-[10px] text-outline font-semibold uppercase block">
                      Blood Pressure
                    </span>
                    <span className="font-mono text-sm font-black text-on-surface">
                      {currentConsultation.vitals.bp}
                    </span>
                  </div>
                  <div className="bg-surface-container-low p-2 rounded-xl border border-outline-variant/20 text-center">
                    <span className="text-[10px] text-outline font-semibold uppercase block">
                      Heart Rate
                    </span>
                    <span className="font-mono text-sm font-black text-on-surface">
                      {currentConsultation.vitals.hr}
                    </span>
                  </div>
                  <div className="bg-surface-container-low p-2 rounded-xl border border-outline-variant/20 text-center">
                    <span className="text-[10px] text-outline font-semibold uppercase block">
                      SpO2 Oxygen
                    </span>
                    <span className="font-mono text-sm font-black text-on-surface">
                      {currentConsultation.vitals.spo2}
                    </span>
                  </div>
                  <div className="bg-surface-container-low p-2 rounded-xl border border-outline-variant/20 text-center">
                    <span className="text-[10px] text-outline font-semibold uppercase block">
                      Temperature
                    </span>
                    <span className="font-mono text-sm font-black text-on-surface">
                      {currentConsultation.vitals.temp}
                    </span>
                  </div>
                </div>
              </div>

              {/* Consultation Controls */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-56 shrink-0">
                <Link href="/doctor" className="w-full">
                  <Button variant="primary" className="w-full h-11 font-bold gap-2 text-xs">
                    <span className="material-symbols-outlined text-[18px]">edit_note</span>
                    <span>Open Clinical SOAP Note</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => handleCompleteConsultation(currentConsultation.id)}
                  className="w-full h-10 font-bold gap-2 text-xs border-success/40 text-success hover:bg-success/10"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Finish Consultation</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-surface-container-low p-8 border border-outline-variant/30 text-center">
            <span className="material-symbols-outlined text-outline text-[40px] block mb-2">
              chair
            </span>
            <h3 className="text-base font-bold text-on-surface">Consultation Room Idle</h3>
            <p className="text-xs text-outline mt-1 max-w-sm mx-auto">
              No patient currently inside Room 304. Review waiting tokens below and call the next
              patient.
            </p>
          </div>
        )}

        {/* Waiting Queue List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">people</span>
              <span>Waiting in Clinic Hallway ({waitingPatients.length})</span>
            </h3>
            <span className="text-xs text-outline font-mono">Average Wait: 12 mins</span>
          </div>

          <div className="space-y-3">
            {waitingPatients.map((item, index) => (
              <div
                key={item.id}
                className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-low flex flex-col items-center justify-center shrink-0 border border-outline-variant/30">
                    <span className="text-[9px] font-bold text-outline uppercase">Pos</span>
                    <span className="font-mono text-base font-black text-on-surface">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-base font-black text-primary">
                        {item.tokenNumber}
                      </span>
                      <h4 className="text-sm font-bold text-on-surface">{item.patientName}</h4>
                      <Badge
                        variant={
                          item.priorityTier === "EMERGENCY"
                            ? "error"
                            : item.priorityTier === "PRIORITY"
                              ? "warning"
                              : "outline"
                        }
                      >
                        {item.priorityTier}
                      </Badge>
                      {item.status === "CALLED" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning/15 text-warning animate-pulse">
                          CALLED TO ROOM
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-outline truncate max-w-xl mt-0.5">
                      {item.chiefComplaint}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-outline font-mono mt-1">
                      <span>BP: {item.vitals.bp}</span>
                      <span>HR: {item.vitals.hr}</span>
                      <span>SpO2: {item.vitals.spo2}</span>
                      <span>Wait: ~{item.waitTimeMin}m</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCallPatient(item)}
                    className="gap-1.5 text-xs font-bold flex-1 md:flex-none"
                  >
                    <span className="material-symbols-outlined text-[16px]">campaign</span>
                    <span>Call Patient</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStartConsultation(item)}
                    className="gap-1.5 text-xs font-bold flex-1 md:flex-none"
                  >
                    <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                    <span>Start Visit</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completed Today Counter */}
        <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/30 flex items-center justify-between text-xs text-outline">
          <div className="flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-success text-[18px]">task_alt</span>
            <span>
              Completed Consultations Today:{" "}
              <strong className="text-on-surface">{completedPatients.length}</strong> patients
            </span>
          </div>
          <Link href="/doctor/encounters" className="text-primary font-bold hover:underline">
            View All Encounters &rarr;
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
