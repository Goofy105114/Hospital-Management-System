"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function DetailedInvoicePage() {
  const params = useParams();
  const invoiceId = (params?.id as string) || "inv-01";

  const [invoice, setInvoice] = useState({
    id: invoiceId,
    invoiceNumber: "INV-2026-0042",
    date: "2026-10-24",
    dueDate: "2026-11-07",
    status: "PENDING" as "PAID" | "PENDING" | "OVERDUE",
    patientName: "Eleanor Pena",
    patientMrn: "MRN-2026-001842",
    address: "742 Evergreen Terrace, Springfield, OR 97477",
    phone: "+1 (555) 234-5678",
    insuranceProvider: "Blue Cross Blue Shield",
    policyNumber: "BCBS-8942103",
    items: [
      {
        description: "Specialist Outpatient Consultation (Dr. Marcus Vance)",
        department: "Cardiology Suite",
        quantity: 1,
        unitPrice: 180.0,
        total: 180.0,
      },
      {
        description: "12-Lead Resting Electrocardiogram (ECG)",
        department: "Diagnostics Lab",
        quantity: 1,
        unitPrice: 120.0,
        total: 120.0,
      },
      {
        description: "Comprehensive Metabolic Panel (CMP)",
        department: "Biochemistry",
        quantity: 1,
        unitPrice: 85.0,
        total: 85.0,
      },
      {
        description: "Prescription Dispensing (Amlodipine 5mg - 30 Tabs)",
        department: "Central Pharmacy",
        quantity: 1,
        unitPrice: 35.0,
        total: 35.0,
      },
    ],
    subtotal: 420.0,
    taxAmount: 21.0, // 5% GST
    insuranceCovered: 336.0,
    patientOwing: 105.0,
    payments: [
      {
        id: "pmt-01",
        date: "2026-10-24 11:30 AM",
        mode: "INSURANCE_TPA",
        ref: "BCBS-EFT-9941",
        amount: 336.0,
        status: "SETTLED",
      },
    ],
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"CASH" | "CARD" | "UPI">("CARD");
  const [paymentAmount, setPaymentAmount] = useState(invoice.patientOwing.toString());

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(paymentAmount);
    const newPayment = {
      id: `pmt-${Date.now()}`,
      date: new Date().toLocaleString(),
      mode: paymentMode,
      ref: `POS-${Math.floor(10000 + Math.random() * 90000)}`,
      amount: amt,
      status: "SETTLED",
    };

    setInvoice({
      ...invoice,
      status: "PAID",
      patientOwing: Math.max(0, invoice.patientOwing - amt),
      payments: [...invoice.payments, newPayment],
    });
    setShowPaymentModal(false);
  };

  return (
    <AppLayout>
      <div className="space-y-space-6 max-w-4xl mx-auto pb-space-12">
        {/* Breadcrumb Navigation & Action Bar */}
        <div className="flex items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div className="flex items-center gap-space-2 text-label-md text-outline">
            <Link href="/billing" className="hover:text-primary transition-colors">
              Billing & Invoices
            </Link>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-on-surface font-semibold">Tax Invoice</span>
            <span className="font-mono text-label-sm text-outline">({invoice.invoiceNumber})</span>
          </div>

          <div className="flex items-center gap-space-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-space-2"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print Invoice
            </Button>
            {invoice.status !== "PAID" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowPaymentModal(true)}
                className="gap-space-2"
              >
                <span className="material-symbols-outlined text-[18px]">payments</span>
                Collect Payment
              </Button>
            )}
          </div>
        </div>

        {/* Printable Official Invoice Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-space-8 shadow-sm space-y-space-8 font-sans">
          {/* Top Brand & Tax ID Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-4 border-b border-outline-variant/20 pb-space-6">
            <div className="flex items-center gap-space-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-headline-sm">
                <span className="material-symbols-outlined text-[32px]">local_hospital</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm font-extrabold text-primary">
                  Going Merry Hospital
                </h2>
                <span className="text-label-sm text-outline">
                  Healthcare License #HOSP-9421 • GSTIN: 27AAAAA0000A1Z5
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-label-xs uppercase font-bold text-outline tracking-wider block">
                OFFICIAL TAX INVOICE
              </span>
              <div className="font-mono font-extrabold text-headline-sm text-on-surface">
                {invoice.invoiceNumber}
              </div>
              <Badge
                variant="outline"
                className={
                  invoice.status === "PAID"
                    ? "bg-success/15 text-success border-success/30 font-bold"
                    : "bg-warning/15 text-warning border-warning/30 font-bold"
                }
              >
                {invoice.status}
              </Badge>
            </div>
          </div>

          {/* Bill-To and Meta Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-6 text-body-sm">
            <div>
              <span className="text-label-xs uppercase font-bold text-outline tracking-wider block mb-space-1">
                Billed To (Patient)
              </span>
              <span className="font-title-md font-bold text-on-surface block">
                {invoice.patientName}
              </span>
              <span className="text-label-sm font-mono text-outline block">
                MRN: {invoice.patientMrn}
              </span>
              <span className="text-outline block mt-1">{invoice.address}</span>
              <span className="text-outline block">{invoice.phone}</span>
            </div>

            <div className="sm:text-right space-y-space-1">
              <div>
                <span className="text-outline">Invoice Date: </span>
                <span className="font-semibold text-on-surface font-mono">{invoice.date}</span>
              </div>
              <div>
                <span className="text-outline">Payment Due: </span>
                <span className="font-semibold text-on-surface font-mono">{invoice.dueDate}</span>
              </div>
              <div>
                <span className="text-outline">Insurance Payer: </span>
                <span className="font-semibold text-on-surface">{invoice.insuranceProvider}</span>
              </div>
              <div>
                <span className="text-outline">Policy ID: </span>
                <span className="font-mono font-semibold text-primary">{invoice.policyNumber}</span>
              </div>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div className="border border-outline-variant/30 rounded-xl overflow-hidden">
            <table className="w-full text-body-sm text-left border-collapse">
              <thead className="bg-surface-container text-label-sm font-semibold text-outline uppercase border-b border-outline-variant/30">
                <tr>
                  <th className="py-space-3 px-space-4">Description of Service</th>
                  <th className="py-space-3 px-space-4">Department</th>
                  <th className="py-space-3 px-space-4 text-center">Qty</th>
                  <th className="py-space-3 px-space-4 text-right">Unit Rate</th>
                  <th className="py-space-3 px-space-4 text-right">Total ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-high/30">
                    <td className="py-space-3 px-space-4 font-semibold text-on-surface">
                      {item.description}
                    </td>
                    <td className="py-space-3 px-space-4 text-outline">{item.department}</td>
                    <td className="py-space-3 px-space-4 text-center font-mono">{item.quantity}</td>
                    <td className="py-space-3 px-space-4 text-right font-mono text-outline">
                      ${item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-space-3 px-space-4 text-right font-mono font-bold text-on-surface">
                      ${item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Calculation Strip */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-space-4 pt-space-2">
            <div className="text-label-sm text-outline max-w-sm">
              Thank you for trusting Going Merry Hospital. This document is a computer-generated tax
              invoice valid without physical signature under digital billing rules.
            </div>

            <div className="w-full sm:w-72 space-y-space-2 text-body-sm">
              <div className="flex justify-between text-outline">
                <span>Gross Subtotal:</span>
                <span className="font-mono font-semibold text-on-surface">
                  ${invoice.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-outline">
                <span>Applicable GST / Tax (5%):</span>
                <span className="font-mono font-semibold text-on-surface">
                  ${invoice.taxAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-success">
                <span>Insurance Adjudication (80%):</span>
                <span className="font-mono font-semibold">
                  -${invoice.insuranceCovered.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-outline-variant/30 pt-space-2 flex justify-between font-bold text-title-md">
                <span className="text-on-surface">Net Patient Payable:</span>
                <span className="font-mono text-primary">${invoice.patientOwing.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Remittance Timeline (BIL-06) */}
          <div className="border-t border-outline-variant/20 pt-space-6 space-y-space-3">
            <span className="font-title-sm font-bold text-on-surface block">
              Payment & Settlement History
            </span>
            <div className="space-y-space-2">
              {invoice.payments.map((pmt) => (
                <div
                  key={pmt.id}
                  className="flex items-center justify-between p-space-3 bg-surface-container rounded-lg border border-outline-variant/30 text-body-sm"
                >
                  <div className="flex items-center gap-space-3">
                    <span className="material-symbols-outlined text-success text-[20px]">
                      check_circle
                    </span>
                    <div>
                      <span className="font-semibold text-on-surface block">
                        {pmt.mode.replace(/_/g, " ")} Settlement
                      </span>
                      <span className="text-label-xs text-outline font-mono">
                        Ref: {pmt.ref} • {pmt.date}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-success">${pmt.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal: Collect Payment (BIL-04) */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-4">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-space-6 max-w-md w-full shadow-2xl space-y-space-4">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Collect Payment for {invoice.invoiceNumber}
              </h3>
              <form onSubmit={handleRecordPayment} className="space-y-space-4">
                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Settlement Mode
                  </label>
                  <div className="grid grid-cols-3 gap-space-2">
                    {(["CARD", "CASH", "UPI"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMode(mode)}
                        className={`py-space-2 font-bold rounded-lg border text-label-md transition-all ${
                          paymentMode === mode
                            ? "bg-primary text-on-primary border-primary"
                            : "border-outline-variant/40 text-outline hover:border-on-surface"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Amount to Collect ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md font-mono font-bold focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-space-2 pt-space-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Confirm & Settle
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
