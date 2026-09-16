"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface LabResult {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: "NORMAL" | "HIGH" | "LOW" | "CRITICAL";
}

interface DiagnosticReport {
  id: string;
  testName: string;
  orderedBy: string;
  collectedAt: string;
  reportedAt: string;
  category: "BIOCHEMISTRY" | "HEMATOLOGY" | "CARDIOLOGY" | "RADIOLOGY";
  results: LabResult[];
  impression: string;
}

const REPORTS_CATALOG: DiagnosticReport[] = [
  {
    id: "rep-cmp-01",
    testName: "Comprehensive Metabolic Panel (CMP)",
    orderedBy: "Dr. Marcus Vance",
    collectedAt: "Oct 24, 2026 • 08:45 AM",
    reportedAt: "Oct 24, 2026 • 10:15 AM",
    category: "BIOCHEMISTRY",
    impression:
      "Normal electrolyte and renal function profile. Fasting plasma glucose within normal limits.",
    results: [
      {
        parameter: "Glucose (Fasting)",
        value: "92",
        unit: "mg/dL",
        referenceRange: "70 - 99",
        status: "NORMAL",
      },
      {
        parameter: "Blood Urea Nitrogen (BUN)",
        value: "14",
        unit: "mg/dL",
        referenceRange: "7 - 20",
        status: "NORMAL",
      },
      {
        parameter: "Serum Creatinine",
        value: "0.85",
        unit: "mg/dL",
        referenceRange: "0.60 - 1.10",
        status: "NORMAL",
      },
      {
        parameter: "Sodium",
        value: "140",
        unit: "mEq/L",
        referenceRange: "136 - 145",
        status: "NORMAL",
      },
      {
        parameter: "Potassium",
        value: "4.2",
        unit: "mEq/L",
        referenceRange: "3.5 - 5.1",
        status: "NORMAL",
      },
      {
        parameter: "Chloride",
        value: "102",
        unit: "mEq/L",
        referenceRange: "98 - 107",
        status: "NORMAL",
      },
      {
        parameter: "Calcium",
        value: "9.4",
        unit: "mg/dL",
        referenceRange: "8.6 - 10.2",
        status: "NORMAL",
      },
      {
        parameter: "eGFR",
        value: "> 90",
        unit: "mL/min/1.73m²",
        referenceRange: "> 60",
        status: "NORMAL",
      },
    ],
  },
  {
    id: "rep-lip-02",
    testName: "Lipid Panel (Fasting)",
    orderedBy: "Dr. Marcus Vance",
    collectedAt: "Oct 24, 2026 • 08:45 AM",
    reportedAt: "Oct 24, 2026 • 10:15 AM",
    category: "BIOCHEMISTRY",
    impression:
      "Mildly elevated LDL cholesterol. Dietary counseling and lifestyle optimization recommended.",
    results: [
      {
        parameter: "Total Cholesterol",
        value: "212",
        unit: "mg/dL",
        referenceRange: "< 200",
        status: "HIGH",
      },
      {
        parameter: "Triglycerides",
        value: "120",
        unit: "mg/dL",
        referenceRange: "< 150",
        status: "NORMAL",
      },
      {
        parameter: "HDL Cholesterol",
        value: "54",
        unit: "mg/dL",
        referenceRange: "> 50",
        status: "NORMAL",
      },
      {
        parameter: "LDL Cholesterol (Calculated)",
        value: "134",
        unit: "mg/dL",
        referenceRange: "< 100",
        status: "HIGH",
      },
    ],
  },
  {
    id: "rep-ecg-03",
    testName: "12-Lead Resting Electrocardiogram (ECG)",
    orderedBy: "Dr. Marcus Vance",
    collectedAt: "Oct 24, 2026 • 09:10 AM",
    reportedAt: "Oct 24, 2026 • 09:25 AM",
    category: "CARDIOLOGY",
    impression:
      "Sinus rhythm at 72 bpm with occasional premature atrial complexes (PACs). Normal axis. No acute ST-T wave changes indicative of ischemia.",
    results: [
      {
        parameter: "Ventricular Heart Rate",
        value: "72",
        unit: "bpm",
        referenceRange: "60 - 100",
        status: "NORMAL",
      },
      {
        parameter: "PR Interval",
        value: "160",
        unit: "ms",
        referenceRange: "120 - 200",
        status: "NORMAL",
      },
      {
        parameter: "QRS Duration",
        value: "88",
        unit: "ms",
        referenceRange: "60 - 110",
        status: "NORMAL",
      },
      {
        parameter: "QT / QTc Interval",
        value: "390 / 415",
        unit: "ms",
        referenceRange: "< 450",
        status: "NORMAL",
      },
    ],
  },
];

