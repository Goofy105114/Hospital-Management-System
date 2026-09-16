"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface AnalyteResult {
  id: string;
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: "NORMAL" | "HIGH" | "LOW" | "CRITICAL";
}

const INITIAL_ANALYTES: AnalyteResult[] = [
  {
    id: "an-1",
    name: "Serum Glucose (Fasting)",
    value: "102",
    unit: "mg/dL",
    referenceRange: "70 - 99 mg/dL",
    status: "HIGH",
  },
  {
    id: "an-2",
    name: "Blood Urea Nitrogen (BUN)",
    value: "16",
    unit: "mg/dL",
    referenceRange: "7 - 20 mg/dL",
    status: "NORMAL",
  },
  {
    id: "an-3",
    name: "Serum Creatinine",
    value: "0.9",
    unit: "mg/dL",
    referenceRange: "0.6 - 1.2 mg/dL",
    status: "NORMAL",
  },
  {
    id: "an-4",
    name: "Serum Sodium (Na+)",
    value: "139",
    unit: "mmol/L",
    referenceRange: "136 - 145 mmol/L",
    status: "NORMAL",
  },
  {
    id: "an-5",
    name: "Serum Potassium (K+)",
    value: "6.2",
    unit: "mmol/L",
    referenceRange: "3.5 - 5.1 mmol/L",
    status: "CRITICAL",
  },
  {
    id: "an-6",
    name: "Serum Calcium",
    value: "9.4",
    unit: "mg/dL",
    referenceRange: "8.5 - 10.5 mg/dL",
    status: "NORMAL",
  },
];

