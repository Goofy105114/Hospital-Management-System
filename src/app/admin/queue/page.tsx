"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/axios";

interface QueueTokenItem {
  id: string;
  tokenNumber: string;
  patientName: string;
  doctorName: string;
  departmentName: string;
  roomNumber: string;
  status: string;
  priorityTier: string;
  estimatedWaitMinutes: number;
}

export default function AdminQueueMonitorPage() {
  const [tokens, setTokens] = useState<QueueTokenItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTokens = async () => {
    try {
      const res = await api.get("/queue/tokens");
      const list = res.data?.data;
      if (Array.isArray(list)) {
        setTokens(list);
      } else {
        setTokens([]);
      }
    } catch {
      setTokens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
    const interval = setInterval(fetchTokens, 5000);
    return () => clearInterval(interval);
  }, []);

  const waitingTokens = tokens.filter((t) => t.status === "WAITING");
  const servingTokens = tokens.filter(
    (t) => t.status === "IN_CONSULTATION" || t.status === "IN_PROGRESS" || t.status === "CALLED"
  );
  const completedTokens = tokens.filter((t) => t.status === "COMPLETED");

  const avgWait =
    waitingTokens.length > 0
      ? (
          waitingTokens.reduce((acc, t) => acc + (t.estimatedWaitMinutes || 0), 0) /
          waitingTokens.length
        ).toFixed(1)
      : "0.0";

  // Group by department
  const deptGroups = tokens.reduce<
    Record<
      string,
      {
        dept: string;
        leadDoctor: string;
        activeQueue: number;
        avgWaitMin: number;
        rooms: Set<string>;
        hasEmergency: boolean;
      }
    >
  >((acc, t) => {
    const deptName = t.departmentName || "General OPD";
    if (!acc[deptName]) {
      acc[deptName] = {
        dept: deptName,
        leadDoctor: t.doctorName || "Attending Physician",
        activeQueue: 0,
        avgWaitMin: 0,
        rooms: new Set<string>(),
        hasEmergency: false,
      };
    }
    if (t.status === "WAITING" || t.status === "CALLED" || t.status === "IN_CONSULTATION") {
      acc[deptName].activeQueue += 1;
    }
    if (t.roomNumber) {
      acc[deptName].rooms.add(t.roomNumber);
    }
    if (t.priorityTier === "EMERGENCY") {
      acc[deptName].hasEmergency = true;
    }
    return acc;
  }, {});

  const departmentStats = Object.values(deptGroups);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800/10 text-slate-800 border border-slate-800/20">
                Administration &amp; Operations
              </span>
              <span className="text-xs text-outline">• Hospital-Wide SLA Monitor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight mt-1">
              OPD Queue SLA &amp; Operations Command
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
            <span className="font-mono text-3xl font-black text-primary block mt-1">
              {waitingTokens.length}
            </span>
            <span className="text-[11px] text-outline">
              Across {departmentStats.length} active departments
            </span>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
            <span className="text-[10px] text-outline uppercase font-bold block">
              Average Wait Time
            </span>
            <span className="font-mono text-3xl font-black text-on-surface block mt-1">
              {avgWait}m
            </span>
            <span className="text-[11px] text-success font-semibold">Target SLA: &lt; 20m</span>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
            <span className="text-[10px] text-outline uppercase font-bold block">
              Serving Right Now
            </span>
            <span className="font-mono text-3xl font-black text-success block mt-1">
              {servingTokens.length}
            </span>
            <span className="text-[11px] text-outline">Active consultations</span>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
            <span className="text-[10px] text-outline uppercase font-bold block">
              Completed Consultations
            </span>
            <span className="font-mono text-3xl font-black text-on-surface block mt-1">
              {completedTokens.length}
            </span>
            <span className="text-[11px] text-outline">Since 08:00 AM today</span>
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/40 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div>
              <h3 className="text-sm font-bold text-on-surface">
                Department Queue Lanes &amp; Bottlenecks
              </h3>
              <p className="text-[11px] text-outline">
                Real-time throughput and SLA compliance tracking
              </p>
            </div>
            <span className="text-xs text-outline font-mono">Live Sync</span>
          </div>

          {departmentStats.length === 0 ? (
            <div className="py-12 text-center text-outline">
              <span className="material-symbols-outlined text-[40px] text-outline/50 mb-2">groups</span>
              <p className="font-semibold text-on-surface">No Active Queue Lanes Today</p>
              <p className="text-xs text-outline mt-1">
                Patients will automatically appear in department lanes once checked in via reception or kiosk.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/20">
              {departmentStats.map((item) => {
                const slaStatus = item.hasEmergency
                  ? "CRITICAL_TRIAGE"
                  : item.activeQueue > 6
                    ? "WARN"
                    : "OPTIMAL";
                const statusColor =
                  slaStatus === "CRITICAL_TRIAGE"
                    ? "text-error"
                    : slaStatus === "WARN"
                      ? "text-warning"
                      : "text-success";
                const roomsDisplay =
                  item.rooms.size > 0 ? Array.from(item.rooms).join(", ") : "Station Assigned";

                return (
                  <div
                    key={item.dept}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-on-surface">{item.dept}</span>
                        <span className="text-xs text-outline font-mono">({roomsDisplay})</span>
                        <Badge
                          variant={
                            slaStatus === "WARN"
                              ? "warning"
                              : slaStatus === "CRITICAL_TRIAGE"
                                ? "error"
                                : "success"
                          }
                        >
                          {slaStatus}
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
                          Active Lane
                        </span>
                        <span className={`font-mono text-base font-black ${statusColor}`}>
                          {item.activeQueue} queued
                        </span>
                      </div>

                      <Link href="/queue">
                        <Button variant="outline" size="sm" className="text-xs font-bold">
                          Inspect Lane &rarr;
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
