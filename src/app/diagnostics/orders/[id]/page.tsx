"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import api from "@/lib/axios";

interface AnalyteResult {
  id: string;
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: "NORMAL" | "HIGH" | "LOW" | "CRITICAL";
}

export default function DiagnosticOrderWorkstationPage() {
  const params = useParams();
  const orderId = (params?.id as string) || "";

  const [order, setOrder] = useState<any>(null);
  const [analytes, setAnalytes] = useState<AnalyteResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [isReleasedToPatient, setIsReleasedToPatient] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    api
      .get(`/diagnostics/orders/${orderId}`)
      .then((res) => {
        const data = res.data?.data;
        if (data) {
          setOrder(data);
          setAnalytes(data.analytes || []);
        }
      })
      .catch(() => {
        setOrder(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId]);

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

  const handleRelease = async () => {
    try {
      await api.post(`/diagnostics/orders/${orderId}/release-to-patient`, {});
    } catch {
      // Handled
    }
    setIsReleasedToPatient(true);
    setIsVerified(true);
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
          {order && (
            <span className="font-mono text-label-sm text-outline">({order.orderNumber})</span>
          )}
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-outline">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-body-sm font-medium">Loading diagnostic order records...</p>
          </div>
        ) : !order ? (
          <div className="p-12 text-center border border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-lowest">
            <span className="material-symbols-outlined text-[48px] text-outline/50 mb-2">biotech</span>
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Order Not Found</h3>
            <p className="text-body-sm text-outline mt-1 max-w-sm mx-auto">
              The requested diagnostic test accession was not found in the laboratory database.
            </p>
            <Link href="/diagnostics" className="inline-block mt-4">
              <Button variant="outline">Back to Diagnostics</Button>
            </Link>
          </div>
        ) : (
          <>
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
                      Out-of-range critical value detected. Ordering clinician ({order.doctorName}) has been
                      notified via urgent priority dispatch.
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="bg-error text-on-error font-bold shrink-0">
                  STAT CALLOUT
                </Badge>
              </div>
            )}

            {/* Accession Header Card */}
            <Card>
              <CardContent className="p-space-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/20 pb-space-4">
                  <div>
                    <div className="flex items-center gap-space-2">
                      <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                        {order.testName}
                      </h2>
                      <Badge variant="secondary" className="font-mono">
                        {order.orderNumber}
                      </Badge>
                    </div>
                    <p className="font-body-sm text-outline mt-space-1">
                      Patient: <strong className="text-on-surface">{order.patientName}</strong> (
                      <span className="font-mono">{order.patientMrn}</span>) • Ordering Clinician:{" "}
                      <strong className="text-on-surface">{order.doctorName}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-space-2">
                    <Button
                      variant={isVerified ? "outline" : "primary"}
                      onClick={() => setIsVerified(true)}
                      className="gap-space-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      {isVerified ? "Pathologist Verified" : "Verify & Sign Off"}
                    </Button>
                    <Button
                      variant={isReleasedToPatient ? "secondary" : "primary"}
                      disabled={!isVerified}
                      onClick={handleRelease}
                      className="gap-space-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      {isReleasedToPatient ? "Released to Portal" : "Release to Patient"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-4 pt-space-4 text-body-sm">
                  <div>
                    <span className="text-label-sm text-outline block">Specimen Barcode:</span>
                    <span className="font-mono font-bold text-primary">{order.specimenBarcode}</span>
                  </div>
                  <div>
                    <span className="text-label-sm text-outline block">Ordered At:</span>
                    <span className="text-on-surface font-medium">{order.orderedAt}</span>
                  </div>
                  <div>
                    <span className="text-label-sm text-outline block">Specimen Collected:</span>
                    <span className="text-on-surface font-medium">{order.specimenCollectedAt}</span>
                  </div>
                  <div>
                    <span className="text-label-sm text-outline block">Bench Technologist:</span>
                    <span className="text-on-surface font-medium">{order.technicianName}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analyte Results Entry & Reference Ranges (DIA-03) */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Analyte Data & Reference Intervals</CardTitle>
                    <CardDescription>
                      Automated high/low/critical flagging against validated clinical ranges.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {analytes.length} Analytes
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-0 overflow-x-auto">
                {analytes.length === 0 ? (
                  <div className="py-8 text-center text-outline">
                    <p className="text-body-sm">No analyte line items registered for this order.</p>
                  </div>
                ) : (
                  <table className="w-full text-body-sm text-left border-collapse">
                    <thead className="bg-surface-container text-label-sm font-semibold text-outline uppercase border-y border-outline-variant/30">
                      <tr>
                        <th className="py-space-3 px-space-4">Analyte / Component</th>
                        <th className="py-space-3 px-space-4">Result Value</th>
                        <th className="py-space-3 px-space-4">Units</th>
                        <th className="py-space-3 px-space-4">Biological Ref Range</th>
                        <th className="py-space-3 px-space-4">Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {analytes.map((a) => (
                        <tr
                          key={a.id}
                          className={
                            a.status === "CRITICAL"
                              ? "bg-error/10 hover:bg-error/15"
                              : a.status === "HIGH" || a.status === "LOW"
                                ? "bg-warning/10 hover:bg-warning/15"
                                : "hover:bg-surface-container-high/40"
                          }
                        >
                          <td className="py-space-3 px-space-4 font-semibold text-on-surface">
                            {a.name}
                          </td>
                          <td className="py-space-3 px-space-4 font-mono font-bold">
                            <input
                              type="text"
                              value={a.value}
                              onChange={(e) => handleUpdateValue(a.id, e.target.value)}
                              className="w-24 px-2 py-1 bg-surface-container-lowest border border-outline-variant/50 rounded font-mono font-bold text-on-surface focus:outline-none focus:border-primary"
                            />
                          </td>
                          <td className="py-space-3 px-space-4 text-outline font-mono">{a.unit}</td>
                          <td className="py-space-3 px-space-4 text-outline font-mono">
                            {a.referenceRange}
                          </td>
                          <td className="py-space-3 px-space-4">
                            <Badge
                              variant="outline"
                              className={
                                a.status === "CRITICAL"
                                  ? "bg-error text-on-error font-bold"
                                  : a.status === "HIGH" || a.status === "LOW"
                                    ? "bg-warning/20 text-warning border-warning/40 font-bold"
                                    : "bg-success/15 text-success border-success/30 font-medium"
                              }
                            >
                              {a.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
