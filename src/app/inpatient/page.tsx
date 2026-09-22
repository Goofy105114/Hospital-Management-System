"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Bed as BedIcon,
  Users,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  LogOut,
  X,
  Activity,
  Sparkles,
  Wrench,
} from "lucide-react";

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
          mrn: "MRN-2026-001830",
          admittedAt: "Yesterday • 08:15 PM",
          doctor: "Dr. Marcus Vance",
          diagnosis: "Post-PCI arterial sheath monitoring",
          condition: "STABLE",
        },
      },
      {
        id: "b-ccu-03",
        bedNumber: "CCU-03",
        status: "OCCUPIED",
        patient: {
          name: "George Sterling",
          mrn: "MRN-2026-001799",
          admittedAt: "Oct 22 • 02:40 PM",
          doctor: "Dr. Sarah Jenkins",
          diagnosis: "Decompensated heart failure with reduced ejection fraction",
          condition: "GUARDED",
        },
      },
      { id: "b-ccu-04", bedNumber: "CCU-04", status: "AVAILABLE" },
      { id: "b-ccu-05", bedNumber: "CCU-05", status: "CLEANING" },
      { id: "b-ccu-06", bedNumber: "CCU-06", status: "MAINTENANCE" },
    ],
  },
  {
    id: "ward-02",
    name: "Intensive Care Unit (ICU)",
    type: "CRITICAL_CARE",
    floor: "Level 3, West Wing",
    totalBeds: 4,
    beds: [
      {
        id: "b-icu-01",
        bedNumber: "ICU-01",
        status: "OCCUPIED",
        patient: {
          name: "David Chen",
          mrn: "MRN-2026-001815",
          admittedAt: "Oct 23 • 04:10 AM",
          doctor: "Dr. Rachel Adams",
          diagnosis: "Post-cardiac arrest targeted temperature management",
          condition: "CRITICAL",
        },
      },
      { id: "b-icu-02", bedNumber: "ICU-02", status: "AVAILABLE" },
      { id: "b-icu-03", bedNumber: "ICU-03", status: "AVAILABLE" },
      { id: "b-icu-04", bedNumber: "ICU-04", status: "CLEANING" },
    ],
  },
  {
    id: "ward-03",
    name: "General Medicine Ward 4A",
    type: "STEP_DOWN",
    floor: "Level 4, North Wing",
    totalBeds: 8,
    beds: [
      {
        id: "b-gen-01",
        bedNumber: "4A-101",
        status: "OCCUPIED",
        patient: {
          name: "Maria Santos",
          mrn: "MRN-2026-001740",
          admittedAt: "Oct 21 • 10:00 AM",
          doctor: "Dr. Elena Ramos",
          diagnosis: "Community-acquired pneumonia, resolving on IV ceftriaxone",
          condition: "STABLE",
        },
      },
      { id: "b-gen-02", bedNumber: "4A-102", status: "AVAILABLE" },
      { id: "b-gen-03", bedNumber: "4A-103", status: "AVAILABLE" },
      { id: "b-gen-04", bedNumber: "4A-104", status: "AVAILABLE" },
      { id: "b-gen-05", bedNumber: "4A-105", status: "AVAILABLE" },
      { id: "b-gen-06", bedNumber: "4A-106", status: "CLEANING" },
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
  };

  const handleDischarge = (bedId: string) => {
    setWards((prev) =>
      prev.map((ward) => ({
        ...ward,
        beds: ward.beds.map((b) => {
          if (b.id === bedId) {
            return {
              ...b,
              status: "CLEANING",
              patient: undefined,
            };
          }
          return b;
        }),
      }))
    );
    setSelectedBed(null);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-5 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Inpatient Wards &amp; Bed Command
              </h1>
              <Badge variant="primary" className="text-[11px] font-semibold px-2 py-0.5">
                IPD-01 Bed Matrix
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time Bed Occupancy • Patient Admission, Transfer &amp; Discharge Workflows
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              Overall Hospital Occupancy:{" "}
              <strong className="text-teal-800 text-sm font-bold">{occupancyRate}%</strong>
            </span>
          </div>
        </div>

        {/* Top Status Strips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border border-slate-200/80 shadow-2xs rounded-2xl bg-white">
            <CardContent className="p-4">
              <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                Total Ward Capacity
              </span>
              <div className="text-xl font-bold font-mono text-slate-800 mt-1">
                {totalBeds} Beds
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">Across all facilities</span>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 shadow-2xs rounded-2xl bg-white">
            <CardContent className="p-4">
              <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                Occupied Beds
              </span>
              <div className="text-xl font-bold font-mono text-teal-800 mt-1">
                {occupiedBeds} Beds
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">{occupancyRate}% Occupancy</span>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 shadow-2xs rounded-2xl bg-white">
            <CardContent className="p-4">
              <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                Available Immediately
              </span>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                {totalBeds - occupiedBeds} Beds
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                Ready for Admission
              </span>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 shadow-2xs rounded-2xl bg-white">
            <CardContent className="p-4">
              <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                Turnaround / Cleaning
              </span>
              <div className="text-xl font-bold font-mono text-amber-700 mt-1">2 Beds</div>
              <span className="text-[11px] text-slate-400 block mt-0.5">Housekeeping active</span>
            </CardContent>
          </Card>
        </div>

        {/* Ward Selector Tabs */}
        <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto">
          {wards.map((ward) => (
            <button
              key={ward.id}
              onClick={() => {
                setSelectedWardId(ward.id);
                setSelectedBed(null);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                selectedWardId === ward.id
                  ? "bg-white text-teal-800 font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <BedIcon className="w-3.5 h-3.5 text-teal-700" />
              {ward.name} ({ward.beds.filter((b) => b.status === "AVAILABLE").length} free)
            </button>
          ))}
        </div>

        {/* Bed Status Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Available (Click to Admit)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-700" />
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Cleaning / Sanitization</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span>Maintenance</span>
          </div>
        </div>

        {/* Interactive Bed Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {currentWard.beds.map((bed) => {
            const isSelected = selectedBed?.id === bed.id;
            const isOccupied = bed.status === "OCCUPIED";
            const isAvailable = bed.status === "AVAILABLE";
            const isCleaning = bed.status === "CLEANING";

            return (
              <div
                key={bed.id}
                onClick={() => handleBedClick(bed)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? "border-teal-700 shadow-sm ring-2 ring-teal-600/20 bg-white"
                    : "border-slate-200/80 hover:border-teal-600/50 bg-white"
                } ${
                  isOccupied
                    ? "bg-teal-50/30"
                    : isAvailable
                      ? "bg-emerald-50/30"
                      : isCleaning
                        ? "bg-amber-50/30"
                        : "bg-slate-50/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-slate-800">
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
                  <div className="mt-2.5 space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 truncate">
                      {bed.patient.name}
                    </h4>
                    <p className="font-mono text-[11px] text-slate-400">{bed.patient.mrn}</p>
                    <p className="text-xs text-teal-700 font-medium line-clamp-1">
                      {bed.patient.diagnosis}
                    </p>
                    <div className="pt-2 flex justify-between items-center text-[10px] text-slate-400">
                      <span>Admitted: {bed.patient.admittedAt}</span>
                      <span className="text-emerald-700 font-bold">{bed.patient.condition}</span>
                    </div>
                  </div>
                ) : isAvailable ? (
                  <div className="mt-4 text-center py-2 text-emerald-700 font-semibold text-xs flex items-center justify-center gap-1.5 bg-emerald-50 rounded-xl border border-emerald-200/60">
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Click to Admit Patient
                  </div>
                ) : (
                  <div className="mt-4 text-center py-2 text-slate-400 font-semibold text-xs flex items-center justify-center gap-1.5 bg-slate-50 rounded-xl border border-slate-100">
                    {isCleaning ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Sanitizing in progress</span>
                      </>
                    ) : (
                      <>
                        <Wrench className="w-3.5 h-3.5 text-slate-400" />
                        <span>Under maintenance</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Occupied Bed Management Card */}
        {selectedBed && selectedBed.status === "OCCUPIED" && selectedBed.patient && (
          <Card className="border border-teal-600/40 shadow-2xs bg-white rounded-2xl overflow-hidden animate-in fade-in">
            <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Bed {selectedBed.bedNumber} — {selectedBed.patient.name}
                  </CardTitle>
                  <Badge variant="success" className="text-[10px]">
                    {selectedBed.patient.condition}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  MRN: {selectedBed.patient.mrn} • Attending: {selectedBed.patient.doctor}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDischarge(selectedBed.id)}
                  className="border-rose-200 text-rose-600 hover:bg-rose-50 gap-1.5 text-xs font-semibold h-8 rounded-xl shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  Discharge Patient
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Admitting Diagnosis
                  </span>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {selectedBed.patient.diagnosis}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Admission Timestamp
                  </span>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {selectedBed.patient.admittedAt}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Telemetry Status</span>
                  <p className="font-medium text-emerald-700 mt-0.5">
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAdmit}
            className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">Admit Patient to Bed</h3>
              <button
                type="button"
                onClick={() => setAdmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Patient Name / Lookup
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samuel Henderson"
                  value={admitPatientName}
                  onChange={(e) => setAdmitPatientName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Admitting Diagnosis / Clinical Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acute Coronary Syndrome Observation"
                  value={admitDiagnosis}
                  onChange={(e) => setAdmitDiagnosis(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setAdmitModalOpen(false)} className="rounded-xl text-xs h-8">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs h-8">
                Confirm Admission
              </Button>
            </div>
          </form>
        </div>
      )}
    </AppLayout>
  );
}
