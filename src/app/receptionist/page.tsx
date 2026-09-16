"use client";

import React from "react";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";

export default function ReceptionistDashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-600/10 text-emerald-700 border border-emerald-600/20">
                Front Office & Reception Desk
              </span>
              <span className="text-xs text-outline">• Station Main-A1</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight mt-1">
              Front Desk & Triage Command
            </h1>
            <p className="text-xs text-outline mt-0.5">
              Patient intake, queue token issuance, appointments desk, and reception cashiering.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/receptionist/queue">
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                <span className="material-symbols-outlined text-[16px]">confirmation_number</span>
                <span>Dispense Queue Token</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Action Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/receptionist/queue"
            className="block p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs hover:border-emerald-600 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600/15 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[24px]">timelapse</span>
            </div>
            <h3 className="text-sm font-bold text-on-surface">Reception Queue Desk</h3>
            <p className="text-xs text-outline mt-1">Manage tokens, doctor lanes, waiting lines</p>
          </Link>

          <Link
            href="/patients/register"
            className="block p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs hover:border-emerald-600 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600/15 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[24px]">person_add</span>
            </div>
            <h3 className="text-sm font-bold text-on-surface">Walk-in Intake</h3>
            <p className="text-xs text-outline mt-1">Register new patients, issue permanent MRN</p>
          </Link>

          <Link
            href="/appointments/book"
            className="block p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs hover:border-emerald-600 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600/15 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[24px]">calendar_month</span>
            </div>
            <h3 className="text-sm font-bold text-on-surface">Schedule Appointment</h3>
            <p className="text-xs text-outline mt-1">Book consultations with specialist doctors</p>
          </Link>

          <Link
            href="/billing"
            className="block p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs hover:border-emerald-600 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600/15 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            </div>
            <h3 className="text-sm font-bold text-on-surface">Cashier & Invoices</h3>
            <p className="text-xs text-outline mt-1">
              Collect co-pays, print receipts, settle bills
            </p>
          </Link>
        </div>

        {/* Today's Front Desk Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/40 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-on-surface">Today&apos;s Intake Activity</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                <span className="text-[10px] text-outline uppercase font-bold block">
                  Walk-ins Registered
                </span>
                <span className="font-mono text-2xl font-black text-on-surface block mt-1">18</span>
              </div>
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                <span className="text-[10px] text-outline uppercase font-bold block">
                  Appointments Checked-in
                </span>
                <span className="font-mono text-2xl font-black text-on-surface block mt-1">34</span>
              </div>
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                <span className="text-[10px] text-outline uppercase font-bold block">
                  Tokens Dispensed
                </span>
                <span className="font-mono text-2xl font-black text-emerald-700 block mt-1">
                  52
                </span>
              </div>
            </div>
            <div className="pt-2">
              <Link
                href="/patients"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <span>Search full patient registry</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/40 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-on-surface">Waiting Room TV & Kiosk</h3>
            <p className="text-xs text-outline">
              Supervise the full-screen lobby displays and patient self-service check-in kiosk.
            </p>
            <div className="space-y-2 pt-2">
              <Link href="/queue/display" target="_blank" className="w-full block">
                <Button variant="outline" className="w-full justify-start gap-2 text-xs font-bold">
                  <span className="material-symbols-outlined text-[18px]">tv</span>
                  <span>Open Waiting Room TV</span>
                </Button>
              </Link>
              <Link href="/queue/kiosk" target="_blank" className="w-full block">
                <Button variant="outline" className="w-full justify-start gap-2 text-xs font-bold">
                  <span className="material-symbols-outlined text-[18px]">touch_app</span>
                  <span>Open Self-Service Kiosk</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
