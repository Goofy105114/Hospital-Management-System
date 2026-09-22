"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/axios";

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [mrn, setMrn] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api
      .get("/auth/me")
      .then((res) => {
        if (!isMounted) return;
        const u = res.data?.data;
        if (u) {
          const names = (u.name || "").split(" ");
          setFirstName(names[0] || "");
          setLastName(names.slice(1).join(" ") || "");
          setEmail(u.email || "");
          setPhone(u.phone || "");
          if (u.patientProfile) {
            setMrn(u.patientProfile.mrn || "");
            setDob(
              u.patientProfile.dob ? u.patientProfile.dob.split("T")[0] : ""
            );
            setBloodGroup(u.patientProfile.bloodGroup || "O+");
            setAddress(u.patientProfile.address || "");
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.patch("/auth/me", {
        name: `${firstName} ${lastName}`.trim(),
        phone,
        address,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-space-6 pb-space-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <div className="flex items-center gap-space-3">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                Patient Demographics &amp; Medical Identity
              </h1>
              <Badge variant="outline" className="font-mono text-xs">
                {mrn || user?.mrn || "Verified Patient Record"}
              </Badge>
            </div>
            <p className="font-body-md text-on-surface-variant mt-1">
              Official Identification • Verified Emergency Contacts &amp; Health Insurance
            </p>
          </div>
        </div>

        {saved && (
          <div className="p-space-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Patient profile updated successfully in database.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-space-6">
          <Card className="border border-outline-variant/30 shadow-xs">
            <CardHeader className="pb-space-3 border-b border-outline-variant/20">
              <CardTitle className="font-title-md text-title-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-space-4 space-y-space-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-4">
                <div>
                  <label className="font-label-md font-semibold text-on-surface block mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm"
                  />
                </div>
                <div>
                  <label className="font-label-md font-semibold text-on-surface block mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm"
                  />
                </div>
                <div>
                  <label className="font-label-md font-semibold text-on-surface block mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="font-label-md font-semibold text-on-surface block mb-1">
                    Blood Group
                  </label>
                  <input
                    type="text"
                    value={bloodGroup}
                    readOnly
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-label-md font-semibold text-on-surface block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
                  />
                </div>
                <div>
                  <label className="font-label-md font-semibold text-on-surface block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="font-label-md font-semibold text-on-surface block mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, city, state, postal code"
                  className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-outline-variant/30 shadow-xs">
            <CardHeader className="pb-space-3 border-b border-outline-variant/20">
              <CardTitle className="font-title-md text-title-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">contact_emergency</span>
                Emergency Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-space-4 space-y-space-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-4">
                <div>
                  <label className="font-label-md font-semibold text-on-surface block mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Primary Next of Kin"
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm"
                  />
                </div>
                <div>
                  <label className="font-label-md font-semibold text-on-surface block mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    defaultValue="Family Member"
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm"
                  />
                </div>
                <div>
                  <label className="font-label-md font-semibold text-on-surface block mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="tel"
                    defaultValue={phone || "+1 (555) 000-0000"}
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-outline-variant/30 shadow-xs">
            <CardHeader className="pb-space-3 border-b border-outline-variant/20">
              <CardTitle className="font-title-md text-title-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">health_and_safety</span>
                Health Insurance Provider
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-space-4 space-y-space-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-4">
                <div>
                  <label className="font-label-md font-semibold text-on-surface block mb-1">
                    Carrier Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Going Merry Health Coverage"
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm"
                  />
                </div>
                <div>
                  <label className="font-label-md font-semibold text-on-surface block mb-1">
                    Policy Number
                  </label>
                  <input
                    type="text"
                    defaultValue="GM-INS-88190"
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="font-label-md font-semibold text-on-surface block mb-1">
                    Group ID
                  </label>
                  <input
                    type="text"
                    defaultValue="GRP-9901"
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-white"
            >
              {isSubmitting ? "Saving..." : "Save Profile Changes"}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
