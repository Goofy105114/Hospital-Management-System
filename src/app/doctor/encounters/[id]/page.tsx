"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

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
      <div className="space-y-space-6 max-w-5xl mx-auto pb-space-12">
        {/* Navigation & Print Actions */}
        <div className="flex items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div className="flex items-center gap-space-2 text-label-md text-outline">
            <Link href="/doctor" className="hover:text-primary transition-colors">
              Clinician Workspace
            </Link>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-on-surface font-semibold">Encounter Summary</span>
            <span className="font-mono text-label-sm text-outline">
              ({encounter.encounterNumber})
            </span>
          </div>

          <div className="flex items-center gap-space-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-space-2"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print Medical Summary
            </Button>
            <Link href="/doctor">
              <Button variant="secondary" size="sm" className="gap-space-1">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Workspace
              </Button>
            </Link>
          </div>
        </div>

        {/* Digital Signature Seal Header (EMR-06) */}
        <div className="p-space-6 bg-surface-container-lowest rounded-2xl border border-success/40 shadow-sm space-y-space-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-4">
            <div className="flex items-center gap-space-3">
              <div className="w-12 h-12 rounded-xl bg-success/15 text-success flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[32px]">verified</span>
              </div>
              <div>
                <div className="flex items-center gap-space-2">
                  <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Officially Signed Clinical Encounter (EMR-06)
                  </h1>
                  <Badge variant="primary" className="bg-success/15 text-success font-semibold">
                    IMMUTABLE RECORD
                  </Badge>
                </div>
                <p className="font-body-sm text-outline mt-space-1">
                  Electronically authenticated by {encounter.doctorName} on {encounter.signedAt}.
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-label-sm text-outline uppercase font-semibold block">
                License Number
              </span>
              <span className="font-mono font-bold text-on-surface">{encounter.licenseNumber}</span>
            </div>
          </div>

          {/* Cryptographic Hash Badge */}
          <div className="p-space-3 bg-surface-container rounded-lg border border-outline-variant/30 text-label-xs font-mono text-outline flex items-center gap-space-2 overflow-x-auto">
            <span className="material-symbols-outlined text-success text-[16px] shrink-0">
              lock
            </span>
            <span className="font-bold text-on-surface shrink-0">CRYPTOGRAPHIC SIGNATURE:</span>
            <span className="truncate">{encounter.digitalSignatureHash}</span>
          </div>
        </div>

        {/* Patient Demographics Strip */}
        <div className="p-space-4 bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-space-4 text-body-sm">
          <div>
            <span className="text-label-sm text-outline block">Patient Name</span>
            <Link
              href={`/patients/${encounter.patientMrn}`}
              className="font-bold text-primary hover:underline"
            >
              {encounter.patientName}
            </Link>
          </div>
          <div>
            <span className="text-label-sm text-outline block">Medical Record No.</span>
            <span className="font-mono font-bold text-on-surface">{encounter.patientMrn}</span>
          </div>
          <div>
            <span className="text-label-sm text-outline block">Age & Gender</span>
            <span className="font-medium text-on-surface">
              {encounter.age} yrs • {encounter.gender}
            </span>
          </div>
          <div>
            <span className="text-label-sm text-outline block">Clinical Specialty</span>
            <span className="font-medium text-on-surface">{encounter.department}</span>
          </div>
        </div>

        {/* Recorded Vitals Snapshot */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-space-2 text-primary">
              <span className="material-symbols-outlined">vital_signs</span>
              <CardTitle>Recorded Encounter Vital Signs (EMR-02)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-space-3 text-center">
            <div className="p-space-3 bg-surface-container rounded-lg border border-outline-variant/30">
              <span className="text-label-xs uppercase font-semibold text-outline block">
                Blood Pressure
              </span>
              <span className="text-title-sm font-bold text-on-surface font-mono mt-1 block">
                {encounter.vitals.bp}
              </span>
            </div>
            <div className="p-space-3 bg-surface-container rounded-lg border border-outline-variant/30">
              <span className="text-label-xs uppercase font-semibold text-outline block">
                Heart Rate
              </span>
              <span className="text-title-sm font-bold text-on-surface font-mono mt-1 block">
                {encounter.vitals.hr}
              </span>
            </div>
            <div className="p-space-3 bg-surface-container rounded-lg border border-outline-variant/30">
              <span className="text-label-xs uppercase font-semibold text-outline block">
                Temperature
              </span>
              <span className="text-title-sm font-bold text-on-surface font-mono mt-1 block">
                {encounter.vitals.temp}
              </span>
            </div>
            <div className="p-space-3 bg-surface-container rounded-lg border border-outline-variant/30">
              <span className="text-label-xs uppercase font-semibold text-outline block">
                Oxygen Sat
              </span>
              <span className="text-title-sm font-bold text-success font-mono mt-1 block">
                {encounter.vitals.spo2}
              </span>
            </div>
            <div className="p-space-3 bg-surface-container rounded-lg border border-outline-variant/30">
              <span className="text-label-xs uppercase font-semibold text-outline block">
                Body Weight
              </span>
              <span className="text-title-sm font-bold text-on-surface font-mono mt-1 block">
                {encounter.vitals.weight}
              </span>
            </div>
            <div className="p-space-3 bg-surface-container rounded-lg border border-outline-variant/30">
              <span className="text-label-xs uppercase font-semibold text-outline block">
                Height
              </span>
              <span className="text-title-sm font-bold text-on-surface font-mono mt-1 block">
                {encounter.vitals.height}
              </span>
            </div>
            <div className="p-space-3 bg-surface-container rounded-lg border border-outline-variant/30">
              <span className="text-label-xs uppercase font-semibold text-outline block">
                Calculated BMI
              </span>
              <span className="text-title-sm font-bold text-on-surface font-mono mt-1 block">
                {encounter.vitals.bmi}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* SOAP Clinical Notes (EMR-04) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-space-2 text-primary">
              <span className="material-symbols-outlined">clinical_notes</span>
              <CardTitle>Authenticated Clinical Notes (SOAP)</CardTitle>
            </div>
            <CardDescription>
              Locked on sign-off. Post-signature amendments require a linked amendment record
              (EMR-06).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-space-4 text-body-md">
            <div className="p-space-3 bg-surface-container rounded-lg border border-outline-variant/30">
              <span className="text-label-sm font-bold text-primary block uppercase tracking-wider mb-1">
                Subjective History & Chief Complaint
              </span>
              <p className="text-on-surface leading-relaxed">{encounter.soap.subjective}</p>
            </div>

            <div className="p-space-3 bg-surface-container rounded-lg border border-outline-variant/30">
              <span className="text-label-sm font-bold text-primary block uppercase tracking-wider mb-1">
                Objective Physical Examination & Findings
              </span>
              <p className="text-on-surface leading-relaxed">{encounter.soap.objective}</p>
            </div>

            <div className="p-space-3 bg-surface-container rounded-lg border border-outline-variant/30">
              <span className="text-label-sm font-bold text-primary block uppercase tracking-wider mb-1">
                Clinical Assessment & Differential Diagnosis
              </span>
              <p className="text-on-surface leading-relaxed whitespace-pre-line">
                {encounter.soap.assessment}
              </p>
            </div>

            <div className="p-space-3 bg-surface-container rounded-lg border border-outline-variant/30">
              <span className="text-label-sm font-bold text-primary block uppercase tracking-wider mb-1">
                Management Plan & Follow-Up Directives
              </span>
              <p className="text-on-surface leading-relaxed whitespace-pre-line">
                {encounter.soap.plan}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Diagnoses (ICD-10) */}
        <Card>
          <CardHeader>
            <CardTitle>Coded Diagnoses (ICD-10)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-space-2">
            {encounter.diagnoses.map((diag, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-space-3 bg-surface-container rounded-lg border border-outline-variant/30"
              >
                <div className="flex items-center gap-space-3">
                  <span className="px-space-2 py-0.5 bg-primary/15 text-primary font-mono font-bold rounded text-label-sm">
                    {diag.code}
                  </span>
                  <span className="font-semibold text-on-surface">{diag.name}</span>
                </div>
                <Badge variant={diag.isPrimary ? "primary" : "outline"}>
                  {diag.isPrimary ? "PRIMARY" : "SECONDARY"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* E-Prescriptions & Diagnostic Orders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-6">
          {/* Prescriptions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Prescribed Regimens (PHA-01)</CardTitle>
                <Link href="/prescriptions">
                  <span className="text-label-sm text-primary hover:underline">
                    Prescription Hub
                  </span>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-space-3">
              {encounter.prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="p-space-3 bg-surface-container rounded-lg border border-outline-variant/30 space-y-space-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-on-surface">
                      {rx.medicine} {rx.strength}
                    </span>
                    <Badge variant="outline" className="text-label-xs">
                      {rx.status}
                    </Badge>
                  </div>
                  <p className="text-label-sm text-outline">{rx.dosage}</p>
                  <span className="text-label-xs text-outline block">Duration: {rx.duration}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Diagnostic Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Diagnostic Work Orders (DIA-02)</CardTitle>
                <Link href="/diagnostics">
                  <span className="text-label-sm text-primary hover:underline">
                    Lab Workstation
                  </span>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-space-3">
              {encounter.orders.map((ord, idx) => (
                <div
                  key={idx}
                  className="p-space-3 bg-surface-container rounded-lg border border-outline-variant/30 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-on-surface block">{ord.test}</span>
                    <span className="text-label-xs text-outline">{ord.category}</span>
                  </div>
                  <Badge variant="outline" className="text-label-xs">
                    {ord.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Follow-up Directive */}
        <div className="p-space-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between gap-space-4">
          <div className="flex items-center gap-space-3">
            <span className="material-symbols-outlined text-primary text-[28px]">event_repeat</span>
            <div>
              <span className="font-title-sm font-bold text-primary block">
                Scheduled Follow-up: {encounter.followUp.date}
              </span>
              <span className="text-body-sm text-on-surface-variant">
                {encounter.followUp.instructions}
              </span>
            </div>
          </div>
          <Link href={`/appointments/book?patientId=${encounter.patientMrn}`}>
            <Button variant="primary" size="sm">
              Confirm Booking
            </Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