export default function MedicalRecordsPage() {
  const [reports, setReports] = useState<DiagnosticReport[]>(REPORTS_CATALOG);
  const [selectedReport, setSelectedReport] = useState<DiagnosticReport>(REPORTS_CATALOG[0]);
  const [activeTab, setActiveTab] = useState<"LABS" | "ENCOUNTERS" | "IMMUNIZATIONS">("LABS");
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-space-6 pb-space-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <div className="flex items-center gap-space-3">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                Electronic Medical Records & Diagnostics
              </h1>
              <Badge variant="outline" className="font-mono text-xs">
                MRN-2026-001842
              </Badge>
            </div>
            <p className="font-body-md text-on-surface-variant mt-1">
              Patient: Eleanor Pena • Female, 38 yrs • Blood Group: A+
            </p>
          </div>

          <div className="flex items-center gap-space-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPdfModalOpen(true)}
              className="gap-1 border-outline-variant/40"
            >
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              Export Full Health Summary
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-space-2 border-b border-outline-variant/20 pb-space-2">
          <button
            onClick={() => setActiveTab("LABS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-md transition-colors ${
              activeTab === "LABS"
                ? "bg-primary text-white font-bold"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-base">science</span>
            Diagnostic Lab Results ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab("ENCOUNTERS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-md transition-colors ${
              activeTab === "ENCOUNTERS"
                ? "bg-primary text-white font-bold"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-base">history</span>
            Past Encounters (3)
          </button>
          <button
            onClick={() => setActiveTab("IMMUNIZATIONS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-md transition-colors ${
              activeTab === "IMMUNIZATIONS"
                ? "bg-primary text-white font-bold"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-base">vaccines</span>
            Immunizations & Allergies
          </button>
        </div>

        {/* TAB 1: Diagnostic Lab Reports */}
        {activeTab === "LABS" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-6">
            {/* Left Column: Report List */}
            <div className="space-y-space-3">
              <h3 className="font-title-sm font-bold text-outline uppercase tracking-wider text-xs">
                Diagnostic Reports
              </h3>
              {reports.map((report) => {
                const isSelected = selectedReport.id === report.id;
                const hasAbnormal = report.results.some((r) => r.status !== "NORMAL");

                return (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`p-space-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary/50 shadow-xs"
                        : "bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase font-bold text-primary">
                        {report.category}
                      </span>
                      {hasAbnormal ? (
                        <Badge variant="warning" className="text-[10px]">
                          Abnormal Flag
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px]">
                          Normal
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-title-sm font-bold text-on-surface mt-1">
                      {report.testName}
                    </h4>
                    <p className="font-body-sm text-xs text-outline mt-0.5">
                      Reported: {report.reportedAt}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Detailed Test Result Values & Clinical Impression */}
            <div className="lg:col-span-2 space-y-space-6">
              <Card className="border border-outline-variant/30 shadow-xs">
                <CardHeader className="pb-space-3 border-b border-outline-variant/20 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-title-lg text-title-lg text-on-surface">
                      {selectedReport.testName}
                    </CardTitle>
                    <p className="font-body-sm text-outline mt-0.5">
                      Ordered by {selectedReport.orderedBy} • Collected {selectedReport.collectedAt}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPdfModalOpen(true)}
                    className="gap-1 border-outline-variant/40"
                  >
                    <span className="material-symbols-outlined text-base">print</span>
                    Print PDF
                  </Button>
                </CardHeader>

                <CardContent className="pt-space-4 space-y-space-6">
                  {/* Results Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-outline-variant/20 bg-surface-container-low font-label-sm text-outline uppercase tracking-wider text-xs">
                          <th className="p-3">Biomarker / Analyte</th>
                          <th className="p-3">Observed Value</th>
                          <th className="p-3">Reference Range</th>
                          <th className="p-3">Units</th>
                          <th className="p-3">Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {selectedReport.results.map((res, i) => (
                          <tr key={i} className="hover:bg-surface-container/40">
                            <td className="p-3 font-semibold text-on-surface">{res.parameter}</td>
                            <td className="p-3 font-mono font-bold text-base text-on-surface">
                              {res.value}
                            </td>
                            <td className="p-3 font-mono text-xs text-outline">
                              {res.referenceRange}
                            </td>
                            <td className="p-3 text-xs text-outline">{res.unit}</td>
                            <td className="p-3">
                              <Badge
                                variant={
                                  res.status === "NORMAL"
                                    ? "success"
                                    : res.status === "HIGH"
                                      ? "warning"
                                      : "error"
                                }
                                className="text-[10px]"
                              >
                                {res.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Clinical Impression Box */}
                  <div className="p-space-4 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1">
                    <span className="text-xs uppercase font-bold text-primary tracking-wider block">
                      Pathologist / Clinical Interpretation
                    </span>
                    <p className="font-body-md text-on-surface-variant leading-relaxed">
                      {selectedReport.impression}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: Past Encounters */}
        {activeTab === "ENCOUNTERS" && (
          <div className="space-y-space-4">
            {[
              {
                encNo: "ENC-2026-0042",
                date: "Oct 24, 2026",
                doctor: "Dr. Marcus Vance (Chief of Cardiology)",
                reason: "Comprehensive Cardiovascular Follow-up & Stress Echo Review",
                dx: "I10 Essential Hypertension, R00.2 Palpitations",
                status: "SIGNED & LOCKED",
              },
              {
                encNo: "ENC-2026-0012",
                date: "Aug 15, 2026",
                doctor: "Dr. Sarah Jenkins (Internal Medicine)",
                reason: "Annual Physical Examination & Wellness Screen",
                dx: "Z00.00 General adult medical examination",
                status: "SIGNED & LOCKED",
              },
              {
                encNo: "ENC-2025-0891",
                date: "Nov 02, 2025",
                doctor: "Dr. Marcus Vance (Cardiology)",
                reason: "Initial evaluation of elevated blood pressure",
                dx: "I10 Essential Hypertension (New onset)",
                status: "SIGNED & LOCKED",
              },
            ].map((enc, idx) => (
              <Card key={idx} className="border border-outline-variant/30 shadow-xs">
                <CardContent className="p-space-4 flex flex-col sm:flex-row sm:items-center justify-between gap-space-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-space-2">
                      <span className="font-mono font-bold text-sm text-primary">{enc.encNo}</span>
                      <span className="text-outline text-xs">•</span>
                      <span className="text-xs text-outline font-semibold">{enc.date}</span>
                      <Badge variant="success" className="text-[10px]">
                        {enc.status}
                      </Badge>
                    </div>
                    <h4 className="font-title-md font-bold text-on-surface">{enc.reason}</h4>
                    <p className="text-xs text-on-surface-variant">Attending: {enc.doctor}</p>
                    <p className="text-xs font-mono text-primary font-semibold">ICD-10: {enc.dx}</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1 border-outline-variant/40">
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    View Notes
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* TAB 3: Immunizations & Allergies */}
        {activeTab === "IMMUNIZATIONS" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-6">
            <Card className="border border-outline-variant/30 shadow-xs">
              <CardHeader className="pb-space-3 border-b border-outline-variant/20">
                <CardTitle className="font-title-md text-title-md text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-600">warning</span>
                  Documented Allergies & Adverse Reactions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-space-4 space-y-space-3">
                <div className="p-space-3 rounded-xl bg-red-50 border border-red-200">
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-red-900 text-sm">Penicillin Derivatives</h5>
                    <Badge variant="error" className="text-[10px]">
                      Severity: High / Anaphylaxis
                    </Badge>
                  </div>
                  <p className="text-xs text-red-800 mt-1">
                    Reaction: Generalized urticaria, facial angioedema. Verified 2019.
                  </p>
                </div>

                <div className="p-space-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-amber-900 text-sm">Aspirin / NSAIDs</h5>
                    <Badge variant="warning" className="text-[10px]">
                      Severity: Moderate
                    </Badge>
                  </div>
                  <p className="text-xs text-amber-800 mt-1">
                    Reaction: Severe epigastric dyspepsia & gastritis. Verified 2021.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-outline-variant/30 shadow-xs">
              <CardHeader className="pb-space-3 border-b border-outline-variant/20">
                <CardTitle className="font-title-md text-title-md text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">vaccines</span>
                  Immunization History
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-space-4 space-y-space-3">
                {[
                  { name: "Influenza Quadrivalent", date: "Sep 2026", status: "Current" },
                  { name: "COVID-19 Updated Booster", date: "Oct 2025", status: "Current" },
                  {
                    name: "Tdap (Tetanus, Diphtheria, Pertussis)",
                    date: "May 2022",
                    status: "Valid (Next: 2032)",
                  },
                  { name: "Hepatitis B (3-Dose Series)", date: "Completed 2015", status: "Immune" },
                ].map((imm, idx) => (
                  <div
                    key={idx}
                    className="p-space-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between"
                  >
                    <div>
                      <h5 className="font-title-sm font-bold text-on-surface">{imm.name}</h5>
                      <span className="text-xs text-outline">{imm.date}</span>
                    </div>
                    <Badge variant="success" className="text-[10px]">
                      {imm.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Official Diagnostic PDF Preview Modal */}
      {pdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-space-8 shadow-2xl border border-slate-300 space-y-space-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header / Letterhead */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-space-4">
              <div>
                <h2 className="text-xl font-bold text-teal-800 tracking-tight">
                  GOING MERRY MEMORIAL HOSPITAL
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  DEPARTMENT OF LABORATORY MEDICINE & PATHOLOGY
                </p>
                <p className="text-xs text-slate-500">
                  400 West Pavilion Way, Suite 100 • Tel: (555) 019-2831
                </p>
              </div>
              <div className="text-right font-mono text-xs text-slate-500">
                <span className="font-bold text-slate-800 block">CLIA # 99D0872615</span>
                <span>CAP Accredited</span>
              </div>
            </div>

            {/* Patient Demographic Block */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border rounded-lg text-xs font-mono">
              <div>
                <strong>PATIENT:</strong> Eleanor Pena
              </div>
              <div>
                <strong>MRN:</strong> MRN-2026-001842
              </div>
              <div>
                <strong>DOB:</strong> Apr 15, 1988 (Age 38 F)
              </div>
              <div>
                <strong>PHYSICIAN:</strong> Dr. Marcus Vance
              </div>
              <div>
                <strong>COLLECTED:</strong> {selectedReport.collectedAt}
              </div>
              <div>
                <strong>REPORTED:</strong> {selectedReport.reportedAt}
              </div>
            </div>

            {/* Table */}
            <div>
              <h4 className="font-bold text-sm mb-2 text-teal-900 uppercase">
                {selectedReport.testName}
              </h4>
              <table className="w-full text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-left text-slate-600">
                    <th className="py-1.5">Test Parameter</th>
                    <th className="py-1.5">Result</th>
                    <th className="py-1.5">Reference Range</th>
                    <th className="py-1.5">Units</th>
                    <th className="py-1.5">Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedReport.results.map((r, i) => (
                    <tr key={i}>
                      <td className="py-1 font-semibold">{r.parameter}</td>
                      <td className="py-1 font-bold">{r.value}</td>
                      <td className="py-1 text-slate-600">{r.referenceRange}</td>
                      <td className="py-1 text-slate-600">{r.unit}</td>
                      <td className="py-1">
                        {r.status !== "NORMAL" && (
                          <span className="px-1 bg-amber-100 text-amber-900 font-bold rounded">
                            {r.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 rounded border text-xs text-slate-700">
              <strong>INTERPRETATION:</strong> {selectedReport.impression}
            </div>

            <div className="flex justify-between items-end pt-4 border-t border-slate-200 text-xs text-slate-500">
              <div>
                <span className="block font-bold text-slate-800">Electronically Verified By:</span>
                <span>Dr. Julian Ward, MD, FCAP (Chief of Pathology)</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPdfModalOpen(false)}>
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    window.print();
                    setPdfModalOpen(false);
                  }}
                  className="bg-primary text-white gap-1"
                >
                  <span className="material-symbols-outlined text-sm">print</span>
                  Print
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
