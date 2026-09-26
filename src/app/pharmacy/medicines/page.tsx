"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import api from "@/lib/axios";

interface MedicineItem {
  id: string;
  name: string;
  genericName: string;
  form: string;
  strength: string;
  unit: string;
  category: string;
  atcCode: string;
  unitPrice: number;
  stockOnHand: number;
  isActive: boolean;
}

export default function MedicinesFormularyPage() {
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedForm, setSelectedForm] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Drug State
  const [newName, setNewName] = useState("");
  const [newGeneric, setNewGeneric] = useState("");
  const [newForm, setNewForm] = useState("TABLET");
  const [newStrength, setNewStrength] = useState("");
  const [newCategory, setNewCategory] = useState("General Medicine");
  const [newPrice, setNewPrice] = useState("15.00");
  const [newAtc, setNewAtc] = useState("A01AA01");

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const res = await api.get("/medicines");
      if (res.data?.success && Array.isArray(res.data.data)) {
        const formatted: MedicineItem[] = res.data.data.map((m: any) => ({
          id: m.id,
          name: m.name || "Unknown Medicine",
          genericName: m.genericName || "—",
          form: m.form || "TABLET",
          strength: m.strength || "Standard",
          unit: m.unit || "Tablet",
          category: m.category || m.manufacturer || "General Medicine",
          atcCode: m.atcCode || "—",
          unitPrice: Number(m.unitPrice ?? 0),
          stockOnHand: Number(m.stockOnHand ?? 250),
          isActive: m.isActive !== undefined ? Boolean(m.isActive) : true,
        }));
        setMedicines(formatted);
      }
    } catch (err) {
      console.error("Failed to load medicines", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/medicines", {
        name: newName,
        genericName: newGeneric,
        form: newForm,
        strength: newStrength || "Standard",
        unit: newForm === "INJECTION" ? "Vial" : "Tablet",
        unitPrice: Number(newPrice) || 10,
      });
      await loadMedicines();
    } catch (err) {
      console.error("Failed to add medicine", err);
    }
    setShowAddModal(false);
    setNewName("");
    setNewGeneric("");
  };

  const filteredMedicines = medicines.filter((med) => {
    const q = (searchQuery || "").toLowerCase();
    const matchesSearch =
      (med.name || "").toLowerCase().includes(q) ||
      (med.genericName || "").toLowerCase().includes(q) ||
      (med.category || "").toLowerCase().includes(q) ||
      (med.atcCode || "").toLowerCase().includes(q);
    const matchesForm = selectedForm === "ALL" || med.form === selectedForm;
    return matchesSearch && matchesForm;
  });

  return (
    <AppLayout>
      <div className="space-y-space-6 max-w-7xl mx-auto pb-space-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-space-2 text-label-md text-outline">
          <Link href="/pharmacy" className="hover:text-primary transition-colors">
            Dispensary Console
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface font-semibold">Drug Catalog & Formulary</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              Hospital Drug Formulary (PHA-02, INV-01)
            </h1>
            <p className="font-body-md text-body-md text-outline mt-space-1">
              Master pharmaceutical registry, ATC classification codes, generic equivalents, and
              standard unit pricing.
            </p>
          </div>

          <div className="flex items-center gap-space-2">
            <Link href="/pharmacy">
              <Button variant="outline" className="gap-space-1">
                <span className="material-symbols-outlined text-[18px]">medication</span>
                Dispensary Queue
              </Button>
            </Link>
            <Button variant="primary" onClick={() => setShowAddModal(true)} className="gap-space-2">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Medicine
            </Button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-space-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <span className="material-symbols-outlined absolute left-space-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search generic, brand, or ATC code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-space-10 pr-space-4 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-space-2 overflow-x-auto w-full sm:w-auto">
            {["ALL", "TABLET", "CAPSULE", "INJECTION", "SYRUP"].map((form) => (
              <button
                key={form}
                onClick={() => setSelectedForm(form)}
                className={`px-space-3 py-space-1.5 rounded-lg text-label-md font-semibold transition-colors ${
                  selectedForm === form
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container text-outline hover:text-on-surface"
                }`}
              >
                {form}
              </button>
            ))}
          </div>
        </div>

        {/* Formulary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Medications ({filteredMedicines.length})</CardTitle>
            <CardDescription>
              All items are synchronised with Inventory Supply Command and Prescribing Desks.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-body-sm text-left border-collapse">
              <thead className="bg-surface-container text-label-sm font-semibold text-outline uppercase border-y border-outline-variant/30">
                <tr>
                  <th className="py-space-3 px-space-4">Medicine & Generic Name</th>
                  <th className="py-space-3 px-space-4">Dosage Form</th>
                  <th className="py-space-3 px-space-4">Therapeutic Class</th>
                  <th className="py-space-3 px-space-4">ATC Code</th>
                  <th className="py-space-3 px-space-4">Unit Price</th>
                  <th className="py-space-3 px-space-4">Stock on Hand</th>
                  <th className="py-space-3 px-space-4">Status</th>
                  <th className="py-space-3 px-space-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredMedicines.map((med) => (
                  <tr key={med.id} className="hover:bg-surface-container-high/40">
                    <td className="py-space-3 px-space-4">
                      <span className="font-bold text-on-surface block">{med.name}</span>
                      <span className="text-label-sm text-outline font-medium">
                        {med.genericName} • {med.strength}
                      </span>
                    </td>
                    <td className="py-space-3 px-space-4">
                      <Badge variant="secondary" className="font-mono text-label-xs">
                        {med.form}
                      </Badge>
                    </td>
                    <td className="py-space-3 px-space-4 text-on-surface-variant font-medium">
                      {med.category}
                    </td>
                    <td className="py-space-3 px-space-4 font-mono font-semibold text-primary">
                      {med.atcCode}
                    </td>
                    <td className="py-space-3 px-space-4 font-mono font-bold text-on-surface">
                      ₹{Number(med.unitPrice ?? 0).toFixed(2)} / {med.unit || "Unit"}
                    </td>
                    <td className="py-space-3 px-space-4 font-mono font-semibold">
                      <span className={(Number(med.stockOnHand) || 0) < 200 ? "text-warning" : "text-success"}>
                        {Number(med.stockOnHand) || 0} {med.unit || "Unit"}s
                      </span>
                    </td>
                    <td className="py-space-3 px-space-4">
                      <Badge
                        variant="outline"
                        className={
                          med.isActive
                            ? "bg-success/15 text-success border-success/30 font-semibold"
                            : "bg-error/15 text-error border-error/30 font-semibold"
                        }
                      >
                        {med.isActive ? "ACTIVE" : "DISCONTINUED"}
                      </Badge>
                    </td>
                    <td className="py-space-3 px-space-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setMedicines(
                            medicines.map((m) =>
                              m.id === med.id ? { ...m, isActive: !m.isActive } : m
                            )
                          )
                        }
                      >
                        {med.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Modal: Add New Medicine (PHA-02) */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-4">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-space-6 max-w-lg w-full shadow-2xl space-y-space-4">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Add Medicine to Formulary (PHA-02)
              </h3>
              <form onSubmit={handleAddMedicine} className="space-y-space-4">
                <div className="grid grid-cols-2 gap-space-4">
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Brand / Commercial Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lipitor"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Generic Active Ingredient
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Atorvastatin"
                      value={newGeneric}
                      onChange={(e) => setNewGeneric(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-space-4">
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Dosage Form
                    </label>
                    <select
                      value={newForm}
                      onChange={(e) => setNewForm(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    >
                      <option value="TABLET">Tablet</option>
                      <option value="CAPSULE">Capsule</option>
                      <option value="INJECTION">Injection</option>
                      <option value="SYRUP">Syrup</option>
                      <option value="CREAM">Topical Cream</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Strength / Potency
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 20 mg"
                      value={newStrength}
                      onChange={(e) => setNewStrength(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-space-4">
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      ATC Classification Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. C10AA05"
                      value={newAtc}
                      onChange={(e) => setNewAtc(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Base Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Therapeutic Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cardiovascular / Statin"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-space-2 pt-space-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Register Medicine
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
