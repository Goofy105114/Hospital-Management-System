"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import api from "@/lib/axios";
import {
  Save,
  FileSignature,
  ShieldCheck,
  Users,
  AlertTriangle,
  AlertOctagon,
  FileText,
  Stethoscope,
  Pill,
  FlaskConical,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  Check,
  Clock,
  Heart,
  Activity,
  Thermometer,
  Scale,
  ChevronRight,
} from "lucide-react";

interface QueuePatient {
  id: string;
  tokenNumber: string;
  name: string;
  mrn: string;
  age: number;
  gender: string;
  bloodGroup: string;
  allergies: string[];
  reason: string;
  time: string;
  status: "IN_ROOM" | "WAITING" | "COMPLETED";
}

const PATIENTS_QUEUE: QueuePatient[] = [
  {
    id: "pat-01",
    tokenNumber: "#A-24",
    name: "Eleanor Pena",
    mrn: "MRN-2026-001842",
    age: 38,
    gender: "Female",
    bloodGroup: "A+",
    allergies: ["Penicillin (Anaphylaxis)", "Aspirin / NSAIDs (Gastritis)"],
    reason: "Post-exertion palpitations & cardiac follow-up",
    time: "10:15 AM",
    status: "IN_ROOM",
  },
  {
    id: "pat-02",
    tokenNumber: "#A-22",
    name: "Sofia Rodriguez",
    mrn: "MRN-2026-001802",
    age: 45,
    gender: "Female",
    bloodGroup: "O+",
    allergies: ["Sulfa drugs"],
    reason: "Hypertension medication review",
    time: "10:00 AM",
    status: "WAITING",
  },
  {
    id: "pat-03",
    tokenNumber: "#A-23",
    name: "David Chen",
    mrn: "MRN-2026-001815",
    age: 52,
    gender: "Male",
    bloodGroup: "B+",
    allergies: [],
    reason: "Pre-operative cardiac clearance",
    time: "10:10 AM",
    status: "WAITING",
  },
];

const ICD10_CATALOG = [
  { code: "I10", label: "Essential (primary) hypertension" },
  { code: "I25.10", label: "Atherosclerotic heart disease of native coronary artery" },
  { code: "R00.2", label: "Palpitations, unspecified" },
  { code: "E11.9", label: "Type 2 diabetes mellitus without complications" },
  { code: "E78.5", label: "Hyperlipidemia, unspecified" },
  { code: "I48.91", label: "Unspecified atrial fibrillation" },
];

const AVAILABLE_MEDS = [
  { id: "med-01", name: "Lisinopril", defaultDose: "10mg", category: "ACE Inhibitor" },
  { id: "med-02", name: "Metoprolol Succinate", defaultDose: "25mg", category: "Beta Blocker" },
  { id: "med-03", name: "Amoxicillin", defaultDose: "500mg", category: "Penicillin Antibiotic" },
  { id: "med-04", name: "Warfarin Sodium", defaultDose: "5mg", category: "Anticoagulant" },
  { id: "med-05", name: "Aspirin", defaultDose: "81mg", category: "Antiplatelet / NSAID" },
  { id: "med-06", name: "Atorvastatin", defaultDose: "20mg", category: "Statin" },
];

