"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import api from "@/lib/axios";

interface InsuranceClaim {
  id: string;
  claimNumber: string;
  patientName: string;
  mrn: string;
  payerName: string;
  policyNumber: string;
  preAuthCode: string;
  claimedAmount: number;
  approvedAmount: number;
  copayAmount: number;
  submittedDate: string;
  status: "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "SETTLED";
}

export default function InsuranceClaimsPage() {
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // New Claim Form State
  const [newPatient, setNewPatient] = useState("");
  const [newMrn, setNewMrn] = useState("");
  const [newPayer, setNewPayer] = useState("Blue Cross Blue Shield");
  const [newPolicy, setNewPolicy] = useState("");
  const [newPreAuth, setNewPreAuth] = useState("");
  const [newAmount, setNewAmount] = useState("500.00");

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await api.get("/billing/claims");
      const list = res.data?.data;
      if (Array.isArray(list)) {
        setClaims(list);
      }
    } catch {
      setClaims([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/billing/claims", {
        patientName: newPatient,
        mrn: newMrn,
        payerName: newPayer,
        policyNumber: newPolicy || "POL-894210",
        preAuthCode: newPreAuth,
        claimedAmount: Number(newAmount),
      });
      await fetchClaims();
      setShowSubmitModal(false);
      setNewPatient("");
      setNewMrn("");
      setNewPolicy("");
      setNewPreAuth("");
    } catch {
      // Handled
    }
  };

  const filtered = claims.filter((clm) => {
    const matchesSearch =
      clm.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clm.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clm.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clm.payerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || clm.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="space-y-space-6 max-w-7xl mx-auto pb-space-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-space-2 text-label-md text-outline">
          <Link href="/billing" className="hover:text-primary transition-colors">
            Cashier & Invoices
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface font-semibold">TPA & Insurance Claims</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              Third-Party Insurance & TPA Claims Tracker (BIL-04, BIL-05)
            </h1>
            <p className="font-body-md text-body-md text-outline mt-space-1">
              Adjudicate institutional insurance claims, monitor pre-authorization approvals,
              copays, and electronic remittances.
            </p>
          </div>

          <div className="flex items-center gap-space-2">
            <Link href="/billing">
              <Button variant="outline" className="gap-space-1">
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                Hospital Invoices
              </Button>
            </Link>
            <Button
              variant="primary"
              onClick={() => setShowSubmitModal(true)}
              className="gap-space-2"
            >
              <span className="material-symbols-outlined text-[18px]">post_add</span>
              Submit New Claim
            </Button>
          </div>
        </div>

        {/* Financial Adjudication Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-4">
          <div className="p-space-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl">
            <span className="text-label-sm text-outline uppercase font-semibold block">
              Active Claims
            </span>
            <span className="text-headline-sm font-extrabold text-primary font-mono mt-1 block">
              {claims.length}
            </span>
          </div>
          <div className="p-space-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl">
            <span className="text-label-sm text-outline uppercase font-semibold block">
              Total Claimed
            </span>
            <span className="text-headline-sm font-extrabold text-on-surface font-mono mt-1 block">
              ${claims.reduce((acc, c) => acc + c.claimedAmount, 0).toLocaleString()}
            </span>
          </div>
          <div className="p-space-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl">
            <span className="text-label-sm text-outline uppercase font-semibold block">
              Insurer Approved
            </span>
            <span className="text-headline-sm font-extrabold text-success font-mono mt-1 block">
              ${claims.reduce((acc, c) => acc + c.approvedAmount, 0).toLocaleString()}
            </span>
          </div>
          <div className="p-space-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl">
            <span className="text-label-sm text-outline uppercase font-semibold block">
              Patient Co-Pay
            </span>
            <span className="text-headline-sm font-extrabold text-secondary font-mono mt-1 block">
              ${claims.reduce((acc, c) => acc + c.copayAmount, 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-space-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <span className="material-symbols-outlined absolute left-space-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search claim, patient, MRN, or payer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-space-10 pr-space-4 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-space-2 overflow-x-auto w-full sm:w-auto">
            {["ALL", "SUBMITTED", "IN_REVIEW", "APPROVED", "SETTLED", "REJECTED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-space-3 py-space-1.5 rounded-lg text-label-md font-semibold transition-colors ${
                  statusFilter === st
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container text-outline hover:text-on-surface"
                }`}
              >
                {st.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Claims Table */}
        <Card>
          <CardHeader>
            <CardTitle>Insurance Claims Register ({filtered.length})</CardTitle>
            <CardDescription>
              Claims are linked directly with itemized patient invoices (BIL-02).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-outline">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-body-sm font-medium">Loading insurance claims...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-outline border-t border-outline-variant/20">
                <span className="material-symbols-outlined text-[40px] text-outline/50 mb-2">policy</span>
                <p className="font-semibold text-on-surface">No insurance claims found</p>
                <p className="text-body-sm text-outline mt-1">
                  Click &quot;Submit New Claim&quot; to register an insurance pre-authorization or claim request.
                </p>
              </div>
            ) : (
              <table className="w-full text-body-sm text-left border-collapse">
                <thead className="bg-surface-container text-label-sm font-semibold text-outline uppercase border-y border-outline-variant/30">
                  <tr>
                    <th className="py-space-3 px-space-4">Claim ID</th>
                    <th className="py-space-3 px-space-4">Patient / MRN</th>
                    <th className="py-space-3 px-space-4">Payer / Provider</th>
                    <th className="py-space-3 px-space-4">Pre-Auth Code</th>
                    <th className="py-space-3 px-space-4">Claimed</th>
                    <th className="py-space-3 px-space-4">Approved</th>
                    <th className="py-space-3 px-space-4">Patient Co-Pay</th>
                    <th className="py-space-3 px-space-4">Status</th>
                    <th className="py-space-3 px-space-4 text-right">Adjudication</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filtered.map((clm) => (
                    <tr key={clm.id} className="hover:bg-surface-container-high/40">
                      <td className="py-space-3 px-space-4 font-mono font-bold text-primary">
                        {clm.claimNumber}
                      </td>
                      <td className="py-space-3 px-space-4">
                        <span className="font-bold text-on-surface block">{clm.patientName}</span>
                        <span className="font-mono text-label-xs text-outline">{clm.mrn}</span>
                      </td>
                      <td className="py-space-3 px-space-4">
                        <span className="font-semibold text-on-surface block">{clm.payerName}</span>
                        <span className="font-mono text-label-xs text-outline">
                          {clm.policyNumber}
                        </span>
                      </td>
                      <td className="py-space-3 px-space-4 font-mono text-outline font-semibold">
                        {clm.preAuthCode}
                      </td>
                      <td className="py-space-3 px-space-4 font-mono font-bold text-on-surface">
                        ${clm.claimedAmount.toFixed(2)}
                      </td>
                      <td className="py-space-3 px-space-4 font-mono font-bold text-success">
                        ${clm.approvedAmount.toFixed(2)}
                      </td>
                      <td className="py-space-3 px-space-4 font-mono font-bold text-secondary">
                        ${clm.copayAmount.toFixed(2)}
                      </td>
                      <td className="py-space-3 px-space-4">
                        <Badge
                          variant="outline"
                          className={
                            clm.status === "APPROVED" || clm.status === "SETTLED"
                              ? "bg-success/15 text-success border-success/30 font-semibold"
                              : clm.status === "IN_REVIEW" || clm.status === "SUBMITTED"
                                ? "bg-warning/15 text-warning border-warning/30 font-semibold"
                                : "bg-error/15 text-error border-error/30 font-semibold"
                          }
                        >
                          {clm.status}
                        </Badge>
                      </td>
                      <td className="py-space-3 px-space-4 text-right">
                        <span className="text-label-xs font-mono text-outline">
                          {clm.submittedDate}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Modal: Submit New Claim (BIL-04) */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-4">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-space-6 max-w-lg w-full shadow-2xl space-y-space-4">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Submit Electronic TPA Claim (BIL-04)
              </h3>
              <form onSubmit={handleSubmitClaim} className="space-y-space-4">
                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Patient Name / MRN <span className="text-error">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Patient Full Name"
                      value={newPatient}
                      onChange={(e) => setNewPatient(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="MRN (optional)"
                      value={newMrn}
                      onChange={(e) => setNewMrn(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-space-4">
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Payer / TPA
                    </label>
                    <select
                      value={newPayer}
                      onChange={(e) => setNewPayer(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    >
                      <option value="Blue Cross Blue Shield">Blue Cross Blue Shield</option>
                      <option value="Aetna Healthcare">Aetna Healthcare</option>
                      <option value="UnitedHealthcare">UnitedHealthcare</option>
                      <option value="Cigna Health Life">Cigna Health Life</option>
                      <option value="Humana Health">Humana Health</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Policy / Card #
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BCBS-8942103"
                      value={newPolicy}
                      onChange={(e) => setNewPolicy(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-space-4">
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Pre-Auth Reference
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AUTH-98412"
                      value={newPreAuth}
                      onChange={(e) => setNewPreAuth(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Claim Total ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-space-2 pt-space-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSubmitModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Transmit Claim (EDI 837)
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
