"use client";

import React from "react";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminQueueMonitorPage() {
  const departmentStats = [
    {
      dept: "Cardiology",
      leadDoctor: "Dr. Marcus Vance",
      activeQueue: 5,
      avgWaitMin: 18,
      slaStatus: "OPTIMAL",
      statusColor: "text-success",
      rooms: "Clinic 304, 305",
    },
    {
      dept: "Neurology",
      leadDoctor: "Dr. Aisha Patel",
      activeQueue: 3,
      avgWaitMin: 12,
      slaStatus: "OPTIMAL",
      statusColor: "text-success",
      rooms: "Clinic 202",
    },
    {
      dept: "Pediatrics",
      leadDoctor: "Dr. David Chen",
      activeQueue: 8,
      avgWaitMin: 28,
      slaStatus: "WARN",
      statusColor: "text-warning",
      rooms: "Clinic 104, 105",
    },
    {
      dept: "Emergency (ED)",
      leadDoctor: "Dr. Sarah Jenkins",
      activeQueue: 2,
      avgWaitMin: 4,
      slaStatus: "CRITICAL_TRIAGE",
      statusColor: "text-error",
      rooms: "Trauma Bay 1-4",
    },
    {
      dept: "Orthopedics",
      leadDoctor: "Dr. Elena Rostova",
      activeQueue: 4,
      avgWaitMin: 15,
      slaStatus: "OPTIMAL",
      statusColor: "text-success",
      rooms: "Clinic 401",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800/10 text-slate-800 border border-slate-800/20">
                Administration & Operations
              </span>
              <span className="text-xs text-outline">• Hospital-Wide SLA Monitor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight mt-1">
              OPD Queue SLA & Operations Command
            </h1>
            <p className="text-xs text-outline mt-0.5">
              Enterprise monitoring of patient wait times, station throughput, triage bottlenecks,
              and department capacity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold">
                <span className="material-symbols-outlined text-[16px]">shield_person</span>
                <span>Admin Console</span>
              </Button>
            </Link>
            <Link href="/queue/display" target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold">
                <span className="material-symbols-outlined text-[16px]">tv</span>
                <span>Waiting Room TV</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Global KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
            <span className="text-[10px] text-outline uppercase font-bold block">
              Total In Waiting Line
            </span>
            <span className="font-mono text-3xl font-black text-primary block mt-1">22</span>
            <span className="text-[11px] text-outline">Across 5 OPD departments</span>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
            <span className="text-[10px] text-outline uppercase font-bold block">
              Average Wait Time
            </span>
            <span className="font-mono text-3xl font-black text-on-surface block mt-1">15.4m</span>
            <span className="text-[11px] text-success font-semibold">Target SLA: &lt; 20m</span>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
            <span className="text-[10px] text-outline uppercase font-bold block">
              Serving Right Now
            </span>
            <span className="font-mono text-3xl font-black text-success block mt-1">8</span>
            <span className="text-[11px] text-outline">Doctors in consultation</span>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
            <span className="text-[10px] text-outline uppercase font-bold block">
              Completed Consultations
            </span>
            <span className="font-mono text-3xl font-black text-on-surface block mt-1">84</span>
            <span className="text-[11px] text-outline">Since 08:00 AM today</span>
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/40 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div>
              <h3 className="text-sm font-bold text-on-surface">
                Department Queue Lanes & Bottlenecks
              </h3>
              <p className="text-[11px] text-outline">
                Real-time throughput and SLA compliance tracking
              </p>
            </div>
            <span className="text-xs text-outline font-mono">Live Sync</span>
          </div>

          <div className="divide-y divide-outline-variant/20">
            {departmentStats.map((item) => (
              <div
                key={item.dept}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-on-surface">{item.dept}</span>
                    <span className="text-xs text-outline font-mono">({item.rooms})</span>
                    <Badge
                      variant={
                        item.slaStatus === "WARN"
                          ? "warning"
                          : item.slaStatus === "CRITICAL_TRIAGE"
                            ? "error"
                            : "success"
                      }
                    >
                      {item.slaStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-outline mt-0.5">
                    Lead: {item.leadDoctor} • Active Patients:{" "}
                    <strong className="text-on-surface">{item.activeQueue}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-outline uppercase font-bold block">
                      Avg Wait
                    </span>
                    <span className={`font-mono text-base font-black ${item.statusColor}`}>
                      ~{item.avgWaitMin} min
                    </span>
                  </div>

                  <Link href={`/queue`}>
                    <Button variant="outline" size="sm" className="text-xs font-bold">
                      Inspect Lane &rarr;
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
