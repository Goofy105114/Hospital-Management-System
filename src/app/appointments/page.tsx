"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";

export default function AppointmentsListPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  return (
    <AppLayout>
      <div className="flex flex-col w-full pb-space-12 space-y-space-6">
        {/* Breadcrumb & Header */}
        <div>
          <div className="flex items-center gap-2 text-label-sm font-label-sm text-outline uppercase tracking-wider mb-1">
            <span>APPOINTMENTS</span>
            <span>/</span>
            <span className="text-primary font-bold">ALL VISITS</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
                My Appointments
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                Review, manage, reschedule, or prepare for your upcoming, past, and cancelled clinic
                visits.
              </p>
            </div>
            <div className="flex items-center gap-space-3">
              <button className="h-11 px-4 rounded-lg bg-surface-container-lowest hover:bg-surface-container-low text-on-surface font-label-md flex items-center gap-2 transition-colors border border-outline-variant/30 shadow-sm">
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Export Schedule</span>
              </button>
              <Link
                href="/appointments/book"
                className="h-11 px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md font-bold flex items-center gap-2 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Book Appointment</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Arrival Notice Banner */}
        {!noticeDismissed && (
          <div className="p-space-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[22px]">info</span>
              <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                <span className="font-bold">Arrival Notice:</span> Patient digital check-in is
                required 15 minutes prior to appointment slot for contactless triage at Main Clinic
                - Building B.
              </p>
            </div>
            <button
              onClick={() => setNoticeDismissed(true)}
              className="font-label-sm text-label-sm text-outline hover:text-on-surface uppercase tracking-wider font-bold shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filter Bar & Tabs */}
        <div className="bg-surface-container-lowest rounded-xl p-space-4 shadow-sm border border-outline-variant/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-4">
            {/* Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-colors flex items-center gap-2 ${
                  activeTab === "upcoming"
                    ? "bg-primary text-on-primary font-bold shadow-sm"
                    : "bg-surface-container-low hover:bg-surface-container text-on-surface"
                }`}
              >
                <span>Upcoming</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${activeTab === "upcoming" ? "bg-on-primary/20 text-on-primary" : "bg-surface-container-lowest text-outline"}`}
                >
                  2
                </span>
              </button>
              <button
                onClick={() => setActiveTab("past")}
                className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-colors flex items-center gap-2 ${
                  activeTab === "past"
                    ? "bg-primary text-on-primary font-bold shadow-sm"
                    : "bg-surface-container-low hover:bg-surface-container text-on-surface"
                }`}
              >
                <span>Past Visits</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-surface-container-lowest text-outline">
                  8
                </span>
              </button>
              <button
                onClick={() => setActiveTab("cancelled")}
                className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-colors flex items-center gap-2 ${
                  activeTab === "cancelled"
                    ? "bg-primary text-on-primary font-bold shadow-sm"
                    : "bg-surface-container-low hover:bg-surface-container text-on-surface"
                }`}
              >
                <span>Cancelled</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-surface-container-lowest text-outline">
                  1
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-label-sm font-label-sm text-outline">
              <span className="material-symbols-outlined text-[16px]">sync</span>
              <span>EMR Sync: 3 mins ago</span>
            </div>
          </div>

          {/* Search & Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search by doctor name, specialty, or clinic..."
                className="w-full h-10 pl-9 pr-4 bg-surface-container-low rounded-lg text-body-sm text-on-surface placeholder:text-outline border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="sm:col-span-2">
              <select className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-outline-variant/30 focus:outline-none">
                <option>All Specialties</option>
                <option>Cardiology</option>
                <option>Family Medicine</option>
                <option>Dermatology</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <select className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-outline-variant/30 focus:outline-none">
                <option>Next 30 Days</option>
                <option>Next 3 Months</option>
                <option>Past Year</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <select className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-sm text-on-surface border border-outline-variant/30 focus:outline-none">
                <option>All Modalities</option>
                <option>In-Person Visit</option>
                <option>Telehealth Video</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Split Grid: 8 Cols Left (Appointment Cards) / 4 Cols Right (Care Summary Rail) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-6 items-start">
          {/* Left Cards (8 cols) */}
          <div className="lg:col-span-8 flex flex-col space-y-space-4">
            {/* Card 1: Today, Confirmed in 2 Hours */}
            <div className="bg-surface-container-lowest rounded-xl p-space-6 shadow-sm border border-outline-variant/30 relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-outline-variant/20 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">
                    Today • Confirmed in 2 Hours
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-outline font-semibold">
                  Ref: <span className="text-on-surface font-bold">#GM-APP-98241</span>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-space-4">
                <div className="flex items-start gap-4">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-surface-container shrink-0 border border-outline-variant/40">
                    <Image
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuASMiD_yIVTlPeVGR7BMhyNEBY4UL5xU-OoFzIFeJzBj4GmKdxC0eh0O4xcyAS3CeXQ8NnQ0gvEJtDPR7t5t1JjDePFWPhcRLZp7XojtXi3GXzaHG2TEhrMGeUo60Zagx_dPuYjl9yycKazLAPMm422VDhdlpJWf5p52tJw9hokXGmV5eJKYysRs8n32VNtjWqaxUdA2CEbErmKL4Y7-Qo8a6D-QSVTBbeSyA9KcMLyiD4Dunv2el8b"
                      alt="Dr. Marcus Vance"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                      Dr. Marcus Vance, MD, FACC
                    </h3>
                    <p className="font-label-md text-label-md text-primary font-medium mt-0.5">
                      Cardiology • Senior Interventional Cardiologist
                    </p>
                    <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant mt-1">
                      <span className="text-primary font-semibold">✓ Board Certified</span>
                      <span>•</span>
                      <span>★ 4.9 (340+ reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Queue Tracker mini widget */}
                <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 shrink-0 text-center min-w-[150px]">
                  <p className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                    Queue Tracker
                  </p>
                  <p className="font-data-metric text-data-metric text-primary font-bold leading-none my-1">
                    Token #A-24
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Est. Wait: <span className="font-bold text-on-surface">18 mins</span> • Room 304
                  </p>
                </div>
              </div>

              {/* Trip Details Trio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-space-4 rounded-lg bg-surface-container-low border border-outline-variant/20 font-body-sm text-body-sm">
                <div>
                  <span className="font-label-sm text-label-sm text-outline uppercase font-semibold block">
                    Date &amp; Time
                  </span>
                  <p className="font-bold text-on-surface mt-0.5">Today, Oct 24, 2024</p>
                  <p className="text-on-surface-variant">11:30 AM (45 mins)</p>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-outline uppercase font-semibold block">
                    Consultation Type
                  </span>
                  <p className="font-bold text-on-surface mt-0.5">In-Person Clinic Visit</p>
                  <p className="text-on-surface-variant">Comprehensive Heart Follow-up</p>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-outline uppercase font-semibold block">
                    Facility &amp; Room
                  </span>
                  <p className="font-bold text-on-surface mt-0.5">Main Clinic – Bldg B</p>
                  <p className="text-on-surface-variant">Suite 304 (East Wing, 3rd Fl)</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-space-4 mt-space-2 border-t border-outline-variant/20">
                <div className="flex items-center gap-1.5 text-primary text-body-sm font-semibold">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Digital Check-in Completed at 09:12 AM</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="h-9 px-3 rounded-lg border border-outline-variant/30 text-error hover:bg-error-container text-label-md font-semibold transition-colors">
                    Cancel Visit
                  </button>
                  <button className="h-9 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-label-md font-semibold transition-colors">
                    Reschedule
                  </button>
                  <Link
                    href="/appointments/APT-20241024-0014"
                    className="h-9 px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-label-md font-bold transition-colors shadow-sm flex items-center gap-1"
                  >
                    <span>View Details</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 2: Confirmed in 6 Days (Telehealth Video Visit) */}
            <div className="bg-surface-container-lowest rounded-xl p-space-6 shadow-sm border border-outline-variant/30 relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-outline-variant/20 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">
                    Confirmed • Upcoming in 6 Days
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-outline font-semibold">
                  Ref: <span className="text-on-surface font-bold">#GM-APP-88412</span>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-space-4">
                <div className="flex items-start gap-4">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-surface-container shrink-0 border border-outline-variant/40">
                    <Image
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCvHI2z7pNpbP2RW1JQXUYImd2zTMB99RPVL0Y12qTD4dS8w_YBA-SYZltDmRePjXmlydIGV-yRp8NuIbK8yyke96hR9QzHO0SPo9noTWl3IEbLpVMxVBX50R5Wh9PK0GgKqSh4E4Y6SQdyfhrJILFW0HpZHsipSF_yxD8o96_JSDvTtZ_hDcit_Qhu3EIOfmfPlKX7cmncPApS3pQEnCJZOrUuV_zgPezWz2OmoVyyX5tSVxWmFma"
                      alt="Dr. Elena Ramos"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                      Dr. Elena Ramos, MD
                    </h3>
                    <p className="font-label-md text-label-md text-primary font-medium mt-0.5">
                      Family Medicine &amp; Preventive Health • Primary Care Lead
                    </p>
                    <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant mt-1">
                      <span className="text-primary font-semibold">
                        ✓ Assigned Primary Physician
                      </span>
                      <span>•</span>
                      <span>Annual Routine Review</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 shrink-0 text-center min-w-[150px]">
                  <p className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                    Clinical Status
                  </p>
                  <p className="font-label-md text-label-md text-primary font-bold my-1">
                    ✓ Questionnaire Ready
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Intake forms validated
                  </p>
                </div>
              </div>

              {/* Trip Details Trio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-space-4 rounded-lg bg-surface-container-low border border-outline-variant/20 font-body-sm text-body-sm">
                <div>
                  <span className="font-label-sm text-label-sm text-outline uppercase font-semibold block">
                    Date &amp; Time
                  </span>
                  <p className="font-bold text-on-surface mt-0.5">Wednesday, Oct 30, 2024</p>
                  <p className="text-on-surface-variant">02:15 PM (30 mins)</p>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-outline uppercase font-semibold block">
                    Consultation Type
                  </span>
                  <p className="font-bold text-on-surface mt-0.5">Telehealth Video Visit</p>
                  <p className="text-on-surface-variant">Encrypted WebRTC Room</p>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-outline uppercase font-semibold block">
                    Join Platform
                  </span>
                  <p className="font-bold text-primary mt-0.5">Virtual Care Room</p>
                  <p className="text-on-surface-variant">Link opens 10 mins prior</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-space-4 mt-space-2 border-t border-outline-variant/20">
                <button className="flex items-center gap-1.5 text-secondary text-body-sm font-semibold hover:underline">
                  <span className="material-symbols-outlined text-[18px]">videocam</span>
                  <span>Test Video &amp; Audio Compatibility</span>
                </button>
                <div className="flex items-center gap-2">
                  <button className="h-9 px-3 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container text-label-md font-semibold transition-colors">
                    Cancel
                  </button>
                  <button className="h-9 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-label-md font-semibold transition-colors">
                    Reschedule
                  </button>
                  <button className="h-9 px-4 rounded-lg bg-secondary hover:bg-secondary/90 text-on-secondary text-label-md font-bold transition-colors shadow-sm">
                    View Details
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Medical Visit History Table */}
            <div className="bg-surface-container-lowest rounded-xl p-space-6 shadow-sm border border-outline-variant/30">
              <div className="flex items-center justify-between pb-space-4 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    history
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Recent Medical Visit History
                  </h3>
                </div>
                <button className="font-label-md text-label-md text-primary font-semibold hover:underline">
                  View All 8 Past Visits →
                </button>
              </div>

              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-body-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/20 text-outline uppercase font-label-sm text-[11px]">
                      <th className="py-3">Date</th>
                      <th className="py-3">Attending Doctor</th>
                      <th className="py-3">Department</th>
                      <th className="py-3">Diagnosis Summary</th>
                      <th className="py-3 text-right">Summary Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                    <tr>
                      <td className="py-3.5 font-medium">Sep 14, 2024</td>
                      <td>Dr. Elena Ramos</td>
                      <td className="text-on-surface-variant">Family Medicine</td>
                      <td>Routine Bloodwork &amp; Lipid Panel</td>
                      <td className="text-right">
                        <button className="text-primary font-semibold hover:underline flex items-center gap-1 justify-end ml-auto">
                          <span className="material-symbols-outlined text-[14px]">download</span>
                          <span>Download PDF</span>
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 font-medium">Jul 02, 2024</td>
                      <td>Dr. Marcus Vance</td>
                      <td className="text-on-surface-variant">Cardiology</td>
                      <td>Stress Echocardiogram Test</td>
                      <td className="text-right">
                        <button className="text-primary font-semibold hover:underline flex items-center gap-1 justify-end ml-auto">
                          <span className="material-symbols-outlined text-[14px]">download</span>
                          <span>Download PDF</span>
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 font-medium">Mar 18, 2024</td>
                      <td>Dr. Sarah Jenkins</td>
                      <td className="text-on-surface-variant">Dermatology</td>
                      <td>Annual Full-Body Skin Screening</td>
                      <td className="text-right">
                        <button className="text-primary font-semibold hover:underline flex items-center gap-1 justify-end ml-auto">
                          <span className="material-symbols-outlined text-[14px]">download</span>
                          <span>Download PDF</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Rail (4 cols) */}
          <div className="lg:col-span-4 flex flex-col space-y-space-4">
            {/* Care Summary Card */}
            <div className="bg-surface-container-lowest rounded-xl p-space-5 shadow-sm border border-outline-variant/30 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Care Summary
                </h3>
                <span className="material-symbols-outlined text-outline text-[20px]">badge</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20">
                  <span className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                    Visits 2024
                  </span>
                  <p className="font-headline-lg text-headline-lg text-primary font-bold leading-tight my-1">
                    6
                  </p>
                  <span className="text-[11px] text-on-surface-variant">All completed</span>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20">
                  <span className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                    Prescriptions
                  </span>
                  <p className="font-headline-lg text-headline-lg text-secondary font-bold leading-tight my-1">
                    3
                  </p>
                  <span className="text-[11px] text-on-surface-variant">Active refills</span>
                </div>
              </div>

              <div className="space-y-2 text-body-sm text-on-surface-variant pt-2 border-t border-outline-variant/20">
                <div className="flex justify-between">
                  <span>Primary Physician:</span>
                  <span className="font-semibold text-on-surface">Dr. Elena Ramos, MD</span>
                </div>
                <div className="flex justify-between">
                  <span>Primary Facility:</span>
                  <span className="font-semibold text-on-surface">Main Clinic (Bldg B)</span>
                </div>
                <div className="flex justify-between">
                  <span>Next Review:</span>
                  <span className="font-semibold text-primary">Oct 30, 2024</span>
                </div>
              </div>

              <Link
                href="/medical-records"
                className="w-full h-10 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-md font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View Medical File</span>
              </Link>
            </div>

            {/* Clinic Visit Checklist */}
            <div className="bg-surface-container-lowest rounded-xl p-space-5 shadow-sm border border-outline-variant/30 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold pb-2 border-b border-outline-variant/20">
                <span className="material-symbols-outlined text-[20px]">checklist</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Clinic Visit Checklist
                </h3>
              </div>

              <div className="space-y-3 text-[13px] text-on-surface-variant leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <p>Bring a valid government-issued photo ID and insurance policy card.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <p>
                    Bring original bottles of current prescribed medications or daily vitamin
                    supplements.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
                    schedule
                  </span>
                  <p>
                    <span className="font-bold text-on-surface">15-Minute Protocol:</span> Arrive 15
                    minutes ahead for vitals (BP, temperature, pulse oximetry).
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low flex items-center gap-3 border border-outline-variant/20">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  accessible
                </span>
                <div className="text-[12px] leading-snug">
                  <p className="font-bold text-on-surface">Wheelchair &amp; Mobility Assistance</p>
                  <p className="text-on-surface-variant">
                    Available at Main Entrance. Call ext. 4010.
                  </p>
                </div>
              </div>
            </div>

            {/* Urgent Rescheduling Card */}
            <div className="bg-primary text-on-primary rounded-xl p-space-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">
                  Clinical Support
                </span>
              </div>
              <h4 className="font-headline-sm text-headline-sm font-bold">
                Need urgent visit rescheduling?
              </h4>
              <p className="font-body-sm text-body-sm opacity-90 leading-relaxed">
                Our registered nurse navigators can reroute acute symptom appointments immediately.
              </p>
              <a
                href="tel:18005556377"
                className="w-full h-10 rounded-lg bg-surface-container-lowest text-primary font-label-md font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">call</span>
                <span>1-800-555-MERRY</span>
              </a>
              <button
                onClick={() => alert("Secure message thread opened")}
                className="w-full text-center text-label-sm text-[12px] opacity-80 hover:opacity-100 underline pt-1"
              >
                Send Secure Provider Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
