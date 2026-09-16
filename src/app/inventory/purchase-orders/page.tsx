"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface PurchaseOrderItem {
  medicine: string;
  qtyOrdered: number;
  qtyReceived: number;
  unitCost: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  orderDate: string;
  expectedDelivery: string;
  totalAmount: number;
  status: "DRAFT" | "SENT" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CLOSED";
  items: PurchaseOrderItem[];
}

const INITIAL_POS: PurchaseOrder[] = [
  {
    id: "po-01",
    poNumber: "PO-2026-0041",
    supplier: "Pfizer Global Health Supply",
    orderDate: "2026-10-18",
    expectedDelivery: "2026-10-28",
    totalAmount: 4850.0,
    status: "SENT",
    items: [
      { medicine: "Amlodipine Besylate 5mg", qtyOrdered: 1000, qtyReceived: 0, unitCost: 2.2 },
      { medicine: "Atorvastatin 20mg", qtyOrdered: 500, qtyReceived: 0, unitCost: 4.5 },
    ],
  },
  {
    id: "po-02",
    poNumber: "PO-2026-0038",
    supplier: "Novartis Pharmaceuticals",
    orderDate: "2026-10-10",
    expectedDelivery: "2026-10-20",
    totalAmount: 3200.0,
    status: "PARTIALLY_RECEIVED",
    items: [
      { medicine: "Metformin 500mg", qtyOrdered: 2000, qtyReceived: 1000, unitCost: 1.1 },
      { medicine: "Omeprazole 20mg", qtyOrdered: 800, qtyReceived: 800, unitCost: 1.25 },
    ],
  },
  {
    id: "po-03",
    poNumber: "PO-2026-0032",
    supplier: "Medline Medical Supplies Ltd",
    orderDate: "2026-09-28",
    expectedDelivery: "2026-10-05",
    totalAmount: 1850.0,
    status: "RECEIVED",
    items: [
      { medicine: "Sterile Normal Saline 500mL", qtyOrdered: 400, qtyReceived: 400, unitCost: 3.5 },
      { medicine: "IV Cannula 20G", qtyOrdered: 1000, qtyReceived: 1000, unitCost: 0.45 },
    ],
  },
];

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_POS);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGRNModal, setShowGRNModal] = useState(false);

  // New PO State
  const [newSupplier, setNewSupplier] = useState("Pfizer Global Health Supply");
  const [newDeliveryDate, setNewDeliveryDate] = useState("");
  const [newTotal, setNewTotal] = useState("3500.00");

  // Goods Receipt Note (GRN) State (INV-06)
  const [grnLotNumber, setGrnLotNumber] = useState("");
  const [grnExpiryDate, setGrnExpiryDate] = useState("");
  const [grnQty, setGrnQty] = useState(1000);

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const seq = Math.floor(1000 + Math.random() * 9000);
    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-${seq}`,
      supplier: newSupplier,
      orderDate: new Date().toISOString().split("T")[0],
      expectedDelivery: newDeliveryDate || "2026-11-15",
      totalAmount: Number(newTotal),
      status: "DRAFT",
      items: [
        { medicine: "Amlodipine Besylate 5mg", qtyOrdered: 1000, qtyReceived: 0, unitCost: 2.2 },
        { medicine: "Atorvastatin 20mg", qtyOrdered: 500, qtyReceived: 0, unitCost: 4.5 },
      ],
    };
    setPurchaseOrders([newPO, ...purchaseOrders]);
    setShowCreateModal(false);
  };

  const handleReceiveGoods = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;

    setPurchaseOrders(
      purchaseOrders.map((po) =>
        po.id === selectedPO.id
          ? {
              ...po,
              status: "RECEIVED",
              items: po.items.map((it) => ({ ...it, qtyReceived: it.qtyOrdered })),
            }
          : po
      )
    );
    setShowGRNModal(false);
    setSelectedPO(null);
  };

  return (
    <AppLayout>
      <div className="space-y-space-6 max-w-7xl mx-auto pb-space-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-space-2 text-label-md text-outline">
          <Link href="/inventory" className="hover:text-primary transition-colors">
            Supply Command
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface font-semibold">Purchase Orders & Goods Receipt</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              Purchase Orders & Procurement (INV-06)
            </h1>
            <p className="font-body-md text-body-md text-outline mt-space-1">
              Procurement workflows, vendor contracts, Goods Receipt Notes (GRN), and automated
              stock ledger intake.
            </p>
          </div>

          <div className="flex items-center gap-space-2">
            <Link href="/inventory/batches">
              <Button variant="outline" className="gap-space-1">
                <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                Batch Lot Tracker (INV-02)
              </Button>
            </Link>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="gap-space-2"
            >
              <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
              Create Purchase Order
            </Button>
          </div>
        </div>

        {/* PO Status Pipeline Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-4">
          <div className="p-space-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl">
            <span className="text-label-sm text-outline uppercase font-semibold block">
              Total In Pipeline
            </span>
            <span className="text-headline-sm font-extrabold text-primary font-mono mt-1 block">
              {purchaseOrders.length} POs
            </span>
          </div>
          <div className="p-space-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl">
            <span className="text-label-sm text-outline uppercase font-semibold block">
              Awaiting Delivery
            </span>
            <span className="text-headline-sm font-extrabold text-warning font-mono mt-1 block">
              {purchaseOrders.filter((p) => p.status === "SENT").length}
            </span>
          </div>
          <div className="p-space-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl">
            <span className="text-label-sm text-outline uppercase font-semibold block">
              Partial Receipts
            </span>
            <span className="text-headline-sm font-extrabold text-secondary font-mono mt-1 block">
              {purchaseOrders.filter((p) => p.status === "PARTIALLY_RECEIVED").length}
            </span>
          </div>
          <div className="p-space-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl">
            <span className="text-label-sm text-outline uppercase font-semibold block">
              Fully Received
            </span>
            <span className="text-headline-sm font-extrabold text-success font-mono mt-1 block">
              {purchaseOrders.filter((p) => p.status === "RECEIVED").length}
            </span>
          </div>
        </div>

        {/* PO Table */}
        <Card>
          <CardHeader>
            <CardTitle>Procurement Orders</CardTitle>
            <CardDescription>
              Each received PO generates traceable batch lots and writes immutable ledger rows.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-body-sm text-left border-collapse">
              <thead className="bg-surface-container text-label-sm font-semibold text-outline uppercase border-y border-outline-variant/30">
                <tr>
                  <th className="py-space-3 px-space-4">PO Number</th>
                  <th className="py-space-3 px-space-4">Supplier / Vendor</th>
                  <th className="py-space-3 px-space-4">Order Date</th>
                  <th className="py-space-3 px-space-4">Expected Delivery</th>
                  <th className="py-space-3 px-space-4">Total Amount</th>
                  <th className="py-space-3 px-space-4">Line Items</th>
                  <th className="py-space-3 px-space-4">Status</th>
                  <th className="py-space-3 px-space-4 text-right">Receipt Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-surface-container-high/40">
                    <td className="py-space-3 px-space-4 font-mono font-bold text-primary">
                      {po.poNumber}
                    </td>
                    <td className="py-space-3 px-space-4 font-semibold text-on-surface">
                      {po.supplier}
                    </td>
                    <td className="py-space-3 px-space-4 font-mono text-outline">{po.orderDate}</td>
                    <td className="py-space-3 px-space-4 font-mono font-semibold">
                      {po.expectedDelivery}
                    </td>
                    <td className="py-space-3 px-space-4 font-mono font-bold text-on-surface">
                      ${po.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-space-3 px-space-4 text-label-sm text-outline">
                      {po.items.length} items
                    </td>
                    <td className="py-space-3 px-space-4">
                      <Badge
                        variant="outline"
                        className={
                          po.status === "RECEIVED"
                            ? "bg-success/15 text-success border-success/30 font-semibold"
                            : po.status === "PARTIALLY_RECEIVED"
                              ? "bg-secondary/15 text-secondary border-secondary/30 font-semibold"
                              : "bg-warning/15 text-warning border-warning/30 font-semibold"
                        }
                      >
                        {po.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-space-3 px-space-4 text-right">
                      {po.status !== "RECEIVED" ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedPO(po);
                            setShowGRNModal(true);
                          }}
                          className="gap-space-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">input</span>
                          Receive GRN
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-success text-label-xs">
                          Ledger Posted
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Modal: Create Purchase Order (INV-06) */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-4">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-space-6 max-w-lg w-full shadow-2xl space-y-space-4">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Create Purchase Order (INV-06)
              </h3>
              <form onSubmit={handleCreatePO} className="space-y-space-4">
                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Authorized Supplier
                  </label>
                  <select
                    value={newSupplier}
                    onChange={(e) => setNewSupplier(e.target.value)}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                  >
                    <option value="Pfizer Global Health Supply">Pfizer Global Health Supply</option>
                    <option value="Novartis Pharmaceuticals">Novartis Pharmaceuticals</option>
                    <option value="Medline Medical Supplies Ltd">
                      Medline Medical Supplies Ltd
                    </option>
                    <option value="McKesson Medical Distribution">
                      McKesson Medical Distribution
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-space-4">
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Expected Delivery Date
                    </label>
                    <input
                      type="date"
                      required
                      value={newDeliveryDate}
                      onChange={(e) => setNewDeliveryDate(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Estimated Total ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newTotal}
                      onChange={(e) => setNewTotal(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="p-space-3 bg-surface-container rounded-lg border border-outline-variant/30 text-body-sm text-outline">
                  Line items: Amlodipine 5mg (1,000 units), Atorvastatin 20mg (500 units).
                </div>

                <div className="flex items-center justify-end gap-space-2 pt-space-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Issue PO
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Goods Receipt Note (GRN) (INV-06) */}
        {showGRNModal && selectedPO && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-4">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-space-6 max-w-lg w-full shadow-2xl space-y-space-4">
              <div className="flex items-center gap-space-3 text-primary">
                <span className="material-symbols-outlined text-[32px]">inventory_2</span>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Receive Goods: {selectedPO.poNumber}
                  </h3>
                  <span className="text-label-sm text-outline">
                    Supplier: {selectedPO.supplier}
                  </span>
                </div>
              </div>

              <form onSubmit={handleReceiveGoods} className="space-y-space-4">
                <div className="grid grid-cols-2 gap-space-4">
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Manufacturer Lot / Batch #
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LOT-2026-X14"
                      value={grnLotNumber}
                      onChange={(e) => setGrnLotNumber(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Batch Expiry Date
                    </label>
                    <input
                      type="date"
                      required
                      value={grnExpiryDate}
                      onChange={(e) => setGrnExpiryDate(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Physical Quantity Received
                  </label>
                  <input
                    type="number"
                    required
                    value={grnQty}
                    onChange={(e) => setGrnQty(Number(e.target.value))}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="p-space-3 bg-success/10 rounded-lg border border-success/30 text-label-sm text-success">
                  Confirming GRN will automatically allocate batch lots into Main Pharmacy Store and
                  post positive entries into the Stock Ledger (INV-03).
                </div>

                <div className="flex items-center justify-end gap-space-2 pt-space-2">
                  <Button type="button" variant="outline" onClick={() => setShowGRNModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Sign & Commit GRN
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
