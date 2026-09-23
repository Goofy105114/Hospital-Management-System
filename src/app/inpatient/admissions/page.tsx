"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import api from "@/lib/axios";

interface InpatientAdmission {
  id: string;
  admissionNumber: string;
  patientName: string;
  mrn: string;
  wardName: string;
  bedNumber: string;
  attendingDoctor: string;
  admittedAt: string;
  diagnosis: string;
  dischargeReady: boolean;
  status: "ADMITTED" | "DISCHARGE_PENDING" | "DISCHARGED";
}

export default function InpatientAdmissionsPage() {
  const [admissions, setAdmissions] = useState<InpatientAdmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmission, setSelectedAdmission] = useState<InpatientAdmission | null>(null);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [dischargeSummary, setDischargeSummary] = useState("");

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/inpatient/admissions");
      const list = res.data?.data;
      if (Array.isArray(list)) {
        setAdmissions(list);
      } else {
        setAdmissions([]);
      }
    } catch {
      setAdmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const handleDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;

    try {
      await api.patch("/inpatient/admissions", {
        admissionId: selectedAdmission.id,
        status: "DISCHARGED",
        dischargeSummary,
      });
      await fetchAdmissions();
    } catch {
      // Handled
    } finally {
      setShowDischargeModal(false);
      setSelectedAdmission(null);
      setDischargeSummary("");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-space-6 max-w-7xl mx-auto pb-space-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-space-2 text-label-md text-outline">
          <Link href="/inpatient" className="hover:text-primary transition-colors">
            Inpatient Wards
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface font-semibold">Admissions & Discharge Coordination</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              Inpatient Admissions & Care Coordination (IPD-01..05)
            </h1>
            <p className="font-body-md text-body-md text-outline mt-space-1">
              Active inpatient occupant register, daily rounds, medication administration records
              (MAR), and discharge clearance workflows.
            </p>
          </div>

          <div className="flex items-center gap-space-2">
            <Link href="/inpatient">
              <Button variant="outline" className="gap-space-1">
                <span className="material-symbols-outlined text-[18px]">hotel</span>
                Ward Bed Matrix (IPD-02)
              </Button>
            </Link>
          </div>
        </div>

        {/* Status Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-4">
          <div className="p-space-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl">
            <span className="text-label-sm text-outline uppercase font-semibold block">
              Active Inpatients
            </span>
            <span className="text-headline-sm font-extrabold text-primary font-mono mt-1 block">
              {admissions.filter((a) => a.status !== "DISCHARGED").length} Patients
            </span>
          </div>
          <div className="p-space-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl">
            <span className="text-label-sm text-outline uppercase font-semibold block">
              Discharges Pending
            </span>
            <span className="text-headline-sm font-extrabold text-warning font-mono mt-1 block">
              {admissions.filter((a) => a.status === "DISCHARGE_PENDING").length}
            </span>
          </div>
          <div className="p-space-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl">
            <span className="text-label-sm text-outline uppercase font-semibold block">
              Completed Discharges
            </span>
            <span className="text-headline-sm font-extrabold text-success font-mono mt-1 block">
              {admissions.filter((a) => a.status === "DISCHARGED").length}
            </span>
          </div>
          <div className="p-space-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl">
            <span className="text-label-sm text-outline uppercase font-semibold block">
              Total Recorded
            </span>
            <span className="text-headline-sm font-extrabold text-on-surface font-mono mt-1 block">
              {admissions.length}
            </span>
          </div>
        </div>

        {/* Admissions Register Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inpatient Cohort</CardTitle>
            <CardDescription>
              All current and past inpatient hospitalizations recorded in database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-outline">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-body-sm font-medium">Loading admission records...</p>
              </div>
            ) : admissions.length === 0 ? (
              <div className="py-12 text-center text-outline border border-dashed border-outline-variant/30 rounded-xl">
                <span className="material-symbols-outlined text-[40px] text-outline/50 mb-2">hotel</span>
                <p className="font-semibold text-on-surface">No inpatient admissions recorded</p>
                <p className="text-body-sm text-outline mt-1">
                  Admissions will appear here when patients are admitted to ward beds.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-body-sm">
                  <thead className="border-b border-outline-variant/30 text-label-sm font-semibold text-outline uppercase bg-surface-container/30">
                    <tr>
                      <th className="py-space-3 px-space-4">Admission #</th>
                      <th className="py-space-3 px-space-4">Patient / MRN</th>
                      <th className="py-space-3 px-space-4">Ward / Bed</th>
                      <th className="py-space-3 px-space-4">Attending Doctor</th>
                      <th className="py-space-3 px-space-4">Diagnosis</th>
                      <th className="py-space-3 px-space-4">Admitted At</th>
                      <th className="py-space-3 px-space-4">Status</th>
                      <th className="py-space-3 px-space-4 text-right">Discharge Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {admissions.map((adm) => (
                      <tr key={adm.id} className="hover:bg-surface-container-high/40">
                        <td className="py-space-3 px-space-4 font-mono font-bold text-primary">
                          {adm.admissionNumber}
                        </td>
                        <td className="py-space-3 px-space-4">
                          <span className="font-bold text-on-surface block">{adm.patientName}</span>
                          <span className="font-mono text-label-xs text-outline">{adm.mrn}</span>
                        </td>
                        <td className="py-space-3 px-space-4">
                          <span className="font-semibold text-on-surface block">{adm.wardName}</span>
                          <span className="text-label-xs text-outline font-mono">{adm.bedNumber}</span>
                        </td>
                        <td className="py-space-3 px-space-4 text-on-surface font-medium">
                          {adm.attendingDoctor}
                        </td>
                        <td className="py-space-3 px-space-4 text-outline max-w-xs truncate">
                          {adm.diagnosis}
                        </td>
                        <td className="py-space-3 px-space-4 font-mono text-outline">
                          {adm.admittedAt}
                        </td>
                        <td className="py-space-3 px-space-4">
                          <Badge
                            variant="outline"
                            className={
                              adm.status === "ADMITTED"
                                ? "bg-secondary/15 text-secondary border-secondary/30 font-semibold"
                                : adm.status === "DISCHARGE_PENDING"
                                  ? "bg-warning/15 text-warning border-warning/30 font-semibold"
                                  : "bg-success/15 text-success border-success/30 font-semibold"
                            }
                          >
                            {adm.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="py-space-3 px-space-4 text-right">
                          {adm.status !== "DISCHARGED" ? (
                            <Button
                              variant={adm.dischargeReady ? "primary" : "outline"}
                              size="sm"
                              onClick={() => {
                                setSelectedAdmission(adm);
                                setShowDischargeModal(true);
                              }}
                            >
                              {adm.dischargeReady ? "Execute Discharge" : "Prepare Discharge"}
                            </Button>
                          ) : (
                            <span className="text-label-xs text-success font-semibold">
                              Discharged & Billed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal: Discharge Summary & Final Invoice (IPD-05) */}
        {showDischargeModal && selectedAdmission && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-4">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-space-6 max-w-lg w-full shadow-2xl space-y-space-4">
              <div className="flex items-center gap-space-3 text-primary">
                <span className="material-symbols-outlined text-[32px]">output</span>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Discharge Coordination: {selectedAdmission.patientName}
                  </h3>
                  <span className="text-label-sm text-outline">
                    {selectedAdmission.wardName} • {selectedAdmission.bedNumber}
                  </span>
                </div>
              </div>

              <form onSubmit={handleDischarge} className="space-y-space-4">
                <div className="p-space-3 bg-surface-container rounded-lg border border-outline-variant/30 space-y-space-1 text-body-sm">
                  <div className="flex justify-between">
                    <span className="text-outline">Admitting Diagnosis:</span>
                    <span className="font-semibold text-on-surface">
                      {selectedAdmission.diagnosis}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Attending Clinician:</span>
                    <span className="font-semibold text-on-surface">
                      {selectedAdmission.attendingDoctor}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Clinical Discharge Summary & Medication Plan{" "}
                    <span className="text-error">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="e.g. Patient stabilized; respiratory rate normalized. Prescribed 5-day oral antibiotic course and outpatient cardiology follow-up in 2 weeks."
                    value={dischargeSummary}
                    onChange={(e) => setDischargeSummary(e.target.value)}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="p-space-3 bg-warning/10 rounded-lg border border-warning/30 text-label-sm text-warning">
                  Finalizing discharge will mark {selectedAdmission.bedNumber} as CLEANING, notify
                  Housekeeping, and trigger final consolidated billing in BIL-02.
                </div>

                <div className="flex items-center justify-end gap-space-2 pt-space-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDischargeModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Authorize Discharge & Release Bed
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