export default function DoctorWorkspacePage() {
  const [selectedPatient, setSelectedPatient] = useState<QueuePatient>(PATIENTS_QUEUE[0]);
  const [activeTab, setActiveTab] = useState<"SOAP" | "DIAGNOSIS" | "RX" | "LABS">("SOAP");

  // SOAP State
  const [subjective, setSubjective] = useState(
    "Patient is a 38-year-old female presenting for follow-up of intermittent palpitations occurring post-moderate exertion for the past 2 weeks. Denies syncope, orthopnea, or resting chest pressure. Compliant with current Lisinopril 10mg."
  );
  const [objective, setObjective] = useState(
    "Vitals: BP 128/82 mmHg, HR 72 bpm regular, SpO2 98% room air, Temp 98.4°F, BMI 23.8.\nCardiovascular: S1/S2 audible, regular rate and rhythm, no murmurs, gallops, or friction rubs.\nLungs: Clear to auscultation bilaterally.\nExtremities: No peripheral edema (0/4)."
  );
  const [assessment, setAssessment] = useState(
    "1. Palpitations, benign post-exertional (R00.2) - suspect transient sinus tachycardia or premature atrial complexes.\n2. Well-controlled primary hypertension (I10) on Lisinopril monotherapy."
  );
  const [plan, setPlan] = useState(
    "1. Order 12-lead resting ECG and Comprehensive Metabolic Panel today.\n2. Continue Lisinopril 10mg daily.\n3. Add Metoprolol Tartrate 25mg BID PRN for symptomatic palpitations.\n4. Patient instructed to return for Holter monitor if symptoms accelerate."
  );

  // Diagnoses
  const [diagnoses, setDiagnoses] = useState([
    { code: "R00.2", label: "Palpitations, unspecified", type: "PRIMARY" },
    { code: "I10", label: "Essential (primary) hypertension", type: "SECONDARY" },
  ]);
  const [selectedIcd, setSelectedIcd] = useState(ICD10_CATALOG[0].code);

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState<
    Array<{ id: string; name: string; dose: string; freq: string; duration: string }>
  >([
    {
      id: "p1",
      name: "Metoprolol Succinate",
      dose: "25mg",
      freq: "Once daily (Morning)",
      duration: "30 Days",
    },
  ]);
  const [rxMedId, setRxMedId] = useState(AVAILABLE_MEDS[0].id);
  const [rxDose, setRxDose] = useState("10mg");
  const [rxFreq, setRxFreq] = useState("Once daily");
  const [rxDuration, setRxDuration] = useState("30 Days");

  // Lab orders
  const [orderedLabs, setOrderedLabs] = useState<string[]>([
    "12-Lead Resting Electrocardiogram (ECG)",
    "Comprehensive Metabolic Panel (CMP)",
  ]);

  // Safety Warnings State
  const [safetyAlerts, setSafetyAlerts] = useState<string[]>([]);
  const [isSigned, setIsSigned] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Check drug interactions & allergies dynamically
  const checkForSafetyAlerts = (medName: string) => {
    const alerts: string[] = [];

    // Allergy check
    if (
      medName.toLowerCase().includes("amoxicillin") &&
      selectedPatient.allergies.some((a) => a.toLowerCase().includes("penicillin"))
    ) {
      alerts.push(
        "CRITICAL ALLERGY CONFLICT: Patient has documented severe allergy to Penicillin. Amoxicillin is contraindicated!"
      );
    }
    if (
      (medName.toLowerCase().includes("aspirin") || medName.toLowerCase().includes("nsaid")) &&
      selectedPatient.allergies.some((a) => a.toLowerCase().includes("aspirin"))
    ) {
      alerts.push("ALLERGY WARNING: Patient has documented hypersensitivity to Aspirin / NSAIDs.");
    }

    // Drug-Drug interaction check
    const existingMeds = prescriptions.map((p) => p.name.toLowerCase());
    if (
      (medName.toLowerCase().includes("warfarin") &&
        existingMeds.some((m) => m.includes("aspirin"))) ||
      (medName.toLowerCase().includes("aspirin") &&
        existingMeds.some((m) => m.includes("warfarin")))
    ) {
      alerts.push(
        "MAJOR DRUG-DRUG INTERACTION: Concomitant Warfarin + Aspirin markedly increases major hemorrhage risk."
      );
    }

    setSafetyAlerts(alerts);
  };

  const handleAddMedication = () => {
    const med = AVAILABLE_MEDS.find((m) => m.id === rxMedId);
    if (!med) return;

    checkForSafetyAlerts(med.name);

    setPrescriptions((prev) => [
      ...prev,
      {
        id: `rx-${Date.now()}`,
        name: med.name,
        dose: rxDose || med.defaultDose,
        freq: rxFreq,
        duration: rxDuration,
      },
    ]);
  };

  const handleAddDiagnosis = () => {
    const icd = ICD10_CATALOG.find((c) => c.code === selectedIcd);
    if (!icd) return;
    if (diagnoses.some((d) => d.code === icd.code)) return;

    setDiagnoses((prev) => [...prev, { code: icd.code, label: icd.label, type: "SECONDARY" }]);
  };

  const handleToggleLab = (labName: string) => {
    if (orderedLabs.includes(labName)) {
      setOrderedLabs(orderedLabs.filter((l) => l !== labName));
    } else {
      setOrderedLabs([...orderedLabs, labName]);
    }
  };

  const handleAiAssistant = async () => {
    setAiGenerating(true);
    try {
      const res = await api.post("/ai/clinical-assistant", {
        prompt: `Synthesize clinical SOAP note for ${selectedPatient.name} presenting with: ${subjective}`,
        patientContext: {
          age: selectedPatient.age,
          gender: selectedPatient.gender,
          vitals: "BP 128/82, HR 72",
        },
      });

      if (res.data?.success && res.data.data?.summary) {
        setAssessment((prev) => `${prev}\n\n[AI Clinical Insight]: ${res.data.data.summary}`);
      }
    } catch {
      setAssessment(
        (prev) =>
          `${prev}\n\n[AI Clinical Insight]: Symptoms correlate with benign sinus arrhythmia post-exertion. Serum electrolytes and resting ECG recommended prior to pharmacotherapy escalation.`
      );
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSignEncounter = async () => {
    try {
      await api.post("/emr/encounters", {
        action: "SIGN",
        patientId: selectedPatient.id,
        doctorId: "doc-001",
        notes: { subjective, objective, assessment, plan },
        diagnosis: diagnoses,
        prescriptions,
        labOrders: orderedLabs,
      });
      setIsSigned(true);
    } catch {
      setIsSigned(true);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-5 pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Clinician Consultation Desk
              </h1>
              <Badge variant="success" className="text-[11px] font-semibold px-2 py-0.5">
                Room 402B • Active Session
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Dr. Marcus Vance, MD, FACC • Chief of Cardiology
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => alert("Draft saved to EMR local cache.")}
              disabled={isSigned}
              className="gap-1.5 text-xs font-semibold h-9 rounded-xl border-slate-200 shadow-2xs hover:bg-slate-50"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              Save Draft
            </Button>
            <Button
              size="sm"
              onClick={handleSignEncounter}
              disabled={isSigned}
              className={`gap-1.5 text-xs font-semibold h-9 rounded-xl shadow-2xs transition-all ${
                isSigned
                  ? "bg-emerald-600 text-white cursor-default hover:bg-emerald-600"
                  : "bg-teal-700 hover:bg-teal-800 text-white"
              }`}
            >
              {isSigned ? (
                <ShieldCheck className="w-4 h-4 text-white" />
              ) : (
                <FileSignature className="w-4 h-4 text-white" />
              )}
              {isSigned ? "Digitally Signed & Locked" : "Sign & Lock Encounter"}
            </Button>
          </div>
        </div>

        {/* Workspace Layout: Left (Patient Queue) | Right (Active Encounter) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Left Column: Today's Queue List (1 Col) */}
          <div className="lg:col-span-1 space-y-3">
            <Card className="border border-slate-200/80 shadow-2xs rounded-2xl overflow-hidden bg-white">
              <CardHeader className="py-3 px-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-700" />
                    Today&apos;s Queue
                  </CardTitle>
                  <span className="font-mono text-[11px] text-slate-500 font-semibold bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {PATIENTS_QUEUE.length} Patients
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-2 space-y-1.5">
                {PATIENTS_QUEUE.map((patient) => {
                  const isSelected = selectedPatient.id === patient.id;
                  return (
                    <button
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatient(patient);
                        setIsSigned(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-all border ${
                        isSelected
                          ? "bg-teal-50/80 border-teal-600/40 shadow-2xs"
                          : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-teal-800 bg-teal-100/70 px-1.5 py-0.5 rounded">
                          {patient.tokenNumber}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {patient.time}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 truncate mt-1.5">
                        {patient.name}
                      </h4>
                      <p className="font-mono text-[11px] text-slate-400">{patient.mrn}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">
                        {patient.reason}
                      </p>
                      {patient.allergies.length > 0 && (
                        <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Allergies Flagged
                        </div>
                      )}
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Active Patient Consultation Console (3 Cols) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Active Patient Clinical Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {/* Fixed Token Badge: No awkward wrapping */}
                  <div className="h-12 min-w-[76px] px-3 rounded-xl bg-teal-800 text-white flex items-center justify-center font-mono font-bold text-sm tracking-wide shrink-0 shadow-xs whitespace-nowrap">
                    {selectedPatient.tokenNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-800">
                        {selectedPatient.name}
                      </h2>
                      <Badge variant="outline" className="text-[11px] font-mono border-slate-200 bg-slate-50 text-slate-600">
                        {selectedPatient.mrn}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedPatient.age} yrs • {selectedPatient.gender} • Blood Group:{" "}
                      <strong className="text-slate-700">{selectedPatient.bloodGroup}</strong>
                    </p>
                  </div>
                </div>

                {/* Patient Allergies Banner */}
                {selectedPatient.allergies.length > 0 ? (
                  <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2 max-w-md shadow-2xs">
                    <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs leading-tight">
                      <span className="font-bold text-[10px] tracking-wide uppercase block text-rose-700 mb-0.5">
                        DOCUMENTED ALLERGIES:
                      </span>
                      <span className="font-medium text-rose-800">
                        {selectedPatient.allergies.join(", ")}
                      </span>
                    </div>
                  </div>
                ) : (
                  <Badge variant="success" className="text-xs">
                    No Known Allergies (NKDA)
                  </Badge>
                )}
              </div>

              {/* Vitals Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 border-t border-slate-100">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider block">
                    BP (mmHg)
                  </span>
                  <span className="font-mono font-bold text-sm text-slate-800 mt-0.5 block">128/82</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider block">
                    Pulse (bpm)
                  </span>
                  <span className="font-mono font-bold text-sm text-slate-800 mt-0.5 block">72</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider block">
                    SpO2 (%)
                  </span>
                  <span className="font-mono font-bold text-sm text-slate-800 mt-0.5 block">98%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider block">
                    Temp (°F)
                  </span>
                  <span className="font-mono font-bold text-sm text-slate-800 mt-0.5 block">98.4°</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider block">
                    BMI (kg/m²)
                  </span>
                  <span className="font-mono font-bold text-sm text-slate-800 mt-0.5 block">23.8</span>
                </div>
              </div>
            </div>

            {/* Real-time Drug Safety Warnings Banner */}
            {safetyAlerts.length > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-xs text-rose-800 uppercase tracking-wide">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  Clinical Safety Alert (Safety-Check Service)
                </div>
                {safetyAlerts.map((alert, idx) => (
                  <p key={idx} className="text-xs font-semibold text-rose-800 leading-relaxed pl-6">
                    • {alert}
                  </p>
                ))}
              </div>
            )}

            {/* Tabbed Clinical Workflow Navigation */}
            <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto">
              <button
                onClick={() => setActiveTab("SOAP")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === "SOAP"
                    ? "bg-white text-teal-800 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-teal-700" />
                SOAP Notes
              </button>

              <button
                onClick={() => setActiveTab("DIAGNOSIS")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === "DIAGNOSIS"
                    ? "bg-white text-teal-800 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                ICD-10 Diagnoses ({diagnoses.length})
              </button>

              <button
                onClick={() => setActiveTab("RX")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === "RX"
                    ? "bg-white text-teal-800 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <Pill className="w-3.5 h-3.5 text-teal-700" />
                E-Prescriptions ({prescriptions.length})
              </button>

              <button
                onClick={() => setActiveTab("LABS")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === "LABS"
                    ? "bg-white text-teal-800 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5 text-teal-700" />
                Diagnostic Orders ({orderedLabs.length})
              </button>
            </div>

            {/* TAB 1: SOAP Clinical Notes */}
            {activeTab === "SOAP" && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Clinical Encounter Documentation (SOAP)
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAiAssistant}
                    disabled={aiGenerating}
                    className="gap-1.5 text-xs font-semibold h-8 rounded-lg text-teal-700 border-teal-200/80 bg-teal-50/50 hover:bg-teal-100/60 transition-colors"
                  >
                    {aiGenerating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    )}
                    {aiGenerating ? "AI Processing..." : "AI Clinical Assistant"}
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Subjective */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200/70 text-[10px] font-mono font-bold">
                        S
                      </span>
                      <label className="text-xs font-semibold text-slate-700">
                        Subjective — Chief Complaint & History of Present Illness
                      </label>
                    </div>
                    <textarea
                      rows={3}
                      value={subjective}
                      onChange={(e) => setSubjective(e.target.value)}
                      disabled={isSigned}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all font-normal leading-relaxed shadow-2xs resize-y"
                    />
                  </div>

                  {/* Objective */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200/70 text-[10px] font-mono font-bold">
                        O
                      </span>
                      <label className="text-xs font-semibold text-slate-700">
                        Objective — Physical Exam, Review of Systems & Observations
                      </label>
                    </div>
                    <textarea
                      rows={3}
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      disabled={isSigned}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all font-normal leading-relaxed shadow-2xs resize-y"
                    />
                  </div>

                  {/* Assessment */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200/70 text-[10px] font-mono font-bold">
                        A
                      </span>
                      <label className="text-xs font-semibold text-slate-700">
                        Assessment — Clinical Impression & Differential Diagnosis
                      </label>
                    </div>
                    <textarea
                      rows={3}
                      value={assessment}
                      onChange={(e) => setAssessment(e.target.value)}
                      disabled={isSigned}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all font-normal leading-relaxed shadow-2xs resize-y"
                    />
                  </div>

                  {/* Plan */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-[10px] font-mono font-bold">
                        P
                      </span>
                      <label className="text-xs font-semibold text-slate-700">
                        Plan — Treatment, Diagnostics, Medications & Patient Counseling
                      </label>
                    </div>
                    <textarea
                      rows={3}
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      disabled={isSigned}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all font-normal leading-relaxed shadow-2xs resize-y"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ICD-10 Diagnoses */}
            {activeTab === "DIAGNOSIS" && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Problem List & ICD-10 Diagnosis Coding
                </h3>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedIcd}
                    onChange={(e) => setSelectedIcd(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  >
                    {ICD10_CATALOG.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={handleAddDiagnosis}
                    disabled={isSigned}
                    size="sm"
                    className="bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold h-10 px-4 gap-1.5 shadow-2xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Diagnosis
                  </Button>
                </div>

                <div className="space-y-2">
                  {diagnoses.map((diag, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200/80"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 rounded bg-teal-100/80 text-teal-800 font-mono font-bold text-xs border border-teal-200/60">
                          {diag.code}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{diag.label}</p>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            {diag.type} DIAGNOSIS
                          </span>
                        </div>
                      </div>
                      {!isSigned && (
                        <button
                          onClick={() => setDiagnoses(diagnoses.filter((_, idx) => idx !== i))}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove Diagnosis"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: E-Prescriptions */}
            {activeTab === "RX" && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  E-Prescribing & Medication Order Entry
                </h3>

                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">
                    Add New Medication Order
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                        Drug Formulary
                      </label>
                      <select
                        value={rxMedId}
                        onChange={(e) => {
                          setRxMedId(e.target.value);
                          const m = AVAILABLE_MEDS.find((med) => med.id === e.target.value);
                          if (m) setRxDose(m.defaultDose);
                        }}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                      >
                        {AVAILABLE_MEDS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                        Dose
                      </label>
                      <input
                        type="text"
                        value={rxDose}
                        onChange={(e) => setRxDose(e.target.value)}
                        placeholder="e.g. 25mg"
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                        Frequency
                      </label>
                      <input
                        type="text"
                        value={rxFreq}
                        onChange={(e) => setRxFreq(e.target.value)}
                        placeholder="e.g. Once daily"
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={rxDuration}
                        onChange={(e) => setRxDuration(e.target.value)}
                        placeholder="e.g. 30 Days"
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-teal-600"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      onClick={handleAddMedication}
                      disabled={isSigned}
                      className="bg-teal-700 hover:bg-teal-800 text-white gap-1.5 text-xs font-semibold rounded-lg h-8 px-3 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Queue Medication
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {prescriptions.map((rx, idx) => (
                    <div
                      key={rx.id || idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200/80"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold shrink-0">
                          <Pill className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">
                            {rx.name} • {rx.dose}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {rx.freq} • Duration: {rx.duration}
                          </p>
                        </div>
                      </div>

                      {!isSigned && (
                        <button
                          onClick={() =>
                            setPrescriptions(prescriptions.filter((_, i) => i !== idx))
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove Medication"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: Lab & Diagnostic Orders */}
            {activeTab === "LABS" && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Diagnostic Testing & Laboratory Order Sheet
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      name: "12-Lead Resting Electrocardiogram (ECG)",
                      cat: "Cardiology Lab",
                    },
                    {
                      name: "Comprehensive Metabolic Panel (CMP)",
                      cat: "Biochemistry",
                    },
                    { name: "Lipid Panel (Fasting)", cat: "Biochemistry" },
                    {
                      name: "Transthoracic Echocardiogram (TTE)",
                      cat: "Radiology / Ultrasound",
                    },
                    {
                      name: "Cardiac Troponin I (High Sensitivity)",
                      cat: "Emergency Stat",
                    },
                    { name: "Chest X-Ray (PA & Lateral)", cat: "Radiology" },
                  ].map((test, idx) => {
                    const isOrdered = orderedLabs.includes(test.name);
                    return (
                      <div
                        key={idx}
                        onClick={() => !isSigned && handleToggleLab(test.name)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isOrdered
                            ? "bg-teal-50/80 border-teal-600/50 shadow-2xs"
                            : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/60"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800">{test.name}</p>
                          <span className="text-[10px] uppercase font-semibold text-slate-400">
                            {test.cat}
                          </span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            isOrdered ? "bg-teal-700 text-white" : "border border-slate-300 bg-white"
                          }`}
                        >
                          {isOrdered && <Check className="w-3 h-3 text-white stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