export default function DiagnosticOrderWorkstationPage() {
  const params = useParams();
  const orderId = (params?.id as string) || "dia-01";

  const [order] = useState({
    id: orderId,
    orderNumber: "DIA-2026-0042",
    testName: "Comprehensive Metabolic Panel (CMP)",
    patientName: "Eleanor Pena",
    patientMrn: "MRN-2026-001842",
    doctorName: "Dr. Marcus Vance",
    orderedAt: "Oct 24, 2026 • 10:35 AM",
    specimenBarcode: "BAR-CMP-84920",
    specimenCollectedAt: "Oct 24, 2026 • 10:48 AM",
    technicianName: "Alex Morgan, MLS(ASCP)",
    status: "RESULT_PENDING",
  });

  const [analytes, setAnalytes] = useState<AnalyteResult[]>(INITIAL_ANALYTES);
  const [isVerified, setIsVerified] = useState(false);
  const [isReleasedToPatient, setIsReleasedToPatient] = useState(false);

  const hasCritical = analytes.some((a) => a.status === "CRITICAL");

  const handleUpdateValue = (id: string, newValue: string) => {
    setAnalytes(
      analytes.map((a) => {
        if (a.id !== id) return a;
        let status: "NORMAL" | "HIGH" | "LOW" | "CRITICAL" = "NORMAL";
        const val = parseFloat(newValue);
        if (a.name.includes("Potassium")) {
          if (val > 6.0) status = "CRITICAL";
          else if (val > 5.1) status = "HIGH";
          else if (val < 3.5) status = "LOW";
        } else if (a.name.includes("Glucose")) {
          if (val > 100) status = "HIGH";
          else if (val < 70) status = "LOW";
        }
        return { ...a, value: newValue, status };
      })
    );
  };

  return (
    <AppLayout>
      <div className="space-y-space-6 max-w-5xl mx-auto pb-space-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-space-2 text-label-md text-outline">
          <Link href="/diagnostics" className="hover:text-primary transition-colors">
            Diagnostic Center
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface font-semibold">Specimen Workstation</span>
          <span className="font-mono text-label-sm text-outline">({order.orderNumber})</span>
        </div>

        {/* Critical Alert Warning Banner (DIA-04, DIA-05) */}
        {hasCritical && (
          <div className="p-space-4 bg-error/15 border-2 border-error rounded-xl flex items-center justify-between text-on-error-container animate-pulse">
            <div className="flex items-center gap-space-3">
              <span className="material-symbols-outlined text-error text-[32px]">crisis_alert</span>
              <div>
                <span className="font-title-md font-bold text-error block">
                  CRITICAL RESULT DETECTED (DIA-05): Immediate Notification Triggered
                </span>
                <span className="text-body-sm text-on-surface">
                  Serum Potassium = 6.2 mmol/L exceeds critical threshold (&gt;6.0 mmol/L). Ordering
                  clinician (Dr. Marcus Vance) has been alerted via urgent push and SMS.
                </span>
              </div>
            </div>
            <Badge variant="danger" className="text-label-sm uppercase font-mono">
              STAT ESCALATION
            </Badge>
          </div>
        )}

        {/* Order & Specimen Context Header */}
        <div className="p-space-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-space-4">
          <div>
            <div className="flex items-center gap-space-3">
              <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface">
                {order.testName}
              </h1>
              <Badge variant="outline" className="font-mono text-primary font-bold">
                {order.orderNumber}
              </Badge>
            </div>
            <div className="flex items-center gap-space-3 text-body-sm text-outline mt-space-1 flex-wrap">
              <span>
                Patient: <strong className="text-on-surface">{order.patientName}</strong> (
                {order.patientMrn})
              </span>
              <span>•</span>
              <span>Ordering: {order.doctorName}</span>
              <span>•</span>
              <span>Ordered: {order.orderedAt}</span>
            </div>
          </div>

          <div className="flex items-center gap-space-2">
            <Link href="/diagnostics">
              <Button variant="outline" size="sm" className="gap-space-1">
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Worklist
              </Button>
            </Link>
          </div>
        </div>

        {/* Specimen Tracking Strip (DIA-03) */}
        <div className="p-space-4 bg-surface-container rounded-xl border border-outline-variant/30 grid grid-cols-1 sm:grid-cols-3 gap-space-4 text-body-sm">
          <div>
            <span className="text-label-xs uppercase font-semibold text-outline block">
              Specimen Barcode
            </span>
            <span className="font-mono font-bold text-on-surface text-title-sm">
              {order.specimenBarcode}
            </span>
          </div>
          <div>
            <span className="text-label-xs uppercase font-semibold text-outline block">
              Collected Timestamp
            </span>
            <span className="font-medium text-on-surface">{order.specimenCollectedAt}</span>
          </div>
          <div>
            <span className="text-label-xs uppercase font-semibold text-outline block">
              Processing MLS Technician
            </span>
            <span className="font-medium text-on-surface">{order.technicianName}</span>
          </div>
        </div>

        {/* Result Entry Grid (DIA-04) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Assay Result Entry & Flagging (DIA-04)</CardTitle>
                <CardDescription>
                  Enter measured laboratory values. Automatic abnormal and critical range
                  validation.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-label-xs font-mono">
                {analytes.length} ANALYTES
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-body-sm text-left border-collapse">
              <thead className="bg-surface-container text-label-sm font-semibold text-outline uppercase border-y border-outline-variant/30">
                <tr>
                  <th className="py-space-3 px-space-4">Analyte Component</th>
                  <th className="py-space-3 px-space-4">Measured Value</th>
                  <th className="py-space-3 px-space-4">Standard Unit</th>
                  <th className="py-space-3 px-space-4">Biological Reference Interval</th>
                  <th className="py-space-3 px-space-4 text-right">Clinical Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {analytes.map((analyte) => (
                  <tr key={analyte.id} className="hover:bg-surface-container-high/40">
                    <td className="py-space-3 px-space-4 font-bold text-on-surface">
                      {analyte.name}
                    </td>
                    <td className="py-space-3 px-space-4">
                      <input
                        type="text"
                        value={analyte.value}
                        onChange={(e) => handleUpdateValue(analyte.id, e.target.value)}
                        className="w-24 px-space-2 py-1 bg-surface-container-lowest border border-outline-variant/40 rounded font-mono font-bold text-body-md focus:outline-none focus:border-primary"
                      />
                    </td>
                    <td className="py-space-3 px-space-4 font-mono text-outline">{analyte.unit}</td>
                    <td className="py-space-3 px-space-4 font-mono text-outline">
                      {analyte.referenceRange}
                    </td>
                    <td className="py-space-3 px-space-4 text-right">
                      <Badge
                        variant="outline"
                        className={
                          analyte.status === "CRITICAL"
                            ? "bg-error text-on-error border-transparent font-bold animate-pulse"
                            : analyte.status === "HIGH" || analyte.status === "LOW"
                              ? "bg-warning/20 text-warning border-warning/40 font-bold"
                              : "bg-success/10 text-success border-success/30"
                        }
                      >
                        {analyte.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Verification & Release Action Bar (DIA-04, DIA-05) */}
        <div className="p-space-6 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-space-4">
          <div>
            <span className="font-title-sm font-bold text-on-surface block">
              Quality Assurance & Clinician Release Protocol
            </span>
            <p className="text-body-sm text-outline mt-space-1">
              Dual-verification ensures high diagnostic integrity before EHR publication.
            </p>
          </div>

          <div className="flex items-center gap-space-3 flex-wrap">
            {!isVerified ? (
              <Button variant="outline" onClick={() => setIsVerified(true)} className="gap-space-2">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                Senior Tech Verification
              </Button>
            ) : (
              <Badge
                variant="primary"
                className="bg-success/15 text-success font-bold py-1.5 px-space-3"
              >
                ✓ QA Verified
              </Badge>
            )}

            {!isReleasedToPatient ? (
              <Button
                variant="primary"
                onClick={() => setIsReleasedToPatient(true)}
                className="gap-space-2"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                Release Report to Patient (DIA-05)
              </Button>
            ) : (
              <Badge
                variant="primary"
                className="bg-primary/15 text-primary font-bold py-1.5 px-space-3"
              >
                Released to Patient EHR
              </Badge>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
