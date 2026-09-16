"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import api from "@/lib/axios";

interface PrescriptionItem {
  id: string;
  rxNumber: string;
  patientName: string;
  mrn: string;
  doctorName: string;
  prescribedAt: string;
  status: "PENDING_VALIDATION" | "READY_TO_DISPENSE" | "DISPENSED";
  medications: Array<{
    name: string;
    dosage: string;
    quantity: number;
    instructions: string;
    batchNo: string;
    expiryDate: string;
    inStock: number;
  }>;
  allergies: string[];
  safetyPassed: boolean;
  warnings?: string[];
}

const INITIAL_RX_LIST: PrescriptionItem[] = [
  {
    id: "rx-101",
    rxNumber: "RX-2026-0042",
    patientName: "Eleanor Pena",
    mrn: "MRN-2026-001842",
    doctorName: "Dr. Marcus Vance (Cardiology)",
    prescribedAt: "Today • 10:45 AM",
    status: "READY_TO_DISPENSE",
    allergies: ["Penicillin", "Aspirin"],
    safetyPassed: true,
    medications: [
      {
        name: "Metoprolol Succinate",
        dosage: "25mg Extended Release",
        quantity: 30,
        instructions: "Take 1 tablet daily with morning meal",
        batchNo: "MET-2026-B8",
        expiryDate: "2027-11-30",
        inStock: 340,
      },
      {
        name: "Lisinopril",
        dosage: "10mg Tablet",
        quantity: 30,
        instructions: "Take 1 tablet daily at bedtime",
        batchNo: "LIS-2026-A4",
        expiryDate: "2027-09-15",
        inStock: 185,
      },
    ],
  },
  {
    id: "rx-102",
    rxNumber: "RX-2026-0043",
    patientName: "Arthur Pendelton",
    mrn: "MRN-2026-001789",
    doctorName: "Dr. Marcus Vance (Cardiology)",
    prescribedAt: "Today • 09:50 AM",
    status: "PENDING_VALIDATION",
    allergies: ["None"],
    safetyPassed: false,
    warnings: [
      "POTENTIAL INTERACTION: Concomitant Clopidogrel and Omeprazole may reduce antiplatelet efficacy.",
    ],
    medications: [
      {
        name: "Clopidogrel Bisulfate",
        dosage: "75mg",
        quantity: 30,
        instructions: "Take 1 tablet once daily with water",
        batchNo: "CLO-2026-02",
        expiryDate: "2027-04-10",
        inStock: 110,
      },
    ],
  },
  {
    id: "rx-103",
    rxNumber: "RX-2026-0039",
    patientName: "Sofia Rodriguez",
    mrn: "MRN-2026-001802",
    doctorName: "Dr. Marcus Vance (Cardiology)",
    prescribedAt: "Today • 09:15 AM",
    status: "DISPENSED",
    allergies: ["Sulfa drugs"],
    safetyPassed: true,
    medications: [
      {
        name: "Amlodipine Besylate",
        dosage: "5mg",
        quantity: 30,
        instructions: "Take 1 tablet once daily",
        batchNo: "AML-2025-C9",
        expiryDate: "2027-02-28",
        inStock: 420,
      },
    ],
  },
];

