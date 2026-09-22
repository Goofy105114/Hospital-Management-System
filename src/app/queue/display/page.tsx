"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface LiveCallToken {
  tokenNumber: string;
  doctorName: string;
  roomNumber: string;
  department: string;
  calledAt: string;
  priorityTier: "NORMAL" | "PRIORITY" | "EMERGENCY";
}

interface WaitingToken {
  tokenNumber: string;
  roomNumber: string;
  position: number;
}

import api from "@/lib/axios";

export default function WaitingRoomDisplayPage() {
  const [activeCalls, setActiveCalls] = useState<LiveCallToken[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingToken[]>([]);
  const [currentTime, setCurrentTime] = useState("");
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  useEffect(() => {
    const fetchTokens = () => {
      api
        .get("/queue/tokens")
        .then((res) => {
          const list = res.data?.data;
          if (Array.isArray(list)) {
            const called: LiveCallToken[] = list
              .filter(
                (t: any) =>
                  t.status === "CALLED" ||
                  t.status === "IN_PROGRESS" ||
                  t.status === "IN_CONSULTATION"
              )
              .map((t: any) => ({
                tokenNumber: t.tokenNumber,
                doctorName: t.doctorName || "Attending Physician",
                roomNumber: t.roomNumber || "Consultation Room",
                department: t.department || "Outpatient Clinic",
                calledAt: t.calledAt
                  ? new Date(t.calledAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Now Serving",
                priorityTier:
                  t.priorityTier === "EMERGENCY"
                    ? "EMERGENCY"
                    : t.priorityTier === "PRIORITY"
                      ? "PRIORITY"
                      : "NORMAL",
              }));

            const waiting: WaitingToken[] = list
              .filter((t: any) => t.status === "WAITING")
              .map((t: any, idx: number) => ({
                tokenNumber: t.tokenNumber,
                roomNumber: t.roomNumber || "Consultation Room",
                position: idx + 1,
              }));

            setActiveCalls(called);
            setWaitingList(waiting);
          } else {
            setActiveCalls([]);
            setWaitingList([]);
          }
        })
        .catch(() => {
          setActiveCalls([]);
          setWaitingList([]);
        });
    };

    fetchTokens();
    const tokenInterval = setInterval(fetchTokens, 5000);
    return () => clearInterval(tokenInterval);
  }, []);

  // Audio Context Ref for Web Audio API Chime
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Web Audio Chime Generator
  const playTurnChime = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      // Tone 1: 523.25 Hz (C5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Tone 2: 659.25 Hz (E5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.frequency.setValueAtTime(659.25, now + 0.2);
      gain2.gain.setValueAtTime(0.3, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.8);
    } catch {
      // Audio not permitted without user gesture
    }
  };

  // Simulate Turn Announcement
  const triggerDemoCall = () => {
    if (isAudioEnabled) playTurnChime();
    const randomSeq = Math.floor(10 + Math.random() * 89);
    const newCall: LiveCallToken = {
      tokenNumber: `DR01-0${randomSeq}`,
      doctorName: "Dr. Marcus Vance",
      roomNumber: "Room 104",
      department: "Cardiology Suite",
      calledAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      priorityTier: "NORMAL",
    };
    setActiveCalls([newCall, ...activeCalls.slice(0, 2)]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-space-6 sm:p-space-8 overflow-hidden select-none">
      {/* Top Banner & TV Header */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-space-4">
        <div className="flex items-center gap-space-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-headline-sm">
            <span className="material-symbols-outlined text-[36px]">local_hospital</span>
          </div>
          <div>
            <h1 className="text-[32px] font-extrabold text-teal-400 tracking-tight leading-tight">
              Going Merry Hospital
            </h1>
            <span className="text-slate-400 font-semibold uppercase tracking-widest text-sm">
              Live Outpatient Queue Board (QUE-03)
            </span>
          </div>
        </div>

        {/* Live Clock & Navigation */}
        <div className="flex items-center gap-space-6">
          <div className="text-right">
            <div className="text-[36px] font-mono font-extrabold text-white tracking-widest leading-none">
              {currentTime || "10:45:00 AM"}
            </div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center justify-end gap-1 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live WebSocket Sync Active
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={triggerDemoCall}
              className="bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 gap-1 text-xs"
            >
              <span className="material-symbols-outlined text-[16px]">volume_up</span>
              Test Chime
            </Button>
            <Link href="/queue">
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 text-xs"
              >
                Exit Fullscreen
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Grid: Left = Now Serving; Right = Next in Queue */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-space-6 py-space-6">
        {/* Left 2 Cols: NOW SERVING */}
        <div className="lg:col-span-2 space-y-space-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-400">campaign</span>
              Now Serving / Proceed to Room
            </h2>
            <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-xs font-mono">
              ACTIVE CALLS
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-space-4">
            {activeCalls.length === 0 ? (
              <div className="p-12 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 text-center py-16">
                <span className="material-symbols-outlined text-[48px] text-slate-600 mb-2">hourglass_empty</span>
                <h3 className="text-lg font-bold text-slate-300">Consultation Rooms Preparing</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Please remain seated in the waiting lounge. Tokens will appear here as doctors call patients.
                </p>
              </div>
            ) : (
              activeCalls.map((call, idx) => (
              <div
                key={idx}
                className={`p-space-6 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-center justify-between gap-space-6 ${
                  idx === 0
                    ? "bg-slate-900/90 border-teal-400 shadow-[0_0_30px_rgba(20,184,166,0.25)] animate-pulse"
                    : "bg-slate-900/50 border-slate-800"
                }`}
              >
                <div className="flex items-center gap-space-6">
                  <div className="text-center sm:text-left">
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                      Token
                    </span>
                    <div className="text-[64px] font-black font-mono tracking-tight text-teal-300 leading-none">
                      {call.tokenNumber}
                    </div>
                  </div>
                  <div className="h-16 w-px bg-slate-800 hidden sm:block" />
                  <div>
                    <span className="text-xs uppercase font-semibold text-slate-400 block">
                      {call.department}
                    </span>
                    <div className="text-2xl font-bold text-white">{call.doctorName}</div>
                    <span className="text-sm text-slate-400 font-mono">
                      Called at {call.calledAt}
                    </span>
                  </div>
                </div>

                <div className="text-center sm:text-right">
                  <span className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
                    Proceed To
                  </span>
                  <div className="text-[36px] font-black text-amber-400 font-mono leading-tight">
                    {call.roomNumber}
                  </div>
                  {call.priorityTier === "EMERGENCY" && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-xs mt-1">
                      EMERGENCY TRIAGE
                    </Badge>
                  )}
                </div>
              </div>
            )))}
          </div>
        </div>

        {/* Right 1 Col: NEXT IN QUEUE */}
        <div className="space-y-space-4 bg-slate-900/40 border border-slate-800 rounded-2xl p-space-6 flex flex-col justify-between">
          <div className="space-y-space-4">
            <h3 className="text-lg font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400">timelapse</span>
              Next in Line / Preparing
            </h3>

            <div className="space-y-space-3">
              {waitingList.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 text-center text-slate-500">
                  <span className="material-symbols-outlined text-3xl text-slate-600 mb-1">done_all</span>
                  <p className="text-xs font-semibold text-slate-400">Queue is Clear</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">No patients currently waiting in line</p>
                </div>
              ) : (
                waitingList.map((token, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-space-3 bg-slate-900/80 rounded-xl border border-slate-800 font-mono"
                >
                  <div className="flex items-center gap-space-3">
                    <span className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                      #{token.position}
                    </span>
                    <span className="text-xl font-black text-slate-100">{token.tokenNumber}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-400">{token.roomNumber}</span>
                </div>
              )))}
            </div>
          </div>

          <div className="p-space-4 bg-slate-900/80 rounded-xl border border-slate-800 text-center space-y-1">
            <span className="text-xs uppercase font-bold text-teal-400 tracking-wider block">
              Patient Instruction
            </span>
            <p className="text-xs text-slate-300">
              When your token appears on screen, please proceed to your designated room promptly.
            </p>
          </div>
        </div>
      </main>

      {/* Bottom Broadcast Ticker */}
      <footer className="border-t border-slate-800 pt-space-4 flex items-center gap-space-4 text-sm text-slate-400">
        <Badge className="bg-teal-500/20 text-teal-300 border-transparent text-xs font-bold uppercase shrink-0">
          ANNOUNCEMENTS
        </Badge>
        <div className="overflow-hidden whitespace-nowrap w-full">
          <p className="inline-block animate-marquee text-slate-300">
            Pharmacy dispensary counter #3 is now open • Diagnostic Laboratory reports are available
            online via Patient Portal • Mask wearing is mandatory in clinical waiting rooms •
            Emergency Department operates 24/7.
          </p>
        </div>
      </footer>
    </div>
  );
}
