"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import {
  Download,
  Plus,
  Info,
  RefreshCw,
  Search,
  CheckCircle2,
  Video,
  Calendar,
  Clock,
  MapPin,
  History,
  Phone,
  Accessibility,
  FileText,
  CheckSquare,
  BadgeAlert,
  ArrowRight,
} from "lucide-react";

export default function AppointmentsListPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  return (
    <AppLayout>
      <div className="flex flex-col w-full pb-12 space-y-5 max-w-7xl mx-auto">
        {/* Breadcrumb & Header */}
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <span>Appointments</span>
            <span>/</span>
            <span className="text-teal-700 font-bold">All Visits</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                My Appointments
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Review, manage, reschedule, or prepare for your upcoming, past, and cancelled clinic visits.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-9 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 shadow-2xs">
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Schedule</span>
              </button>
              <Link
                href="/appointments/book"
                className="h-9 px-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book Appointment</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Arrival Notice Banner */}
        {!noticeDismissed && (
          <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-teal-700 shrink-0" />
              <p className="text-xs text-teal-900 leading-relaxed">
                <span className="font-bold">Arrival Notice:</span> Patient digital check-in is required 15 minutes prior to appointment slot for contactless triage at Main Clinic - Building B.
              </p>
            </div>
            <button
              onClick={() => setNoticeDismissed(true)}
              className="text-[11px] text-teal-700 hover:text-teal-900 uppercase tracking-wider font-bold shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filter Bar & Tabs */}
        <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "upcoming"
                    ? "bg-white text-teal-800 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Upcoming</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === "upcoming" ? "bg-teal-100 text-teal-800" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  2
                </span>
              </button>
              <button
                onClick={() => setActiveTab("past")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "past"
                    ? "bg-white text-teal-800 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Past Visits</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                  8
                </span>
              </button>
              <button
                onClick={() => setActiveTab("cancelled")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "cancelled"
                    ? "bg-white text-teal-800 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Cancelled</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                  1
                </span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>EMR Sync: 3 mins ago</span>
            </div>
          </div>

          {/* Search & Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-6 relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by doctor name, specialty, or clinic..."
                className="w-full h-9 pl-9 pr-3 bg-slate-50 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:border-teal-600"
              />
            </div>
            <div className="sm:col-span-2">
              <select className="w-full h-9 px-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-200 focus:outline-none">
                <option>All Specialties</option>
                <option>Cardiology</option>
                <option>Family Medicine</option>
                <option>Dermatology</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <select className="w-full h-9 px-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-200 focus:outline-none">
                <option>Next 30 Days</option>
                <option>Next 3 Months</option>
                <option>Past Year</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <select className="w-full h-9 px-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-200 focus:outline-none">
                <option>All Modalities</option>
                <option>In-Person Visit</option>
                <option>Telehealth Video</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Split Grid: 8 Cols Left (Appointment Cards) / 4 Cols Right (Care Summary Rail) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Cards (8 cols) */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            {/* Card 1: Today, Confirmed in 2 Hours */}
            <div className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200/80 relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
                  <span className="text-[11px] text-teal-800 uppercase font-bold tracking-wider">
                    Today • Confirmed in 2 Hours
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-semibold">
                  Ref: <span className="text-slate-700 font-mono font-bold">#GM-APP-98241</span>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-4">
                <div className="flex items-start gap-3.5">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                    <Image
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuASMiD_yIVTlPeVGR7BMhyNEBY4UL5xU-OoFzIFeJzBj4GmKdxC0eh0O4xcyAS3CeXQ8NnQ0gvEJtDPR7t5t1JjDePFWPhcRLZp7XojtXi3GXzaHG2TEhrMGeUo60Zagx_dPuYjl9yycKazLAPMm422VDhdlpJWf5p52tJw9hokXGmV5eJKYysRs8n32VNtjWqaxUdA2CEbErmKL4Y7-Qo8a6D-QSVTBbeSyA9KcMLyiD4Dunv2el8b"
                      alt="Dr. Marcus Vance"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Dr. Marcus Vance, MD, FACC
                    </h3>
                    <p className="text-xs text-teal-700 font-medium mt-0.5">
                      Cardiology • Senior Interventional Cardiologist
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="text-teal-700 font-semibold">✓ Board Certified</span>
                      <span>•</span>
                      <span>★ 4.9 (340+ reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Queue Tracker mini widget */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 shrink-0 text-center min-w-[140px]">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">
                    Queue Tracker
                  </p>
                  <p className="text-xl text-teal-800 font-bold font-mono my-0.5">
                    Token #A-24
                  </p>
                  <p className="text-xs text-slate-500">
                    Est. Wait: <span className="font-bold text-slate-700">18 mins</span> • Room 304
                  </p>
                </div>
              </div>

              {/* Trip Details Trio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Date &amp; Time
                  </span>
                  <p className="font-bold text-slate-800 mt-0.5">Today, Oct 24, 2024</p>
                  <p className="text-slate-500">11:30 AM (45 mins)</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Consultation Type
                  </span>
                  <p className="font-bold text-slate-800 mt-0.5">In-Person Clinic Visit</p>
                  <p className="text-slate-500">Comprehensive Heart Follow-up</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Facility &amp; Room
                  </span>
                  <p className="font-bold text-slate-800 mt-0.5">Main Clinic – Bldg B</p>
                  <p className="text-slate-500">Suite 304 (East Wing, 3rd Fl)</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-teal-700 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Digital Check-in Completed at 09:12 AM</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="h-8 px-3 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors">
                    Cancel Visit
                  </button>
                  <button className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors">
                    Reschedule
                  </button>
                  <Link
                    href="/doctor/dashboard"
                    className="h-8 px-3.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1"
                  >
                    <span>View Details</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 2: Confirmed in 6 Days (Telehealth Video Visit) */}
            <div className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200/80 relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                  <span className="text-[11px] text-sky-700 uppercase font-bold tracking-wider">
                    Confirmed • Upcoming in 6 Days
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-semibold">
                  Ref: <span className="text-slate-700 font-mono font-bold">#GM-APP-88412</span>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-4">
                <div className="flex items-start gap-3.5">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                    <Image
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCvHI2z7pNpbP2RW1JQXUYImd2zTMB99RPVL0Y12qTD4dS8w_YBA-SYZltDmRePjXmlydIGV-yRp8NuIbK8yyke96hR9QzHO0SPo9noTWl3IEbLpVMxVBX50R5Wh9PK0GgKqSh4E4Y6SQdyfhrJILFW0HpZHsipSF_yxD8o96_JSDvTtZ_hDcit_Qhu3EIOfmfPlKX7cmncPApS3pQEnCJZOrUuV_zgPezWz2OmoVyyX5tSVxWmFma"
                      alt="Dr. Elena Ramos"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Dr. Elena Ramos, MD
                    </h3>
                    <p className="text-xs text-teal-700 font-medium mt-0.5">
                      Family Medicine &amp; Preventive Health • Primary Care Lead
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="text-teal-700 font-semibold">
                        ✓ Assigned Primary Physician
                      </span>
                      <span>•</span>
                      <span>Annual Routine Review</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 shrink-0 text-center min-w-[140px]">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">
                    Clinical Status
                  </p>
                  <p className="text-xs text-teal-700 font-bold my-0.5">
                    ✓ Questionnaire Ready
                  </p>
                  <p className="text-xs text-slate-500">
                    Intake forms validated
                  </p>
                </div>
              </div>

              {/* Trip Details Trio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Date &amp; Time
                  </span>
                  <p className="font-bold text-slate-800 mt-0.5">Wednesday, Oct 30, 2024</p>
                  <p className="text-slate-500">02:15 PM (30 mins)</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Consultation Type
                  </span>
                  <p className="font-bold text-slate-800 mt-0.5">Telehealth Video Visit</p>
                  <p className="text-slate-500">Encrypted WebRTC Room</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Join Platform
                  </span>
                  <p className="font-bold text-teal-700 mt-0.5">Virtual Care Room</p>
                  <p className="text-slate-500">Link opens 10 mins prior</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-100">
                <button className="flex items-center gap-1.5 text-sky-700 text-xs font-semibold hover:underline">
                  <Video className="w-4 h-4 text-sky-600" />
                  <span>Test Video &amp; Audio Compatibility</span>
                </button>
                <div className="flex items-center gap-2">
                  <button className="h-8 px-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors">
                    Cancel
                  </button>
                  <button className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors">
                    Reschedule
                  </button>
                  <button className="h-8 px-3.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold transition-colors shadow-2xs">
                    View Details
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Medical Visit History Table */}
            <div className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200/80">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-teal-700" />
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Recent Medical Visit History
                  </h3>
                </div>
                <button className="text-xs text-teal-700 font-semibold hover:underline">
                  View All 8 Past Visits →
                </button>
              </div>

              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px]">
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Attending Doctor</th>
                      <th className="py-2.5">Department</th>
                      <th className="py-2.5">Diagnosis Summary</th>
                      <th className="py-2.5 text-right">Summary Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-3 font-medium">Sep 14, 2024</td>
                      <td>Dr. Elena Ramos</td>
                      <td className="text-slate-500">Family Medicine</td>
                      <td>Routine Bloodwork &amp; Lipid Panel</td>
                      <td className="text-right">
                        <button className="text-teal-700 font-semibold hover:underline flex items-center gap-1 justify-end ml-auto">
                          <Download className="w-3 h-3" />
                          <span>Download PDF</span>
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 font-medium">Jul 02, 2024</td>
                      <td>Dr. Marcus Vance</td>
                      <td className="text-slate-500">Cardiology</td>
                      <td>Stress Echocardiogram Test</td>
                      <td className="text-right">
                        <button className="text-teal-700 font-semibold hover:underline flex items-center gap-1 justify-end ml-auto">
                          <Download className="w-3 h-3" />
                          <span>Download PDF</span>
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 font-medium">Mar 18, 2024</td>
                      <td>Dr. Sarah Jenkins</td>
                      <td className="text-slate-500">Dermatology</td>
                      <td>Annual Full-Body Skin Screening</td>
                      <td className="text-right">
                        <button className="text-teal-700 font-semibold hover:underline flex items-center gap-1 justify-end ml-auto">
                          <Download className="w-3 h-3" />
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
          <div className="lg:col-span-4 flex flex-col space-y-4">
            {/* Care Summary Card */}
            <div className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Care Summary
                </h3>
                <BadgeAlert className="w-4 h-4 text-slate-400" />
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Visits 2024
                  </span>
                  <p className="text-xl text-teal-800 font-bold leading-tight my-0.5">
                    6
                  </p>
                  <span className="text-[10px] text-slate-500">All completed</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Prescriptions
                  </span>
                  <p className="text-xl text-sky-700 font-bold leading-tight my-0.5">
                    3
                  </p>
                  <span className="text-[10px] text-slate-500">Active refills</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Primary Physician:</span>
                  <span className="font-semibold text-slate-800">Dr. Elena Ramos, MD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Primary Facility:</span>
                  <span className="font-semibold text-slate-800">Main Clinic (Bldg B)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Next Review:</span>
                  <span className="font-semibold text-teal-700">Oct 30, 2024</span>
                </div>
              </div>

              <Link
                href="/medical-records"
                className="w-full h-9 rounded-xl bg-teal-50 hover:bg-teal-100/80 text-teal-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-teal-200/60"
              >
                <span>View Medical File</span>
              </Link>
            </div>

            {/* Clinic Visit Checklist */}
            <div className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 text-teal-800 pb-2 border-b border-slate-100">
                <CheckSquare className="w-4 h-4 text-teal-700" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Clinic Visit Checklist
                </h3>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <p>Bring a valid government-issued photo ID and insurance policy card.</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <p>Bring original bottles of current prescribed medications or daily vitamin supplements.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                  <p>
                    <span className="font-bold text-slate-800">15-Minute Protocol:</span> Arrive 15 minutes ahead for vitals check.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 flex items-center gap-2.5 border border-slate-200/70">
                <Accessibility className="w-5 h-5 text-teal-700 shrink-0" />
                <div className="text-[11px] leading-snug">
                  <p className="font-bold text-slate-800">Wheelchair &amp; Mobility Assistance</p>
                  <p className="text-slate-500">Available at Main Entrance. Call ext. 4010.</p>
                </div>
              </div>
            </div>

            {/* Urgent Support Card */}
            <div className="bg-gradient-to-br from-teal-800 to-teal-900 text-white rounded-2xl p-5 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-300" />
                <span className="text-[10px] uppercase tracking-wider font-bold text-teal-200">
                  Clinical Support
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">
                Need urgent visit rescheduling?
              </h4>
              <p className="text-xs text-teal-100 leading-relaxed">
                Our registered nurse navigators can reroute acute symptom appointments immediately.
              </p>
              <a
                href="tel:18005556377"
                className="w-full h-9 rounded-xl bg-white text-teal-900 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs hover:bg-slate-100 transition-colors mt-2"
              >
                <Phone className="w-3.5 h-3.5 text-teal-800" />
                <span>1-800-555-MERRY</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
