"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface InventoryItem {
  id: string;
  itemCode: string;
  name: string;
  category: string;
  stockOnHand: number;
  reorderLevel: number;
  unitCost: number;
  location: string;
  status: "ADEQUATE" | "LOW_STOCK" | "CRITICAL";
  activeBatches: number;
}

interface StockLedgerEntry {
  id: string;
  timestamp: string;
  itemName: string;
  transactionType: "RECEIPT" | "DISPENSE" | "ADJUSTMENT" | "SCRAP";
  quantity: number;
  batchNumber: string;
  actor: string;
  notes: string;
}

const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: "item-01",
    itemCode: "MED-LIS-10",
    name: "Lisinopril 10mg Tablets",
    category: "Cardiovascular",
    stockOnHand: 185,
    reorderLevel: 100,
    unitCost: 0.18,
    location: "Shelf A-04",
    status: "ADEQUATE",
    activeBatches: 2,
  },
  {
    id: "item-02",
    itemCode: "MED-MET-25",
    name: "Metoprolol Succinate 25mg",
    category: "Cardiovascular",
    stockOnHand: 340,
    reorderLevel: 150,
    unitCost: 0.32,
    location: "Shelf A-05",
    status: "ADEQUATE",
    activeBatches: 3,
  },
  {
    id: "item-03",
    itemCode: "MED-AMX-500",
    name: "Amoxicillin 500mg Capsules",
    category: "Antibiotics",
    stockOnHand: 42,
    reorderLevel: 80,
    unitCost: 0.45,
    location: "Shelf B-02",
    status: "LOW_STOCK",
    activeBatches: 1,
  },
  {
    id: "item-04",
    itemCode: "MED-WAR-5",
    name: "Warfarin Sodium 5mg",
    category: "Anticoagulants",
    stockOnHand: 65,
    reorderLevel: 50,
    unitCost: 0.55,
    location: "Shelf A-08",
    status: "ADEQUATE",
    activeBatches: 1,
  },
  {
    id: "item-05",
    itemCode: "MED-INS-GLA",
    name: "Insulin Glargine 100u/mL Pen",
    category: "Endocrinology",
    stockOnHand: 8,
    reorderLevel: 25,
    unitCost: 32.5,
    location: "Refrigerated Unit 1",
    status: "CRITICAL",
    activeBatches: 1,
  },
  {
    id: "item-06",
    itemCode: "MED-ATV-20",
    name: "Atorvastatin Calcium 20mg",
    category: "Lipid Lowering",
    stockOnHand: 410,
    reorderLevel: 120,
    unitCost: 0.22,
    location: "Shelf A-12",
    status: "ADEQUATE",
    activeBatches: 2,
  },
];

const INITIAL_LEDGER: StockLedgerEntry[] = [
  {
    id: "led-01",
    timestamp: "Today • 10:45 AM",
    itemName: "Metoprolol Succinate 25mg",
    transactionType: "DISPENSE",
    quantity: -30,
    batchNumber: "MET-2026-B8",
    actor: "Pharmacist Sarah Lin",
    notes: "Dispensed for RX-2026-0042 (Eleanor Pena)",
  },
  {
    id: "led-02",
    timestamp: "Today • 10:45 AM",
    itemName: "Lisinopril 10mg Tablets",
    transactionType: "DISPENSE",
    quantity: -30,
    batchNumber: "LIS-2026-A4",
    actor: "Pharmacist Sarah Lin",
    notes: "Dispensed for RX-2026-0042 (Eleanor Pena)",
  },
  {
    id: "led-03",
    timestamp: "Yesterday • 04:30 PM",
    itemName: "Insulin Glargine 100u/mL Pen",
    transactionType: "RECEIPT",
    quantity: +10,
    batchNumber: "INS-2026-09",
    actor: "Logistics Clerk Mark Miller",
    notes: "Purchase Order PO-2026-088 Delivery",
  },
  {
    id: "led-04",
    timestamp: "Yesterday • 02:15 PM",
    itemName: "Amoxicillin 500mg Capsules",
    transactionType: "DISPENSE",
    quantity: -21,
    batchNumber: "AMX-2025-X1",
    actor: "Pharmacist Sarah Lin",
    notes: "Outpatient Pediatric Rx",
  },
];

