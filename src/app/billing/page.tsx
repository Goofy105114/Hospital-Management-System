"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  patientName: string;
  mrn: string;
  date: string;
  totalAmount: number;
  insuranceCovered: number;
  patientOwing: number;
  status: "PAID" | "PENDING" | "OVERDUE";
  items: Array<{ description: string; department: string; amount: number }>;
}

const INITIAL_INVOICES: InvoiceItem[] = [
  {
    id: "inv-01",
    invoiceNumber: "INV-2026-0042",
    patientName: "Eleanor Pena",
    mrn: "MRN-2026-001842",
    date: "Oct 24, 2026",
    totalAmount: 420.0,
    insuranceCovered: 336.0,
    patientOwing: 84.0,
    status: "PENDING",
    items: [
      {
        description: "Specialist Cardiology Consultation (Dr. Marcus Vance)",
        department: "Outpatient Clinic",
        amount: 180.0,
      },
      {
        description: "12-Lead Resting Electrocardiogram (ECG)",
        department: "Diagnostics Lab",
        amount: 120.0,
      },
      {
        description: "Comprehensive Metabolic Panel (CMP)",
        department: "Biochemistry",
        amount: 85.0,
      },
      {
        description: "Prescription Dispensing (Metoprolol 25mg & Lisinopril 10mg)",
        department: "Central Pharmacy",
        amount: 35.0,
      },
    ],
  },
  {
    id: "inv-02",
    invoiceNumber: "INV-2026-0038",
    patientName: "Sofia Rodriguez",
    mrn: "MRN-2026-001802",
    date: "Oct 24, 2026",
    totalAmount: 180.0,
    insuranceCovered: 144.0,
    patientOwing: 36.0,
    status: "PAID",
    items: [
      {
        description: "Cardiology Follow-Up Consultation",
        department: "Outpatient Clinic",
        amount: 150.0,
      },
      {
        description: "Amlodipine Besylate 5mg Dispensed",
        department: "Central Pharmacy",
        amount: 30.0,
      },
    ],
  },
  {
    id: "inv-03",
    invoiceNumber: "INV-2026-0029",
    patientName: "Arthur Pendelton",
    mrn: "MRN-2026-001789",
    date: "Oct 22, 2026",
    totalAmount: 650.0,
    insuranceCovered: 520.0,
    patientOwing: 130.0,
    status: "PAID",
    items: [
      {
        description: "Echocardiogram Complete Transthoracic (TTE)",
        department: "Cardiology Diagnostic",
        amount: 500.0,
      },
      {
        description: "Consultation Review & Assessment",
        department: "Outpatient Clinic",
        amount: 150.0,
      },
    ],
  },
];

