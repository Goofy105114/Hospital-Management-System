"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  headOfDepartment: string;
  roomCount: number;
  activeStaffCount: number;
  description: string;
  isActive: boolean;
}

const INITIAL_DEPARTMENTS: DepartmentItem[] = [
  {
    id: "dept-01",
    name: "Cardiovascular Medicine",
    code: "CARD",
    headOfDepartment: "Dr. Marcus Vance, MD",
    roomCount: 4,
    activeStaffCount: 8,
    description:
      "Invasive & non-invasive adult cardiology, echocardiography, and hypertension clinic.",
    isActive: true,
  },
  {
    id: "dept-02",
    name: "Pediatrics & Neonatology",
    code: "PED",
    headOfDepartment: "Dr. Sarah Jenkins, MD",
    roomCount: 3,
    activeStaffCount: 6,
    description:
      "General pediatric care, immunization, developmental assessments, and child wellness.",
    isActive: true,
  },
  {
    id: "dept-03",
    name: "Neurology & Stroke Clinic",
    code: "NEUR",
    headOfDepartment: "Dr. Emily Chen, MD",
    roomCount: 2,
    activeStaffCount: 4,
    description: "Electroencephalography, neurocognitive assessment, and chronic migraine care.",
    isActive: true,
  },
  {
    id: "dept-04",
    name: "Central Clinical Pathology & Labs",
    code: "PATH",
    headOfDepartment: "Dr. Robert Langley, PhD",
    roomCount: 5,
    activeStaffCount: 12,
    description: "Automated clinical biochemistry, hematology, microbiology, and blood banking.",
    isActive: true,
  },
  {
    id: "dept-05",
    name: "Hospital Pharmacy Services",
    code: "PHARM",
    headOfDepartment: "Elena Rostova, PharmD",
    roomCount: 2,
    activeStaffCount: 9,
    description: "Outpatient dispensary, inpatient unit-dose dispensing, and drug safety auditing.",
    isActive: true,
  },
  {
    id: "dept-06",
    name: "Emergency & Trauma Resuscitation",
    code: "ER",
    headOfDepartment: "Dr. David Ross, MD",
    roomCount: 6,
    activeStaffCount: 18,
    description: "24/7 emergency medicine, acute triage, and rapid stabilization trauma bays.",
    isActive: true,
  },
];

export default function DepartmentsConfigPage() {
  const [departments, setDepartments] = useState<DepartmentItem[]>(INITIAL_DEPARTMENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Department Form State
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newHod, setNewHod] = useState("");
  const [newRooms, setNewRooms] = useState(2);
  const [newDesc, setNewDesc] = useState("");

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    const newDept: DepartmentItem = {
      id: `dept-${Date.now()}`,
      name: newName,
      code: newCode.toUpperCase(),
      headOfDepartment: newHod || "To Be Assigned",
      roomCount: Number(newRooms),
      activeStaffCount: 0,
      description: newDesc,
      isActive: true,
    };
    setDepartments([...departments, newDept]);
    setShowAddModal(false);
    setNewName("");
    setNewCode("");
  };

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.headOfDepartment.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-space-6 max-w-7xl mx-auto pb-space-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-space-2 text-label-md text-outline">
          <Link href="/admin" className="hover:text-primary transition-colors">
            Administration & Policies
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface font-semibold">Hospital Departments (ADM-01)</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              Hospital Departments & Facilities Configuration (ADM-01)
            </h1>
            <p className="font-body-md text-body-md text-outline mt-space-1">
              Master clinic registry, consultation examination suites, and departmental service
              scoping.
            </p>
          </div>

          <div className="flex items-center gap-space-2">
            <Link href="/admin/users">
              <Button variant="outline" className="gap-space-1">
                <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                Staff Users (ADM-02)
              </Button>
            </Link>
            <Button variant="primary" onClick={() => setShowAddModal(true)} className="gap-space-2">
              <span className="material-symbols-outlined text-[18px]">add_business</span>
              Create Department
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between">
          <div className="relative w-full sm:w-96">
            <span className="material-symbols-outlined absolute left-space-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search department by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-space-10 pr-space-4 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
            />
          </div>
          <Badge variant="outline" className="font-mono text-label-xs">
            {filtered.length} DEPARTMENTS ACTIVE
          </Badge>
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-6">
          {filtered.map((dept) => (
            <Card key={dept.id} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="secondary" className="font-mono text-label-xs mb-space-1">
                      {dept.code}
                    </Badge>
                    <CardTitle className="text-title-lg">{dept.name}</CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      dept.isActive
                        ? "bg-success/15 text-success border-success/30 font-semibold"
                        : "bg-error/15 text-error border-error/30 font-semibold"
                    }
                  >
                    {dept.isActive ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </div>
                <CardDescription className="text-body-sm text-outline mt-space-1">
                  Head: <strong className="text-on-surface">{dept.headOfDepartment}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-space-4">
                <p className="text-body-sm text-on-surface-variant line-clamp-2">
                  {dept.description}
                </p>

                <div className="pt-space-2 border-t border-outline-variant/20 grid grid-cols-2 gap-space-2 text-label-sm text-outline">
                  <div>
                    <span>Suites: </span>
                    <strong className="text-on-surface">{dept.roomCount} Rooms</strong>
                  </div>
                  <div className="text-right">
                    <span>Staff: </span>
                    <strong className="text-on-surface">{dept.activeStaffCount} Clinicians</strong>
                  </div>
                </div>

                <div className="pt-space-2 flex items-center justify-end gap-space-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDepartments(
                        departments.map((d) =>
                          d.id === dept.id ? { ...d, isActive: !d.isActive } : d
                        )
                      )
                    }
                  >
                    {dept.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal: Create Department (ADM-01) */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-4">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-space-6 max-w-lg w-full shadow-2xl space-y-space-4">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Create Hospital Department (ADM-01)
              </h3>
              <form onSubmit={handleAddDept} className="space-y-space-4">
                <div className="grid grid-cols-2 gap-space-4">
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Department Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dermatology Clinic"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Department Code (Unique)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DERM"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md font-mono uppercase focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-space-4">
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Head of Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Arthur Miller, MD"
                      value={newHod}
                      onChange={(e) => setNewHod(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Consultation Rooms
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={newRooms}
                      onChange={(e) => setNewRooms(Number(e.target.value))}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Clinical Description & Scope
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe clinical services, specializations, and patient admission criteria..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-space-2 pt-space-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Create Department
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
