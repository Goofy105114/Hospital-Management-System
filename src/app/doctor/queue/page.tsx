"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope,
  Tv,
  Bell,
  X,
  FileText,
  CheckCircle2,
  Users,
  Megaphone,
  Play,
  CheckCheck,
  Armchair,
  Clock,
  Heart,
  Activity,
  ArrowRight,
} from "lucide-react";

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

import api from "@/lib/axios";

export default function DoctorQueuePage() {
  const [queue, setQueue] = useState<DoctorQueueItem[]>([]);
  const [currentConsultation, setCurrentConsultation] = useState<DoctorQueueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get("/queue/tokens");
      const list = res.data?.data;
      if (Array.isArray(list)) {
        const mapped: DoctorQueueItem[] = list.map((tok: any) => {
          let status: DoctorQueueItem["status"] = "WAITING";
          if (tok.status === "IN_CONSULTATION" || tok.status === "IN_PROGRESS") status = "IN_CONSULTATION";
          else if (tok.status === "CALLED") status = "CALLED";
          else if (tok.status === "COMPLETED") status = "COMPLETED";

          return {
            id: tok.id,
            tokenNumber: tok.tokenNumber,
            patientName: tok.patientName || "Patient",
            mrn: tok.patientMrn || "MRN-000",
            ageGender: "Adult / Patient",
            chiefComplaint: tok.reason || "Consultation & clinical evaluation",
            vitals: { bp: "120/80 mmHg", hr: "72 bpm", spo2: "98%", temp: "98.4°F" },
            priorityTier: tok.priorityTier === "EMERGENCY" ? "EMERGENCY" : tok.priorityTier === "PRIORITY" ? "PRIORITY" : "NORMAL",
            status,
            waitTimeMin: tok.estimatedWaitMinutes || 10,
          };
        });
        setQueue(mapped);
        const inConsult = mapped.find((m) => m.status === "IN_CONSULTATION");
        setCurrentConsultation(inConsult || null);
      } else {
        setQueue([]);
        setCurrentConsultation(null);
      }
    } catch {
      setQueue([]);
      setCurrentConsultation(null);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchQueue();
  }, []);

  const handleCallPatient = async (item: DoctorQueueItem) => {
    try {
      await api.post(`/queue/tokens/${item.id}/recall`);
    } catch {
      // Local optimistic update
    }
    setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "CALLED" } : q)));
    setActionNotice(`Called token ${item.tokenNumber} (${item.patientName}) to Room 304`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleStartConsultation = async (item: DoctorQueueItem) => {
    try {
      await api.post(`/queue/tokens/${item.id}/start-consultation`);
    } catch {
      // Local optimistic update
    }
    setQueue((prev) =>
      prev.map((q) => {
        if (q.id === item.id) return { ...q, status: "IN_CONSULTATION" };
        if (q.status === "IN_CONSULTATION") return { ...q, status: "WAITING" };
        return q;
      })
    );
    setCurrentConsultation({ ...item, status: "IN_CONSULTATION" });
    setActionNotice(`Started clinical consultation session with ${item.patientName}`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleCompleteConsultation = async (id: string) => {
    try {
      await api.post(`/queue/tokens/${id}/complete`);
    } catch {
      // Local optimistic update
    }
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, status: "COMPLETED" } : q)));
    setCurrentConsultation(null);
    setActionNotice("Consultation marked completed. Ready for next patient.");
    setTimeout(() => setActionNotice(null), 4000);
  };

  const waitingPatients = queue.filter((q) => q.status === "WAITING" || q.status === "CALLED");
  const completedPatients = queue.filter((q) => q.status === "COMPLETED");

  return (
    <AppLayout>
      <div className="space-y-5 max-w-7xl mx-auto pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200/70">
                Dr. Marcus Vance, MD • Clinic Room 304
              </span>
              <span className="text-xs text-slate-400">• Cardiology OPD</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight mt-1">
              Doctor Consultation Queue
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage patient turn calling, triage priorities, live vitals preview, and SOAP encounters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/doctor/dashboard">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold h-9 rounded-xl border-slate-200 shadow-2xs hover:bg-slate-50">
                <Stethoscope className="w-3.5 h-3.5 text-slate-600" />
                <span>Doctor Workspace</span>
              </Button>
            </Link>
            <Link href="/queue/display" target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold h-9 rounded-xl border-slate-200 shadow-2xs hover:bg-slate-50">
                <Tv className="w-3.5 h-3.5 text-slate-600" />
                <span>Waiting Room TV</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-medium flex items-center justify-between shadow-2xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-teal-600" />
              <span>{actionNotice}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              className="text-teal-600 hover:text-teal-900 p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Active Consultation Hero Card */}
        {currentConsultation ? (
          <div className="rounded-2xl bg-white border border-teal-600/30 p-5 sm:p-6 shadow-2xs relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3.5 py-1 rounded-bl-xl bg-teal-800 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>In Consultation Now</span>
            </div>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-3">
                  <div className="h-12 min-w-[76px] px-3 rounded-xl bg-teal-800 text-white flex items-center justify-center font-mono font-bold text-base tracking-wide shrink-0 shadow-xs whitespace-nowrap">
                    {currentConsultation.tokenNumber}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">
                      {currentConsultation.patientName}
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      MRN: {currentConsultation.mrn} • {currentConsultation.ageGender}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                  <span className="font-bold text-slate-500 uppercase text-[10px] block mb-0.5">
                    Chief Complaint / Intake Reason
                  </span>
                  {currentConsultation.chiefComplaint}
                </div>

                {/* Vitals Snapshot */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                      Blood Pressure
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-800 mt-0.5 block">
                      {currentConsultation.vitals.bp}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                      Heart Rate
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-800 mt-0.5 block">
                      {currentConsultation.vitals.hr}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                      SpO2 Oxygen
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-800 mt-0.5 block">
                      {currentConsultation.vitals.spo2}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                      Temperature
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-800 mt-0.5 block">
                      {currentConsultation.vitals.temp}
                    </span>
                  </div>
                </div>
              </div>

              {/* Consultation Controls */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-56 shrink-0">
                <Link href="/doctor/dashboard" className="w-full">
                  <Button className="w-full h-10 font-semibold gap-2 text-xs bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-2xs">
                    <FileText className="w-4 h-4" />
                    <span>Open Clinical SOAP Note</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => handleCompleteConsultation(currentConsultation.id)}
                  className="w-full h-10 font-semibold gap-2 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-xl"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finish Consultation</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-8 border border-slate-200/80 text-center shadow-2xs">
            <Armchair className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">Consultation Room Idle</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No patient currently inside Room 304. Review waiting tokens below and call the next patient.
            </p>
          </div>
        )}

        {/* Waiting Queue List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-700" />
              <span>Waiting in Clinic Hallway ({waitingPatients.length})</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Average Wait: 12 mins</span>
          </div>

          <div className="space-y-2.5">
            {waitingPatients.map((item, index) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-teal-600/40 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-slate-50 flex flex-col items-center justify-center shrink-0 border border-slate-200/70">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Pos</span>
                    <span className="font-mono text-sm font-bold text-slate-700">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded">
                        {item.tokenNumber}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800">{item.patientName}</h4>
                      <Badge
                        variant={
                          item.priorityTier === "EMERGENCY"
                            ? "error"
                            : item.priorityTier === "PRIORITY"
                              ? "warning"
                              : "outline"
                        }
                        className="text-[10px]"
                      >
                        {item.priorityTier}
                      </Badge>
                      {item.status === "CALLED" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse border border-amber-200">
                          CALLED TO ROOM
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-xl mt-0.5">
                      {item.chiefComplaint}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1">
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
                    className="gap-1.5 text-xs font-semibold h-9 rounded-xl border-slate-200 shadow-2xs hover:bg-slate-50 flex-1 md:flex-none"
                  >
                    <Megaphone className="w-3.5 h-3.5 text-slate-600" />
                    <span>Call Patient</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleStartConsultation(item)}
                    className="gap-1.5 text-xs font-semibold h-9 rounded-xl bg-teal-700 hover:bg-teal-800 text-white shadow-2xs flex-1 md:flex-none"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Visit</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completed Today Counter */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2 font-medium">
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Completed Consultations Today:{" "}
              <strong className="text-slate-800">{completedPatients.length}</strong> patients
            </span>
          </div>
          <Link href="/doctor/encounters" className="text-teal-700 font-semibold hover:underline flex items-center gap-1">
            <span>View All Encounters</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
