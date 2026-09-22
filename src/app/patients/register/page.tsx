"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import api from "@/lib/axios";

export default function RegisterPatientPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "Female",
    bloodGroup: "O+",
    phone: "",
    secondaryPhone: "",
    email: "",
    address: "",
    preferredLanguage: "English",
    emergencyName: "",
    emergencyRelation: "Spouse",
    emergencyPhone: "",
    allergies: "Penicillin",
    chronicConditions: "Hypertension",
    insuranceProvider: "Blue Cross Blue Shield",
    policyNumber: "BC-9842103",
    isVip: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredPatient, setRegisteredPatient] = useState<{
    mrn: string;
    id: string;
    name: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.post("/patients", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        dob: formData.dob || "1990-01-01",
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        phone: formData.phone || "+1-555-0100",
        email: formData.email || `patient.${Date.now()}@goingmerry.org`,
        address: formData.address,
        allergies: formData.allergies,
        preferredLanguage: formData.preferredLanguage,
      });

      if (res.data?.success && res.data.data) {
        setRegisteredPatient({
          mrn: res.data.data.mrn,
          id: res.data.data.id,
          name: res.data.data.name,
        });
      } else {
        setErrorMessage("Failed to register patient. Please check the form data.");
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "An error occurred while creating the patient record."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-space-6 max-w-5xl mx-auto pb-space-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-space-2 text-label-md text-outline">
          <Link href="/patients" className="hover:text-primary transition-colors">
            Patients
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface font-semibold">New Patient Registration</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              Register New Patient
            </h1>
            <p className="font-body-md text-body-md text-outline mt-space-1">
              Onboard a walk-in or new outpatient into the Master Patient Index (MPI). A permanent,
              unique MRN will be issued.
            </p>
          </div>
          <Link href="/patients">
            <Button variant="outline" className="gap-space-2">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Cancel & Return
            </Button>
          </Link>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-space-4 rounded-xl bg-error/10 border border-error/30 text-error flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px]">error</span>
            <span className="font-semibold text-body-md flex-1">{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="hover:opacity-75"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-space-6">
          {/* Section 1: Demographics */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-space-2 text-primary">
                <span className="material-symbols-outlined">person</span>
                <CardTitle>1. Personal Demographics</CardTitle>
              </div>
              <CardDescription>
                Essential identification matching government photo ID or passport.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-space-4">
              <div>
                <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                  First Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clara"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                  Last Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oswald"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                  Date of Birth <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                  Biological Gender <span className="text-error">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                  Blood Group
                </label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                >
                  <option value="A+">A Positive (A+)</option>
                  <option value="A-">A Negative (A-)</option>
                  <option value="B+">B Positive (B+)</option>
                  <option value="B-">B Negative (B-)</option>
                  <option value="AB+">AB Positive (AB+)</option>
                  <option value="AB-">AB Negative (AB-)</option>
                  <option value="O+">O Positive (O+)</option>
                  <option value="O-">O Negative (O-)</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              <div>
                <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                  Preferred Language
                </label>
                <select
                  value={formData.preferredLanguage}
                  onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                  className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="Mandarin">Mandarin</option>
                  <option value="French">French</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Contact & Address */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-space-2 text-primary">
                <span className="material-symbols-outlined">call</span>
                <CardTitle>2. Contact Information</CardTitle>
              </div>
              <CardDescription>
                Primary communication channel for appointment SMS reminders and queue notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
              <div>
                <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                  Primary Mobile Phone (E.164) <span className="text-error">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                  Secondary Phone
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 111-2222"
                  value={formData.secondaryPhone}
                  onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                  className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                  Email Address <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="patient@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  placeholder="Street address, City, State, ZIP"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Emergency Contact & Alerts */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-space-2 text-primary">
                <span className="material-symbols-outlined">emergency</span>
                <CardTitle>3. Emergency Contact & Clinical Safety Alerts</CardTitle>
              </div>
              <CardDescription>
                Crucial for immediate next-of-kin notification and clinical alert flagging across
                EMR and Queue boards.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-space-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4">
                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Emergency Contact Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Oswald"
                    value={formData.emergencyName}
                    onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Relationship <span className="text-error">*</span>
                  </label>
                  <select
                    value={formData.emergencyRelation}
                    onChange={(e) =>
                      setFormData({ ...formData, emergencyRelation: e.target.value })
                    }
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Friend">Friend</option>
                  </select>
                </div>
                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Emergency Phone <span className="text-error">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 999-8888"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4 pt-space-2 border-t border-outline-variant/20">
                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Known Allergies (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin, NSAIDs, Peanuts"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                  />
                  <p className="text-label-sm text-outline mt-space-1">
                    Severe allergies automatically generate persistent warnings in EMR & Dispensary.
                  </p>
                </div>
                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Chronic Conditions
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Type 2 Diabetes, Asthma"
                    value={formData.chronicConditions}
                    onChange={(e) =>
                      setFormData({ ...formData, chronicConditions: e.target.value })
                    }
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Insurance & Payer Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-space-2 text-primary">
                <span className="material-symbols-outlined">health_and_safety</span>
                <CardTitle>4. Insurance & Payer Details</CardTitle>
              </div>
              <CardDescription>
                Third-party administrator (TPA) policy for claims adjudication (BIL-04).
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
              <div>
                <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                  Insurance Provider / TPA
                </label>
                <input
                  type="text"
                  placeholder="e.g. Blue Cross Blue Shield"
                  value={formData.insuranceProvider}
                  onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                  className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                  Policy / Member ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. BCBS-9941203"
                  value={formData.policyNumber}
                  onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                  className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-space-3">
            <Link href="/patients">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="gap-space-2 min-w-[200px]"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                  Issuing MRN...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                  Complete Registration
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Success Modal */}
        {registeredPatient && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-4">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-space-6 max-w-md w-full shadow-2xl space-y-space-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-primary/15 text-primary flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[32px]">check_circle</span>
              </div>
              <div className="text-center">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Patient Registered!
                </h3>
                <p className="font-body-sm text-body-sm text-outline mt-space-1">
                  Unique Medical Record Number (MRN) has been assigned to {registeredPatient.name}.
                </p>
              </div>

              {/* Physical Card / MRN Display */}
              <div className="p-space-4 bg-surface-container rounded-xl border border-outline-variant/30 text-center space-y-space-2">
                <span className="text-label-sm uppercase font-semibold text-outline tracking-wider">
                  Official Patient MRN
                </span>
                <div className="font-headline-md text-headline-md font-extrabold text-primary font-mono tracking-tight">
                  {registeredPatient.mrn}
                </div>
                <div className="text-label-xs text-outline font-mono">
                  BARCODE: ||| | | || ||| || ||| | |||
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-space-2 pt-space-2">
                <Button
                  variant="primary"
                  className="w-full gap-space-2"
                  onClick={() => router.push(`/patients/${registeredPatient.id}`)}
                >
                  <span className="material-symbols-outlined text-[18px]">badge</span>
                  View Full Patient Chart
                </Button>
                <Button
                  variant="secondary"
                  className="w-full gap-space-2"
                  onClick={() =>
                    router.push(`/appointments/book?patientId=${registeredPatient.id}`)
                  }
                >
                  <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                  Book Immediate Appointment
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-outline"
                  onClick={() => {
                    setRegisteredPatient(null);
                    router.push("/patients");
                  }}
                >
                  Return to Patient Directory
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
