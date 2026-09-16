"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface BatchLot {
  id: string;
  lotNumber: string;
  medicineName: string;
  location: string;
  quantity: number;
  manufacturedDate: string;
  expiryDate: string;
  isColdChain: boolean;
  status: "ACTIVE" | "QUARANTINED" | "EXPIRED";
  quarantineReason?: string;
  daysToExpiry: number;
}

const INITIAL_BATCHES: BatchLot[] = [
  {
    id: "batch-01",
    lotNumber: "LOT-AML-2025-09",
    medicineName: "Amlodipine Besylate 5mg",
    location: "Main Pharmacy Store",
    quantity: 320,
    manufacturedDate: "2025-09-01",
    expiryDate: "2027-08-31",
    isColdChain: false,
    status: "ACTIVE",
    daysToExpiry: 687,
  },
  {
    id: "batch-02",
    lotNumber: "LOT-MET-2024-11",
    medicineName: "Metformin 500mg",
    location: "OPD Sub-Dispensary",
    quantity: 140,
    manufacturedDate: "2024-11-15",
    expiryDate: "2026-11-30",
    isColdChain: false,
    status: "ACTIVE",
    daysToExpiry: 48,
  },
  {
    id: "batch-03",
    lotNumber: "LOT-INS-2025-03",
    medicineName: "Regular Insulin 100 IU/mL",
    location: "Refrigerated Depot (2-8°C)",
    quantity: 45,
    manufacturedDate: "2025-03-10",
    expiryDate: "2026-10-31",
    isColdChain: true,
    status: "ACTIVE",
    daysToExpiry: 18,
  },
  {
    id: "batch-04",
    lotNumber: "LOT-AMO-2024-06",
    medicineName: "Amoxicillin / Clavulanate 625mg",
    location: "Main Pharmacy Store",
    quantity: 80,
    manufacturedDate: "2024-06-01",
    expiryDate: "2026-05-31",
    isColdChain: false,
    status: "QUARANTINED",
    quarantineReason: "Suspected packaging seal moisture compromise during transit",
    daysToExpiry: 0,
  },
];

