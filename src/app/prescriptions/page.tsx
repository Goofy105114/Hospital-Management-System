"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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

export default function PrescriptionsHubPage() {
  const [meds, setMeds] = useState<MedicationItem[]>(INITIAL_MEDS);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [refillSuccess, setRefillSuccess] = useState<string | null>(null);

  const toggleTaken = (id: string) => {
    setMeds((prev) => prev.map((m) => (m.id === id ? { ...m, takenToday: !m.takenToday } : m)));
  };

  const requestRefill = (medName: string) => {
    setRefillSuccess(`Refill request for ${medName} submitted to Pharmacy Dispensary.`);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-space-6 pb-space-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <div className="flex items-center gap-space-3">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                My Prescriptions & Medications
              </h1>
              <Badge variant="success" className="text-xs">
                {meds.filter((m) => m.status === "ACTIVE").length} Active Regimens
              </Badge>
            </div>
            <p className="font-body-md text-on-surface-variant mt-1">
              Patient: Eleanor Pena (MRN-2026-001842) • Automated Refills & Adherence Tracking
            </p>
          </div>

          <div className="flex items-center gap-space-3">
            <Button
              onClick={() => setQrModalOpen(true)}
              className="bg-primary text-white hover:bg-primary/90 gap-1 shadow-xs font-semibold"
            >
              <span className="material-symbols-outlined text-base">qr_code_2</span>
              Show Pharmacy Pickup QR
            </Button>
          </div>
        </div>

        {refillSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-space-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-space-2">
              <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              <span className="font-body-md font-medium">{refillSuccess}</span>
            </div>
            <button
              onClick={() => setRefillSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Daily Adherence Banner */}
        <div className="p-space-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-space-4">
          <div className="flex items-center gap-space-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-primary flex items-center justify-center font-bold text-xl shrink-0">
              <span className="material-symbols-outlined text-2xl">alarm_on</span>
            </div>
            <div>
              <h3 className="font-title-sm font-bold text-on-surface">
                Today&apos;s Medication Schedule
              </h3>
              <p className="text-xs text-outline">
                {meds.filter((m) => m.takenToday).length} of {meds.length} doses logged today
              </p>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{
                  width: `${(meds.filter((m) => m.takenToday).length / meds.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Medication Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-6">
          {meds.map((med) => (
            <Card
              key={med.id}
              className="border border-outline-variant/30 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between"
            >
              <CardHeader className="pb-space-3 border-b border-outline-variant/20">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <Badge variant="primary" className="text-[10px]">
                      {med.indication}
                    </Badge>
                    <CardTitle className="font-title-md text-title-md text-on-surface mt-1">
                      {med.name}
                    </CardTitle>
                    <p className="font-mono text-xs font-bold text-primary">{med.dosage}</p>
                  </div>
                  <Badge variant="success" className="text-[10px]">
                    {med.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-space-4 space-y-space-4 flex-1 flex flex-col justify-between">
                <div className="space-y-space-2 text-xs">
                  <div className="p-space-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20 font-medium text-on-surface">
                    <span className="text-[10px] uppercase font-bold text-outline block">
                      Instructions
                    </span>
                    {med.sig}
                  </div>

                  <div className="flex justify-between py-1 border-b border-outline-variant/10 text-outline">
                    <span>Prescriber:</span>
                    <span className="text-on-surface font-medium">{med.prescribedBy}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-outline-variant/10 text-outline">
                    <span>Refills Left:</span>
                    <span className="font-mono font-bold text-on-surface">
                      {med.refillsRemaining} Refills
                    </span>
                  </div>

                  <div className="flex justify-between py-1 text-outline">
                    <span>Started On:</span>
                    <span className="font-mono">{med.startDate}</span>
                  </div>
                </div>

                <div className="space-y-space-2 pt-space-2 border-t border-outline-variant/20">
                  <Button
                    variant={med.takenToday ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleTaken(med.id)}
                    className={`w-full text-xs font-bold gap-1 ${
                      med.takenToday
                        ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                        : "bg-primary text-white"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {med.takenToday ? "check_circle" : "radio_button_unchecked"}
                    </span>
                    {med.takenToday ? "Dose Logged for Today" : "Mark Taken Today"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => requestRefill(med.name)}
                    className="w-full text-xs border-outline-variant/40 hover:bg-surface-container"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-sm w-full p-space-6 shadow-2xl border border-slate-300 text-center space-y-space-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-teal-900">Hospital Pharmacy Express Pass</h3>
              <button onClick={() => setQrModalOpen(false)} className="text-slate-400">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Present this pass at Central Pharmacy Kiosk Station B for rapid automated dispensing.
            </p>

            {/* Stylized QR placeholder */}
            <div className="p-6 bg-slate-100 rounded-2xl inline-block border-2 border-dashed border-teal-600/50">
              <span className="material-symbols-outlined text-8xl text-teal-800">qr_code_2</span>
              <div className="font-mono text-xs font-bold text-slate-700 mt-2">
                RX-PASS-2026-001842
              </div>
            </div>

            <div className="text-xs font-mono text-slate-500">
              Valid for Eleanor Pena • 3 Active Items Ready
            </div>

            <Button
              className="w-full bg-primary text-white text-xs"
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
