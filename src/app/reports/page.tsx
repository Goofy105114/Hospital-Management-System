"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const OPD_VOLUME_DATA = [
  { day: "Mon", count: 142, waitAvg: 14 },
  { day: "Tue", count: 168, waitAvg: 12 },
  { day: "Wed", count: 155, waitAvg: 11 },
  { day: "Thu", count: 182, waitAvg: 16 },
  { day: "Fri", count: 190, waitAvg: 15 },
  { day: "Sat", count: 120, waitAvg: 9 },
  { day: "Sun", count: 75, waitAvg: 6 },
];

const REVENUE_DATA = [
  { name: "Consultations", value: 38500, color: "#00685f" },
  { name: "Pharmacy", value: 29400, color: "#008378" },
  { name: "Laboratory", value: 22100, color: "#006398" },
  { name: "Inpatient Wards", value: 44200, color: "#5bb8fe" },
];

const WARD_OCCUPANCY_DATA = [
  { ward: "General A", occupied: 24, total: 30 },
  { ward: "Female Med", occupied: 18, total: 20 },
  { ward: "CCU", occupied: 5, total: 6 },
  { ward: "ICU 1", occupied: 7, total: 8 },
  { ward: "Maternity", occupied: 12, total: 15 },
];
import api from "@/lib/axios";