export default function BatchLotTrackerPage() {
  const [batches, setBatches] = useState<BatchLot[]>(INITIAL_BATCHES);
  const [selectedBatch, setSelectedBatch] = useState<BatchLot | null>(null);
  const [showQuarantineModal, setShowQuarantineModal] = useState(false);
  const [quarantineReason, setQuarantineReason] = useState("");

  const handleQuarantine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch || !quarantineReason.trim()) return;

    setBatches(
      batches.map((b) =>
        b.id === selectedBatch.id
          ? {
              ...b,
              status: "QUARANTINED",
              quarantineReason,
            }
          : b
      )
    );
    setShowQuarantineModal(false);
    setSelectedBatch(null);
    setQuarantineReason("");
  };

  const handleRelease = (batchId: string) => {
    setBatches(
      batches.map((b) =>
        b.id === batchId
          ? {
              ...b,
              status: "ACTIVE",
              quarantineReason: undefined,
            }
          : b
      )
    );
  };

  const nearExpiryCount = batches.filter((b) => b.daysToExpiry > 0 && b.daysToExpiry <= 60).length;

  return (
    <AppLayout>
      <div className="space-y-space-6 max-w-7xl mx-auto pb-space-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-space-2 text-label-md text-outline">
          <Link href="/inventory" className="hover:text-primary transition-colors">
            Supply Command
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface font-semibold">Batch Lots & Expiry Quarantine</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              Batch Lot Expiry & Quarantine Tracker (INV-02)
            </h1>
            <p className="font-body-md text-body-md text-outline mt-space-1">
              Lot-level traceability, cold chain monitoring, near-expiry risk countdowns, and safety
              quarantine controls.
            </p>
          </div>

          <div className="flex items-center gap-space-2">
            <Link href="/inventory/purchase-orders">
              <Button variant="outline" className="gap-space-1">
                <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                Purchase Orders (INV-06)
              </Button>
            </Link>
            <Link href="/inventory">
              <Button variant="secondary" className="gap-space-1">
                <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                Stock Ledger
              </Button>
            </Link>
          </div>
        </div>

        {/* Near Expiry Alert Banner */}
        {nearExpiryCount > 0 && (
          <div className="p-space-4 bg-warning/15 border border-warning/30 rounded-xl flex items-center justify-between text-on-warning-container">
            <div className="flex items-center gap-space-3">
              <span className="material-symbols-outlined text-warning text-[28px]">
                notification_important
              </span>
              <div>
                <span className="font-title-sm font-bold text-on-surface block">
                  Near-Expiry Risk Warning: {nearExpiryCount} Batch Lots Expiring within 60 Days
                </span>
                <span className="text-body-sm text-outline">
                  First-Expiry-First-Out (FEFO) dispensing policy is actively prioritizing these
                  lots in the dispensary queue.
                </span>
              </div>
            </div>
            <Badge variant="warning" className="font-mono">
              FEFO ACTIVE
            </Badge>
          </div>
        )}

        {/* Batch Lots Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Pharmaceutical Batches ({batches.length})</CardTitle>
            <CardDescription>
              Quarantined and expired lots are strictly blocked from outpatient dispensing in
              PHA-04.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-body-sm text-left border-collapse">
              <thead className="bg-surface-container text-label-sm font-semibold text-outline uppercase border-y border-outline-variant/30">
                <tr>
                  <th className="py-space-3 px-space-4">Batch Lot Number</th>
                  <th className="py-space-3 px-space-4">Medicine Item</th>
                  <th className="py-space-3 px-space-4">Current Location</th>
                  <th className="py-space-3 px-space-4">Storage Environment</th>
                  <th className="py-space-3 px-space-4">Expiry Date</th>
                  <th className="py-space-3 px-space-4">Lot Balance</th>
                  <th className="py-space-3 px-space-4">Status</th>
                  <th className="py-space-3 px-space-4 text-right">Quarantine Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-surface-container-high/40">
                    <td className="py-space-3 px-space-4 font-mono font-bold text-primary">
                      {batch.lotNumber}
                    </td>
                    <td className="py-space-3 px-space-4 font-semibold text-on-surface">
                      {batch.medicineName}
                    </td>
                    <td className="py-space-3 px-space-4 text-outline">{batch.location}</td>
                    <td className="py-space-3 px-space-4">
                      {batch.isColdChain ? (
                        <Badge
                          variant="secondary"
                          className="text-secondary bg-secondary/10 border-secondary/30"
                        >
                          ❄️ Cold Chain (2-8°C)
                        </Badge>
                      ) : (
                        <span className="text-label-sm text-outline">Controlled Ambient</span>
                      )}
                    </td>
                    <td className="py-space-3 px-space-4 font-mono">
                      <span
                        className={
                          batch.daysToExpiry <= 30
                            ? "text-error font-bold"
                            : batch.daysToExpiry <= 60
                              ? "text-warning font-bold"
                              : "text-on-surface"
                        }
                      >
                        {batch.expiryDate} ({batch.daysToExpiry}d left)
                      </span>
                    </td>
                    <td className="py-space-3 px-space-4 font-mono font-bold">
                      {batch.quantity} units
                    </td>
                    <td className="py-space-3 px-space-4">
                      <Badge
                        variant="outline"
                        className={
                          batch.status === "ACTIVE"
                            ? "bg-success/15 text-success border-success/30 font-semibold"
                            : batch.status === "QUARANTINED"
                              ? "bg-error/15 text-error border-error/30 font-semibold"
                              : "bg-outline/15 text-outline font-semibold"
                        }
                      >
                        {batch.status}
                      </Badge>
                    </td>
                    <td className="py-space-3 px-space-4 text-right">
                      {batch.status === "ACTIVE" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-error/50 text-error hover:bg-error/10 gap-1 text-xs"
                          onClick={() => {
                            setSelectedBatch(batch);
                            setShowQuarantineModal(true);
                          }}
                        >
                          <span className="material-symbols-outlined text-[16px]">block</span>
                          Quarantine
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={() => handleRelease(batch.id)}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            check_circle
                          </span>
                          Release
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Modal: Quarantine Batch (INV-02) */}
        {showQuarantineModal && selectedBatch && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-4">
            <div className="bg-surface-container-lowest border-2 border-error rounded-2xl p-space-6 max-w-md w-full shadow-2xl space-y-space-4">
              <div className="flex items-center gap-space-3 text-error">
                <span className="material-symbols-outlined text-[32px]">warning</span>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Quarantine Lot: {selectedBatch.lotNumber}
                  </h3>
                  <span className="text-label-sm text-outline">{selectedBatch.medicineName}</span>
                </div>
              </div>

              <form onSubmit={handleQuarantine} className="space-y-space-4">
                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Clinical / QA Quarantine Reason <span className="text-error">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Manufacturer defect notice received; discoloration observed during daily visual inspection."
                    value={quarantineReason}
                    onChange={(e) => setQuarantineReason(e.target.value)}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-error"
                  />
                </div>

                <div className="p-space-3 bg-error/10 rounded-lg border border-error/20 text-body-sm text-error">
                  Quarantining removes all {selectedBatch.quantity} units from active dispensary
                  allocations instantly while preserving the ledger footprint.
                </div>

                <div className="flex items-center justify-end gap-space-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowQuarantineModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="danger">
                    Enforce Quarantine
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
