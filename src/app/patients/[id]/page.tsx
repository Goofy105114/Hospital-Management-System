"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import api from "@/lib/axios";

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

interface ClinicalAlert {
  id: string;
  type: "ALLERGY_ON_FILE" | "HIGH_RISK" | "VIP" | "DNR_NOTED";
  note: string;
  createdAt: string;
  createdBy: string;
}

interface DocumentItem {
  id: string;
  title: string;
  type: "LAB_REPORT" | "PRESCRIPTION_SCAN" | "ID_PROOF" | "OTHER";
  uploadedAt: string;
  uploadedBy: string;
  fileSize: string;
}

export default function PatientChartPage() {
  const params = useParams();
  const patientId = (params?.id as string) || "pat-01";

  // Tab State
  const [activeTab, setActiveTab] = useState<
    "overview" | "alerts" | "documents" | "history" | "merge"
  >("overview");

  // Security & Break-Glass States (SEC-02, SEC-04)
  const [isPiiMasked, setIsPiiMasked] = useState(true);
  const [showStepUpModal, setShowStepUpModal] = useState(false);
  const [stepUpOtp, setStepUpOtp] = useState("");
  const [showBreakGlassModal, setShowBreakGlassModal] = useState(false);
  const [breakGlassReason, setBreakGlassReason] = useState("");
  const [isBreakGlassActive, setIsBreakGlassActive] = useState(false);

  // Document Upload State (PAT-03)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocType, setNewDocType] = useState<
    "LAB_REPORT" | "PRESCRIPTION_SCAN" | "ID_PROOF" | "OTHER"
  >("LAB_REPORT");

  // Merge State (PAT-04)
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [targetPatientMrn, setTargetPatientMrn] = useState("");
  const [mergeReason, setMergeReason] = useState("");
  const [mergeSuccess, setMergeSuccess] = useState(false);

  // Patient Real Data (PAT-01, PAT-02)
  const [patient, setPatient] = useState({
    id: patientId,
    mrn: "MRN-PENDING",
    firstName: "Patient",
    lastName: "Record",
    dob: "1990-01-01",
    age: 35,
    gender: "Other",
    bloodGroup: "O+",
    phone: "",
    secondaryPhone: "",
    email: "",
    address: "Medical Record on File",
    preferredLanguage: "English",
    insuranceProvider: "Going Merry Health Plan",
    policyNumber: "GM-INS-001",
    status: "ACTIVE",
    registeredAt: "Recent",
  });

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    api
      .get(`/patients/${patientId}`)
      .then((res) => {
        if (!isMounted) return;
        const data = res.data?.data;
        if (data) {
          setPatient({
            id: data.id,
            mrn: data.mrn,
            firstName: data.firstName,
            lastName: data.lastName,
            dob: data.dob,
            age: data.age,
            gender: data.gender,
            bloodGroup: data.bloodGroup,
            phone: data.phone,
            secondaryPhone: data.secondaryPhone,
            email: data.email,
            address: data.address,
            preferredLanguage: data.preferredLanguage,
            insuranceProvider: "Going Merry Health Plan",
            policyNumber: "GM-INS-001",
            status: data.status,
            registeredAt: data.registeredAt,
          });
          if (Array.isArray(data.emergencyContacts) && data.emergencyContacts.length > 0) {
            setEmergencyContacts(data.emergencyContacts);
          }
          if (Array.isArray(data.alerts) && data.alerts.length > 0) {
            setAlerts(data.alerts);
          }
          if (Array.isArray(data.documents) && data.documents.length > 0) {
            setDocuments(data.documents);
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [patientId]);

  const [newAlertNote, setNewAlertNote] = useState("");
  const [newAlertType, setNewAlertType] = useState<
    "ALLERGY_ON_FILE" | "HIGH_RISK" | "VIP" | "DNR_NOTED"
  >("ALLERGY_ON_FILE");

  // Handle Add Alert (PAT-02)
  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertNote.trim()) return;
    const newAlert: ClinicalAlert = {
      id: `alt-${Date.now()}`,
      type: newAlertType,
      note: newAlertNote,
      createdAt: "Today",
      createdBy: "Attending Clinician (You)",
    };
    setAlerts([newAlert, ...alerts]);
    setNewAlertNote("");
  };

  // Handle Step-Up Auth for PII (SEC-02, IAM-03)
  const handleVerifyStepUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (stepUpOtp === "123456" || stepUpOtp.length >= 4) {
      setIsPiiMasked(false);
      setShowStepUpModal(false);
      setStepUpOtp("");
    }
  };

  // Handle Emergency Break-Glass Access (SEC-04)
  const handleActivateBreakGlass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakGlassReason.trim()) return;
    setIsBreakGlassActive(true);
    setIsPiiMasked(false);
    setShowBreakGlassModal(false);
  };

  // Handle Document Upload (PAT-03)
  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;
    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      title: newDocTitle,
      type: newDocType,
      uploadedAt: "Just now",
      uploadedBy: "Staff User (You)",
      fileSize: "1.2 MB",
    };
    setDocuments([newDoc, ...documents]);
    setNewDocTitle("");
    setShowUploadModal(false);
  };

  // Masking Helper (SEC-02)
  const maskPhone = (phone: string) => {
    if (!isPiiMasked) return phone;
    return phone.replace(/(\+\d{1,3}\s*\(\d{3}\)\s*)\d{3}(-\d{4})/, "$1XXX$2");
  };

  const maskEmail = (email: string) => {
    if (!isPiiMasked) return email;
    const [name, domain] = email.split("@");
    return `${name.slice(0, 2)}****@${domain}`;
  };

  return (
    <AppLayout>
      <div className="space-y-space-6 max-w-6xl mx-auto pb-space-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-space-2 text-label-md text-outline">
          <Link href="/patients" className="hover:text-primary transition-colors">
            Patients
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface font-semibold">
            {patient.firstName} {patient.lastName}
          </span>
          <span className="text-outline font-mono text-label-sm">({patient.mrn})</span>
        </div>

        {/* Emergency Break-Glass Active Banner (SEC-04) */}
        {isBreakGlassActive && (
          <div className="p-space-4 bg-error/15 border-2 border-error rounded-xl flex items-center justify-between text-on-error-container animate-pulse">
            <div className="flex items-center gap-space-3">
              <span className="material-symbols-outlined text-error text-[28px]">warning</span>
              <div>
                <span className="font-title-md font-bold text-error block">
                  EMERGENCY BREAK-GLASS ACCESS ACTIVE (SEC-04)
                </span>
                <span className="text-body-sm text-on-surface">
                  All clinical safeguards and PII restrictions temporarily overridden.
                  Justification: &quot;{breakGlassReason}&quot;. Full audit session streaming to
                  compliance log.
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-error text-error hover:bg-error/10"
              onClick={() => {
                setIsBreakGlassActive(false);
                setIsPiiMasked(true);
              }}
            >
              Relinquish Override
            </Button>
          </div>
        )}

        {/* Clinical Safety Alert Banner (PAT-02) */}
        {alerts.length > 0 && (
          <div className="p-space-4 bg-warning/10 border-l-4 border-warning rounded-r-xl space-y-space-2">
            <div className="flex items-center gap-space-2 text-warning font-bold">
              <span className="material-symbols-outlined">report</span>
              <span className="text-title-sm uppercase tracking-wide">
                Active Clinical Alerts ({alerts.length})
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="text-body-sm bg-surface-container-lowest p-space-2 rounded border border-outline-variant/30 flex items-start gap-space-2"
                >
                  <span className="material-symbols-outlined text-warning text-[18px] shrink-0 mt-0.5">
                    priority_high
                  </span>
                  <div>
                    <span className="font-semibold text-on-surface block text-label-sm">
                      {alert.type.replace(/_/g, " ")}:
                    </span>
                    <span className="text-on-surface-variant">{alert.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patient 360 Header Banner */}
        <div className="p-space-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-space-4">
          <div className="flex items-center gap-space-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-headline-sm shrink-0">
              {patient.firstName[0]}
              {patient.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-space-3 flex-wrap">
                <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface">
                  {patient.firstName} {patient.lastName}
                </h1>
                <Badge
                  variant="outline"
                  className="font-mono bg-surface-container text-primary font-bold"
                >
                  {patient.mrn}
                </Badge>
                <Badge variant="primary" className="bg-primary/15 text-primary border-transparent">
                  {patient.status}
                </Badge>
              </div>
              <div className="flex items-center gap-space-4 text-body-sm text-outline mt-space-1 flex-wrap">
                <span>
                  {patient.gender}, {patient.age} yrs (DOB: {patient.dob})
                </span>
                <span>•</span>
                <span>
                  Blood: <strong className="text-error">{patient.bloodGroup}</strong>
                </span>
                <span>•</span>
                <span>Payer: {patient.insuranceProvider}</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-space-2 flex-wrap">
            {isPiiMasked ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-space-1 text-label-sm"
                onClick={() => setShowStepUpModal(true)}
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                Reveal Full PII
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="gap-space-1 text-label-sm"
                onClick={() => setIsPiiMasked(true)}
              >
                <span className="material-symbols-outlined text-[16px]">visibility_off</span>
                Mask PII
              </Button>
            )}

            {!isBreakGlassActive && (
              <Button
                variant="outline"
                size="sm"
                className="gap-space-1 border-error/50 text-error hover:bg-error/10 text-label-sm"
                onClick={() => setShowBreakGlassModal(true)}
              >
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                Break-Glass Access
              </Button>
            )}

            <Link href={`/appointments/book?patientId=${patient.id}`}>
              <Button variant="primary" size="sm" className="gap-space-1">
                <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
                Book Appointment
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-outline-variant/30 gap-space-6 text-label-lg overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-space-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-on-surface"
            }`}
          >
            Demographics & Contacts
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`pb-space-3 font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-space-1 ${
              activeTab === "alerts"
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-on-surface"
            }`}
          >
            Clinical Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`pb-space-3 font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-space-1 ${
              activeTab === "documents"
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-on-surface"
            }`}
          >
            Document Vault ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-space-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-on-surface"
            }`}
          >
            Clinical Encounters & Timeline
          </button>
          <button
            onClick={() => setActiveTab("merge")}
            className={`pb-space-3 font-semibold border-b-2 transition-colors whitespace-nowrap text-error hover:text-error ${
              activeTab === "merge" ? "border-error text-error" : "border-transparent text-outline"
            }`}
          >
            Duplicate Merge (PAT-04)
          </button>
        </div>

        {/* TAB 1: Demographics & Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-6">
            <div className="md:col-span-2 space-y-space-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact & Residential Information</CardTitle>
                  <CardDescription>Primary communication channels and address.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-space-4">
                  <div>
                    <span className="text-label-sm text-outline block">Primary Phone</span>
                    <span className="font-body-md font-semibold text-on-surface font-mono">
                      {maskPhone(patient.phone)}
                    </span>
                  </div>
                  <div>
                    <span className="text-label-sm text-outline block">Secondary Phone</span>
                    <span className="font-body-md font-semibold text-on-surface font-mono">
                      {maskPhone(patient.secondaryPhone)}
                    </span>
                  </div>
                  <div>
                    <span className="text-label-sm text-outline block">Email Address</span>
                    <span className="font-body-md font-semibold text-on-surface font-mono">
                      {maskEmail(patient.email)}
                    </span>
                  </div>
                  <div>
                    <span className="text-label-sm text-outline block">Preferred Language</span>
                    <span className="font-body-md font-semibold text-on-surface">
                      {patient.preferredLanguage}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-label-sm text-outline block">Residential Address</span>
                    <span className="font-body-md text-on-surface">{patient.address}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contacts (PAT-02) */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Emergency Contacts (PAT-02)</CardTitle>
                      <CardDescription>
                        Designated next-of-kin contacts for notification.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-space-3">
                    {emergencyContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between p-space-3 bg-surface-container rounded-lg border border-outline-variant/30"
                      >
                        <div>
                          <span className="font-title-sm font-bold text-on-surface block">
                            {contact.name} ({contact.relationship})
                          </span>
                          <span className="font-body-sm text-outline font-mono">
                            {maskPhone(contact.phone)}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-primary bg-primary/10">
                          Authorized Next-of-Kin
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar: Insurance & Quick Links */}
            <div className="space-y-space-6">
              <Card>
                <CardHeader>
                  <CardTitle>Insurance & Billing Coverage</CardTitle>
                  <CardDescription>TPA Policy details for claim settlement.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-space-3">
                  <div>
                    <span className="text-label-sm text-outline block">Payer Name</span>
                    <span className="font-body-md font-bold text-on-surface">
                      {patient.insuranceProvider}
                    </span>
                  </div>
                  <div>
                    <span className="text-label-sm text-outline block">Policy / Member ID</span>
                    <span className="font-body-md font-mono text-primary font-semibold">
                      {patient.policyNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-label-sm text-outline block">Coverage Status</span>
                    <Badge variant="primary" className="bg-success/15 text-success">
                      Active & Pre-Authorized
                    </Badge>
                  </div>
                  <div className="pt-space-2 border-t border-outline-variant/20">
                    <Link href="/billing/claims">
                      <Button variant="outline" size="sm" className="w-full gap-space-2">
                        <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                        View Insurance Claims
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Panel */}
              <Card>
                <CardHeader>
                  <CardTitle>Clinical Hub Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-space-2">
                  <Link href={`/doctor?patientId=${patient.id}`} className="block">
                    <Button variant="secondary" className="w-full justify-start gap-space-2">
                      <span className="material-symbols-outlined text-[18px]">stethoscope</span>
                      Start Clinical Encounter
                    </Button>
                  </Link>
                  <Link href="/prescriptions" className="block">
                    <Button variant="outline" className="w-full justify-start gap-space-2">
                      <span className="material-symbols-outlined text-[18px]">medication</span>
                      Active Prescriptions
                    </Button>
                  </Link>
                  <Link href="/medical-records" className="block">
                    <Button variant="outline" className="w-full justify-start gap-space-2">
                      <span className="material-symbols-outlined text-[18px]">folder_shared</span>
                      Biomarkers & Lab Results
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: Clinical Alerts (PAT-02) */}
        {activeTab === "alerts" && (
          <div className="space-y-space-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Clinical Alert / Allergy Tag</CardTitle>
                <CardDescription>
                  Surfaces immediately across Consultation Desks, Queue Boards, and Inpatient Ward
                  charts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddAlert} className="space-y-space-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4">
                    <div>
                      <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                        Alert Classification
                      </label>
                      <select
                        value={newAlertType}
                        onChange={(e) => setNewAlertType(e.target.value as any)}
                        className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                      >
                        <option value="ALLERGY_ON_FILE">Allergy on File (Severe)</option>
                        <option value="HIGH_RISK">High Risk Clinical Flag</option>
                        <option value="VIP">VIP Patient Protocol</option>
                        <option value="DNR_NOTED">Do Not Resuscitate (DNR) Noted</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                        Clinical Alert Description / Specific Allergen
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Severe anaphylaxis to Sulfa drugs. Keep epinephrine on hand."
                        value={newAlertNote}
                        onChange={(e) => setNewAlertNote(e.target.value)}
                        className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" variant="primary" className="gap-space-2">
                      <span className="material-symbols-outlined text-[18px]">add_alert</span>
                      Add Persistent Alert
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* List of Existing Alerts */}
            <div className="space-y-space-3">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Recorded Clinical Flags ({alerts.length})
              </h3>
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-space-4 bg-surface-container-lowest border border-outline-variant/40 rounded-xl flex items-start justify-between gap-space-4 shadow-sm"
                >
                  <div className="flex items-start gap-space-3">
                    <div className="w-10 h-10 rounded-lg bg-warning/15 text-warning flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">warning</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-space-2">
                        <span className="font-title-md font-bold text-on-surface">
                          {alert.type.replace(/_/g, " ")}
                        </span>
                        <Badge variant="outline" className="text-outline text-label-xs">
                          {alert.createdAt}
                        </Badge>
                      </div>
                      <p className="font-body-md text-on-surface-variant mt-space-1">
                        {alert.note}
                      </p>
                      <span className="text-label-sm text-outline mt-space-2 block">
                        Logged by: {alert.createdBy}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Document Vault (PAT-03) */}
        {activeTab === "documents" && (
          <div className="space-y-space-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Secure Patient Document Vault (PAT-03)
                </h3>
                <p className="font-body-sm text-outline mt-space-1">
                  Protected with encrypted object storage. Downloads generated via short-lived
                  signed SAS tokens (5-minute TTL).
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => setShowUploadModal(true)}
                className="gap-space-2"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                Upload Document
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-space-4 bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-sm flex items-start justify-between gap-space-3"
                >
                  <div className="flex items-start gap-space-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[24px]">
                        {doc.type === "LAB_REPORT"
                          ? "science"
                          : doc.type === "PRESCRIPTION_SCAN"
                            ? "description"
                            : "badge"}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-title-sm font-bold text-on-surface">{doc.title}</h4>
                      <div className="flex items-center gap-space-2 text-label-sm text-outline mt-space-1">
                        <Badge variant="secondary" className="text-label-xs">
                          {doc.type.replace(/_/g, " ")}
                        </Badge>
                        <span>•</span>
                        <span>{doc.fileSize}</span>
                        <span>•</span>
                        <span>{doc.uploadedAt}</span>
                      </div>
                      <span className="text-label-xs text-outline block mt-space-1">
                        Uploaded by: {doc.uploadedBy}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-space-1"
                    onClick={() =>
                      alert(`Secure signed URL generated for ${doc.title}. Valid for 5 minutes.`)
                    }
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Clinical Encounters & History */}
        {activeTab === "history" && (
          <div className="space-y-space-4">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Encounter Timeline & Diagnostic Records
            </h3>
            <div className="p-space-4 bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-sm space-y-space-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-space-3">
                <div className="flex items-center gap-space-3">
                  <span className="material-symbols-outlined text-primary text-[28px]">
                    verified
                  </span>
                  <div>
                    <span className="font-title-md font-bold text-on-surface block">
                      Encounter #ENC-2026-0089 — Signed Outpatient Consultation
                    </span>
                    <span className="text-label-sm text-outline">
                      Oct 24, 2026 • Attending: Dr. Marcus Vance, MD (Cardiology)
                    </span>
                  </div>
                </div>
                <Link href="/doctor/encounters/ENC-2026-0089">
                  <Button variant="outline" size="sm" className="gap-space-1">
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    View Signed Summary (EMR-06)
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-3 text-body-sm">
                <div>
                  <span className="text-label-sm text-outline block">Diagnosis (ICD-10)</span>
                  <span className="font-semibold text-on-surface">
                    I10 — Essential Primary Hypertension
                  </span>
                </div>
                <div>
                  <span className="text-label-sm text-outline block">Vital Signs</span>
                  <span className="font-semibold text-on-surface">
                    BP: 138/86 mmHg • HR: 74 bpm • SpO2: 98%
                  </span>
                </div>
                <div>
                  <span className="text-label-sm text-outline block">Discharge Action</span>
                  <span className="font-semibold text-success">
                    Prescription Finalized & Released
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Duplicate Record Merge (PAT-04) */}
        {activeTab === "merge" && (
          <div className="space-y-space-6 max-w-3xl">
            <Card className="border-error/30">
              <CardHeader>
                <div className="flex items-center gap-space-2 text-error">
                  <span className="material-symbols-outlined">merge_type</span>
                  <CardTitle>Master Patient Index (MPI) Record Merge Tool (PAT-04)</CardTitle>
                </div>
                <CardDescription>
                  Merge a duplicate patient record into this canonical record ({patient.mrn}).
                  Re-points all historical appointments, clinical encounters, diagnostic reports,
                  and invoices in a single atomic transaction.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-space-4">
                {mergeSuccess ? (
                  <div className="p-space-4 bg-success/15 border border-success/30 rounded-xl text-success font-semibold text-center space-y-space-2">
                    <span className="material-symbols-outlined text-[36px] block mx-auto">
                      check_circle
                    </span>
                    <span>
                      Records successfully merged into {patient.mrn}! All foreign keys updated.
                    </span>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setShowMergeModal(true);
                    }}
                    className="space-y-space-4"
                  >
                    <div>
                      <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                        Duplicate Record MRN to Absorb (Source Record)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. MRN-2026-001799"
                        value={targetPatientMrn}
                        onChange={(e) => setTargetPatientMrn(e.target.value)}
                        className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md font-mono focus:outline-none focus:border-error"
                      />
                      <p className="text-label-sm text-outline mt-space-1">
                        This source record will be marked as soft-deleted and permanently merged.
                      </p>
                    </div>

                    <div>
                      <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                        Clinical Justification / Audit Reason
                      </label>
                      <textarea
                        rows={2}
                        required
                        placeholder="e.g. Accidental duplicate registration during emergency walk-in triage on Oct 18."
                        value={mergeReason}
                        onChange={(e) => setMergeReason(e.target.value)}
                        className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-error"
                      />
                    </div>

                    <div className="p-space-3 bg-error/10 rounded-lg border border-error/20 text-error text-body-sm flex items-start gap-space-2">
                      <span className="material-symbols-outlined text-[20px] shrink-0">info</span>
                      <span>
                        <strong>Irreversible Operation:</strong> Merging cannot be undone. Only
                        users with SUPER_ADMIN or CHIEF_REGISTRAR roles are authorized.
                      </span>
                    </div>

                    <Button type="submit" variant="danger" className="gap-space-2 w-full">
                      <span className="material-symbols-outlined text-[18px]">call_merge</span>
                      Review Dry-Run Diff & Initiate Merge
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal: Document Upload (PAT-03) */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-4">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-space-6 max-w-md w-full shadow-2xl space-y-space-4">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Upload Patient Document (PAT-03)
              </h3>
              <form onSubmit={handleUploadDocument} className="space-y-space-4">
                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Document Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pulmonary Function Test Report"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Document Classification
                  </label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value as any)}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                  >
                    <option value="LAB_REPORT">Diagnostic / Lab Report</option>
                    <option value="PRESCRIPTION_SCAN">Prescription Scan</option>
                    <option value="ID_PROOF">Government Photo ID</option>
                    <option value="OTHER">Other Clinical Record</option>
                  </select>
                </div>
                <div className="border-2 border-dashed border-outline-variant/50 p-space-4 rounded-xl text-center text-outline text-body-sm hover:border-primary cursor-pointer transition-colors">
                  <span className="material-symbols-outlined text-[32px] block mx-auto text-primary">
                    cloud_upload
                  </span>
                  <span>Drag & drop PDF, JPG, or PNG (Max 20MB)</span>
                </div>
                <div className="flex items-center justify-end gap-space-2">
                  <Button type="button" variant="outline" onClick={() => setShowUploadModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Upload & Encrypt
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Step-Up Auth for PII Reveal (SEC-02, IAM-03) */}
        {showStepUpModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-4">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-space-6 max-w-sm w-full shadow-2xl space-y-space-4">
              <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[24px]">pin</span>
              </div>
              <div className="text-center">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Step-Up Authentication
                </h3>
                <p className="font-body-sm text-outline mt-space-1">
                  Enter your 6-digit staff OTP or PIN to unmask full Patient PII (SEC-02).
                </p>
              </div>
              <form onSubmit={handleVerifyStepUp} className="space-y-space-4">
                <div>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    placeholder="Enter 123456"
                    value={stepUpOtp}
                    onChange={(e) => setStepUpOtp(e.target.value)}
                    className="w-full text-center text-headline-sm font-mono tracking-widest px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex items-center justify-end gap-space-2">
                  <Button type="button" variant="outline" onClick={() => setShowStepUpModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" className="w-full">
                    Verify & Reveal PII
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Break-Glass Access (SEC-04) */}
        {showBreakGlassModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-4">
            <div className="bg-surface-container-lowest border-2 border-error rounded-2xl p-space-6 max-w-md w-full shadow-2xl space-y-space-4">
              <div className="flex items-center gap-space-3 text-error">
                <span className="material-symbols-outlined text-[32px]">bolt</span>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold">
                    Emergency Break-Glass (SEC-04)
                  </h3>
                  <span className="text-label-sm text-outline">
                    High-Security Clinical Override
                  </span>
                </div>
              </div>
              <p className="font-body-sm text-on-surface">
                Emergency break-glass bypasses departmental scopes and PII masking for 15 minutes.
                This action will immediately notify Hospital Security & Compliance.
              </p>
              <form onSubmit={handleActivateBreakGlass} className="space-y-space-4">
                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Emergency Clinical Justification <span className="text-error">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Unresponsive trauma patient in ER; immediate allergy and blood group verification required."
                    value={breakGlassReason}
                    onChange={(e) => setBreakGlassReason(e.target.value)}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-error"
                  />
                </div>
                <div className="flex items-center justify-end gap-space-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBreakGlassModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="danger" className="gap-space-2">
                    <span className="material-symbols-outlined text-[18px]">lock_open</span>
                    Authorize Break-Glass
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Confirm Merge Dry-Run (PAT-04) */}
        {showMergeModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-4">
            <div className="bg-surface-container-lowest border-2 border-error rounded-2xl p-space-6 max-w-lg w-full shadow-2xl space-y-space-4">
              <div className="flex items-center gap-space-3 text-error">
                <span className="material-symbols-outlined text-[32px]">call_merge</span>
                <h3 className="font-headline-sm text-headline-sm font-bold">
                  Confirm Transactional Merge
                </h3>
              </div>
              <div className="p-space-3 bg-surface-container rounded-lg border border-outline-variant/30 space-y-space-2 text-body-sm">
                <div>
                  <strong>Surviving Target Record:</strong> {patient.firstName} {patient.lastName} (
                  {patient.mrn})
                </div>
                <div>
                  <strong>Absorbed Duplicate Record:</strong> {targetPatientMrn}
                </div>
                <div className="text-label-sm text-outline border-t border-outline-variant/20 pt-space-2">
                  Dry-Run Verification: 2 Appointments, 1 Diagnostic Report, and 1 Invoice will be
                  re-pointed to {patient.mrn}.
                </div>
              </div>
              <div className="flex items-center justify-end gap-space-2">
                <Button type="button" variant="outline" onClick={() => setShowMergeModal(false)}>
                  Abort
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setShowMergeModal(false);
                    setMergeSuccess(true);
                  }}
                >
                  Confirm & Commit Merge
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