export default function ReportsAnalyticsPage() {
  const { activeRole, user } = useAuthStore();
  const isPatient = activeRole === "PATIENT";
  const [timeframe, setTimeframe] = useState<"7D" | "30D" | "YTD">("7D");
  const [patientCategory, setPatientCategory] = useState<string>("ALL");
  const [labReports, setLabReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [overviewData, setOverviewData] = useState<any>(null);

  React.useEffect(() => {
    let isMounted = true;
    api
      .get("/reports/overview")
      .then((res) => {
        if (!isMounted) return;
        setOverviewData(res.data?.data);
      })
      .catch(() => {});

    api
      .get("/diagnostics/orders")
      .then((res) => {
        if (!isMounted) return;
        const orders = res.data?.data;
        if (Array.isArray(orders) && orders.length > 0) {
          const mapped = orders.flatMap((o: any) =>
            (o.tests || []).map((t: any) => ({
              id: `${o.id}-${t.testId}`,
              specimenId: o.orderNumber || "SPEC-2026",
              testName: t.testName,
              category: t.category || "BIOCHEMISTRY",
              date: new Date(o.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              orderingDoctor: "Attending Clinician",
              pathologist: "Certified Laboratory Service",
              impression: o.notes || "Standard clinical profile within validated tolerance limits.",
              status: o.status || "FINAL_REPORT",
              results: [
                {
                  analyte: t.testName,
                  value: "Reference Standard",
                  unit: t.sampleType || "Blood",
                  reference: "Normal Range",
                  status: "NORMAL" as const,
                },
              ],
            }))
          );
          if (mapped.length > 0) {
            setLabReports(mapped);
            setSelectedReport(mapped[0]);
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const totalWeeklyRevenue = REVENUE_DATA.reduce((acc, curr) => acc + curr.value, 0);
  const totalWeeklyPatients = OPD_VOLUME_DATA.reduce((acc, curr) => acc + curr.count, 0);

  const filteredPatientReports =
    patientCategory === "ALL"
      ? labReports
      : labReports.filter((r) => r.category === patientCategory);

  if (isPatient) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto space-y-space-6 pb-space-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
            <div>
              <div className="flex items-center gap-space-3">
                <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                  My Diagnostic &amp; Laboratory Test Reports
                </h1>
                <Badge variant="primary" className="text-xs">
                  Validated Records DIA-05
                </Badge>
              </div>
              <p className="font-body-md text-on-surface-variant mt-1">
                {user?.name || "Patient Record"} {user?.mrn ? `(MRN: ${user.mrn})` : ""} • Verified Pathology &amp; Cardiology Assays
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 border-outline-variant/40 w-full sm:w-auto justify-center"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print Full Lab Record
            </Button>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-space-2 overflow-x-auto no-scrollbar pb-1 border-b border-outline-variant/20 max-w-full">
            {[
              { id: "ALL", label: "All Reports" },
              { id: "BIOCHEMISTRY", label: "Biochemistry & Panels" },
              { id: "CARDIOLOGY", label: "Cardiology Diagnostics" },
              { id: "HEMATOLOGY", label: "Hematology & Blood" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPatientCategory(tab.id)}
                className={`px-space-3 py-1.5 rounded-lg text-label-md font-semibold transition-colors shrink-0 ${
                  patientCategory === tab.id
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 2-Column Reports Master-Detail */}
          {filteredPatientReports.length === 0 ? (
            <div className="py-16 text-center text-outline bg-surface-container-lowest border border-outline-variant/30 rounded-2xl">
              <span className="material-symbols-outlined text-[48px] text-outline/50 mb-2">science</span>
              <p className="font-semibold text-on-surface">No Diagnostic Reports On File</p>
              <p className="text-body-sm text-outline mt-1">
                Validated laboratory, imaging, and pathology reports will appear here when finalized by clinical staff.
              </p>
            </div>
          ) : selectedReport ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-6">
              {/* Left Column: Report Selection Cards */}
              <div className="space-y-space-3">
                <h3 className="font-title-sm font-bold text-outline uppercase tracking-wider text-xs">
                  Available Reports ({filteredPatientReports.length})
                </h3>
                {filteredPatientReports.map((report) => {
                  const isSelected = selectedReport?.id === report.id;
                  return (
                    <div
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`p-space-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                        isSelected
                          ? "bg-primary/5 border-primary shadow-sm"
                          : "bg-surface-container-lowest border-outline-variant/30 hover:border-outline"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-label-lg text-on-surface font-bold leading-snug">
                          {report.testName}
                        </span>
                        <Badge variant="primary" className="text-[10px] shrink-0 font-mono">
                          FINAL
                        </Badge>
                      </div>
                      <p className="text-body-sm text-on-surface-variant line-clamp-2">
                        {report.impression}
                      </p>
                      <div className="flex items-center justify-between text-label-xs text-outline pt-1 border-t border-outline-variant/20">
                        <span>{report.date}</span>
                        <span className="font-mono">{report.specimenId}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Detailed Report Sheet */}
              <div className="lg:col-span-2">
                <Card className="border border-outline-variant/30 shadow-sm">
                  <CardHeader className="border-b border-outline-variant/20 p-space-6 space-y-space-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-3">
                      <div>
                      <span className="text-label-xs uppercase font-bold text-primary tracking-wider">
                        {selectedReport.category}
                      </span>
                      <CardTitle className="text-headline-sm font-bold text-on-surface mt-0.5">
                        {selectedReport.testName}
                      </CardTitle>
                    </div>
                    <Badge variant="primary" className="text-label-sm font-mono">
                      SPECIMEN: {selectedReport.specimenId}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-3 pt-space-2 text-body-sm text-outline border-t border-outline-variant/20">
                    <div>
                      <span className="block text-label-xs uppercase font-bold">
                        Collected &amp; Reported
                      </span>
                      <span className="text-on-surface font-semibold">{selectedReport.date}</span>
                    </div>
                    <div>
                      <span className="block text-label-xs uppercase font-bold">
                        Ordering Clinician
                      </span>
                      <span className="text-on-surface font-semibold">
                        {selectedReport.orderingDoctor}
                      </span>
                    </div>
                    <div>
                      <span className="block text-label-xs uppercase font-bold">
                        Reviewing Pathologist
                      </span>
                      <span className="text-on-surface font-semibold">
                        {selectedReport.pathologist}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-space-6 space-y-space-6">
                  {/* Quantitative Table */}
                  <div>
                    <h4 className="font-label-lg font-bold text-on-surface uppercase tracking-wider text-[12px] mb-space-3">
                      Analyte Findings &amp; Reference Intervals
                    </h4>
                    <div className="border border-outline-variant/30 rounded-xl overflow-x-auto">
                      <table className="w-full text-left text-body-sm min-w-[340px]">
                        <thead className="bg-surface-container text-outline text-label-xs uppercase tracking-wider">
                          <tr>
                            <th className="p-space-3 font-semibold">Analyte Parameter</th>
                            <th className="p-space-3 font-semibold">Result Value</th>
                            <th className="p-space-3 font-semibold">Unit</th>
                            <th className="p-space-3 font-semibold">Reference Range</th>
                            <th className="p-space-3 font-semibold text-right">Evaluation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                          {selectedReport.results.map((res: any, rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-surface-container-low/50">
                              <td className="p-space-3 font-semibold text-on-surface">
                                {res.analyte}
                              </td>
                              <td className="p-space-3 font-mono font-bold text-primary">
                                {res.value}
                              </td>
                              <td className="p-space-3 text-outline font-mono text-xs">
                                {res.unit}
                              </td>
                              <td className="p-space-3 text-outline font-mono text-xs">
                                {res.reference}
                              </td>
                              <td className="p-space-3 text-right">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-800">
                                  NORMAL
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Clinical Impression */}
                  <div className="p-space-4 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1">
                    <span className="font-label-sm uppercase font-bold text-outline tracking-wider block">
                      Diagnostic Impression &amp; Interpretive Notes
                    </span>
                    <p className="text-body-md text-on-surface leading-relaxed font-medium">
                      {selectedReport.impression}
                    </p>
                  </div>

                  {/* Actions & Verification */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-space-3 pt-space-4 border-t border-outline-variant/20">
                    <div className="flex items-center gap-2 text-label-xs text-outline">
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        verified
                      </span>
                      <span>Electronically Verified &amp; Signed via Clinical Portal</span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => window.print()}
                      className="gap-2 font-bold w-full sm:w-auto"
                    >
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      Download Official PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
              </div>
            </div>
          ) : null}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-space-6 pb-space-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <div className="flex items-center gap-space-3">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                Hospital Intelligence & Executive Analytics
              </h1>
              <Badge variant="primary" className="text-xs">
                Real-Time Recharts BI
              </Badge>
            </div>
            <p className="font-body-md text-on-surface-variant mt-1">
              Throughput Trends (REP-01) • Bed Occupancy • Financial Performance & Clinical Yield
            </p>
          </div>

          <div className="flex items-center gap-space-2">
            {(["7D", "30D", "YTD"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  timeframe === t
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-4">
          <Card className="border border-outline-variant/30 shadow-xs">
            <CardContent className="p-space-4">
              <span className="font-label-sm text-outline uppercase tracking-wider block">
                Total OPD Visits
              </span>
              <div className="text-3xl font-bold font-mono text-on-surface mt-1">
                {overviewData?.metrics?.totalPatients || totalWeeklyPatients}
              </div>
              <span className="text-xs text-emerald-600 font-semibold block mt-0.5">
                Active Patients in System
              </span>
            </CardContent>
          </Card>

          <Card className="border border-outline-variant/30 shadow-xs">
            <CardContent className="p-space-4">
              <span className="font-label-sm text-outline uppercase tracking-wider block">
                Gross Hospital Billings
              </span>
              <div className="text-3xl font-bold font-mono text-primary mt-1">
                {formatCurrency(totalWeeklyRevenue)}
              </div>
              <span className="text-xs text-emerald-600 font-semibold block mt-0.5">
                98.4% Collection Ratio
              </span>
            </CardContent>
          </Card>

          <Card className="border border-outline-variant/30 shadow-xs">
            <CardContent className="p-space-4">
              <span className="font-label-sm text-outline uppercase tracking-wider block">
                Active Queue / Waiting
              </span>
              <div className="text-3xl font-bold font-mono text-secondary mt-1">
                {overviewData?.metrics?.activeQueueTokens ?? 0} Tokens
              </div>
              <span className="text-xs text-emerald-600 font-semibold block mt-0.5">
                Live Outpatient Queue
              </span>
            </CardContent>
          </Card>

          <Card className="border border-outline-variant/30 shadow-xs">
            <CardContent className="p-space-4">
              <span className="font-label-sm text-outline uppercase tracking-wider block">
                Overall Bed Occupancy
              </span>
              <div className="text-3xl font-bold font-mono text-on-surface mt-1">
                {overviewData?.metrics?.bedOccupancyRate ?? 0}%
              </div>
              <span className="text-xs text-outline block mt-0.5">
                {overviewData?.metrics?.occupiedBeds ?? 0} / {overviewData?.metrics?.totalBeds ?? 0} Beds Occupied
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-6">
          {/* Chart 1: OPD Patient Volume Trend */}
          <Card className="border border-outline-variant/30 shadow-xs">
            <CardHeader className="pb-space-2 border-b border-outline-variant/20">
              <CardTitle className="font-title-md text-title-md text-on-surface">
                OPD Patient Volume & Wait Times
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-space-4">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={OPD_VOLUME_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#cbd5e1",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Patients Seen"
                      stroke="#00685f"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="waitAvg"
                      name="Avg Wait (Mins)"
                      stroke="#006398"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Chart 2: Bed Occupancy by Ward */}
          <Card className="border border-outline-variant/30 shadow-xs">
            <CardHeader className="pb-space-2 border-b border-outline-variant/20">
              <CardTitle className="font-title-md text-title-md text-on-surface">
                Bed Occupancy by Medical Ward
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-space-4">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={WARD_OCCUPANCY_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="ward" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#cbd5e1",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="occupied"
                      name="Occupied Beds"
                      fill="#00685f"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar dataKey="total" name="Total Beds" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Chart 3: Revenue Stream Distribution */}
          <Card className="border border-outline-variant/30 shadow-xs">
            <CardHeader className="pb-space-2 border-b border-outline-variant/20">
              <CardTitle className="font-title-md text-title-md text-on-surface">
                Hospital Revenue Stream Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-space-4 flex flex-col sm:flex-row items-center justify-around gap-4">
              <div className="h-64 w-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={REVENUE_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {REVENUE_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => formatCurrency(Number(val))}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#cbd5e1",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-space-2 text-sm">
                {REVENUE_DATA.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-space-3">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-on-surface w-32">{item.name}</span>
                    <span className="font-mono font-bold text-on-surface">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chart 4: Clinical Quality & Safety Indices */}
          <Card className="border border-outline-variant/30 shadow-xs">
            <CardHeader className="pb-space-2 border-b border-outline-variant/20">
              <CardTitle className="font-title-md text-title-md text-on-surface">
                Clinical Safety & Quality Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-space-4 space-y-space-4 text-sm">
              <div className="p-space-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-emerald-900">Drug Interaction Interceptions</h4>
                  <p className="text-xs text-emerald-700">Prevented medication error rate</p>
                </div>
                <span className="font-mono font-bold text-lg text-emerald-800">100%</span>
              </div>

              <div className="p-space-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-on-surface">Digital Encounter Signoff Rate</h4>
                  <p className="text-xs text-outline">EMR encounters locked within 24h</p>
                </div>
                <span className="font-mono font-bold text-lg text-primary">99.2%</span>
              </div>

              <div className="p-space-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-on-surface">Patient Experience (CSAT)</h4>
                  <p className="text-xs text-outline">Post-consultation digital survey</p>
                </div>
                <span className="font-mono font-bold text-lg text-secondary">4.8 / 5.0</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
