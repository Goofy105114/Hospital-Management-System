"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type BedStatus = "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE";

interface Bed {
  id: string;
  bedNumber: string;
  status: BedStatus;
  patient?: {
    name: string;
    mrn: string;
    admittedAt: string;
    doctor: string;
    diagnosis: string;
    condition: "STABLE" | "GUARDED" | "CRITICAL";
  };
}

interface Ward {
  id: string;
  name: string;
  type: string;
  floor: string;
  totalBeds: number;
  beds: Bed[];
}

const INITIAL_WARDS: Ward[] = [
  {
    id: "ward-01",
    name: "Coronary Care Unit (CCU)",
    type: "CRITICAL_CARE",
    floor: "Level 4, East Wing",
    totalBeds: 6,
    beds: [
      {
        id: "b-ccu-01",
        bedNumber: "CCU-01",
        status: "OCCUPIED",
        patient: {
          name: "Eleanor Pena",
          mrn: "MRN-2026-001842",
          admittedAt: "Today • 11:30 AM",
          doctor: "Dr. Marcus Vance",
          diagnosis: "Telemetry monitoring post-arrhythmia observation",
          condition: "STABLE",
        },
      },
      {
        id: "b-ccu-02",
        bedNumber: "CCU-02",
        status: "OCCUPIED",
        patient: {
          name: "Robert Hastings",
          mrn: "MRN-2026-001640",
          admittedAt: "Yesterday • 06:15 PM",
          doctor: "Dr. Marcus Vance",
          diagnosis: "Post-PCI Stent Placement",
          condition: "STABLE",
        },
      },
      { id: "b-ccu-03", bedNumber: "CCU-03", status: "AVAILABLE" },
      { id: "b-ccu-04", bedNumber: "CCU-04", status: "CLEANING" },
      { id: "b-ccu-05", bedNumber: "CCU-05", status: "AVAILABLE" },
      { id: "b-ccu-06", bedNumber: "CCU-06", status: "MAINTENANCE" },
    ],
  },
  {
    id: "ward-02",
    name: "General Medical Ward 4A",
    type: "GENERAL",
    floor: "Level 4, West Wing",
    totalBeds: 8,
    beds: [
      {
        id: "b-gen-01",
        bedNumber: "4A-101",
        status: "OCCUPIED",
        patient: {
          name: "Arthur Pendelton",
          mrn: "MRN-2026-001789",
          admittedAt: "Oct 22, 2026",
          doctor: "Dr. Sarah Jenkins",
          diagnosis: "Decompensated Heart Failure Recovery",
          condition: "STABLE",
        },
      },
      { id: "b-gen-02", bedNumber: "4A-102", status: "AVAILABLE" },
      { id: "b-gen-03", bedNumber: "4A-103", status: "AVAILABLE" },
      { id: "b-gen-04", bedNumber: "4A-104", status: "AVAILABLE" },
      { id: "b-gen-05", bedNumber: "4A-105", status: "CLEANING" },
      { id: "b-gen-06", bedNumber: "4A-106", status: "AVAILABLE" },
      { id: "b-gen-07", bedNumber: "4A-107", status: "AVAILABLE" },
      { id: "b-gen-08", bedNumber: "4A-108", status: "AVAILABLE" },
    ],
  },
];

