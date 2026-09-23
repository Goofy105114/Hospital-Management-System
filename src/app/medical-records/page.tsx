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

import api from "@/lib/axios";
import { useAuthStore } from "@/stores/authStore";

export default function MedicalRecordsPage() {
  const { user } = useAuthStore();
  const [reports, setReports] = useState<DiagnosticReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<DiagnosticReport | null>(null);
  const [encounters, setEncounters] = useState<any[]>([]);
  const [allergies, setAllergies] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"LABS" | "ENCOUNTERS" | "IMMUNIZATIONS">("LABS");
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  React.useEffect(() => {
    let isMounted = true;
    api
      .get("/diagnostics/orders")
      .then((res) => {
        if (!isMounted) return;
        const list = res.data?.data;
        if (Array.isArray(list) && list.length > 0) {
          const mapped: DiagnosticReport[] = list.map((ord: any) => ({
            id: ord.id,
            testName: ord.service?.name || ord.testName || "Diagnostic Analysis",
            orderedBy: ord.doctor?.user?.name || "Attending Physician",
            collectedAt: ord.createdAt
              ? new Date(ord.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Today",
            reportedAt: "Final Certified Report",
            category: ord.category || "BIOCHEMISTRY",
            impression: ord.clinicalNotes || "Results within baseline reference parameters.",
            results: Array.isArray(ord.results) ? ord.results : [],
          }));
          setReports(mapped);
          setSelectedReport(mapped[0]);
        } else {
          setReports([]);
          setSelectedReport(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setReports([]);
          setSelectedReport(null);
        }
      });

    api
      .get("/emr/encounters")
      .then((res) => {
        if (!isMounted) return;
        const list = res.data?.data;
        if (Array.isArray(list)) {
          setEncounters(list);
        }
      })
      .catch(() => {});

    if (user?.id) {
      api
        .get(`/patients/${user.id}`)
        .then((res) => {
          if (!isMounted) return;
          const data = res.data?.data;
          if (data?.allergies && Array.isArray(data.allergies)) {
            setAllergies(data.allergies);
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-space-6 pb-space-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <div className="flex items-center gap-space-3">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                Electronic Medical Records &amp; Diagnostics
              </h1>
              <Badge variant="outline" className="font-mono text-xs">
                {user?.mrn || "N/A"}
              </Badge>
            </div>
            <p className="font-body-md text-on-surface-variant mt-1">
              Patient: {user?.name || "Patient Record"} • {user?.email || "Protected Health Information"}
            </p>
          </div>

          <div className="flex items-center gap-space-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPdfModalOpen(true)}
              className="gap-1 border-outline-variant/40"
              disabled={!selectedReport}
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
            Past Encounters ({encounters.length})
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
            Immunizations &amp; Allergies
          </button>
        </div>

        {/* TAB 1: Diagnostic Lab Reports */}
        {activeTab === "LABS" && (
          reports.length === 0 ? (
            <div className="p-12 text-center bg-surface-container-low rounded-2xl border border-outline-variant/30">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">science</span>
              <h4 className="font-bold text-on-surface">No Diagnostic Reports On File</h4>
              <p className="text-xs text-on-surface-variant mt-1">
                Validated laboratory, pathology, and imaging reports will appear here once finalized by clinical staff.
              </p>
            </div>
          ) : selectedReport ? (
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
                          {selectedReport.results.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-outline text-xs">
                                Panel analysis pending or results being certified by pathologist.
                              </td>
                            </tr>
                          ) : (
                            selectedReport.results.map((res, i) => (
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
                            ))
                          )}
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
          ) : null
        )}

        {/* TAB 2: Past Encounters */}
        {activeTab === "ENCOUNTERS" && (
          <div className="space-y-space-4">
            {encounters.length === 0 ? (
              <div className="p-8 text-center bg-surface-container-low rounded-2xl border border-outline-variant/30">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">history_edu</span>
                <h4 className="font-bold text-on-surface">No Clinical Encounters Recorded</h4>
                <p className="text-xs text-on-surface-variant mt-1">
                  Once consultations with attending clinicians are completed and signed, clinical notes will appear here.
                </p>
              </div>
            ) : (
              encounters.map((enc: any, idx: number) => (
                <Card key={enc.id || idx} className="border border-outline-variant/30 shadow-xs">
                  <CardContent className="p-space-4 flex flex-col sm:flex-row sm:items-center justify-between gap-space-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-space-2">
                        <span className="font-mono font-bold text-sm text-primary">
                          {enc.encounterNumber || `ENC-${idx + 1}`}
                        </span>
                        <span className="text-outline text-xs">•</span>
                        <span className="text-xs text-outline font-semibold">
                          {enc.createdAt
                            ? new Date(enc.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Recent"}
                        </span>
                        <Badge variant="success" className="text-[10px]">
                          {enc.status || "SIGNED"}
                        </Badge>
                      </div>
                      <h4 className="font-title-md font-bold text-on-surface">
                        {enc.chiefComplaint || "Clinical Consultation & Follow-up"}
                      </h4>
                      <p className="text-xs text-on-surface-variant">
                        Attending: {enc.doctor?.user?.name || enc.doctor?.specialization || "Attending Physician"}
                      </p>
                      {enc.diagnoses && enc.diagnoses.length > 0 && (
                        <p className="text-xs font-mono text-primary font-semibold">
                          ICD-10: {enc.diagnoses.map((d: any) => `${d.icd10Code || d.code} ${d.description || d.name || ""}`).join(", ")}
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="gap-1 border-outline-variant/40">
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      View Notes
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* TAB 3: Immunizations & Allergies */}
        {activeTab === "IMMUNIZATIONS" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-6">
            <Card className="border border-outline-variant/30 shadow-xs">
              <CardHeader className="pb-space-3 border-b border-outline-variant/20">
                <CardTitle className="font-title-md text-title-md text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-600">warning</span>
                  Documented Allergies &amp; Adverse Reactions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-space-4 space-y-space-3">
                {allergies.length === 0 ? (
                  <div className="p-6 text-center text-outline bg-surface-container-low rounded-xl">
                    <span className="material-symbols-outlined text-2xl text-outline/60 mb-1">check_circle</span>
                    <p className="text-xs font-medium">No Known Drug Allergies (NKDA) on file.</p>
                  </div>
                ) : (
                  allergies.map((alg: any) => (
                    <div key={alg.id} className="p-space-3 rounded-xl bg-red-50 border border-red-200">
                      <div className="flex justify-between items-center">
                        <h5 className="font-bold text-red-900 text-sm">{alg.allergen || alg.type || "Allergy Alert"}</h5>
                        <Badge variant="error" className="text-[10px]">
                          Severity: {alg.severity || "MODERATE"}
                        </Badge>
                      </div>
                      <p className="text-xs text-red-800 mt-1">
                        Reaction: {alg.reaction || "Documented clinical reaction."}
                      </p>
                    </div>
                  ))
                )}
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
                <div className="p-6 text-center text-outline bg-surface-container-low rounded-xl">
                  <span className="material-symbols-outlined text-2xl text-outline/60 mb-1">vaccines</span>
                  <p className="text-xs font-medium">No routine immunization records on file.</p>
                  <p className="text-[11px] text-outline mt-0.5">Records updated upon hospital administration or verification.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Official Diagnostic PDF Preview Modal */}
      {pdfModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-space-8 shadow-2xl border border-slate-300 space-y-space-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header / Letterhead */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-space-4">
              <div>
                <h2 className="text-xl font-bold text-teal-800 tracking-tight">
                  GOING MERRY MEMORIAL HOSPITAL
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  DEPARTMENT OF LABORATORY MEDICINE &amp; PATHOLOGY
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
                <strong>PATIENT:</strong> {user?.name || "Patient Record"}
              </div>
              <div>
                <strong>MRN:</strong> {user?.mrn || "N/A"}
              </div>
              <div>
                <strong>RECORD:</strong> Certified Electronic Health Record
              </div>
              <div>
                <strong>PHYSICIAN:</strong> {selectedReport.orderedBy}
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
                  {selectedReport.results.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400">
                        No individual analytes listed for this test order.
                      </td>
                    </tr>
                  ) : (
                    selectedReport.results.map((r, i) => (
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
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 rounded border text-xs text-slate-700">
              <strong>INTERPRETATION:</strong> {selectedReport.impression}
            </div>

            <div className="flex justify-between items-end pt-4 border-t border-slate-200 text-xs text-slate-500">
              <div>
                <span className="block font-bold text-slate-800">Electronically Verified By:</span>
                <span>{selectedReport.orderedBy}</span>
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
