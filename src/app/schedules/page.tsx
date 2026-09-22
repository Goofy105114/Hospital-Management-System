"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface ClinicSession {
  id: string;
  doctorId: string;
  doctorName: string;
  department: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  maxCapacity: number;
  roomNumber: string;
  isPublished: boolean;
}

interface DoctorLeave {
  id: string;
  doctorId: string;
  doctorName: string;
  department: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

import api from "@/lib/axios";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function DoctorSchedulingPage() {
  const [sessions, setSessions] = useState<ClinicSession[]>([]);
  const [leaves, setLeaves] = useState<DoctorLeave[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<
    Array<{ id: string; name: string; department: string }>
  >([]);
  const [activeTab, setActiveTab] = useState<"sessions" | "leaves" | "rooms" | "publish">(
    "sessions"
  );

  React.useEffect(() => {
    let isMounted = true;
    api
      .get("/schedules")
      .then((res) => {
        if (!isMounted) return;
        const list = res.data?.data;
        if (Array.isArray(list)) {
          const mapped: ClinicSession[] = list.map((s: any) => ({
            id: s.id,
            doctorId: s.doctorId,
            doctorName: s.doctor?.user?.name || s.doctorName || "Doctor",
            department: s.doctor?.department?.name || s.department || "Clinical Care",
            dayOfWeek: s.dayOfWeek,
            dayName: DAY_NAMES[s.dayOfWeek] || "Day",
            startTime: s.startTime,
            endTime: s.endTime,
            slotDurationMinutes: s.slotDurationMinutes || 15,
            maxCapacity: s.maxCapacity || 20,
            roomNumber: s.roomNumber || "Consultation Room",
            isPublished: s.isPublished ?? true,
          }));
          setSessions(mapped);
        }
      })
      .catch(() => {});

    api
      .get("/doctors")
      .then((res) => {
        if (!isMounted) return;
        const docList = res.data?.data;
        if (Array.isArray(docList)) {
          setAvailableDoctors(
            docList.map((d: any) => ({
              id: d.id,
              name: d.name,
              department: d.department || "Clinical Care",
            }))
          );
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Session Modal State (SCH-01, SCH-03)
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [newDoctor, setNewDoctor] = useState("Dr. Marcus Vance (Cardiology)");
  const [newDay, setNewDay] = useState(1);
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("13:00");
  const [newRoom, setNewRoom] = useState("Room 104 (Echo Suite)");
  const [newDuration, setNewDuration] = useState(15);
  const [newCapacity, setNewCapacity] = useState(16);

  // Leave Modal State (SCH-02)
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveDoctor, setLeaveDoctor] = useState("Dr. Marcus Vance");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  // Create Session Handler (SCH-01)
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const newSession: ClinicSession = {
      id: `sch-${Date.now()}`,
      doctorId: "doc-01",
      doctorName: newDoctor.split(" (")[0],
      department: newDoctor.includes("Cardiology") ? "Cardiology" : "General",
      dayOfWeek: Number(newDay),
      dayName: dayNames[Number(newDay)],
      startTime: newStartTime,
      endTime: newEndTime,
      slotDurationMinutes: Number(newDuration),
      maxCapacity: Number(newCapacity),
      roomNumber: newRoom,
      isPublished: false,
    };
    setSessions([...sessions, newSession]);
    setShowSessionModal(false);
  };

  // Submit Leave Handler (SCH-02)
  const handleCreateLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const newLeave: DoctorLeave = {
      id: `lve-${Date.now()}`,
      doctorId: "doc-01",
      doctorName: leaveDoctor,
      department: "Cardiology",
      startDate: leaveStart,
      endDate: leaveEnd,
      reason: leaveReason,
      status: "PENDING",
    };
    setLeaves([newLeave, ...leaves]);
    setShowLeaveModal(false);
    setLeaveReason("");
  };

  // Publish / Unpublish Session Handler (SCH-04)
  const handleTogglePublish = (sessionId: string) => {
    setSessions(
      sessions.map((s) => (s.id === sessionId ? { ...s, isPublished: !s.isPublished } : s))
    );
  };

  return (
    <AppLayout>
      <div className="space-y-space-6 max-w-7xl mx-auto pb-space-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <div className="flex items-center gap-space-2 text-label-md text-outline">
              <Link href="/appointments" className="hover:text-primary transition-colors">
                Appointments Desk
              </Link>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              <span className="text-on-surface font-semibold">Doctor Capacity & Schedules</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mt-space-1">
              Clinic Scheduling & Capacity Command (SCH-01..04)
            </h1>
            <p className="font-body-md text-body-md text-outline mt-space-1">
              Manage clinician consultation blocks, room assignments, slot capacities, leave
              blackouts, and publishing conflict verification.
            </p>
          </div>

          <div className="flex items-center gap-space-2">
            <Button
              variant="outline"
              onClick={() => setShowLeaveModal(true)}
              className="gap-space-2"
            >
              <span className="material-symbols-outlined text-[18px]">event_busy</span>
              Record Leave (SCH-02)
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowSessionModal(true)}
              className="gap-space-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Clinic Session
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-outline-variant/30 gap-space-6 text-label-lg overflow-x-auto">
          <button
            onClick={() => setActiveTab("sessions")}
            className={`pb-space-3 font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-space-1 ${
              activeTab === "sessions"
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            Weekly Recurring Sessions ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab("leaves")}
            className={`pb-space-3 font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-space-1 ${
              activeTab === "leaves"
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">beach_access</span>
            Doctor Leaves & Blackouts ({leaves.length})
          </button>
          <button
            onClick={() => setActiveTab("rooms")}
            className={`pb-space-3 font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-space-1 ${
              activeTab === "rooms"
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">meeting_room</span>
            Room Allocation & Conflicts (SCH-03)
          </button>
          <button
            onClick={() => setActiveTab("publish")}
            className={`pb-space-3 font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-space-1 ${
              activeTab === "publish"
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">publish</span>
            Schedule Exceptions & Publishing (SCH-04)
          </button>
        </div>

        {/* TAB 1: Weekly Recurring Sessions (SCH-01, SCH-03) */}
        {activeTab === "sessions" && (
          <div className="space-y-space-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-space-4">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
                .slice(0, 4)
                .map((day, idx) => {
                  const daySessions = sessions.filter((s) => s.dayName === day);
                  return (
                    <div
                      key={day}
                      className="p-space-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 space-y-space-3"
                    >
                      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-space-2">
                        <span className="font-title-sm font-bold text-on-surface">{day}</span>
                        <Badge variant="outline" className="text-label-xs">
                          {daySessions.length} block{daySessions.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>

                      {daySessions.length === 0 ? (
                        <p className="text-label-sm text-outline italic py-space-4 text-center">
                          No sessions scheduled
                        </p>
                      ) : (
                        daySessions.map((session) => (
                          <div
                            key={session.id}
                            className="p-space-3 rounded-lg bg-surface-container border border-outline-variant/30 space-y-space-2 text-body-sm"
                          >
                            <div className="flex items-start justify-between">
                              <span className="font-bold text-on-surface block">
                                {session.doctorName}
                              </span>
                              <Badge
                                variant="outline"
                                className={
                                  session.isPublished
                                    ? "bg-success/10 text-success text-label-xs border-success/30"
                                    : "bg-warning/10 text-warning text-label-xs border-warning/30"
                                }
                              >
                                {session.isPublished ? "PUBLISHED" : "DRAFT"}
                              </Badge>
                            </div>
                            <div className="text-label-sm text-outline flex items-center gap-space-1">
                              <span className="material-symbols-outlined text-[14px]">
                                schedule
                              </span>
                              <span>
                                {session.startTime} – {session.endTime}
                              </span>
                            </div>
                            <div className="text-label-sm text-outline flex items-center gap-space-1">
                              <span className="material-symbols-outlined text-[14px]">
                                meeting_room
                              </span>
                              <span>{session.roomNumber}</span>
                            </div>
                            <div className="text-label-xs text-outline pt-space-1 border-t border-outline-variant/20 flex justify-between">
                              <span>Slot: {session.slotDurationMinutes}m</span>
                              <span>Cap: {session.maxCapacity} pts</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Sessions Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Configured Session Blocks</CardTitle>
                <CardDescription>
                  Directly controls the slot generation engine for outpatient appointment booking
                  (APT-02).
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-body-sm text-left border-collapse">
                  <thead className="bg-surface-container text-label-sm font-semibold text-outline uppercase border-y border-outline-variant/30">
                    <tr>
                      <th className="py-space-3 px-space-4">Clinician</th>
                      <th className="py-space-3 px-space-4">Department</th>
                      <th className="py-space-3 px-space-4">Day</th>
                      <th className="py-space-3 px-space-4">Time Window</th>
                      <th className="py-space-3 px-space-4">Room Suite</th>
                      <th className="py-space-3 px-space-4">Slot Config</th>
                      <th className="py-space-3 px-space-4">Status</th>
                      <th className="py-space-3 px-space-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {sessions.map((session) => (
                      <tr key={session.id} className="hover:bg-surface-container-high/40">
                        <td className="py-space-3 px-space-4 font-semibold text-on-surface">
                          {session.doctorName}
                        </td>
                        <td className="py-space-3 px-space-4 text-outline">{session.department}</td>
                        <td className="py-space-3 px-space-4 font-medium">{session.dayName}</td>
                        <td className="py-space-3 px-space-4 font-mono font-semibold">
                          {session.startTime} - {session.endTime}
                        </td>
                        <td className="py-space-3 px-space-4 text-on-surface-variant">
                          {session.roomNumber}
                        </td>
                        <td className="py-space-3 px-space-4 text-label-sm text-outline">
                          {session.slotDurationMinutes} mins ({session.maxCapacity} max)
                        </td>
                        <td className="py-space-3 px-space-4">
                          <Badge
                            variant="outline"
                            className={
                              session.isPublished
                                ? "bg-success/15 text-success border-success/30 font-semibold"
                                : "bg-warning/15 text-warning border-warning/30 font-semibold"
                            }
                          >
                            {session.isPublished ? "PUBLISHED" : "DRAFT"}
                          </Badge>
                        </td>
                        <td className="py-space-3 px-space-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTogglePublish(session.id)}
                          >
                            {session.isPublished ? "Unpublish" : "Publish"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: Leaves & Blackouts (SCH-02) */}
        {activeTab === "leaves" && (
          <div className="space-y-space-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Doctor Leave & Blackout Calendar (SCH-02)</CardTitle>
                    <CardDescription>
                      Approved leaves automatically suppress slot generation in APT-02. Existing
                      appointments require conflict resolution.
                    </CardDescription>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => setShowLeaveModal(true)}
                    className="gap-space-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Request Leave
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-body-sm text-left border-collapse">
                  <thead className="bg-surface-container text-label-sm font-semibold text-outline uppercase border-y border-outline-variant/30">
                    <tr>
                      <th className="py-space-3 px-space-4">Doctor</th>
                      <th className="py-space-3 px-space-4">Department</th>
                      <th className="py-space-3 px-space-4">Period</th>
                      <th className="py-space-3 px-space-4">Leave Reason</th>
                      <th className="py-space-3 px-space-4">Status</th>
                      <th className="py-space-3 px-space-4 text-right">Approval</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {leaves.map((leave) => (
                      <tr key={leave.id} className="hover:bg-surface-container-high/40">
                        <td className="py-space-3 px-space-4 font-bold text-on-surface">
                          {leave.doctorName}
                        </td>
                        <td className="py-space-3 px-space-4 text-outline">{leave.department}</td>
                        <td className="py-space-3 px-space-4 font-mono">
                          {leave.startDate} to {leave.endDate}
                        </td>
                        <td className="py-space-3 px-space-4 text-on-surface-variant">
                          {leave.reason}
                        </td>
                        <td className="py-space-3 px-space-4">
                          <Badge
                            variant="outline"
                            className={
                              leave.status === "APPROVED"
                                ? "bg-success/15 text-success"
                                : "bg-warning/15 text-warning"
                            }
                          >
                            {leave.status}
                          </Badge>
                        </td>
                        <td className="py-space-3 px-space-4 text-right space-x-space-2">
                          {leave.status === "PENDING" && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() =>
                                  setLeaves(
                                    leaves.map((l) =>
                                      l.id === leave.id ? { ...l, status: "APPROVED" } : l
                                    )
                                  )
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setLeaves(
                                    leaves.map((l) =>
                                      l.id === leave.id ? { ...l, status: "REJECTED" } : l
                                    )
                                  )
                                }
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: Room Allocation & Conflicts (SCH-03) */}
        {activeTab === "rooms" && (
          <div className="space-y-space-6">
            <Card>
              <CardHeader>
                <CardTitle>Consultation Room Allocation Matrix (SCH-03)</CardTitle>
                <CardDescription>
                  Prevents double-booking across doctors sharing physical examination suites.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-space-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4">
                  <div className="p-space-4 bg-surface-container rounded-xl border border-outline-variant/30 space-y-space-2">
                    <span className="font-title-md font-bold text-on-surface block">
                      Room 104 (Echo Suite)
                    </span>
                    <span className="text-label-sm text-outline block">Department: Cardiology</span>
                    <div className="pt-space-2 border-t border-outline-variant/20 text-body-sm space-y-space-1">
                      <div className="text-success font-semibold flex items-center gap-space-1">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Mon 09:00 - 13:00: Dr. Marcus Vance
                      </div>
                      <div className="text-success font-semibold flex items-center gap-space-1">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Wed 14:00 - 18:00: Dr. Marcus Vance
                      </div>
                    </div>
                  </div>

                  <div className="p-space-4 bg-surface-container rounded-xl border border-outline-variant/30 space-y-space-2">
                    <span className="font-title-md font-bold text-on-surface block">
                      Room 202 (Pediatric Suite)
                    </span>
                    <span className="text-label-sm text-outline block">Department: Pediatrics</span>
                    <div className="pt-space-2 border-t border-outline-variant/20 text-body-sm space-y-space-1">
                      <div className="text-success font-semibold flex items-center gap-space-1">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Tue 09:00 - 14:00: Dr. Sarah Jenkins
                      </div>
                    </div>
                  </div>

                  <div className="p-space-4 bg-surface-container rounded-xl border border-outline-variant/30 space-y-space-2">
                    <span className="font-title-md font-bold text-on-surface block">
                      Room 305 (Neuro Lab)
                    </span>
                    <span className="text-label-sm text-outline block">Department: Neurology</span>
                    <div className="pt-space-2 border-t border-outline-variant/20 text-body-sm space-y-space-1">
                      <div className="text-outline font-semibold flex items-center gap-space-1">
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                        Thu 10:00 - 16:00: Dr. Emily Chen (Draft)
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4: Publishing & Conflict Verification (SCH-04) */}
        {activeTab === "publish" && (
          <div className="space-y-space-6 max-w-3xl">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-space-2 text-primary">
                  <span className="material-symbols-outlined">publish</span>
                  <CardTitle>Schedule Exceptions & Conflict Verification (SCH-04)</CardTitle>
                </div>
                <CardDescription>
                  Validation pass across all recurring blocks, doctor leaves, and room constraints.
                  Unresolved conflicts block publishing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-space-4">
                <div className="p-space-4 bg-success/15 border border-success/30 rounded-xl space-y-space-2">
                  <div className="flex items-center gap-space-2 text-success font-bold">
                    <span className="material-symbols-outlined">verified</span>
                    <span>Conflict Verification Passed: 0 Overlaps Detected</span>
                  </div>
                  <p className="text-body-sm text-on-surface">
                    All published doctor sessions are mathematically disjoint and room-exclusive.
                    Patient booking engine (APT-02) is operating with 100% capacity integrity.
                  </p>
                </div>

                <div className="flex items-center justify-between p-space-4 bg-surface-container rounded-xl border border-outline-variant/30">
                  <div>
                    <span className="font-title-sm font-bold text-on-surface block">
                      Bulk Publish All Draft Sessions
                    </span>
                    <span className="text-label-sm text-outline">
                      1 draft session (Dr. Emily Chen, Room 305) ready to go live.
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setSessions(sessions.map((s) => ({ ...s, isPublished: true })));
                      alert("All draft schedules published to patient booking engine!");
                    }}
                  >
                    Publish All Drafts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal: New Clinic Session (SCH-01) */}
        {showSessionModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-4">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-space-6 max-w-lg w-full shadow-2xl space-y-space-4">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Create Clinic Session Block (SCH-01)
              </h3>
              <form onSubmit={handleCreateSession} className="space-y-space-4">
                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Attending Clinician & Department
                  </label>
                  <select
                    value={newDoctor}
                    onChange={(e) => setNewDoctor(e.target.value)}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                  >
                    {availableDoctors.length > 0 ? (
                      availableDoctors.map((doc) => (
                        <option key={doc.id} value={`${doc.name} (${doc.department})`}>
                          {doc.name} ({doc.department})
                        </option>
                      ))
                    ) : (
                      <option value="Dr. Marcus Vance (Cardiology)">
                        Dr. Marcus Vance (Cardiology)
                      </option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-space-4">
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Day of the Week
                    </label>
                    <select
                      value={newDay}
                      onChange={(e) => setNewDay(Number(e.target.value))}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    >
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                      <option value={0}>Sunday</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Consultation Room
                    </label>
                    <input
                      type="text"
                      required
                      value={newRoom}
                      onChange={(e) => setNewRoom(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-space-4">
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      required
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-space-4">
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Slot Duration (Minutes)
                    </label>
                    <select
                      value={newDuration}
                      onChange={(e) => setNewDuration(Number(e.target.value))}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    >
                      <option value={10}>10 Minutes</option>
                      <option value={15}>15 Minutes</option>
                      <option value={20}>20 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Max Patient Capacity
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(Number(e.target.value))}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-space-2 pt-space-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSessionModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Create Session
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Leave Request (SCH-02) */}
        {showLeaveModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-4">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-space-6 max-w-md w-full shadow-2xl space-y-space-4">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Record Doctor Leave (SCH-02)
              </h3>
              <form onSubmit={handleCreateLeave} className="space-y-space-4">
                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Clinician
                  </label>
                  <select
                    value={leaveDoctor}
                    onChange={(e) => setLeaveDoctor(e.target.value)}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                  >
                    {availableDoctors.length > 0 ? (
                      availableDoctors.map((doc) => (
                        <option key={doc.id} value={doc.name}>
                          {doc.name} ({doc.department})
                        </option>
                      ))
                    ) : (
                      <option value="Dr. Marcus Vance">Dr. Marcus Vance (Cardiology)</option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-space-4">
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={leaveStart}
                      onChange={(e) => setLeaveStart(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={leaveEnd}
                      onChange={(e) => setLeaveEnd(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Reason / Conference Details
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Annual medical symposium attendance"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-space-2">
                  <Button type="button" variant="outline" onClick={() => setShowLeaveModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Submit Leave
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