export default function InventoryCommandPage() {
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_ITEMS);
  const [ledger, setLedger] = useState<StockLedgerEntry[]>(INITIAL_LEDGER);
  const [activeTab, setActiveTab] = useState<"STOCK" | "LEDGER">("STOCK");
  const [receiveModal, setReceiveModal] = useState(false);
  const [selectedItemCode, setSelectedItemCode] = useState(items[0].itemCode);
  const [receiptQty, setReceiptQty] = useState(100);
  const [receiptBatch, setReceiptBatch] = useState("NEW-2026-BAT");

  const totalInventoryValuation = items.reduce(
    (acc, curr) => acc + curr.stockOnHand * curr.unitCost,
    0
  );

  const lowStockCount = items.filter(
    (i) => i.status === "LOW_STOCK" || i.status === "CRITICAL"
  ).length;

  const handleStockReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    const item = items.find((i) => i.itemCode === selectedItemCode);
    if (!item) return;

    // Update stock on hand
    setItems((prev) =>
      prev.map((i) => {
        if (i.itemCode === selectedItemCode) {
          const newQty = i.stockOnHand + receiptQty;
          return {
            ...i,
            stockOnHand: newQty,
            status: newQty > i.reorderLevel ? "ADEQUATE" : "LOW_STOCK",
          };
        }
        return i;
      })
    );

    // Append to immutable ledger
    const newEntry: StockLedgerEntry = {
      id: `led-${Date.now()}`,
      timestamp: "Just now",
      itemName: item.name,
      transactionType: "RECEIPT",
      quantity: receiptQty,
      batchNumber: receiptBatch,
      actor: "Inventory Manager",
      notes: "Direct inventory stock receipt entry",
    };

    setLedger([newEntry, ...ledger]);
    setReceiveModal(false);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-space-6 pb-space-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <div className="flex items-center gap-space-3">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                Supply & Pharmacy Inventory Command
              </h1>
              <Badge variant="primary" className="text-xs">
                Central Depot
              </Badge>
            </div>
            <p className="font-body-md text-on-surface-variant mt-1">
              Append-Only Stock Mutation Ledger (INV-03) • Reorder Thresholds & Expiry Monitoring
            </p>
          </div>

          <div className="flex items-center gap-space-3">
            <Button
              onClick={() => setReceiveModal(true)}
              className="bg-primary text-white hover:bg-primary/90 gap-1 shadow-xs"
            >
              <span className="material-symbols-outlined text-base">add_box</span>
              Receive Stock Batch
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-4">
          <Card className="border border-outline-variant/30 shadow-xs">
            <CardContent className="p-space-4">
              <span className="font-label-sm text-outline uppercase tracking-wider block">
                Total Catalog SKUs
              </span>
              <div className="text-3xl font-bold font-mono text-on-surface mt-1">
                {items.length} SKUs
              </div>
              <span className="text-xs text-outline block mt-0.5">Active formulations</span>
            </CardContent>
          </Card>

          <Card className="border border-outline-variant/30 shadow-xs">
            <CardContent className="p-space-4">
              <span className="font-label-sm text-outline uppercase tracking-wider block">
                Total Inventory Valuation
              </span>
              <div className="text-3xl font-bold font-mono text-primary mt-1">
                {formatCurrency(totalInventoryValuation)}
              </div>
              <span className="text-xs text-emerald-600 font-semibold block mt-0.5">
                FIFO Cost Basis
              </span>
            </CardContent>
          </Card>

          <Card className="border border-outline-variant/30 shadow-xs">
            <CardContent className="p-space-4">
              <span className="font-label-sm text-outline uppercase tracking-wider block">
                Reorder Alerts
              </span>
              <div className="text-3xl font-bold font-mono text-error mt-1">
                {lowStockCount} Items
              </div>
              <span className="text-xs text-error font-medium block mt-0.5">
                Below minimum safety stock
              </span>
            </CardContent>
          </Card>

          <Card className="border border-outline-variant/30 shadow-xs">
            <CardContent className="p-space-4">
              <span className="font-label-sm text-outline uppercase tracking-wider block">
                Expiring in 90 Days
              </span>
              <div className="text-3xl font-bold font-mono text-amber-600 mt-1">1 Batch</div>
              <span className="text-xs text-outline block mt-0.5">Batch AMX-2025-X1</span>
            </CardContent>
          </Card>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-space-2 border-b border-outline-variant/20 pb-space-2">
          <button
            onClick={() => setActiveTab("STOCK")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-md transition-colors ${
              activeTab === "STOCK"
                ? "bg-primary text-white font-bold"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-base">inventory_2</span>
            Stock on Hand Table
          </button>
          <button
            onClick={() => setActiveTab("LEDGER")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-md transition-colors ${
              activeTab === "LEDGER"
                ? "bg-primary text-white font-bold"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-base">receipt_long</span>
            Audit Movement Ledger ({ledger.length})
          </button>
        </div>

        {/* TAB 1: Stock on Hand Table */}
        {activeTab === "STOCK" ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low font-label-sm text-outline uppercase tracking-wider">
                  <th className="p-space-4">Item Code</th>
                  <th className="p-space-4">Medication Name</th>
                  <th className="p-space-4">Category</th>
                  <th className="p-space-4">Stock on Hand</th>
                  <th className="p-space-4">Reorder Level</th>
                  <th className="p-space-4">Unit Cost</th>
                  <th className="p-space-4">Location</th>
                  <th className="p-space-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container/50 transition-colors">
                    <td className="p-space-4 font-mono font-bold text-xs text-primary">
                      {item.itemCode}
                    </td>
                    <td className="p-space-4 font-semibold text-on-surface">{item.name}</td>
                    <td className="p-space-4 text-xs text-outline">{item.category}</td>
                    <td className="p-space-4 font-mono font-bold text-base text-on-surface">
                      {item.stockOnHand}
                    </td>
                    <td className="p-space-4 font-mono text-outline">{item.reorderLevel}</td>
                    <td className="p-space-4 font-mono">{formatCurrency(item.unitCost)}</td>
                    <td className="p-space-4 text-xs font-mono text-outline">{item.location}</td>
                    <td className="p-space-4">
                      <Badge
                        variant={
                          item.status === "ADEQUATE"
                            ? "success"
                            : item.status === "LOW_STOCK"
                              ? "warning"
                              : "error"
                        }
                        className="text-[10px]"
                      >
                        {item.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* TAB 2: Audit Movement Ledger */
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low font-label-sm text-outline uppercase tracking-wider">
                  <th className="p-space-4">Timestamp</th>
                  <th className="p-space-4">Medication</th>
                  <th className="p-space-4">Transaction</th>
                  <th className="p-space-4">Quantity</th>
                  <th className="p-space-4">Batch No</th>
                  <th className="p-space-4">Actor</th>
                  <th className="p-space-4">Audit Memo / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {ledger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-surface-container/50 transition-colors">
                    <td className="p-space-4 font-mono text-xs text-outline">{entry.timestamp}</td>
                    <td className="p-space-4 font-semibold text-on-surface">{entry.itemName}</td>
                    <td className="p-space-4">
                      <Badge
                        variant={
                          entry.transactionType === "RECEIPT"
                            ? "success"
                            : entry.transactionType === "DISPENSE"
                              ? "primary"
                              : "warning"
                        }
                        className="text-[10px]"
                      >
                        {entry.transactionType}
                      </Badge>
                    </td>
                    <td className="p-space-4 font-mono font-bold">
                      <span className={entry.quantity > 0 ? "text-emerald-600" : "text-on-surface"}>
                        {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity}
                      </span>
                    </td>
                    <td className="p-space-4 font-mono text-xs text-outline">
                      {entry.batchNumber}
                    </td>
                    <td className="p-space-4 text-xs font-medium text-on-surface">{entry.actor}</td>
                    <td className="p-space-4 text-xs text-outline">{entry.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Receipt Modal */}
      {receiveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleStockReceipt}
            className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-6 shadow-xl border border-outline-variant/30 space-y-space-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-space-3">
              <h3 className="font-title-lg font-bold text-on-surface">Receive Stock Batch</h3>
              <button
                type="button"
                onClick={() => setReceiveModal(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-space-3">
              <div>
                <label className="font-label-md font-semibold text-on-surface block mb-1">
                  Target Inventory Item
                </label>
                <select
                  value={selectedItemCode}
                  onChange={(e) => setSelectedItemCode(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.itemCode}>
                      {i.name} ({i.itemCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-label-md font-semibold text-on-surface block mb-1">
                  Quantity Received
                </label>
                <input
                  type="number"
                  min={1}
                  value={receiptQty}
                  onChange={(e) => setReceiptQty(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm font-mono"
                />
              </div>

              <div>
                <label className="font-label-md font-semibold text-on-surface block mb-1">
                  Batch Lot Number
                </label>
                <input
                  type="text"
                  value={receiptBatch}
                  onChange={(e) => setReceiptBatch(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-space-3 pt-space-3 border-t border-outline-variant/20">
              <Button type="button" variant="outline" onClick={() => setReceiveModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-white">
                Commit Stock Receipt
              </Button>
            </div>
          </form>
        </div>
      )}
    </AppLayout>
  );
}
