"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  QrCode,
  CheckCircle2,
  Circle,
  Clock,
  X,
  Pill,
  Sparkles,
} from "lucide-react";

interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  sig: string;
  prescribedBy: string;
  startDate: string;
  refillsRemaining: number;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  indication: string;
  takenToday: boolean;
}

const INITIAL_MEDS: MedicationItem[] = [
  {
    id: "med-01",
    name: "Metoprolol Succinate",
    dosage: "25mg Extended Release",
    sig: "Take 1 tablet daily with breakfast",
    prescribedBy: "Dr. Marcus Vance (Cardiology)",
    startDate: "Oct 24, 2026",
    refillsRemaining: 2,
    status: "ACTIVE",
    indication: "Palpitation & Rate Control",
    takenToday: true,
  },
  {
    id: "med-02",
    name: "Lisinopril",
    dosage: "10mg Tablet",
    sig: "Take 1 tablet daily in the evening",
    prescribedBy: "Dr. Marcus Vance (Cardiology)",
    startDate: "Aug 15, 2026",
    refillsRemaining: 3,
    status: "ACTIVE",
    indication: "Hypertension Blood Pressure",
    takenToday: false,
  },
  {
    id: "med-03",
    name: "Atorvastatin Calcium",
    dosage: "20mg Tablet",
    sig: "Take 1 tablet daily at bedtime",
    prescribedBy: "Dr. Marcus Vance (Cardiology)",
    startDate: "Oct 24, 2026",
    refillsRemaining: 2,
    status: "ACTIVE",
    indication: "Hyperlipidemia Cholesterol",
    takenToday: false,
  },
];

export default function PrescriptionsPage() {
  const [meds, setMeds] = useState<MedicationItem[]>(INITIAL_MEDS);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [refillSuccess, setRefillSuccess] = useState<string | null>(null);

  const toggleTaken = (id: string) => {
    setMeds((prev) =>
      prev.map((m) => (m.id === id ? { ...m, takenToday: !m.takenToday } : m))
    );
  };

  const requestRefill = (medName: string) => {
    setRefillSuccess(`Refill request for ${medName} submitted to Pharmacy Dispensary.`);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-5 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                My Prescriptions &amp; Medications
              </h1>
              <Badge variant="success" className="text-[11px] font-semibold px-2 py-0.5">
                {meds.filter((m) => m.status === "ACTIVE").length} Active Regimens
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Patient: Eleanor Pena (MRN-2026-001842) • Automated Refills &amp; Adherence Tracking
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setQrModalOpen(true)}
              className="bg-teal-700 hover:bg-teal-800 text-white gap-1.5 shadow-2xs text-xs font-semibold h-9 rounded-xl"
            >
              <QrCode className="w-4 h-4" />
              Show Pharmacy Pickup QR
            </Button>
          </div>
        </div>

        {refillSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-medium">{refillSuccess}</span>
            </div>
            <button
              onClick={() => setRefillSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Daily Adherence Banner */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xl shrink-0 border border-teal-200/60">
              <Clock className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Today&apos;s Medication Schedule
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {meds.filter((m) => m.takenToday).length} of {meds.length} doses logged today
              </p>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-teal-600 h-full transition-all duration-300"
                style={{
                  width: `${(meds.filter((m) => m.takenToday).length / meds.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Medication Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {meds.map((med) => (
            <Card
              key={med.id}
              className="border border-slate-200/80 shadow-2xs hover:border-teal-600/40 transition-all flex flex-col justify-between rounded-2xl bg-white overflow-hidden"
            >
              <CardHeader className="py-3 px-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <Badge variant="primary" className="text-[10px]">
                      {med.indication}
                    </Badge>
                    <CardTitle className="text-sm font-bold text-slate-800 mt-1">
                      {med.name}
                    </CardTitle>
                    <p className="font-mono text-xs font-bold text-teal-800">{med.dosage}</p>
                  </div>
                  <Badge variant="success" className="text-[10px]">
                    {med.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 font-medium text-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Instructions
                    </span>
                    {med.sig}
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100 text-slate-500">
                    <span>Prescriber:</span>
                    <span className="text-slate-800 font-medium">{med.prescribedBy}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100 text-slate-500">
                    <span>Refills Left:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {med.refillsRemaining} Refills
                    </span>
                  </div>

                  <div className="flex justify-between py-1 text-slate-500">
                    <span>Started On:</span>
                    <span className="font-mono text-slate-700">{med.startDate}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <Button
                    variant={med.takenToday ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleTaken(med.id)}
                    className={`w-full text-xs font-semibold gap-1.5 h-8 rounded-xl ${
                      med.takenToday
                        ? "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100/60"
                        : "bg-teal-700 hover:bg-teal-800 text-white"
                    }`}
                  >
                    {med.takenToday ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-white/80" />
                    )}
                    {med.takenToday ? "Dose Logged for Today" : "Mark Taken Today"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => requestRefill(med.name)}
                    className="w-full text-xs h-8 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700"
                  >
                    Request Refill
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* QR Pickup Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-teal-800">
                Hospital Pharmacy Express Pass
              </h3>
              <button onClick={() => setQrModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Present this pass at Central Pharmacy Kiosk Station B for rapid automated dispensing.
            </p>

            {/* Stylized QR placeholder */}
            <div className="p-6 bg-slate-50 rounded-2xl inline-block border-2 border-dashed border-teal-600/40">
              <QrCode className="w-24 h-24 text-teal-800 mx-auto" />
              <div className="font-mono text-xs font-bold text-slate-700 mt-2">
                RX-PASS-2026-001842
              </div>
            </div>

            <div className="text-xs font-mono text-slate-500">
              Valid for Eleanor Pena • 3 Active Items Ready
            </div>

            <Button
              className="w-full bg-teal-700 hover:bg-teal-800 text-white text-xs h-9 rounded-xl font-semibold"
              onClick={() => setQrModalOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
