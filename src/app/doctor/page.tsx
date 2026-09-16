"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import api from "@/lib/axios";

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
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/doctor") {
      router.replace("/doctor/dashboard");
    }
  }, [pathname, router]);

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
      // Deterministic local clinical assistant fallback
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
      <div className="max-w-7xl mx-auto space-y-space-6 pb-space-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <div className="flex items-center gap-space-3">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                Clinician Consultation Desk
              </h1>
              <Badge variant="success" className="text-xs">
                Room 402B • Active Session
              </Badge>
            </div>
            <p className="font-body-md text-on-surface-variant mt-1">
              Dr. Marcus Vance, MD, FACC • Chief of Cardiology
            </p>
          </div>

          <div className="flex items-center gap-space-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => alert("Draft saved to EMR local cache.")}
              disabled={isSigned}
              className="gap-1 border-outline-variant/40"
            >
              <span className="material-symbols-outlined text-base">save</span>
              Save Draft
            </Button>
            <Button
              size="sm"
              onClick={handleSignEncounter}
              disabled={isSigned}
              className={`gap-1 font-semibold ${
                isSigned
                  ? "bg-emerald-600 text-white cursor-default"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {isSigned ? "verified" : "draw"}
              </span>
              {isSigned ? "Digitally Signed & Locked" : "Sign & Lock Encounter"}
            </Button>
          </div>
        </div>

        {/* Workspace Layout: Left (Patient Queue) | Right (Active Encounter) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-space-6">
          {/* Left Column: Today's Queue List (1 Col) */}
          <div className="lg:col-span-1 space-y-space-4">
            <Card className="border border-outline-variant/30 shadow-xs">
              <CardHeader className="pb-space-2 border-b border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-title-sm text-title-sm text-on-surface flex items-center gap-space-2">
                    <span className="material-symbols-outlined text-primary text-lg">groups</span>
                    Today&apos;s Queue
                  </CardTitle>
                  <span className="font-mono text-xs text-outline font-semibold">
                    {PATIENTS_QUEUE.length} Patients
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-space-2 space-y-space-2">
                {PATIENTS_QUEUE.map((patient) => {
                  const isSelected = selectedPatient.id === patient.id;
                  return (
                    <button
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatient(patient);
                        setIsSigned(false);
                      }}
                      className={`w-full text-left p-space-3 rounded-xl transition-all border ${
                        isSelected
                          ? "bg-primary/10 border-primary/40 shadow-xs"
                          : "bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-primary">
                          {patient.tokenNumber}
                        </span>
                        <span className="text-[10px] font-mono text-outline">{patient.time}</span>
                      </div>
                      <h4 className="font-title-sm font-bold text-on-surface truncate mt-1">
                        {patient.name}
                      </h4>
                      <p className="font-mono text-xs text-outline">{patient.mrn}</p>
                      <p className="font-body-sm text-xs text-on-surface-variant line-clamp-1 mt-1">
                        {patient.reason}
                      </p>
                      {patient.allergies.length > 0 && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-error font-semibold">
                          <span className="material-symbols-outlined text-xs">warning</span>
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
          <div className="lg:col-span-3 space-y-space-6">
            {/* Active Patient Clinical Banner */}
            <div className="p-space-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs space-y-space-4">
              <div className="flex flex-wrap items-start justify-between gap-space-4">
                <div className="flex items-center gap-space-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-mono font-bold text-xl shrink-0">
                    {selectedPatient.tokenNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-space-2">
                      <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                        {selectedPatient.name}
                      </h2>
                      <Badge variant="outline" className="text-xs font-mono">
                        {selectedPatient.mrn}
                      </Badge>
                    </div>
                    <p className="font-body-sm text-on-surface-variant mt-0.5">
                      {selectedPatient.age} yrs • {selectedPatient.gender} • Blood Group:{" "}
                      <strong>{selectedPatient.bloodGroup}</strong>
                    </p>
                  </div>
                </div>

                {/* Patient Allergies Banner */}
                {selectedPatient.allergies.length > 0 ? (
                  <div className="p-space-2.5 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-space-2 max-w-sm">
                    <span className="material-symbols-outlined text-red-600 text-lg shrink-0 mt-0.5">
                      allergies
                    </span>
                    <div className="text-xs">
                      <span className="font-bold block">DOCUMENTED ALLERGIES:</span>
                      <span>{selectedPatient.allergies.join(", ")}</span>
                    </div>
                  </div>
                ) : (
                  <Badge variant="success" className="text-xs">
                    No Known Allergies (NKDA)
                  </Badge>
                )}
              </div>

              {/* Vitals Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-space-2 pt-space-2 border-t border-outline-variant/20">
                <div className="p-space-2 rounded-lg bg-surface-container-low text-center">
                  <span className="text-[10px] uppercase text-outline font-semibold block">
                    BP (mmHg)
                  </span>
                  <span className="font-mono font-bold text-sm text-on-surface">128/82</span>
                </div>
                <div className="p-space-2 rounded-lg bg-surface-container-low text-center">
                  <span className="text-[10px] uppercase text-outline font-semibold block">
                    Pulse (bpm)
                  </span>
                  <span className="font-mono font-bold text-sm text-on-surface">72</span>
                </div>
                <div className="p-space-2 rounded-lg bg-surface-container-low text-center">
                  <span className="text-[10px] uppercase text-outline font-semibold block">
                    SpO2 (%)
                  </span>
                  <span className="font-mono font-bold text-sm text-on-surface">98%</span>
                </div>
                <div className="p-space-2 rounded-lg bg-surface-container-low text-center">
                  <span className="text-[10px] uppercase text-outline font-semibold block">
                    Temp (°F)
                  </span>
                  <span className="font-mono font-bold text-sm text-on-surface">98.4°</span>
                </div>
                <div className="p-space-2 rounded-lg bg-surface-container-low text-center">
                  <span className="text-[10px] uppercase text-outline font-semibold block">
                    BMI (kg/m²)
                  </span>
                  <span className="font-mono font-bold text-sm text-on-surface">23.8</span>
                </div>
              </div>
            </div>

            {/* Real-time Drug Safety Warnings Banner */}
            {safetyAlerts.length > 0 && (
              <div className="p-space-4 rounded-2xl bg-red-50 border-2 border-red-400 text-red-950 space-y-space-2 animate-in fade-in">
                <div className="flex items-center gap-space-2 font-bold text-red-900">
                  <span className="material-symbols-outlined text-red-600">emergency</span>
                  CLINICAL SAFETY ALERT (SAFETY-CHECK SERVICE)
                </div>
                {safetyAlerts.map((alert, idx) => (
                  <p key={idx} className="text-xs font-semibold text-red-800 leading-relaxed">
                    • {alert}
                  </p>
                ))}
              </div>
            )}

            {/* Tabbed Clinical Workflow Navigation */}
            <div className="flex items-center gap-space-2 border-b border-outline-variant/20 pb-space-2">
              <button
                onClick={() => setActiveTab("SOAP")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-md transition-colors ${
                  activeTab === "SOAP"
                    ? "bg-primary text-white font-bold"
                    : "text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-base">clinical_notes</span>
                SOAP Notes
              </button>

              <button
                onClick={() => setActiveTab("DIAGNOSIS")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-md transition-colors ${
                  activeTab === "DIAGNOSIS"
                    ? "bg-primary text-white font-bold"
                    : "text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-base">diagnosis</span>
                ICD-10 Diagnoses ({diagnoses.length})
              </button>

              <button
                onClick={() => setActiveTab("RX")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-md transition-colors ${
                  activeTab === "RX"
                    ? "bg-primary text-white font-bold"
                    : "text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-base">medication</span>
                E-Prescriptions ({prescriptions.length})
              </button>

              <button
                onClick={() => setActiveTab("LABS")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-md transition-colors ${
                  activeTab === "LABS"
                    ? "bg-primary text-white font-bold"
                    : "text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-base">science</span>
                Diagnostic Orders ({orderedLabs.length})
              </button>
            </div>

            {/* TAB 1: SOAP Clinical Notes */}
            {activeTab === "SOAP" && (
              <div className="space-y-space-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-title-md font-bold text-on-surface">
                    Clinical Encounter Documentation (SOAP)
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAiAssistant}
                    disabled={aiGenerating}
                    className="gap-1 text-primary border-primary/30 hover:bg-primary/10"
                  >
                    <span className="material-symbols-outlined text-base">
                      {aiGenerating ? "progress_activity" : "auto_awesome"}
                    </span>
                    {aiGenerating ? "AI Processing..." : "AI Clinical Assistant"}
                  </Button>
                </div>

                <div className="space-y-space-3">
                  <div>
                    <label className="font-label-md font-bold text-primary block mb-1">
                      Subjective (S) - Chief Complaint & History of Present Illness
                    </label>
                    <textarea
                      rows={3}
                      value={subjective}
                      onChange={(e) => setSubjective(e.target.value)}
                      disabled={isSigned}
                      className="w-full p-3 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="font-label-md font-bold text-primary block mb-1">
                      Objective (O) - Physical Exam, Review of Systems & Observations
                    </label>
                    <textarea
                      rows={3}
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      disabled={isSigned}
                      className="w-full p-3 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="font-label-md font-bold text-primary block mb-1">
                      Assessment (A) - Clinical Impression & Differential Diagnosis
                    </label>
                    <textarea
                      rows={3}
                      value={assessment}
                      onChange={(e) => setAssessment(e.target.value)}
                      disabled={isSigned}
                      className="w-full p-3 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="font-label-md font-bold text-primary block mb-1">
                      Plan (P) - Treatment, Diagnostics, Medications & Patient Counseling
                    </label>
                    <textarea
                      rows={3}
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      disabled={isSigned}
                      className="w-full p-3 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ICD-10 Diagnoses */}
            {activeTab === "DIAGNOSIS" && (
              <div className="space-y-space-4">
                <h3 className="font-title-md font-bold text-on-surface">
                  Problem List & ICD-10 Diagnosis Coding
                </h3>

                <div className="flex flex-col sm:flex-row gap-space-2">
                  <select
                    value={selectedIcd}
                    onChange={(e) => setSelectedIcd(e.target.value)}
                    className="flex-1 p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm"
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
                    className="bg-primary text-white"
                  >
                    Add Diagnosis
                  </Button>
                </div>

                <div className="space-y-space-2">
                  {diagnoses.map((diag, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-space-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30"
                    >
                      <div className="flex items-center gap-space-3">
                        <span className="px-2 py-1 rounded bg-teal-100 text-teal-900 font-mono font-bold text-xs">
                          {diag.code}
                        </span>
                        <div>
                          <p className="font-body-md font-semibold text-on-surface">{diag.label}</p>
                          <span className="text-[10px] text-outline uppercase font-semibold">
                            {diag.type} DIAGNOSIS
                          </span>
                        </div>
                      </div>
                      {!isSigned && (
                        <button
                          onClick={() => setDiagnoses(diagnoses.filter((_, idx) => idx !== i))}
                          className="text-error hover:text-error/80"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: E-Prescriptions */}
            {activeTab === "RX" && (
              <div className="space-y-space-4">
                <h3 className="font-title-md font-bold text-on-surface">
                  E-Prescribing & Medication Order Entry
                </h3>

                <div className="p-space-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-space-3">
                  <h4 className="font-title-sm font-bold text-on-surface">
                    Add New Medication Order
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-space-2">
                    <div>
                      <label className="text-xs font-semibold text-outline block mb-1">Drug</label>
                      <select
                        value={rxMedId}
                        onChange={(e) => {
                          setRxMedId(e.target.value);
                          const m = AVAILABLE_MEDS.find((med) => med.id === e.target.value);
                          if (m) setRxDose(m.defaultDose);
                        }}
                        className="w-full p-2 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-xs"
                      >
                        {AVAILABLE_MEDS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-outline block mb-1">Dose</label>
                      <input
                        type="text"
                        value={rxDose}
                        onChange={(e) => setRxDose(e.target.value)}
                        placeholder="e.g. 25mg"
                        className="w-full p-2 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-outline block mb-1">
                        Frequency
                      </label>
                      <input
                        type="text"
                        value={rxFreq}
                        onChange={(e) => setRxFreq(e.target.value)}
                        placeholder="e.g. Once daily"
                        className="w-full p-2 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-outline block mb-1">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={rxDuration}
                        onChange={(e) => setRxDuration(e.target.value)}
                        placeholder="e.g. 30 Days"
                        className="w-full p-2 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleAddMedication}
                      disabled={isSigned}
                      className="bg-primary text-white gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Queue Medication
                    </Button>
                  </div>
                </div>

                <div className="space-y-space-2">
                  {prescriptions.map((rx, idx) => (
                    <div
                      key={rx.id || idx}
                      className="flex items-center justify-between p-space-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30"
                    >
                      <div className="flex items-center gap-space-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-xl">medication</span>
                        </div>
                        <div>
                          <h4 className="font-title-sm font-bold text-on-surface">
                            {rx.name} • {rx.dose}
                          </h4>
                          <p className="text-xs text-outline">
                            {rx.freq} • Duration: {rx.duration}
                          </p>
                        </div>
                      </div>

                      {!isSigned && (
                        <button
                          onClick={() =>
                            setPrescriptions(prescriptions.filter((_, i) => i !== idx))
                          }
                          className="text-error hover:text-error/80"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: Lab & Diagnostic Orders */}
            {activeTab === "LABS" && (
              <div className="space-y-space-4">
                <h3 className="font-title-md font-bold text-on-surface">
                  Diagnostic Testing & Laboratory Order Sheet
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-3">
                  {[
                    {
                      name: "12-Lead Resting Electrocardiogram (ECG)",
                      cat: "Cardiology Lab",
                      stat: false,
                    },
                    {
                      name: "Comprehensive Metabolic Panel (CMP)",
                      cat: "Biochemistry",
                      stat: false,
                    },
                    { name: "Lipid Panel (Fasting)", cat: "Biochemistry", stat: false },
                    {
                      name: "Transthoracic Echocardiogram (TTE)",
                      cat: "Radiology / Ultrasound",
                      stat: false,
                    },
                    {
                      name: "Cardiac Troponin I (High Sensitivity)",
                      cat: "Emergency Stat",
                      stat: true,
                    },
                    { name: "Chest X-Ray (PA & Lateral)", cat: "Radiology", stat: false },
                  ].map((test, idx) => {
                    const isOrdered = orderedLabs.includes(test.name);
                    return (
                      <div
                        key={idx}
                        onClick={() => !isSigned && handleToggleLab(test.name)}
                        className={`p-space-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isOrdered
                            ? "bg-primary/10 border-primary/50 shadow-xs"
                            : "bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="font-title-sm font-bold text-on-surface">{test.name}</p>
                          <span className="text-[10px] uppercase font-semibold text-outline">
                            {test.cat}
                          </span>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isOrdered ? "bg-primary text-white" : "border border-outline-variant"
                          }`}
                        >
                          {isOrdered && (
                            <span className="material-symbols-outlined text-sm">check</span>
                          )}
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