export default function InpatientWardsPage() {
  const [wards, setWards] = useState<Ward[]>(INITIAL_WARDS);
  const [selectedWardId, setSelectedWardId] = useState(INITIAL_WARDS[0].id);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [admitModalOpen, setAdmitModalOpen] = useState(false);
  const [targetBedId, setTargetBedId] = useState("");
  const [admitPatientName, setAdmitPatientName] = useState("");
  const [admitDiagnosis, setAdmitDiagnosis] = useState("");

  const currentWard = wards.find((w) => w.id === selectedWardId) || wards[0];

  const totalBeds = wards.reduce((sum, w) => sum + w.beds.length, 0);
  const occupiedBeds = wards.reduce(
    (sum, w) => sum + w.beds.filter((b) => b.status === "OCCUPIED").length,
    0
  );
  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);

  const handleBedClick = (bed: Bed) => {
    setSelectedBed(bed);
    if (bed.status === "AVAILABLE") {
      setTargetBedId(bed.id);
      setAdmitModalOpen(true);
    }
  };

  const handleAdmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitPatientName) return;

    setWards((prev) =>
      prev.map((ward) => ({
        ...ward,
        beds: ward.beds.map((b) => {
          if (b.id === targetBedId) {
            return {
              ...b,
              status: "OCCUPIED",
              patient: {
                name: admitPatientName,
                mrn: `MRN-2026-00${Math.floor(1000 + Math.random() * 9000)}`,
                admittedAt: "Just now",
                doctor: "Dr. Marcus Vance",
                diagnosis: admitDiagnosis || "Clinical admission",
                condition: "STABLE",
              },
            };
          }
          return b;
        }),
      }))
    );

    setAdmitModalOpen(false);
    setAdmitPatientName("");
    setAdmitDiagnosis("");
    setSelectedBed(null);
  };

  const handleDischarge = (bedId: string) => {
    setWards((prev) =>
      prev.map((ward) => ({
        ...ward,
        beds: ward.beds.map((b) => {
          if (b.id === bedId) {
            return { ...b, status: "CLEANING", patient: undefined };
          }
          return b;
        }),
      }))
    );
    setSelectedBed(null);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-space-6 pb-space-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <div className="flex items-center gap-space-3">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                Inpatient Wards & Bed Command
              </h1>
              <Badge variant="primary" className="text-xs">
                IPD-01 Bed Matrix
              </Badge>
            </div>
            <p className="font-body-md text-on-surface-variant mt-1">
              Real-time Bed Occupancy • Patient Admission, Transfer & Discharge Workflows
            </p>
          </div>

          <div className="flex items-center gap-space-3">
            <span className="text-xs font-mono font-bold text-outline">
              Overall Hospital Occupancy:{" "}
              <strong className="text-primary text-base">{occupancyRate}%</strong>
            </span>
          </div>
        </div>

        {/* Top Status Strips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-4">
          <Card className="border border-outline-variant/30 shadow-xs">
            <CardContent className="p-space-4">
              <span className="font-label-sm text-outline uppercase tracking-wider block">
                Total Ward Capacity
              </span>
              <div className="text-3xl font-bold font-mono text-on-surface mt-1">
                {totalBeds} Beds
              </div>
              <span className="text-xs text-outline block mt-0.5">Across all facilities</span>
            </CardContent>
          </Card>

          <Card className="border border-outline-variant/30 shadow-xs">
            <CardContent className="p-space-4">
              <span className="font-label-sm text-outline uppercase tracking-wider block">
                Occupied Beds
              </span>
              <div className="text-3xl font-bold font-mono text-primary mt-1">
                {occupiedBeds} Beds
              </div>
              <span className="text-xs text-outline block mt-0.5">{occupancyRate}% Occupancy</span>
            </CardContent>
          </Card>

          <Card className="border border-outline-variant/30 shadow-xs">
            <CardContent className="p-space-4">
              <span className="font-label-sm text-outline uppercase tracking-wider block">
                Available Immediately
              </span>
              <div className="text-3xl font-bold font-mono text-emerald-600 mt-1">
                {totalBeds - occupiedBeds} Beds
              </div>
              <span className="text-xs text-emerald-600 font-semibold block mt-0.5">
                Ready for Admission
              </span>
            </CardContent>
          </Card>

          <Card className="border border-outline-variant/30 shadow-xs">
            <CardContent className="p-space-4">
              <span className="font-label-sm text-outline uppercase tracking-wider block">
                Turnaround / Cleaning
              </span>
              <div className="text-3xl font-bold font-mono text-amber-600 mt-1">2 Beds</div>
              <span className="text-xs text-outline block mt-0.5">Housekeeping active</span>
            </CardContent>
          </Card>
        </div>

        {/* Ward Selector Tabs */}
        <div className="flex items-center gap-space-2 border-b border-outline-variant/20 pb-space-2">
          {wards.map((ward) => (
            <button
              key={ward.id}
              onClick={() => {
                setSelectedWardId(ward.id);
                setSelectedBed(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-md transition-colors ${
                selectedWardId === ward.id
                  ? "bg-primary text-white font-bold"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-base">hotel</span>
              {ward.name} ({ward.beds.filter((b) => b.status === "AVAILABLE").length} free)
            </button>
          ))}
        </div>

        {/* Bed Status Legend */}
        <div className="flex flex-wrap items-center gap-space-4 text-xs font-medium text-outline">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Available (Click to Admit)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-primary" />
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Cleaning / Sanitization</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-400" />
            <span>Maintenance</span>
          </div>
        </div>

        {/* Interactive Bed Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-space-4">
          {currentWard.beds.map((bed) => {
            const isSelected = selectedBed?.id === bed.id;
            const isOccupied = bed.status === "OCCUPIED";
            const isAvailable = bed.status === "AVAILABLE";
            const isCleaning = bed.status === "CLEANING";

            return (
              <div
                key={bed.id}
                onClick={() => handleBedClick(bed)}
                className={`p-space-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? "border-primary shadow-md ring-2 ring-primary/20"
                    : "border-outline-variant/30 hover:border-primary/50"
                } ${
                  isOccupied
                    ? "bg-primary/5"
                    : isAvailable
                      ? "bg-emerald-50/50"
                      : isCleaning
                        ? "bg-amber-50/50"
                        : "bg-slate-100/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-base text-on-surface">
                    {bed.bedNumber}
                  </span>
                  <Badge
                    variant={
                      isAvailable
                        ? "success"
                        : isOccupied
                          ? "primary"
                          : isCleaning
                            ? "warning"
                            : "outline"
                    }
                    className="text-[10px]"
                  >
                    {bed.status}
                  </Badge>
                </div>

                {isOccupied && bed.patient ? (
                  <div className="mt-3 space-y-1">
                    <h4 className="font-title-sm font-bold text-on-surface truncate">
                      {bed.patient.name}
                    </h4>
                    <p className="font-mono text-xs text-outline">{bed.patient.mrn}</p>
                    <p className="text-xs text-primary font-medium line-clamp-1">
                      {bed.patient.diagnosis}
                    </p>
                    <div className="pt-2 flex justify-between items-center text-[10px] text-outline">
                      <span>Admitted: {bed.patient.admittedAt}</span>
                      <span className="text-emerald-700 font-bold">{bed.patient.condition}</span>
                    </div>
                  </div>
                ) : isAvailable ? (
                  <div className="mt-6 text-center py-2 text-emerald-700 font-semibold text-xs flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    Click to Admit Patient
                  </div>
                ) : (
                  <div className="mt-6 text-center py-2 text-outline font-semibold text-xs">
                    {isCleaning ? "Sanitizing in progress" : "Under maintenance"}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Occupied Bed Management Card */}
        {selectedBed && selectedBed.status === "OCCUPIED" && selectedBed.patient && (
          <Card className="border border-primary/40 shadow-md bg-surface-container-lowest animate-in fade-in">
            <CardHeader className="pb-space-3 border-b border-outline-variant/20 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-space-2">
                  <CardTitle className="font-title-md text-title-md text-on-surface">
                    Bed {selectedBed.bedNumber} — {selectedBed.patient.name}
                  </CardTitle>
                  <Badge variant="success" className="text-xs">
                    {selectedBed.patient.condition}
                  </Badge>
                </div>
                <p className="font-body-sm text-outline mt-0.5">
                  MRN: {selectedBed.patient.mrn} • Attending: {selectedBed.patient.doctor}
                </p>
              </div>

              <div className="flex items-center gap-space-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDischarge(selectedBed.id)}
                  className="border-error/30 text-error hover:bg-error/10 gap-1 text-xs"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  Discharge Patient
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-space-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-4 text-xs">
                <div>
                  <span className="text-outline uppercase font-bold block">
                    Admitting Diagnosis
                  </span>
                  <p className="font-body-md font-medium text-on-surface mt-1">
                    {selectedBed.patient.diagnosis}
                  </p>
                </div>
                <div>
                  <span className="text-outline uppercase font-bold block">
                    Admission Timestamp
                  </span>
                  <p className="font-body-md font-medium text-on-surface mt-1">
                    {selectedBed.patient.admittedAt}
                  </p>
                </div>
                <div>
                  <span className="text-outline uppercase font-bold block">Telemetry Status</span>
                  <p className="font-body-md font-medium text-emerald-700 mt-1">
                    Live ECG rhythm strip transmitting (Station 4)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Patient Admission Modal */}
      {admitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAdmit}
            className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-6 shadow-xl border border-outline-variant/30 space-y-space-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-space-3">
              <h3 className="font-title-lg font-bold text-on-surface">Admit Patient to Bed</h3>
              <button
                type="button"
                onClick={() => setAdmitModalOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-space-3 text-sm">
              <div>
                <label className="font-label-md font-semibold text-on-surface block mb-1">
                  Patient Name / Lookup
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samuel Henderson"
                  value={admitPatientName}
                  onChange={(e) => setAdmitPatientName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm"
                />
              </div>

              <div>
                <label className="font-label-md font-semibold text-on-surface block mb-1">
                  Admitting Diagnosis / Clinical Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acute Coronary Syndrome Observation"
                  value={admitDiagnosis}
                  onChange={(e) => setAdmitDiagnosis(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-space-3 pt-space-3 border-t border-outline-variant/20">
              <Button type="button" variant="outline" onClick={() => setAdmitModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-white">
                Confirm Admission
              </Button>
            </div>
          </form>
        </div>
      )}
    </AppLayout>
  );
}
