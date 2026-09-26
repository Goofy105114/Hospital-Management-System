"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/axios";

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  patientName: string;
  mrn: string;
  date: string;
  totalAmount: number;
  insuranceCovered: number;
  patientOwing: number;
  status: "PAID" | "PENDING" | "OVERDUE" | "ISSUED" | "VOID";
  items: Array<{ description: string; department: string; amount: number }>;
}

export default function BillingPage() {
  const { activeRole, user } = useAuthStore();
  const isPatient = activeRole === "PATIENT";
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("CARD");

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/billing/invoices");
      const data = res.data?.data;
      if (Array.isArray(data)) {
        const mapped: InvoiceItem[] = data.map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          patientName: inv.patientName || (inv.patient?.user?.name) || "Patient",
          mrn: inv.patientMrn || (inv.patient?.mrn) || "MRN-000",
          date: inv.createdAt
            ? new Date(inv.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Today",
          totalAmount: Number(inv.totalAmount) || 0,
          insuranceCovered: Number(inv.discountAmount) || 0,
          patientOwing: inv.balanceAmount != null ? Number(inv.balanceAmount) : (Number(inv.totalAmount) - (Number(inv.discountAmount) || 0)),
          status: inv.status,
          items:
            inv.items && inv.items.length > 0
              ? inv.items.map((i: any) => ({
                  description: i.description,
                  department: "Hospital OPD",
                  amount: Number(i.totalPrice || i.unitPrice || 0),
                }))
              : [
                  {
                    description: "Clinical Consultation & Diagnostics",
                    department: "Outpatient Clinic",
                    amount: Number(inv.totalAmount) || 0,
                  },
                ],
        }));
        setInvoices(mapped);
        setSelectedInvoice((prev) => {
          if (prev) {
            const found = mapped.find((m) => m.id === prev.id);
            if (found) return found;
          }
          return mapped.length > 0 ? mapped[0] : null;
        });
      }
    } catch (err) {
      console.error("Billing fetch error:", err);
      setInvoices([]);
      setSelectedInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setPaymentError(null);

    try {
      await api.post(`/billing/invoices/${selectedInvoice.id}/payments`, {
        paymentMethod,
        amount: selectedInvoice.patientOwing,
      });
      await fetchInvoices();
      setPaymentSuccess(
        `Payment of ${formatCurrency(selectedInvoice.patientOwing)} settled successfully.`
      );
      setPayModalOpen(false);
    } catch (err: any) {
      setPaymentError(
        err?.response?.data?.message || err?.message || "Failed to process invoice payment."
      );
    }
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
                ? `${user?.name || "Patient"} • Real-Time Patient Financial Records`
                : "Automated Fee Aggregation • Insurance Co-Pay Settlement & Receipts"}
            </p>
          </div>

          <div className="flex items-center gap-space-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1 border-outline-variant/40 w-full sm:w-auto justify-center"
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

        {paymentError && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-space-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-space-2">
              <span className="material-symbols-outlined text-red-600">error</span>
              <span className="font-body-md font-medium">{paymentError}</span>
            </div>
            <button
              onClick={() => setPaymentError(null)}
              className="text-red-700 hover:text-red-900"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-outline">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-body-sm font-medium">Loading financial records...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-outline border border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-lowest">
            <span className="material-symbols-outlined text-[48px] text-outline/50 mb-3">receipt_long</span>
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">No Invoices Found</h3>
            <p className="text-body-md text-outline mt-1 max-w-md mx-auto">
              There are currently no billing statements or pending invoices registered for this account.
            </p>
          </div>
        ) : (
          /* 2-Column Layout */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-6">
            {/* Invoices List */}
            <div className="space-y-space-3">
              <h3 className="font-title-sm font-bold text-outline uppercase tracking-wider text-xs">
                {isPatient ? "My Active Statements" : "Recent Statements"} ({invoices.length})
              </h3>

              {invoices.map((inv) => {
                const isSelected = selectedInvoice?.id === inv.id;
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
                            : inv.status === "PENDING" || inv.status === "ISSUED"
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
            {selectedInvoice && (
              <div className="lg:col-span-2 space-y-space-6">
                <Card className="border border-outline-variant/30 shadow-xs">
                  <CardHeader className="pb-space-3 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

                    <div className="text-left sm:text-right">
                      <span className="font-bold text-sm text-on-surface block">
                        {selectedInvoice.patientName}
                      </span>
                      <span className="font-mono text-xs text-outline">{selectedInvoice.mrn}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-space-4 space-y-space-6">
                    {/* Itemized Line Items */}
                    <div className="overflow-x-auto -mx-3 sm:mx-0">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[340px]">
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
                    <div className="p-space-4 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-space-2 w-full sm:max-w-sm sm:ml-auto text-sm">
                      <div className="flex justify-between text-outline">
                        <span>Gross Hospital Charges:</span>
                        <span className="font-mono font-semibold text-on-surface">
                          {formatCurrency(selectedInvoice.totalAmount)}
                        </span>
                      </div>
                      {selectedInvoice.insuranceCovered > 0 && (
                        <div className="flex justify-between text-emerald-700 font-medium">
                          <span>Insurance Claim Covered:</span>
                          <span className="font-mono">
                            -{formatCurrency(selectedInvoice.insuranceCovered)}
                          </span>
                        </div>
                      )}
                      <div className="pt-space-2 border-t border-outline-variant/30 flex justify-between font-bold text-base text-on-surface">
                        <span>Patient Co-Pay Balance:</span>
                        <span className="font-mono text-primary text-lg">
                          {formatCurrency(selectedInvoice.patientOwing)}
                        </span>
                      </div>
                    </div>

                    {/* Payment Action Bar */}
                    <div className="pt-space-4 border-t border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-outline">
                        Official Tax Invoice • Electronic Cashier Stamp
                      </div>

                      {selectedInvoice.status !== "PAID" && selectedInvoice.patientOwing > 0 ? (
                        <Button
                          onClick={() => setPayModalOpen(true)}
                          className="bg-primary text-white hover:bg-primary/90 gap-1 font-bold shadow-xs w-full sm:w-auto justify-center"
                        >
                          <span className="material-symbols-outlined text-base">payments</span>
                          Settle Balance ({formatCurrency(selectedInvoice.patientOwing)})
                        </Button>
                      ) : (
                        <Badge variant="success" className="px-3 py-1.5 text-xs w-fit">
                          Fully Settled & Reconciled
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Processing Modal */}
      {payModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRecordPayment}
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