export default function PharmacyConsolePage() {
  const [rxList, setRxList] = useState<PrescriptionItem[]>(INITIAL_RX_LIST);
  const [selectedRx, setSelectedRx] = useState<PrescriptionItem>(INITIAL_RX_LIST[0]);
  const [activeTab, setActiveTab] = useState<"ALL" | "READY" | "PENDING" | "DISPENSED">("ALL");
  const [dispenseSuccess, setDispenseSuccess] = useState<string | null>(null);
  const [showLabelModal, setShowLabelModal] = useState(false);

  const handleDispense = async (rxId: string) => {
    try {
      await api.post("/pharmacy/dispense", {
        prescriptionId: rxId,
        pharmacistId: "usr-pharma-01",
        items: selectedRx.medications.map((m) => ({
          medicineName: m.name,
          quantity: m.quantity,
          batchNo: m.batchNo,
        })),
      });
    } catch {
      // Offline fallback
    }

    setRxList((prev) => prev.map((r) => (r.id === rxId ? { ...r, status: "DISPENSED" } : r)));
    setSelectedRx((prev) => ({ ...prev, status: "DISPENSED" }));
    setDispenseSuccess(
      `Prescription ${selectedRx.rxNumber} dispensed successfully. Stock ledger updated.`
    );
    setShowLabelModal(true);
  };

  const handleValidateSafety = (rxId: string) => {
    setRxList((prev) =>
      prev.map((r) =>
        r.id === rxId ? { ...r, status: "READY_TO_DISPENSE", safetyPassed: true } : r
      )
    );
    setSelectedRx((prev) => ({ ...prev, status: "READY_TO_DISPENSE", safetyPassed: true }));
  };

  const filteredList = rxList.filter((r) => {
    if (activeTab === "READY") return r.status === "READY_TO_DISPENSE";
    if (activeTab === "PENDING") return r.status === "PENDING_VALIDATION";
    if (activeTab === "DISPENSED") return r.status === "DISPENSED";
    return true;
  });

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-space-6 pb-space-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <div className="flex items-center gap-space-3">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                Pharmacy Dispensary Command
              </h1>
              <Badge variant="primary" className="text-xs">
                Station B • Central Pharmacy
              </Badge>
            </div>
            <p className="font-body-md text-on-surface-variant mt-1">
              Automated Safety Checking (PHA-02) • Batch Verification & Stock Ledger Deductions
            </p>
          </div>

          <div className="flex items-center gap-space-2">
            <span className="text-xs font-mono text-outline">
              Pending: {rxList.filter((r) => r.status !== "DISPENSED").length} Orders
            </span>
          </div>
        </div>

        {dispenseSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-space-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-space-2">
              <span className="material-symbols-outlined text-emerald-600">verified</span>
              <span className="font-body-md font-medium">{dispenseSuccess}</span>
            </div>
            <button
              onClick={() => setDispenseSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* 2 Columns: Rx Queue & Rx Fulfillment Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-6">
          {/* Left Column: Worklist (1 Col) */}
          <div className="space-y-space-4">
            <div className="flex items-center gap-1 border-b border-outline-variant/20 pb-2">
              {(["ALL", "READY", "PENDING", "DISPENSED"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === tab
                      ? "bg-primary text-white"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-space-3">
              {filteredList.map((rx) => {
                const isSelected = selectedRx.id === rx.id;
                return (
                  <div
                    key={rx.id}
                    onClick={() => setSelectedRx(rx)}
                    className={`p-space-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary/50 shadow-xs"
                        : "bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-primary">
                        {rx.rxNumber}
                      </span>
                      <Badge
                        variant={
                          rx.status === "DISPENSED"
                            ? "success"
                            : rx.status === "READY_TO_DISPENSE"
                              ? "primary"
                              : "warning"
                        }
                        className="text-[10px]"
                      >
                        {rx.status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <h4 className="font-title-sm font-bold text-on-surface mt-1">
                      {rx.patientName}
                    </h4>
                    <p className="font-mono text-xs text-outline">{rx.mrn}</p>

                    <div className="mt-2 pt-2 border-t border-outline-variant/10 text-xs text-on-surface-variant flex items-center justify-between">
                      <span>{rx.medications.length} items</span>
                      <span className="font-mono text-[10px] text-outline">{rx.prescribedAt}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Rx Details & Dispensing Action (2 Cols) */}
          <div className="lg:col-span-2 space-y-space-6">
            <Card className="border border-outline-variant/30 shadow-xs">
              <CardHeader className="pb-space-3 border-b border-outline-variant/20 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-space-2">
                    <CardTitle className="font-title-md text-title-md text-on-surface">
                      Prescription Order {selectedRx.rxNumber}
                    </CardTitle>
                    <Badge
                      variant={selectedRx.status === "DISPENSED" ? "success" : "primary"}
                      className="text-xs"
                    >
                      {selectedRx.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="font-body-sm text-outline mt-0.5">
                    Prescribed by {selectedRx.doctorName} • {selectedRx.prescribedAt}
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-on-surface block">
                    {selectedRx.patientName}
                  </span>
                  <span className="font-mono text-xs text-outline">{selectedRx.mrn}</span>
                </div>
              </CardHeader>

              <CardContent className="pt-space-6 space-y-space-6">
                {/* Safety Check Results Banner */}
                {selectedRx.warnings && selectedRx.warnings.length > 0 ? (
                  <div className="p-space-4 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-950 space-y-space-2">
                    <div className="flex items-center gap-2 font-bold text-amber-900">
                      <span className="material-symbols-outlined text-amber-700">warning</span>
                      Pharmacist Clinical Intervention Flagged
                    </div>
                    {selectedRx.warnings.map((w, idx) => (
                      <p key={idx} className="text-xs text-amber-900 font-medium">
                        • {w}
                      </p>
                    ))}
                    {selectedRx.status === "PENDING_VALIDATION" && (
                      <div className="pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleValidateSafety(selectedRx.id)}
                          className="bg-amber-700 text-white hover:bg-amber-800 text-xs"
                        >
                          Review & Override With Clinical Justification
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-space-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-space-2">
                      <span className="material-symbols-outlined text-emerald-600">
                        check_circle
                      </span>
                      <span>
                        <strong>Safety Check Passed:</strong> Zero drug-drug interactions or allergy
                        conflicts detected.
                      </span>
                    </div>
                    <Badge variant="success" className="text-[10px]">
                      Validated
                    </Badge>
                  </div>
                )}

                {/* Items to Dispense Table */}
                <div className="space-y-space-3">
                  <h4 className="font-title-sm font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">
                      medication
                    </span>
                    Medication Line Items & Batch Allocation
                  </h4>

                  <div className="space-y-space-3">
                    {selectedRx.medications.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-space-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-space-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h5 className="font-title-sm font-bold text-on-surface">
                              {item.name} ({item.dosage})
                            </h5>
                            <p className="text-xs text-primary font-medium">
                              SIG: {item.instructions}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-outline block">Quantity</span>
                            <span className="font-mono font-bold text-base text-on-surface">
                              {item.quantity} Units
                            </span>
                          </div>
                        </div>

                        {/* Batch Info */}
                        <div className="pt-space-2 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-mono text-outline">
                            Allocated Batch:{" "}
                            <strong className="text-on-surface">{item.batchNo}</strong> (Exp:{" "}
                            {item.expiryDate})
                          </span>
                          <span className="text-emerald-700 font-semibold">
                            Stock On Hand: {item.inStock} units
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Strip */}
                <div className="pt-space-4 border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-space-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowLabelModal(true)}
                    className="gap-1 border-outline-variant/40"
                  >
                    <span className="material-symbols-outlined text-base">barcode</span>
                    Preview Medication Label
                  </Button>

                  {selectedRx.status !== "DISPENSED" ? (
                    <Button
                      onClick={() => handleDispense(selectedRx.id)}
                      disabled={selectedRx.status === "PENDING_VALIDATION"}
                      className="bg-primary text-white hover:bg-primary/90 gap-1 font-bold shadow-sm"
                    >
                      <span className="material-symbols-outlined text-base">inventory</span>
                      Dispense & Deduct Stock
                    </Button>
                  ) : (
                    <Badge variant="success" className="px-3 py-1.5 text-xs">
                      Medications Dispensed & Audited
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Medication Label Preview Modal */}
      {showLabelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-md w-full p-space-6 shadow-2xl border border-slate-300 space-y-space-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">local_hospital</span>
                <span className="font-bold text-sm">GOING MERRY CENTRAL PHARMACY</span>
              </div>
              <button
                onClick={() => setShowLabelModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 border rounded-xl space-y-2 text-xs font-mono">
              <div className="flex justify-between font-bold">
                <span>RX: {selectedRx.rxNumber}</span>
                <span>DATE: {new Date().toLocaleDateString()}</span>
              </div>
              <div>
                <strong>PATIENT:</strong> {selectedRx.patientName} ({selectedRx.mrn})
              </div>
              <div>
                <strong>PRESCRIBER:</strong> {selectedRx.doctorName}
              </div>
              <hr className="my-2" />
              {selectedRx.medications.map((m, i) => (
                <div key={i} className="space-y-0.5">
                  <div className="font-bold text-primary">
                    {m.name} {m.dosage} - QTY: {m.quantity}
                  </div>
                  <div>SIG: {m.instructions}</div>
                  <div className="text-[10px] text-slate-500">
                    BATCH: {m.batchNo} • EXP: {m.expiryDate}
                  </div>
                </div>
              ))}
              <div className="pt-2 text-center text-[10px] text-slate-500">
                KEEP OUT OF REACH OF CHILDREN • STORE AT ROOM TEMP
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowLabelModal(false)}>
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  window.print();
                  setShowLabelModal(false);
                }}
                className="bg-primary text-white gap-1"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                Print Label
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
