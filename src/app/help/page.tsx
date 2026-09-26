"use client";

import React from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function HelpSupportPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-space-6 pb-space-12">
        <div className="border-b border-outline-variant/30 pb-space-4">
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
            Help & Patient Care Navigation
          </h1>
          <p className="font-body-md text-on-surface-variant mt-1">
            24/7 Clinical Support • Hospital Directory • Frequently Asked Questions
          </p>
        </div>

        {/* Emergency Assistance Banner */}
        <div className="p-space-6 rounded-2xl bg-red-50 border border-red-200 text-red-950 flex flex-col sm:flex-row sm:items-center justify-between gap-space-4">
          <div className="flex items-center gap-space-4">
            <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-3xl">emergency</span>
            </div>
            <div>
              <h3 className="font-title-md font-bold text-red-900">Life-Threatening Emergency?</h3>
              <p className="text-xs text-red-800 mt-0.5">
                If you are experiencing severe chest pain, stroke symptoms, or severe respiratory
                distress, call emergency services immediately.
              </p>
            </div>
          </div>
          <a href="tel:911" className="w-full sm:w-auto">
            <Button className="bg-red-600 text-white hover:bg-red-700 font-bold shrink-0 w-full sm:w-auto">
              Call 911 Now
            </Button>
          </a>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-4">
          <Card className="border border-outline-variant/30 shadow-xs">
            <CardContent className="p-space-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined">call</span>
              </div>
              <h4 className="font-bold text-sm text-on-surface">OPD Appointments Desk</h4>
              <p className="font-mono text-xs text-primary font-bold">+1 (555) 019-2830</p>
              <span className="text-[10px] text-outline block">Mon - Sat: 8 AM - 6 PM</span>
            </CardContent>
          </Card>

          <Card className="border border-outline-variant/30 shadow-xs">
            <CardContent className="p-space-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined">medication</span>
              </div>
              <h4 className="font-bold text-sm text-on-surface">Pharmacy Help Desk</h4>
              <p className="font-mono text-xs text-primary font-bold">+1 (555) 019-2835</p>
              <span className="text-[10px] text-outline block">Open 24/7 Daily</span>
            </CardContent>
          </Card>

          <Card className="border border-outline-variant/30 shadow-xs">
            <CardContent className="p-space-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
              <h4 className="font-bold text-sm text-on-surface">Billing & Insurance</h4>
              <p className="font-mono text-xs text-primary font-bold">+1 (555) 019-2840</p>
              <span className="text-[10px] text-outline block">Mon - Fri: 9 AM - 5 PM</span>
            </CardContent>
          </Card>
        </div>

        {/* FAQs */}
        <Card className="border border-outline-variant/30 shadow-xs">
          <CardHeader className="pb-space-3 border-b border-outline-variant/20">
            <CardTitle className="font-title-md text-title-md text-on-surface">
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-space-4 space-y-space-4 text-sm">
            <div>
              <h4 className="font-bold text-on-surface">How does the Live Queue token work?</h4>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                When you check in at the OPD kiosk or reception, a digital token (e.g., #A-24) is
                issued. You can track your estimated wait time in real-time on your phone and will
                receive an SMS when there are 2 patients ahead of you.
              </p>
            </div>
            <div className="pt-space-3 border-t border-outline-variant/20">
              <h4 className="font-bold text-on-surface">How do I request prescription refills?</h4>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Navigate to the Prescriptions tab and tap &apos;Request Refill&apos;. The pharmacy
                team reviews and dispenses your medication within 2 hours. You can present your
                express digital QR pass for instant pickup.
              </p>
            </div>
            <div className="pt-space-3 border-t border-outline-variant/20">
              <h4 className="font-bold text-on-surface">How do I access diagnostic lab reports?</h4>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                All laboratory and radiology results are released to your Medical Records tab as
                soon as the pathologist signs the analysis. You can view biomarker reference ranges
                or download official PDF copies with electronic hospital verification.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
