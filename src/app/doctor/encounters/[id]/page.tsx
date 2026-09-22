"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Printer,
  ArrowLeft,
  ShieldCheck,
  Lock,
  Activity,
  FileText,
  Pill,
  FlaskConical,
  Calendar,
  ChevronRight,
  User,
  Heart,
  Thermometer,
  Scale,
  Stethoscope,
} from "lucide-react";

export default function SignedEncounterSummaryPage() {
  const params = useParams();
  const encounterId = (params?.id as string) || "ENC-2026-0089";

  const [encounter] = useState({
    id: encounterId,
    encounterNumber: encounterId,
    patientName: "Eleanor Pena",
    patientMrn: "MRN-2026-001842",
    dob: "1988-04-15",
    age: 38,
    gender: "Female",
    doctorName: "Dr. Marcus Vance, MD, FACC",
    department: "Cardiovascular Medicine",
    licenseNumber: "MD-894210",
    signedAt: "2026-10-24 11:15 AM",
    status: "SIGNED",
    digitalSignatureHash:
      "SHA256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    vitals: {
      bp: "138/86 mmHg",
      hr: "74 bpm",
      temp: "36.8 °C (98.2 °F)",
      spo2: "98%",
      weight: "68.2 kg",
      height: "168 cm",
      bmi: "24.2 (Normal)",
    },
    soap: {
      subjective:
        "38-year-old female presents for scheduled cardiology evaluation following persistent palpitations and mild exertional dyspnea over the last 3 weeks. Denies syncope, chest pain, or lower extremity edema. Reports increased work-related stress.",
      objective:
        "Alert and oriented x3. Cardiac exam reveals regular rate and rhythm with normal S1/S2; no murmurs, gallops, or friction rubs. Clear breath sounds bilaterally. Resting ECG shows sinus rhythm at 74 bpm without acute ischemic ST-T abnormalities.",
      assessment:
        "1. Primary Essential Hypertension (ICD-10: I10), moderate control.\n2. Benign Palpitations (ICD-10: R00.2), likely catecholamine-mediated stress response.\n3. Mild dyspnea on heavy exertion; rule out early cardiomyopathy.",
      plan: "1. Initiate Amlodipine 5mg PO daily in the morning.\n2. Prescribe 24-hour Holter ambulatory monitoring and Echocardiogram.\n3. Comprehensive Metabolic Panel (CMP) + Lipid profile.\n4. Dietary sodium reduction (<2g/day) and structured aerobic activity.\n5. Follow-up consultation in clinic in 4 weeks.",
    },
    diagnoses: [
      { code: "I10", name: "Essential (primary) hypertension", isPrimary: true },
      { code: "R00.2", name: "Palpitations, unspecified", isPrimary: false },
    ],
    prescriptions: [
      {
        id: "rx-1",
        medicine: "Amlodipine Besylate",
        strength: "5 mg Tablet",
        dosage: "1 tablet daily morning with water",
        duration: "30 Days (Qty: 30)",
        status: "DISPENSED",
      },
      {
        id: "rx-2",
        medicine: "Atorvastatin Calcium",
        strength: "20 mg Tablet",
        dosage: "1 tablet at bedtime",
        duration: "30 Days (Qty: 30)",
        status: "PROCESSING",
      },
    ],
    orders: [
      { test: "24-Hour Ambulatory Holter ECG", category: "CARDIOLOGY", status: "SCHEDULED" },
      { test: "Transthoracic Echocardiogram (TTE)", category: "RADIOLOGY", status: "PENDING" },
      { test: "Comprehensive Metabolic Panel (CMP)", category: "LABORATORY", status: "COMPLETED" },
    ],
    followUp: {
      date: "2026-11-21",
      instructions:
        "Return in 4 weeks for repeat blood pressure check and review of 24h Holter results.",
    },
  });

  return (
    <AppLayout>
      <div className="space-y-5 max-w-5xl mx-auto pb-12">
        {/* Navigation & Print Actions */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/doctor/dashboard" className="hover:text-teal-700 transition-colors font-medium">
              Clinician Workspace
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-800 font-semibold">Encounter Summary</span>
            <span className="font-mono text-[11px] text-slate-400">
              ({encounter.encounterNumber})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 text-xs font-semibold h-9 rounded-xl border-slate-200 shadow-2xs hover:bg-slate-50"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              Print Summary
            </Button>
            <Link href="/doctor/dashboard">
              <Button size="sm" className="gap-1.5 text-xs font-semibold h-9 rounded-xl bg-teal-700 hover:bg-teal-800 text-white shadow-2xs">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Workspace
              </Button>
            </Link>
          </div>
        </div>

        {/* Digital Signature Seal Header (EMR-06) */}
        <div className="p-5 bg-white rounded-2xl border border-emerald-300 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                <ShieldCheck className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-800">
                    Officially Signed Clinical Encounter (EMR-06)
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    IMMUTABLE RECORD
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Electronically authenticated by {encounter.doctorName} on {encounter.signedAt}.
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                License Number
              </span>
              <span className="font-mono text-xs font-bold text-slate-700">{encounter.licenseNumber}</span>
            </div>
          </div>

          {/* Cryptographic Hash Badge */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 text-[11px] font-mono text-slate-500 flex items-center gap-2 overflow-x-auto">
            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-bold text-slate-700 shrink-0">CRYPTOGRAPHIC SIGNATURE:</span>
            <span className="truncate">{encounter.digitalSignatureHash}</span>
          </div>
        </div>

        {/* Patient Demographics Strip */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Patient Name</span>
            <Link
              href={`/patients`}
              className="font-bold text-teal-800 hover:underline mt-0.5 block"
            >
              {encounter.patientName}
            </Link>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Medical Record No.</span>
            <span className="font-mono font-bold text-slate-800 mt-0.5 block">{encounter.patientMrn}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Age & Gender</span>
            <span className="font-medium text-slate-700 mt-0.5 block">
              {encounter.age} yrs • {encounter.gender}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Clinical Specialty</span>
            <span className="font-medium text-slate-700 mt-0.5 block">{encounter.department}</span>
          </div>
        </div>

        {/* Recorded Vitals Snapshot */}
        <Card className="border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden bg-white">
          <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-2 text-teal-800">
              <Activity className="w-4 h-4 text-teal-700" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Recorded Encounter Vital Signs (EMR-02)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Blood Pressure
              </span>
              <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">
                {encounter.vitals.bp}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Heart Rate
              </span>
              <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">
                {encounter.vitals.hr}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Temperature
              </span>
              <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">
                {encounter.vitals.temp}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Oxygen Sat
              </span>
              <span className="text-xs font-bold text-emerald-700 font-mono mt-0.5 block">
                {encounter.vitals.spo2}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Body Weight
              </span>
              <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">
                {encounter.vitals.weight}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Height
              </span>
              <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">
                {encounter.vitals.height}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Calculated BMI
              </span>
              <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">
                {encounter.vitals.bmi}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* SOAP Clinical Notes (EMR-04) */}
        <Card className="border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden bg-white">
          <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-2 text-teal-800">
              <FileText className="w-4 h-4 text-teal-700" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Authenticated Clinical Notes (SOAP)
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Locked on sign-off. Post-signature amendments require a linked amendment record (EMR-06).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3.5 text-xs">
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 text-[10px] font-mono font-bold">S</span>
                <span className="text-xs font-bold text-slate-700">Subjective History & Chief Complaint</span>
              </div>
              <p className="text-slate-700 leading-relaxed pl-5">{encounter.soap.subjective}</p>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 text-[10px] font-mono font-bold">O</span>
                <span className="text-xs font-bold text-slate-700">Objective Physical Examination & Findings</span>
              </div>
              <p className="text-slate-700 leading-relaxed pl-5">{encounter.soap.objective}</p>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold">A</span>
                <span className="text-xs font-bold text-slate-700">Clinical Assessment & Differential Diagnosis</span>
              </div>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line pl-5">
                {encounter.soap.assessment}
              </p>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">P</span>
                <span className="text-xs font-bold text-slate-700">Management Plan & Follow-Up Directives</span>
              </div>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line pl-5">
                {encounter.soap.plan}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Diagnoses (ICD-10) */}
        <Card className="border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden bg-white">
          <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-700" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Coded Diagnoses (ICD-10)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {encounter.diagnoses.map((diag, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/70"
              >
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 bg-teal-100 text-teal-800 font-mono font-bold rounded text-xs">
                    {diag.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-800">{diag.name}</span>
                </div>
                <Badge variant={diag.isPrimary ? "primary" : "outline"} className="text-[10px]">
                  {diag.isPrimary ? "PRIMARY" : "SECONDARY"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* E-Prescriptions & Diagnostic Orders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Prescriptions */}
          <Card className="border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden bg-white">
            <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-teal-700" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Prescribed Regimens (PHA-01)
                  </CardTitle>
                </div>
                <Link href="/prescriptions">
                  <span className="text-xs text-teal-700 font-medium hover:underline">
                    Prescription Hub
                  </span>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              {encounter.prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      {rx.medicine} {rx.strength}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {rx.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">{rx.dosage}</p>
                  <span className="text-[10px] text-slate-400 block">Duration: {rx.duration}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Diagnostic Orders */}
          <Card className="border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden bg-white">
            <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-teal-700" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Diagnostic Work Orders (DIA-02)
                  </CardTitle>
                </div>
                <Link href="/diagnostics">
                  <span className="text-xs text-teal-700 font-medium hover:underline">
                    Lab Workstation
                  </span>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              {encounter.orders.map((ord, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">{ord.test}</span>
                    <span className="text-[10px] text-slate-400">{ord.category}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {ord.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Follow-up Directive */}
        <div className="p-4 bg-white border border-teal-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-teal-700" />
            </div>
            <div>
              <span className="text-xs font-bold text-teal-800 block">
                Scheduled Follow-up: {encounter.followUp.date}
              </span>
              <span className="text-xs text-slate-600">
                {encounter.followUp.instructions}
              </span>
            </div>
          </div>
          <Link href={`/appointments/book?patientId=${encounter.patientMrn}`}>
            <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl h-9 px-3.5 shadow-2xs shrink-0">
              Confirm Booking
            </Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
