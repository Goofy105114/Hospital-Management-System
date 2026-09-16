"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface DiagnosticOrder {
  id: string;
  orderNumber: string;
  patientName: string;
  mrn: string;
  testName: string;
  category: "BIOCHEMISTRY" | "CARDIOLOGY" | "RADIOLOGY" | "HEMATOLOGY";
  orderedBy: string;
  orderedAt: string;
  status: "ORDERED" | "COLLECTED" | "PROCESSING" | "COMPLETED";
  isStat: boolean;
}

const INITIAL_ORDERS: DiagnosticOrder[] = [
  {
    id: "dia-01",
    orderNumber: "DIA-2026-0042",
    patientName: "Eleanor Pena",
    mrn: "MRN-2026-001842",
    testName: "Comprehensive Metabolic Panel (CMP)",
    category: "BIOCHEMISTRY",
    orderedBy: "Dr. Marcus Vance",
    orderedAt: "Today • 10:35 AM",
    status: "PROCESSING",
    isStat: false,
  },
  {
    id: "dia-02",
    orderNumber: "DIA-2026-0043",
    patientName: "Eleanor Pena",
    mrn: "MRN-2026-001842",
    testName: "12-Lead Resting Electrocardiogram (ECG)",
    category: "CARDIOLOGY",
    orderedBy: "Dr. Marcus Vance",
    orderedAt: "Today • 10:35 AM",
    status: "COMPLETED",
    isStat: false,
  },
  {
    id: "dia-03",
    orderNumber: "DIA-2026-0044",
    patientName: "James Wilson",
    mrn: "MRN-2026-001850",
    testName: "Cardiac Troponin I (High Sensitivity)",
    category: "HEMATOLOGY",
    orderedBy: "Dr. Marcus Vance",
    orderedAt: "Today • 10:40 AM",
    status: "ORDERED",
    isStat: true,
  },
  {
    id: "dia-04",
    orderNumber: "DIA-2026-0039",
    patientName: "Arthur Pendelton",
    mrn: "MRN-2026-001789",
    testName: "Transthoracic Echocardiogram (TTE)",
    category: "CARDIOLOGY",
    orderedBy: "Dr. Marcus Vance",
    orderedAt: "Today • 09:30 AM",
    status: "COLLECTED",
    isStat: false,
  },
];

export default function DiagnosticsPage() {
  const [orders, setOrders] = useState<DiagnosticOrder[]>(INITIAL_ORDERS);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleUpdateStatus = (id: string, newStatus: DiagnosticOrder["status"]) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    setSuccessMsg(`Order updated to status: ${newStatus}. Synced to patient medical record.`);
  };

  const filteredOrders = orders.filter((o) => {
    if (activeFilter !== "ALL" && o.status !== activeFilter) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-space-6 pb-space-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <div className="flex items-center gap-space-3">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                Diagnostics & Laboratory Workstation
              </h1>
              <Badge variant="primary" className="text-xs">
                DIA-01 Diagnostic Catalog
              </Badge>
            </div>
            <p className="font-body-md text-on-surface-variant mt-1">
              Specimen Tracking • STAT Emergency Processing & Digital EHR Result Release
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-space-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-space-2">
              <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              <span className="font-body-md font-medium">{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex items-center gap-space-2 border-b border-outline-variant/20 pb-space-2">
          {["ALL", "ORDERED", "COLLECTED", "PROCESSING", "COMPLETED"].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeFilter === f
                  ? "bg-primary text-white font-bold"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {f} ({orders.filter((o) => f === "ALL" || o.status === f).length})
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container-low font-label-sm text-outline uppercase tracking-wider text-xs">
                <th className="p-space-4">Order ID</th>
                <th className="p-space-4">Patient / MRN</th>
                <th className="p-space-4">Diagnostic Procedure</th>
                <th className="p-space-4">Ordered By</th>
                <th className="p-space-4">Status</th>
                <th className="p-space-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-surface-container/40 transition-colors">
                  <td className="p-space-4 font-mono font-bold text-xs text-primary">
                    <div className="flex items-center gap-2">
                      {order.orderNumber}
                      {order.isStat && (
                        <Badge variant="error" className="text-[9px] animate-pulse">
                          STAT
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-space-4">
                    <span className="font-bold text-on-surface block">{order.patientName}</span>
                    <span className="font-mono text-xs text-outline">{order.mrn}</span>
                  </td>
                  <td className="p-space-4">
                    <span className="font-semibold text-on-surface block">{order.testName}</span>
                    <span className="text-[10px] uppercase font-mono text-outline">
                      {order.category}
                    </span>
                  </td>
                  <td className="p-space-4 text-xs text-outline">
                    <span>{order.orderedBy}</span>
                    <span className="block font-mono text-[10px]">{order.orderedAt}</span>
                  </td>
                  <td className="p-space-4">
                    <Badge
                      variant={
                        order.status === "COMPLETED"
                          ? "success"
                          : order.status === "PROCESSING"
                            ? "primary"
                            : order.status === "COLLECTED"
                              ? "secondary"
                              : "warning"
                      }
                      className="text-[10px]"
                    >
                      {order.status}
                    </Badge>
                  </td>
                  <td className="p-space-4 text-right">
                    {order.status === "ORDERED" && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(order.id, "COLLECTED")}
                        className="bg-primary text-white text-xs gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">colorize</span>
                        Collect Sample
                      </Button>
                    )}
                    {order.status === "COLLECTED" && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(order.id, "PROCESSING")}
                        className="bg-secondary text-white text-xs gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">biotech</span>
                        Run Assay
                      </Button>
                    )}
                    {order.status === "PROCESSING" && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(order.id, "COMPLETED")}
                        className="bg-emerald-600 text-white text-xs gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">publish</span>
                        Release Results
                      </Button>
                    )}
                    {order.status === "COMPLETED" && (
                      <span className="text-xs text-emerald-700 font-bold flex items-center justify-end gap-1">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        Report Signed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
