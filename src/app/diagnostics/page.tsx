"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/axios";

interface DiagnosticOrder {
  id: string;
  orderNumber: string;
  patientName: string;
  mrn: string;
  testName: string;
  category: "HEMATOLOGY" | "BIOCHEMISTRY" | "MICROBIOLOGY" | "CARDIOLOGY" | "RADIOLOGY";
  orderedBy: string;
  orderedAt: string;
  status: "ORDERED" | "COLLECTED" | "PROCESSING" | "COMPLETED" | "CANCELLED";
  isStat: boolean;
}

export default function DiagnosticsPage() {
  const [orders, setOrders] = useState<DiagnosticOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/diagnostics/orders");
      const list = res.data?.data;
      if (Array.isArray(list)) {
        const mapped: DiagnosticOrder[] = list.map((ord: any) => ({
          id: ord.id,
          orderNumber: ord.orderNumber,
          patientName: ord.patient?.user?.name || ord.patientName || "Patient",
          mrn: ord.patient?.mrn || ord.patientMrn || "MRN-000",
          testName:
            ord.tests?.[0]?.testName ||
            ord.service?.name ||
            ord.testName ||
            "Diagnostic Analysis",
          category: (ord.tests?.[0]?.category as any) || ord.category || "BIOCHEMISTRY",
          orderedBy: ord.doctor?.user?.name || ord.doctorId || "Attending Physician",
          orderedAt: ord.createdAt
            ? new Date(ord.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Today",
          status: ord.status,
          isStat: ord.priority === "STAT" || ord.priority === "EMERGENCY",
        }));
        setOrders(mapped);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Diagnostics fetch error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: DiagnosticOrder["status"]) => {
    try {
      setErrorMsg(null);
      await api.patch(`/diagnostics/orders/${id}/status`, { status: newStatus });
      await fetchOrders();
      setSuccessMsg(`Order updated to status: ${newStatus}. Synced to patient medical record.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Failed to update diagnostic order status.");
      setTimeout(() => setErrorMsg(null), 4000);
    }
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
                Diagnostics &amp; Laboratory Workstation
              </h1>
              <Badge variant="primary" className="text-xs">
                DIA-01 Diagnostic Catalog
              </Badge>
            </div>
            <p className="font-body-md text-on-surface-variant mt-1">
              Specimen accessioning, automated critical threshold flags, and electronic lab reports.
            </p>
          </div>

          <div className="flex items-center gap-space-3">
            <Link href="/diagnostics/catalog">
              <Button variant="outline" size="sm" className="gap-1 border-outline-variant/40">
                <span className="material-symbols-outlined text-base">list_alt</span>
                Test Catalog (DIA-01)
              </Button>
            </Link>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-space-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-space-2">
              <span className="material-symbols-outlined text-emerald-600">verified</span>
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

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-space-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-space-2">
              <span className="material-symbols-outlined text-red-600">error</span>
              <span className="font-body-md font-medium">{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-red-700 hover:text-red-900"
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
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-outline">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-body-sm font-medium">Loading diagnostic orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-outline p-8">
              <span className="material-symbols-outlined text-[48px] text-outline/50 mb-2">science</span>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">No Diagnostic Orders Found</h3>
              <p className="text-body-sm text-outline mt-1 max-w-sm mx-auto">
                Orders placed during clinical consultations will appear here for specimen collection and testing.
              </p>
            </div>
          ) : (
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
                        <Link href={`/diagnostics/orders/${order.id}`}>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1">
                            <span className="material-symbols-outlined text-sm">assignment_add</span>
                            Enter Results
                          </Button>
                        </Link>
                      )}
                      {order.status === "COMPLETED" && (
                        <Link href={`/diagnostics/orders/${order.id}`}>
                          <Button variant="outline" size="sm" className="text-xs gap-1">
                            <span className="material-symbols-outlined text-sm">description</span>
                            View Report
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