export default function BillingPage() {
  const { activeRole } = useAuthStore();
  const isPatient = activeRole === "PATIENT";
  const [invoices, setInvoices] = useState<InvoiceItem[]>(INITIAL_INVOICES);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem>(INITIAL_INVOICES[0]);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("CARD");

  const displayedInvoices = isPatient
    ? invoices.filter((inv) => inv.patientName.includes("Eleanor") || inv.id === "inv-01")
    : invoices;

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === selectedInvoice.id ? { ...inv, status: "PAID", patientOwing: 0.0 } : inv
      )
    );
    setSelectedInvoice((prev) => ({ ...prev, status: "PAID", patientOwing: 0.0 }));
    setPayModalOpen(false);
    setPaymentSuccess(
      `Payment of ${formatCurrency(selectedInvoice.patientOwing)} settled successfully. Receipt #RCP-2026-9981 issued.`
    );
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-space-6 pb-space-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <div className="flex items-center gap-space-3">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                {isPatient ? "My Invoices & Co-Pay Statements" : "Hospital Billing & Cashier Desk"}
              </h1>
              <Badge variant="primary" className="text-xs">
                {isPatient ? "Patient Co-Pay BIL-04" : "Tariff Module BIL-01"}
              </Badge>
            </div>
            <p className="font-body-md text-on-surface-variant mt-1">
              {isPatient
                ? "Eleanor Vance (MRN: GM-84920) • BlueCross BlueShield PPO #BC-99201 (Covered at 80%)"
                : "Automated Fee Aggregation • Insurance Co-Pay Settlement & Receipts"}
            </p>
          </div>

          <div className="flex items-center gap-space-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1 border-outline-variant/40"
            >
              <span className="material-symbols-outlined text-base">print</span>
              Print Statement
            </Button>
          </div>
        </div>

        {paymentSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-space-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-space-2">
              <span className="material-symbols-outlined text-emerald-600">verified</span>
              <span className="font-body-md font-medium">{paymentSuccess}</span>
            </div>
            <button
              onClick={() => setPaymentSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-6">
          {/* Invoices List */}
          <div className="space-y-space-3">
            <h3 className="font-title-sm font-bold text-outline uppercase tracking-wider text-xs">
              {isPatient ? "My Active Statements" : "Recent Statements"}
            </h3>

            {displayedInvoices.map((inv) => {
              const isSelected = selectedInvoice.id === inv.id;
              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`p-space-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-primary/10 border-primary/50 shadow-xs"
                      : "bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-primary">
                      {inv.invoiceNumber}
                    </span>
                    <Badge
                      variant={
                        inv.status === "PAID"
                          ? "success"
                          : inv.status === "PENDING"
                            ? "warning"
                            : "error"
                      }
                      className="text-[10px]"
                    >
                      {inv.status}
                    </Badge>
                  </div>
                  <h4 className="font-title-sm font-bold text-on-surface mt-1">
                    {inv.patientName}
                  </h4>
                  <p className="font-mono text-xs text-outline">{inv.mrn}</p>

                  <div className="mt-3 pt-2 border-t border-outline-variant/10 flex items-center justify-between">
                    <span className="text-xs text-outline">{inv.date}</span>
                    <span className="font-mono font-bold text-sm text-on-surface">
                      Due: {formatCurrency(inv.patientOwing)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Invoice Details & Itemization */}
          <div className="lg:col-span-2 space-y-space-6">
            <Card className="border border-outline-variant/30 shadow-xs">
              <CardHeader className="pb-space-3 border-b border-outline-variant/20 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="font-title-lg text-title-lg text-on-surface">
                      Statement {selectedInvoice.invoiceNumber}
                    </CardTitle>
                    <Badge
                      variant={selectedInvoice.status === "PAID" ? "success" : "warning"}
                      className="text-xs"
                    >
                      {selectedInvoice.status}
                    </Badge>
                  </div>
                  <p className="font-body-sm text-outline mt-0.5">
                    Issued on {selectedInvoice.date} • Going Merry Medical Center
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-bold text-sm text-on-surface block">
                    {selectedInvoice.patientName}
                  </span>
                  <span className="font-mono text-xs text-outline">{selectedInvoice.mrn}</span>
                </div>
              </CardHeader>

              <CardContent className="pt-space-4 space-y-space-6">
                {/* Itemized Line Items */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-outline-variant/20 bg-surface-container-low font-label-sm text-outline uppercase tracking-wider text-xs">
                        <th className="p-3">Service / Procedure</th>
                        <th className="p-3">Department</th>
                        <th className="p-3 text-right">Fee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-surface-container/30">
                          <td className="p-3 font-medium text-on-surface">{item.description}</td>
                          <td className="p-3 text-xs text-outline">{item.department}</td>
                          <td className="p-3 text-right font-mono font-semibold">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Synthesis Summary */}
                <div className="p-space-4 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-space-2 max-w-sm ml-auto text-sm">
                  <div className="flex justify-between text-outline">
                    <span>Gross Hospital Charges:</span>
                    <span className="font-mono font-semibold text-on-surface">
                      {formatCurrency(selectedInvoice.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Insurance Claim Covered (80%):</span>
                    <span className="font-mono">
                      -{formatCurrency(selectedInvoice.insuranceCovered)}
                    </span>
                  </div>
                  <div className="pt-space-2 border-t border-outline-variant/30 flex justify-between font-bold text-base text-on-surface">
                    <span>Patient Co-Pay Balance:</span>
                    <span className="font-mono text-primary text-lg">
                      {formatCurrency(selectedInvoice.patientOwing)}
                    </span>
                  </div>
                </div>

                {/* Payment Action Bar */}
                <div className="pt-space-4 border-t border-outline-variant/30 flex items-center justify-between">
                  <div className="text-xs text-outline">
                    Insurance Provider: BlueCross BlueShield PPO • Policy #BC-992144
                  </div>

                  {selectedInvoice.status !== "PAID" ? (
                    <Button
                      onClick={() => setPayModalOpen(true)}
                      className="bg-primary text-white hover:bg-primary/90 gap-1 font-bold shadow-xs"
                    >
                      <span className="material-symbols-outlined text-base">payments</span>
                      Settle Balance ({formatCurrency(selectedInvoice.patientOwing)})
                    </Button>
                  ) : (
                    <Badge variant="success" className="px-3 py-1.5 text-xs">
                      Fully Settled & Reconciled
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Processing Modal */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleProcessPayment}
            className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-6 shadow-xl border border-outline-variant/30 space-y-space-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-space-3">
              <h3 className="font-title-lg font-bold text-on-surface">Settle Patient Co-Pay</h3>
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-space-3 text-sm">
              <div className="p-space-3 rounded-lg bg-surface-container-low border border-outline-variant/20 flex justify-between items-center">
                <span className="text-outline font-semibold">Total to Pay:</span>
                <span className="font-mono text-xl font-bold text-primary">
                  {formatCurrency(selectedInvoice.patientOwing)}
                </span>
              </div>

              <div>
                <label className="font-label-md font-semibold text-on-surface block mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["CARD", "CASH", "UPI / STRIPE"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`p-2 rounded-lg border text-xs font-semibold ${
                        paymentMethod === m
                          ? "bg-primary text-white border-primary"
                          : "bg-surface-container-lowest border-outline-variant/40"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "CARD" && (
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Card Number (•••• •••• •••• 4242)"
                    defaultValue="•••• •••• •••• 4242"
                    className="w-full p-2 rounded-lg border border-outline-variant/40 text-xs font-mono"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      defaultValue="12/28"
                      className="p-2 rounded-lg border border-outline-variant/40 text-xs font-mono"
                    />
                    <input
                      type="text"
                      required
                      placeholder="CVC"
                      defaultValue="889"
                      className="p-2 rounded-lg border border-outline-variant/40 text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-space-3 pt-space-3 border-t border-outline-variant/20">
              <Button type="button" variant="outline" onClick={() => setPayModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-white">
                Confirm & Print Receipt
              </Button>
            </div>
          </form>
        </div>
      )}
    </AppLayout>
  );
}
