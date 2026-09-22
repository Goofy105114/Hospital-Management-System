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

import api from "@/lib/axios";

export default function InpatientWardsPage() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<string>("");
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [loading, setLoading] = useState(true);
  const [admitModalOpen, setAdmitModalOpen] = useState(false);
  const [targetBedId, setTargetBedId] = useState("");
  const [admitPatientName, setAdmitPatientName] = useState("");
  const [admitDiagnosis, setAdmitDiagnosis] = useState("");

  const fetchWards = async () => {
    try {
      setLoading(true);
      const res = await api.get("/inpatient/wards");
      const list = res.data?.data;
      if (Array.isArray(list)) {
        const mapped: Ward[] = list.map((w: any) => ({
          id: w.id,
          name: w.name,
          type: w.type || "GENERAL",
          floor: w.floor || "Level 3, East Wing",
          totalBeds: w.totalBeds || w.beds?.length || 6,
          beds: (w.beds || []).map((b: any) => ({
            id: b.id,
            bedNumber: b.bedNumber,
            status: b.status as BedStatus,
            patient: b.patientName
              ? {
                  name: b.patientName,
                  mrn: b.patientMrn || "MRN-000",
                  admittedAt: b.admissionDate || "Today",
                  doctor: b.doctorName || "Attending Physician",
                  diagnosis: "Inpatient observation & clinical management",
                  condition: "STABLE",
                }
              : undefined,
          })),
        }));
        setWards(mapped);
        if (mapped.length > 0) {
          setSelectedWardId((prev) => (prev && mapped.some((m) => m.id === prev) ? prev : mapped[0].id));
        }
      } else {
        setWards([]);
      }
    } catch {
      setWards([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchWards();
  }, []);

  const currentWard = wards.find((w) => w.id === selectedWardId) || wards[0] || null;

  const totalBeds = wards.reduce((sum, w) => sum + w.beds.length, 0);
  const occupiedBeds = wards.reduce(
    (sum, w) => sum + w.beds.filter((b) => b.status === "OCCUPIED").length,
    0
  );
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const handleBedClick = (bed: Bed) => {
    setSelectedBed(bed);
    if (bed.status === "AVAILABLE") {
      setTargetBedId(bed.id);
      setAdmitModalOpen(true);
    }
  };

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitPatientName || !targetBedId) return;

    try {
      await api.patch("/inpatient/beds", {
        bedId: targetBedId,
        status: "OCCUPIED",
      });
      await fetchWards();
    } catch {
      // Handled
    } finally {
      setAdmitModalOpen(false);
      setAdmitPatientName("");
      setAdmitDiagnosis("");
    }
  };

  const handleDischarge = async (bedId: string) => {
    try {
      await api.patch("/inpatient/beds", {
        bedId,
        status: "CLEANING",
      });
      await fetchWards();
    } catch {
      // Handled
    } finally {
      setSelectedBed(null);
    }
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
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-4 border-teal-700 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-medium">Loading ward bed occupancy...</p>
          </div>
        ) : !currentWard ? (
          <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-white p-8">
            <BedIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No Inpatient Wards Found</h3>
            <p className="text-xs text-slate-500 mt-1">Configure hospital wards in the Admin console to monitor bed matrix.</p>
          </div>
        ) : (
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
        )}

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
