"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface DiagnosticCatalogItem {
  id: string;
  name: string;
  code: string;
  category: "BIOCHEMISTRY" | "HEMATOLOGY" | "RADIOLOGY" | "CARDIOLOGY" | "MICROBIOLOGY";
  specimenType: string;
  prepInstructions: string;
  turnaroundTime: string;
  referenceRange: string;
  price: number;
  isActive: boolean;
}

import api from "@/lib/axios";

export default function DiagnosticCatalogPage() {
  const [catalog, setCatalog] = useState<DiagnosticCatalogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Test State
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newCategory, setNewCategory] = useState<any>("BIOCHEMISTRY");
  const [newSpecimen, setNewSpecimen] = useState("");
  const [newPrep, setNewPrep] = useState("");
  const [newTat, setNewTat] = useState("2 Hours");
  const [newRange, setNewRange] = useState("");
  const [newPrice, setNewPrice] = useState("50.00");

  React.useEffect(() => {
    let isMounted = true;
    api
      .get("/diagnostics/catalog")
      .then((res) => {
        if (!isMounted) return;
        const list = res.data?.data;
        if (Array.isArray(list)) {
          setCatalog(
            list.map((item: any) => ({
              id: item.id,
              name: item.name,
              code: item.code,
              category: item.category,
              specimenType: item.specimenType || "Direct Tracing / Serum",
              prepInstructions: item.prepInstructions || "Standard Preparation",
              turnaroundTime: item.turnaroundTime || "2 Hours",
              referenceRange: item.referenceRange || "Standard Reference Range",
              price: item.price || item.tariff?.amount || 50.0,
              isActive: item.isActive ?? true,
            }))
          );
        }
      })
      .catch((err) => {
        console.error("Diagnostic catalog fetch failed:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: newName,
        code: newCode || `LAB-${Math.floor(1000 + Math.random() * 9000)}`,
        category: newCategory,
        specimenType: newSpecimen || "Serum",
        prepInstructions: newPrep || "No special preparation required.",
        turnaroundTime: newTat,
        referenceRange: newRange || "Normal values specified on final report.",
        price: Number(newPrice),
      };
      const res = await api.post("/diagnostics/catalog", payload);
      const created = res.data?.data || {
        id: `cat-${Date.now()}`,
        ...payload,
        isActive: true,
      };
      setCatalog((prev) => [...prev, created]);
      setShowAddModal(false);
      setNewName("");
      setNewCode("");
      setNewPrep("");
      setNewSpecimen("");
    } catch (err) {
      console.error("Failed to add test:", err);
    }
  };

  const filtered = catalog.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <AppLayout>
      <div className="space-y-space-6 max-w-7xl mx-auto pb-space-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-space-2 text-label-md text-outline">
          <Link href="/diagnostics" className="hover:text-primary transition-colors">
            Diagnostic Center
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface font-semibold">Test & Tariff Catalog</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              Diagnostic Test & Tariff Catalog (DIA-01)
            </h1>
            <p className="font-body-md text-body-md text-outline mt-space-1">
              Standard laboratory assays, radiological imaging procedures, specimen preparation
              instructions, and billable tariff rates.
            </p>
          </div>

          <div className="flex items-center gap-space-2">
            <Link href="/diagnostics">
              <Button variant="outline" className="gap-space-1">
                <span className="material-symbols-outlined text-[18px]">science</span>
                Lab Workstation
              </Button>
            </Link>
            <Button variant="primary" onClick={() => setShowAddModal(true)} className="gap-space-2">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Diagnostic Test
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
              placeholder="Search test name or procedure code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-space-10 pr-space-4 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-space-2 overflow-x-auto w-full sm:w-auto">
            {["ALL", "BIOCHEMISTRY", "HEMATOLOGY", "CARDIOLOGY", "RADIOLOGY"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-space-3 py-space-1.5 rounded-lg text-label-md font-semibold transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container text-outline hover:text-on-surface"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Table */}
        <Card>
          <CardHeader>
            <CardTitle>Cataloged Tests ({filtered.length})</CardTitle>
            <CardDescription>
              Orders created from Clinician Desks (EMR-05) draw directly from this catalog.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-body-sm text-left border-collapse">
              <thead className="bg-surface-container text-label-sm font-semibold text-outline uppercase border-y border-outline-variant/30">
                <tr>
                  <th className="py-space-3 px-space-4">Test Name & Code</th>
                  <th className="py-space-3 px-space-4">Category</th>
                  <th className="py-space-3 px-space-4">Specimen Required</th>
                  <th className="py-space-3 px-space-4">Turnaround Time</th>
                  <th className="py-space-3 px-space-4">Standard Tariff (₹)</th>
                  <th className="py-space-3 px-space-4">Prep Instructions</th>
                  <th className="py-space-3 px-space-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-outline">
                      No diagnostic catalog tests found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-high/40">
                      <td className="py-space-3 px-space-4">
                        <span className="font-bold text-on-surface block">{item.name}</span>
                        <span className="font-mono text-label-xs text-primary font-semibold">
                          {item.code}
                        </span>
                      </td>
                      <td className="py-space-3 px-space-4">
                        <Badge variant="secondary" className="font-mono text-label-xs">
                          {item.category}
                        </Badge>
                      </td>
                      <td className="py-space-3 px-space-4 text-on-surface font-medium">
                        {item.specimenType}
                      </td>
                      <td className="py-space-3 px-space-4 font-mono font-semibold text-outline">
                        {item.turnaroundTime}
                      </td>
                      <td className="py-space-3 px-space-4 font-mono font-bold text-on-surface">
                        ₹{item.price.toFixed(2)}
                      </td>
                      <td className="py-space-3 px-space-4 text-label-sm text-outline max-w-xs truncate">
                        {item.prepInstructions}
                      </td>
                      <td className="py-space-3 px-space-4 text-right">
                        <Badge
                          variant="outline"
                          className={
                            item.isActive
                              ? "bg-success/15 text-success border-success/30 font-semibold"
                              : "bg-outline/15 text-outline"
                          }
                        >
                          {item.isActive ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Modal: Add Diagnostic Test (DIA-01) */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-4">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-space-6 max-w-lg w-full shadow-2xl space-y-space-4">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Catalog New Diagnostic Procedure (DIA-01)
              </h3>
              <form onSubmit={handleAddTest} className="space-y-space-4">
                <div className="grid grid-cols-2 gap-space-4">
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Procedure Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Serum Potassium"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Billing Tariff Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LAB-84132"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-space-4">
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Department Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    >
                      <option value="BIOCHEMISTRY">Biochemistry</option>
                      <option value="HEMATOLOGY">Hematology</option>
                      <option value="CARDIOLOGY">Cardiology Diagnostics</option>
                      <option value="RADIOLOGY">Radiology & Imaging</option>
                      <option value="MICROBIOLOGY">Microbiology</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Specimen Type
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Serum / Whole Blood"
                      value={newSpecimen}
                      onChange={(e) => setNewSpecimen(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-space-4">
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Target TAT
                    </label>
                    <input
                      type="text"
                      value={newTat}
                      onChange={(e) => setNewTat(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Standard Tariff (₹)
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
                    Pre-Test Patient Preparation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fasting 8 hours"
                    value={newPrep}
                    onChange={(e) => setNewPrep(e.target.value)}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Biological Reference Interval
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3.5 - 5.1 mmol/L"
                    value={newRange}
                    onChange={(e) => setNewRange(e.target.value)}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-space-2 pt-space-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Save to Catalog
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
