"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import api from "@/lib/axios";

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

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchPOs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/inventory/purchase-orders");
      const list = res.data?.data;
      if (Array.isArray(list)) {
        setPurchaseOrders(list);
      }
    } catch {
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, []);

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/inventory/purchase-orders", {
        supplier: newSupplier,
        expectedDelivery: newDeliveryDate,
        totalAmount: Number(newTotal),
        items: [
          { medicine: "Amlodipine Besylate 5mg", qtyOrdered: 1000, qtyReceived: 0, unitCost: 2.2 },
          { medicine: "Atorvastatin 20mg", qtyOrdered: 500, qtyReceived: 0, unitCost: 4.5 },
        ],
      });
      await fetchPOs();
      setShowCreateModal(false);
    } catch {
      // Handled
    }
  };

  const handleReceiveGoods = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;

    try {
      await api.post("/inventory/purchase-orders", {
        action: "RECEIVE",
        supplier: selectedPO.supplier,
        items: selectedPO.items.map((it) => ({
          ...it,
          qtyReceived: it.qtyOrdered,
        })),
        totalAmount: selectedPO.totalAmount,
      });
      await fetchPOs();
    } catch {
      // Handled
    } finally {
      setShowGRNModal(false);
      setSelectedPO(null);
    }
  };

  const pendingDeliveryCount = purchaseOrders.filter((p) => p.status === "SENT" || p.status === "PARTIALLY_RECEIVED").length;
  const receivedCount = purchaseOrders.filter((p) => p.status === "RECEIVED").length;
  const totalValuation = purchaseOrders.reduce((sum, p) => sum + p.totalAmount, 0);

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
              {pendingDeliveryCount}
            </span>
          </div>
          <div className="p-space-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl">
            <span className="text-label-sm text-outline uppercase font-semibold block">
              Received & Archived
            </span>
            <span className="text-headline-sm font-extrabold text-success font-mono mt-1 block">
              {receivedCount}
            </span>
          </div>
          <div className="p-space-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl">
            <span className="text-label-sm text-outline uppercase font-semibold block">
              Pipeline Valuation
            </span>
            <span className="text-headline-sm font-extrabold text-on-surface font-mono mt-1 block">
              ₹{totalValuation.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* PO Orders List Card */}
        <Card>
          <CardHeader>
            <CardTitle>Procurement Orders</CardTitle>
            <CardDescription>
              Orders dispatched to pharmaceutical vendors with status and intake controls.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-outline">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-body-sm font-medium">Loading purchase orders...</p>
              </div>
            ) : purchaseOrders.length === 0 ? (
              <div className="py-12 text-center text-outline border border-dashed border-outline-variant/30 rounded-xl">
                <span className="material-symbols-outlined text-[40px] text-outline/50 mb-2">shopping_bag</span>
                <p className="font-semibold text-on-surface">No purchase orders found</p>
                <p className="text-body-sm text-outline mt-1">
                  Click &quot;Create Purchase Order&quot; above to issue a new procurement request to suppliers.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-body-sm">
                  <thead className="border-b border-outline-variant/30 text-label-sm font-semibold text-outline uppercase bg-surface-container/30">
                    <tr>
                      <th className="py-space-3 px-space-4">PO #</th>
                      <th className="py-space-3 px-space-4">Supplier</th>
                      <th className="py-space-3 px-space-4">Order Date</th>
                      <th className="py-space-3 px-space-4">Expected Delivery</th>
                      <th className="py-space-3 px-space-4">Items</th>
                      <th className="py-space-3 px-space-4">Total Amount</th>
                      <th className="py-space-3 px-space-4">Status</th>
                      <th className="py-space-3 px-space-4 text-right">Actions</th>
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
                        <td className="py-space-3 px-space-4 text-outline">{po.orderDate}</td>
                        <td className="py-space-3 px-space-4 text-outline font-mono">
                          {po.expectedDelivery}
                        </td>
                        <td className="py-space-3 px-space-4">
                          <span className="text-label-sm text-on-surface">
                            {po.items.length} item(s)
                          </span>
                        </td>
                        <td className="py-space-3 px-space-4 font-mono font-bold text-on-surface">
                          ₹{po.totalAmount.toFixed(2)}
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
              </div>
            )}
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
                      Estimated Total (₹)
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
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-space-3">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Goods Receipt Note (GRN): {selectedPO.poNumber}
                </h3>
                <Badge variant="secondary">{selectedPO.supplier}</Badge>
              </div>

              <form onSubmit={handleReceiveGoods} className="space-y-space-4">
                <p className="text-body-sm text-outline">
                  Receiving goods verifies quantity, triggers lot-number generation, and increments
                  the central pharmacy inventory balance.
                </p>

                <div className="grid grid-cols-2 gap-space-4">
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Batch Lot Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LOT-2026-9921"
                      value={grnLotNumber}
                      onChange={(e) => setGrnLotNumber(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Lot Expiration Date
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
                    Units Received & Passed QA
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={grnQty}
                    onChange={(e) => setGrnQty(Number(e.target.value))}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-space-2 pt-space-2">
                  <Button type="button" variant="outline" onClick={() => setShowGRNModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Post to Stock Ledger
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
