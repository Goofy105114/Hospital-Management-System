"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PatientQueuePassPage() {
  const [chimePlayed, setChimePlayed] = useState(false);

  const playTurnChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Two-tone hospital chime: 523Hz (C5) -> 659Hz (E5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.4);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.25);
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.25);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.25);
      osc2.stop(ctx.currentTime + 0.7);

      setChimePlayed(true);
      setTimeout(() => setChimePlayed(false), 3000);
    } catch {
      // AudioContext unavailable
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                Patient Self-Service Queue
              </span>
              <span className="text-xs text-outline">• Eleanor Vance (MRN: GM-84920)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight mt-1">
              Live OPD Queue Pass
            </h1>
            <p className="text-xs text-outline mt-0.5">
              Keep this pass open on your mobile or desktop device to monitor your turn and audio
              chime alerts.
            </p>
          </div>

          <Link href="/">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Patient Dashboard</span>
            </Button>
          </Link>
        </div>

        {/* Live Token Hero Pass */}
        <div className="rounded-3xl bg-gradient-to-br from-primary/5 via-surface-container-lowest to-primary/10 border-2 border-primary/40 p-8 shadow-xl text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            <span>Station 4 Active • Cardiology OPD</span>
          </div>

          <p className="text-xs font-bold text-outline uppercase tracking-wider">
            Your Assigned Token Pass
          </p>
          <div className="font-mono text-6xl sm:text-7xl font-black text-primary my-2 tracking-tight">
            #A-24
          </div>
          <p className="text-sm font-semibold text-on-surface">
            Consultation with <strong className="text-primary">Dr. Marcus Vance, MD</strong>
          </p>
          <p className="text-xs text-outline mt-0.5 font-medium">Room 304, East Wing (3rd Floor)</p>

          {/* Turn Progress Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8 max-w-xl mx-auto">
            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
              <span className="text-[10px] text-outline uppercase font-bold block">
                Currently Serving
              </span>
              <span className="font-mono text-2xl font-black text-on-surface block mt-1">
                #A-21
              </span>
              <span className="text-[10px] text-primary font-semibold">In Consultation</span>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
              <span className="text-[10px] text-outline uppercase font-bold block">
                Patients Ahead
              </span>
              <span className="font-mono text-2xl font-black text-warning block mt-1">3</span>
              <span className="text-[10px] text-outline font-semibold">Tokens before you</span>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
              <span className="text-[10px] text-outline uppercase font-bold block">
                Est. Wait Time
              </span>
              <span className="font-mono text-2xl font-black text-success block mt-1">~18 min</span>
              <span className="text-[10px] text-outline font-semibold">Based on AI prediction</span>
            </div>
          </div>

          {/* Acoustic Chime Test Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={playTurnChime}
              className="gap-2 text-xs font-bold h-11 px-5 rounded-xl border-primary/40 text-primary hover:bg-primary/10"
            >
              <span className="material-symbols-outlined text-[18px]">volume_up</span>
              <span>{chimePlayed ? "Chime Played! (Ding-Dong)" : "Test Hospital Turn Chime"}</span>
            </Button>
            <Link href="/queue/display" target="_blank">
              <Button
                variant="ghost"
                className="gap-2 text-xs font-bold h-11 px-4 rounded-xl text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                <span>Open Full Waiting Room TV</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Guidance Notice */}
        <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/30 flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-[22px] shrink-0 mt-0.5">
            info
          </span>
          <div className="text-xs text-outline leading-relaxed">
            <strong className="text-on-surface block mb-0.5">Turn Calling Instructions:</strong>
            When your token <strong className="text-primary font-mono">#A-24</strong> is called, a
            two-tone chime will sound and the hallway display will illuminate with your room number.
            Please make your way directly to Room 304.
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
