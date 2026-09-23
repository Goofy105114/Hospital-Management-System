"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/axios";

interface QueueToken {
  id: string;
  tokenNumber: string;
  patientName: string;
  mrn: string;
  status: "WAITING" | "CALLED" | "IN_CONSULTATION" | "COMPLETED" | "SKIPPED";
  priorityTier: "NORMAL" | "PRIORITY" | "EMERGENCY";
  source: "APPOINTMENT" | "WALK_IN";
  estimatedWaitMinutes: number;
  roomNumber: string;
  doctorName: string;
  checkedInAt: string;
  position?: number;
}

export default function QueueBoardPage() {
  const { activeRole, user } = useAuthStore();
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "WAITING" | "SERVING" | "COMPLETED">("ALL");
  const [displayMode, setDisplayMode] = useState<"PATIENT" | "STAFF" | "KIOSK_DISPLAY">(
    activeRole === "PATIENT" ? "PATIENT" : "STAFF"
  );

  const myToken = tokens.find(
    (t) =>
      (user?.name && t.patientName.toLowerCase().includes(user.name.toLowerCase())) ||
      (user?.mrn && t.mrn === user.mrn)
  ) || tokens[0];
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [checkInModal, setCheckInModal] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [walkInReason, setWalkInReason] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);

  const fetchTokens = async () => {
    try {
      const res = await api.get("/queue/tokens");
      if (res.data?.success && Array.isArray(res.data.data)) {
        setTokens(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load queue tokens", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
    const interval = setInterval(fetchTokens, 5000);
    return () => clearInterval(interval);
  }, []);

  // Play a realistic medical chime using native Web Audio API
  const playChime = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // First tone (523.25 Hz - C5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.6);

      // Second tone (659.25 Hz - E5) after 200ms
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime);
        gain2.gain.setValueAtTime(0.2, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.8);
      }, 200);
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  const handleCallToken = async (id: string) => {
    playChime();
    try {
      await api.post(`/queue/tokens/${id}/recall`);
      await fetchTokens();
    } catch (err) {
      console.error("Failed to call token", err);
    }
  };

  const handleStartConsultation = async (id: string) => {
    try {
      await api.post(`/queue/tokens/${id}/start-consultation`);
      await fetchTokens();
    } catch (err) {
      console.error("Failed to start consultation", err);
    }
  };

  const handleCompleteToken = async (id: string) => {
    try {
      await api.post(`/queue/tokens/${id}/complete`);
      await fetchTokens();
    } catch (err) {
      console.error("Failed to complete token", err);
    }
  };

  const handleEmergencyPrioritize = async (id: string) => {
    try {
      await api.post(`/queue/tokens/${id}/recall`);
      await fetchTokens();
    } catch (err) {
      console.error("Failed to prioritize token", err);
    }
  };

  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName) return;

    try {
      let patientId: string | undefined;
      const patientsRes = await api.get(`/patients?query=${encodeURIComponent(walkInName)}`);
      if (patientsRes.data?.data && patientsRes.data.data.length > 0) {
        patientId = patientsRes.data.data[0].id;
      } else {
        const newPatientRes = await api.post("/patients", {
          name: walkInName,
          gender: "OTHER",
          phone: "+1-555-0100",
          email: `walkin.${Date.now()}@goingmerry.org`,
        });
        patientId = newPatientRes.data?.data?.id;
      }

      const doctorsRes = await api.get("/doctors");
      const doctorId = doctorsRes.data?.data?.[0]?.id;

      if (doctorId && patientId) {
        await api.post("/queue/check-in", {
          patientId,
          doctorId,
          isWalkIn: true,
          priorityTier: isEmergency ? "EMERGENCY" : "NORMAL",
          allowOverride: true,
        });
        await fetchTokens();
      }
    } catch (err) {
      console.error("Failed to check in walk-in patient", err);
    }

    setCheckInModal(false);
    setWalkInName("");
    setWalkInReason("");
    setIsEmergency(false);
  };

  // Filtered tokens
  const filteredTokens = tokens.filter((t) => {
    if (activeTab === "WAITING") return t.status === "WAITING" || t.status === "CALLED";
    if (activeTab === "SERVING") return t.status === "IN_CONSULTATION" || t.status === "CALLED";
    if (activeTab === "COMPLETED") return t.status === "COMPLETED";
    return true;
  });

  const nowServing =
    tokens.find((t) => t.status === "IN_CONSULTATION") || tokens.find((t) => t.status === "CALLED");
  const waitingCount = tokens.filter((t) => t.status === "WAITING").length;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-space-6 pb-space-12">
        {/* Top Header & View Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <div className="flex items-center gap-space-3">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                Live OPD Queue Command
              </h1>
              <span className="flex items-center gap-1.5 px-space-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync Active
              </span>
            </div>
            <p className="font-body-md text-on-surface-variant mt-1">
              {myToken?.doctorName
                ? `Attending: ${myToken.doctorName} • Room ${myToken.roomNumber}`
                : nowServing?.doctorName
                ? `Attending: ${nowServing.doctorName} • Room ${nowServing.roomNumber}`
                : "Outpatient Department • Live Queue Stream"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-space-3">
            {/* Audio Chime Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playChime();
              }}
              className="gap-space-1 border-outline-variant/40"
            >
              <span className="material-symbols-outlined text-base">
                {soundEnabled ? "volume_up" : "volume_off"}
              </span>
              {soundEnabled ? "Chime On" : "Muted"}
            </Button>

            {/* Display Mode Toggle */}
            <div className="inline-flex rounded-lg border border-outline-variant/40 p-0.5 bg-surface-container-low">
              {activeRole === "PATIENT" ? (
                <>
                  <button
                    onClick={() => setDisplayMode("PATIENT")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      displayMode === "PATIENT"
                        ? "bg-primary text-white shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    My Live Queue Pass
                  </button>
                  <button
                    onClick={() => setDisplayMode("KIOSK_DISPLAY")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      displayMode === "KIOSK_DISPLAY"
                        ? "bg-primary text-white shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Waiting Room Display
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setDisplayMode("STAFF")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      displayMode === "STAFF"
                        ? "bg-primary text-white shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Staff Desk
                  </button>
                  <button
                    onClick={() => setDisplayMode("KIOSK_DISPLAY")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      displayMode === "KIOSK_DISPLAY"
                        ? "bg-primary text-white shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Waiting Area Big Screen
                  </button>
                </>
              )}
            </div>

            {/* Action Button */}
            {activeRole === "PATIENT" ? (
              <Link href="/appointments/book">
                <Button
                  size="sm"
                  className="bg-primary text-white hover:bg-primary/90 gap-1 shadow-xs font-bold"
                >
                  <span className="material-symbols-outlined text-base">calendar_month</span>
                  Book Follow-Up
                </Button>
              </Link>
            ) : (
              <Button
                size="sm"
                onClick={() => setCheckInModal(true)}
                className="bg-primary text-white hover:bg-primary/90 gap-1 shadow-xs"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                Issue Walk-in Token
              </Button>
            )}
          </div>
        </div>

        {/* Patient Live Queue Mode (QUE-03 Patient View) */}
        {displayMode === "PATIENT" ? (
          <div className="space-y-space-6 animate-in fade-in">
            {/* Live Token Status Hero */}
            <div className="bg-surface-container-lowest rounded-3xl p-space-6 sm:p-space-8 border-2 border-primary/30 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary/10 via-transparent to-transparent pointer-events-none rounded-tr-3xl" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-6 pb-space-6 border-b border-outline-variant/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
                    <span className="text-label-sm font-bold uppercase tracking-wider text-primary">
                      Outpatient Queue Live Pass (QUE-03)
                    </span>
                  </div>
                  <h2 className="font-headline-lg font-black text-on-surface tracking-tight">
                    {myToken
                      ? `${myToken.patientName} • Token ${myToken.tokenNumber}`
                      : `${user?.name || "Patient"} • Outpatient Pass`}
                  </h2>
                  <p className="text-body-md text-outline">
                    {myToken
                      ? `${myToken.doctorName} • ${myToken.roomNumber}`
                      : "Check in at Reception Desk to activate queue pass"}
                  </p>
                </div>

                <div className="flex items-center gap-space-3">
                  <Badge variant="primary" className="px-space-3 py-1 text-label-md">
                    {myToken ? `${myToken.roomNumber} Active` : "Station 1 Active"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={playChime}
                    className="gap-1.5 font-semibold"
                  >
                    <span className="material-symbols-outlined text-[18px]">volume_up</span>
                    Test Turn Chime
                  </Button>
                </div>
              </div>

              {/* Status Alert Banner */}
              <div className="my-space-6 p-space-5 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-space-4">
                <div className="flex items-center gap-space-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-bold text-headline-sm shrink-0 shadow-md">
                    {myToken ? myToken.tokenNumber : "#--"}
                  </div>
                  <div>
                    <span className="text-label-xs uppercase font-bold text-outline tracking-wider">
                      Current Queue Status
                    </span>
                    <h3 className="font-headline-sm font-extrabold text-primary">
                      {myToken
                        ? `${
                            myToken.status === "WAITING"
                              ? "Waiting in Line"
                              : myToken.status === "CALLED"
                              ? "Called to Station"
                              : myToken.status
                          } • Position ${myToken.position}`
                        : "No Active Token"}
                    </h3>
                    <p className="text-body-sm text-on-surface-variant">
                      {myToken
                        ? `Attending Clinician: ${myToken.doctorName} (${myToken.roomNumber})`
                        : "Please check in at the reception desk."}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right border-t sm:border-t-0 pt-space-2 sm:pt-0 border-outline-variant/20">
                  <span className="text-label-xs uppercase font-bold text-outline tracking-wider block">
                    Estimated Wait Time
                  </span>
                  <div className="text-3xl sm:text-4xl font-black font-mono text-on-surface">
                    ~{myToken?.estimatedWaitMinutes || 15}{" "}
                    <span className="text-body-md font-medium text-outline">minutes</span>
                  </div>
                </div>
              </div>

              {/* Queue Progress Bar */}
              <div className="space-y-2 mb-space-6">
                <div className="flex justify-between items-center text-label-md font-semibold">
                  <span className="text-on-surface-variant">Queue Processing Progress</span>
                  <span className="text-primary font-bold">85% Complete</span>
                </div>
                <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                    style={{ width: "85%" }}
                  />
                </div>
                <p className="text-label-xs text-outline">
                  Automated by Upstash QStash event stream and AI Wait-Time Predictor (AI-01).
                </p>
              </div>

              {/* Next In Line Live Ticker */}
              <div className="space-y-space-3">
                <h4 className="font-label-lg font-bold text-on-surface uppercase tracking-wider text-[12px] flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">
                    format_list_numbered
                  </span>
                  Queue Sequence Ahead of You
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-space-3">
                  {tokens
                    .filter((t) => t.status === "IN_CONSULTATION" || t.status === "CALLED" || t.status === "WAITING")
                    .slice(0, 4)
                    .map((tok, idx) => {
                      const isMyTok = myToken && tok.id === myToken.id;
                      const isServing = tok.status === "IN_CONSULTATION";
                      const isCalled = tok.status === "CALLED";
                      return (
                        <div
                          key={tok.id}
                          className={`p-space-3 rounded-xl border ${
                            isMyTok
                              ? "bg-primary-container border-2 border-primary text-on-primary-container"
                              : isServing
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-800"
                              : isCalled
                              ? "bg-amber-500/10 border border-amber-500/20 text-amber-800"
                              : "bg-surface-container border border-outline-variant/30 text-on-surface"
                          }`}
                        >
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider block ${
                              isMyTok
                                ? "text-primary"
                                : isServing
                                ? "text-emerald-700"
                                : isCalled
                                ? "text-amber-700"
                                : "text-outline"
                            }`}
                          >
                            {isMyTok
                              ? "Your Turn"
                              : isServing
                              ? `In Room ${tok.roomNumber || "401"}`
                              : isCalled
                              ? "Called Next"
                              : `Queue #${idx + 1}`}
                          </span>
                          <span className="font-headline-md font-mono font-bold block mt-0.5">
                            #{tok.tokenNumber}
                          </span>
                          <span
                            className={`text-xs truncate block ${
                              isMyTok ? "font-bold text-primary" : "text-on-surface-variant"
                            }`}
                          >
                            {tok.patientName} (~{tok.estimatedWaitMinutes || 15}m)
                          </span>
                        </div>
                      );
                    })}
                  {tokens.filter(
                    (t) => t.status === "IN_CONSULTATION" || t.status === "CALLED" || t.status === "WAITING"
                  ).length === 0 && (
                    <div className="col-span-full py-4 text-center text-sm text-outline">
                      No patients currently waiting in line.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Clinician Card & Pre-Visit Checklist */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-6">
              <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-space-6 border border-outline-variant/30 shadow-sm space-y-space-4">
                <h3 className="font-headline-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">
                    stethoscope
                  </span>
                  Attending Clinician &amp; Consultation Station
                </h3>
                <div className="flex items-center gap-space-4 p-space-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-headline-sm shrink-0">
                    <span className="material-symbols-outlined text-[32px]">health_and_safety</span>
                  </div>
                  <div>
                    <h4 className="font-headline-sm font-bold text-on-surface">
                      {myToken?.doctorName || nowServing?.doctorName || "Assigned Duty Clinician"}
                    </h4>
                    <p className="text-label-md text-primary font-semibold">
                      Outpatient Specialist • Room {myToken?.roomNumber || nowServing?.roomNumber || "402"}
                    </p>
                    <p className="text-body-sm text-outline mt-0.5">
                      Status: {myToken ? (myToken.status === "IN_CONSULTATION" ? "Session In Progress" : myToken.status === "CALLED" ? "Calling Patient" : "Waiting In Queue") : "Station Active"}
                    </p>
                  </div>
                </div>

                <div className="p-space-4 rounded-xl bg-surface-container-high/50 text-body-sm text-on-surface-variant space-y-1">
                  <p className="font-semibold text-on-surface">Pre-Consultation Instructions:</p>
                  <p>
                    • Please remain seated within audio range of the waiting room chime or keep your
                    phone notifications active.
                  </p>
                  <p>
                    • Have your ID and insurance card ready for baseline vitals confirmation at
                    Reception Desk 4.
                  </p>
                  <p>
                    • When your token is called, proceed directly through Corridor B to Examination
                    Room 402B.
                  </p>
                </div>
              </div>

              {/* Wayfinding & Kiosk Display Link */}
              <div className="bg-surface-container-lowest rounded-2xl p-space-6 border border-outline-variant/30 shadow-sm flex flex-col justify-between space-y-space-4">
                <div className="space-y-space-3">
                  <h3 className="font-label-lg font-bold text-on-surface uppercase tracking-wider text-[12px] flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">map</span>
                    Wayfinding &amp; Facility
                  </h3>
                  <div className="space-y-1 text-body-sm text-on-surface-variant">
                    <p className="font-bold text-on-surface">East Wing Elevator Bank B</p>
                    <p>Take Elevator to Level 3, turn left at the Cardiology Clinical Suite.</p>
                  </div>
                  <div className="p-space-3 bg-surface-container rounded-xl text-label-xs text-outline space-y-1">
                    <span className="font-bold text-on-surface block">
                      Need Wheelchair Assistance?
                    </span>
                    <span>Notify the triage nurse at Desk 4 or dial Ext. 4022.</span>
                  </div>
                </div>

                <Link href="/queue/display" className="block w-full">
                  <Button variant="outline" className="w-full gap-2 font-bold">
                    <span className="material-symbols-outlined text-[18px]">tv</span>
                    View Big Screen Display
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : displayMode === "KIOSK_DISPLAY" ? (
          <div className="space-y-space-6 animate-in fade-in">
            {/* Massive Hero Card for Waiting Area */}
            <div className="bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900 text-white rounded-3xl p-space-8 sm:p-space-12 shadow-2xl border border-teal-700/40">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-8 items-center">
                <div>
                  <span className="px-space-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 font-mono text-sm font-semibold uppercase tracking-widest border border-emerald-400/30">
                    {nowServing?.roomNumber ? `NOW SERVING IN ROOM ${nowServing.roomNumber}` : "CURRENT CONSULTATION"}
                  </span>
                  <div className="text-7xl sm:text-9xl font-black font-mono tracking-tighter text-white mt-space-4 drop-shadow-sm">
                    {nowServing?.tokenNumber || "NONE"}
                  </div>
                  <p className="text-xl sm:text-2xl text-teal-100 font-medium mt-space-2">
                    {nowServing?.patientName || "Waiting for next patient call"}
                  </p>
                  <p className="text-sm sm:text-base text-teal-300/80 mt-1">
                    {nowServing
                      ? `Please proceed to Room ${nowServing.roomNumber || "Consultation"} • ${nowServing.doctorName || "Attending Clinician"}`
                      : "Please wait for your token to be announced"}
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-space-6 border border-white/10 space-y-space-4">
                  <h3 className="text-lg font-bold text-teal-200 uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-300">hourglass_top</span>
                    Next Up In Queue
                  </h3>
                  <div className="space-y-space-3">
                    {tokens
                      .filter((t) => t.status === "WAITING")
                      .slice(0, 3)
                      .map((tok, idx) => (
                        <div
                          key={tok.id}
                          className="flex items-center justify-between p-space-3 rounded-xl bg-white/10 border border-white/10"
                        >
                          <div className="flex items-center gap-space-3">
                            <span className="text-xs font-mono px-2 py-1 rounded bg-teal-800 text-teal-200">
                              #{idx + 1}
                            </span>
                            <span className="text-2xl font-bold font-mono text-white">
                              {tok.tokenNumber}
                            </span>
                            <span className="text-teal-200 text-sm hidden sm:inline">
                              {tok.patientName}
                            </span>
                          </div>
                          <span className="text-emerald-300 font-mono font-bold text-sm">
                            ~{tok.estimatedWaitMinutes} Mins
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Staff Desk Console Mode */
          <div className="space-y-space-6">
            {/* KPI Status Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-4">
              <Card className="border border-outline-variant/30 shadow-xs">
                <CardContent className="p-space-4">
                  <span className="font-label-sm text-outline uppercase tracking-wider block">
                    Now Serving
                  </span>
                  <div className="text-3xl font-bold font-mono text-primary mt-1">
                    {nowServing?.tokenNumber || "Idle"}
                  </div>
                  <span className="text-xs text-outline block mt-0.5 truncate">
                    {nowServing?.patientName || "No active consultation"}
                  </span>
                </CardContent>
              </Card>

              <Card className="border border-outline-variant/30 shadow-xs">
                <CardContent className="p-space-4">
                  <span className="font-label-sm text-outline uppercase tracking-wider block">
                    Waiting in Queue
                  </span>
                  <div className="text-3xl font-bold font-mono text-on-surface mt-1">
                    {waitingCount} Patients
                  </div>
                  <span className="text-xs text-outline block mt-0.5">Avg consult: 12 mins/pt</span>
                </CardContent>
              </Card>

              <Card className="border border-outline-variant/30 shadow-xs">
                <CardContent className="p-space-4">
                  <span className="font-label-sm text-outline uppercase tracking-wider block">
                    Consultations Done
                  </span>
                  <div className="text-3xl font-bold font-mono text-emerald-600 mt-1">
                    {tokens.filter((t) => t.status === "COMPLETED").length} Completed
                  </div>
                  <span className="text-xs text-outline block mt-0.5">Today&apos;s session</span>
                </CardContent>
              </Card>

              <Card className="border border-outline-variant/30 shadow-xs">
                <CardContent className="p-space-4">
                  <span className="font-label-sm text-outline uppercase tracking-wider block">
                    Predicted Room Delay
                  </span>
                  <div className="text-3xl font-bold font-mono text-secondary mt-1">+4 Mins</div>
                  <span className="text-xs text-emerald-600 font-semibold block mt-0.5">
                    On Schedule
                  </span>
                </CardContent>
              </Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-space-2 border-b border-outline-variant/20 pb-space-2">
              {(["ALL", "WAITING", "SERVING", "COMPLETED"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-label-md transition-colors ${
                    activeTab === tab
                      ? "bg-primary text-white font-bold"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {tab === "ALL"
                    ? `All Tokens (${tokens.length})`
                    : tab === "WAITING"
                      ? `Waiting (${waitingCount})`
                      : tab === "SERVING"
                        ? "In Room / Called"
                        : "Completed"}
                </button>
              ))}
            </div>

            {/* Live Queue Table / Cards */}
            <div className="space-y-space-3">
              {filteredTokens.map((token) => {
                const isServing = token.status === "IN_CONSULTATION" || token.status === "CALLED";
                const isEmergencyTier = token.priorityTier === "EMERGENCY";

                return (
                  <div
                    key={token.id}
                    className={`p-space-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-space-4 ${
                      isEmergencyTier
                        ? "bg-red-50/70 border-red-200"
                        : isServing
                          ? "bg-primary/5 border-primary/40 shadow-xs"
                          : "bg-surface-container-lowest border-outline-variant/30"
                    }`}
                  >
                    <div className="flex items-center gap-space-4">
                      {/* Big Token Badge */}
                      <div
                        className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center font-mono font-bold shrink-0 ${
                          isEmergencyTier
                            ? "bg-red-600 text-white shadow-md animate-pulse"
                            : isServing
                              ? "bg-primary text-white shadow-sm"
                              : "bg-surface-container-high text-on-surface"
                        }`}
                      >
                        <span className="text-lg leading-tight">{token.tokenNumber}</span>
                        <span className="text-[10px] uppercase font-sans font-semibold">
                          {token.source === "WALK_IN" ? "Walk-In" : "Appt"}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-space-2">
                          <h3 className="font-title-md font-bold text-on-surface truncate">
                            {token.patientName}
                          </h3>
                          {isEmergencyTier && (
                            <Badge variant="error" className="text-[10px] animate-bounce">
                              EMERGENCY TRIAGE
                            </Badge>
                          )}
                          {token.priorityTier === "PRIORITY" && (
                            <Badge variant="warning" className="text-[10px]">
                              Priority
                            </Badge>
                          )}
                          <Badge
                            variant={
                              token.status === "IN_CONSULTATION"
                                ? "success"
                                : token.status === "CALLED"
                                  ? "warning"
                                  : token.status === "COMPLETED"
                                    ? "secondary"
                                    : "outline"
                            }
                            className="text-[10px]"
                          >
                            {token.status}
                          </Badge>
                        </div>
                        <p className="font-mono text-xs text-outline mt-0.5">
                          {token.mrn} • Checked in at {token.checkedInAt}
                        </p>
                      </div>
                    </div>

                    {/* Wait Time & Action Controls */}
                    <div className="flex flex-wrap items-center gap-space-4 justify-between md:justify-end">
                      <div className="text-left md:text-right">
                        <span className="text-xs text-outline block">Est. Wait Time</span>
                        <span className="font-mono font-bold text-base text-on-surface">
                          {token.status === "COMPLETED"
                            ? "Finished"
                            : token.status === "IN_CONSULTATION"
                              ? "In Room"
                              : `~${token.estimatedWaitMinutes} mins`}
                        </span>
                      </div>

                      <div className="flex items-center gap-space-2">
                        {token.status === "WAITING" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleCallToken(token.id)}
                              className="bg-primary text-white hover:bg-primary/90 gap-1 text-xs"
                            >
                              <span className="material-symbols-outlined text-sm">campaign</span>
                              Call Patient
                            </Button>
                            {!isEmergencyTier && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEmergencyPrioritize(token.id)}
                                className="border-red-300 text-red-700 hover:bg-red-50 text-xs"
                              >
                                Prioritize
                              </Button>
                            )}
                          </>
                        )}

                        {token.status === "CALLED" && (
                          <Button
                            size="sm"
                            onClick={() => handleStartConsultation(token.id)}
                            className="bg-emerald-600 text-white hover:bg-emerald-700 gap-1 text-xs"
                          >
                            <span className="material-symbols-outlined text-sm">meeting_room</span>
                            Start Consult
                          </Button>
                        )}

                        {token.status === "IN_CONSULTATION" && (
                          <Button
                            size="sm"
                            onClick={() => handleCompleteToken(token.id)}
                            className="bg-teal-700 text-white hover:bg-teal-800 gap-1 text-xs"
                          >
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            Finish Visit
                          </Button>
                        )}

                        {token.status === "COMPLETED" && (
                          <Badge variant="success" className="text-xs">
                            Visit Complete
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Express Walk-in Check-in Modal */}
      {checkInModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateWalkIn}
            className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-6 shadow-xl border border-outline-variant/30 space-y-space-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-space-3">
              <h3 className="font-title-lg font-bold text-on-surface">Issue Walk-in Token</h3>
              <button
                type="button"
                onClick={() => setCheckInModal(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-space-3">
              <div>
                <label className="font-label-md font-semibold text-on-surface block mb-1">
                  Patient Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Johnathan Doe"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 focus:outline-none focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="font-label-md font-semibold text-on-surface block mb-1">
                  Primary Chief Complaint / Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dizziness, elevated blood pressure"
                  value={walkInReason}
                  onChange={(e) => setWalkInReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 focus:outline-none focus:border-primary text-sm"
                />
              </div>

              <div className="flex items-center gap-space-2 pt-space-2">
                <input
                  type="checkbox"
                  id="emergencyCheck"
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                  className="w-4 h-4 text-error rounded border-outline-variant"
                />
                <label
                  htmlFor="emergencyCheck"
                  className="font-label-md text-error font-semibold cursor-pointer"
                >
                  Emergency Triage Priority (Bump to front of line)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-space-3 pt-space-3 border-t border-outline-variant/20">
              <Button type="button" variant="outline" onClick={() => setCheckInModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-white">
                Generate Token
              </Button>
            </div>
          </form>
        </div>
      )}
    </AppLayout>
  );
}
