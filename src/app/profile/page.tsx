"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ProfilePage() {
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-space-6 pb-space-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <div className="flex items-center gap-space-3">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                Patient Demographics & Medical Identity
              </h1>
              <Badge variant="outline" className="font-mono text-xs">
                MRN-2026-001842
              </Badge>
            </div>
            <p className="font-body-md text-on-surface-variant mt-1">
              Official Identification • Verified Emergency Contacts & Health Insurance
            </p>
          </div>
        </div>

        {saved && (
          <div className="p-space-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Patient profile updated successfully.
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
                    defaultValue="Eleanor"
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm"
                  />
                </div>
                <div>
                  <label className="font-label-md font-semibold text-on-surface block mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Pena"
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm"
                  />
                </div>
                <div>
                  <label className="font-label-md font-semibold text-on-surface block mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    defaultValue="1988-04-15"
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="font-label-md font-semibold text-on-surface block mb-1">
                    Blood Group
                  </label>
                  <input
                    type="text"
                    defaultValue="A+"
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
                    defaultValue="eleanor.pena@example.com"
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm"
                  />
                </div>
                <div>
                  <label className="font-label-md font-semibold text-on-surface block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    defaultValue="+1 (555) 234-5678"
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm font-mono"
                  />
                </div>
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
                    defaultValue="David Pena"
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm"
                  />
                </div>
                <div>
                  <label className="font-label-md font-semibold text-on-surface block mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    defaultValue="Spouse"
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm"
                  />
                </div>
                <div>
                  <label className="font-label-md font-semibold text-on-surface block mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="tel"
                    defaultValue="+1 (555) 987-6543"
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
                    defaultValue="BlueCross BlueShield"
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm"
                  />
                </div>
                <div>
                  <label className="font-label-md font-semibold text-on-surface block mb-1">
                    Policy Number
                  </label>
                  <input
                    type="text"
                    defaultValue="BC-992144-PPO"
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="font-label-md font-semibold text-on-surface block mb-1">
                    Group ID
                  </label>
                  <input
                    type="text"
                    defaultValue="GRP-88219"
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" className="bg-primary text-white">
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
