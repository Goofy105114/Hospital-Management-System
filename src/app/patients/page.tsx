"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import api from "@/lib/axios";

export interface PatientRecord {
  id: string;
  mrn: string;
  name: string;
  dob: string;
  age: number;
  gender: string;
  bloodGroup: string;
  phone: string;
  email: string;
  alertsCount: number;
  lastVisit: string;
  status: "ACTIVE" | "INACTIVE";
}

const INITIAL_PATIENTS: PatientRecord[] = [
  {
    id: "pat-01",
    mrn: "MRN-2026-001842",
    name: "Eleanor Pena",
    dob: "1988-04-15",
    age: 38,
    gender: "Female",
    bloodGroup: "A+",
    phone: "+1 (555) 234-5678",
    email: "eleanor.pena@example.com",
    alertsCount: 2,
    lastVisit: "Today (Dr. Marcus Vance)",
    status: "ACTIVE",
  },
  {
    id: "pat-02",
    mrn: "MRN-2026-001802",
    name: "Sofia Rodriguez",
    dob: "1981-09-22",
    age: 45,
    gender: "Female",
    bloodGroup: "O+",
    phone: "+1 (555) 345-6789",
    email: "sofia.rodriguez@example.com",
    alertsCount: 1,
    lastVisit: "Today (Cardiology)",
    status: "ACTIVE",
  },
  {
    id: "pat-03",
    mrn: "MRN-2026-001789",
    name: "Arthur Pendelton",
    dob: "1964-11-05",
    age: 62,
    gender: "Male",
    bloodGroup: "B+",
    phone: "+1 (555) 456-7890",
    email: "arthur.p@example.com",
    alertsCount: 0,
    lastVisit: "Oct 22, 2026",
    status: "ACTIVE",
  },
  {
    id: "pat-04",
    mrn: "MRN-2026-001815",
    name: "David Chen",
    dob: "1974-03-12",
    age: 52,
    gender: "Male",
    bloodGroup: "AB+",
    phone: "+1 (555) 567-8901",
    email: "david.chen@example.com",
    alertsCount: 1,
    lastVisit: "Oct 20, 2026",
    status: "ACTIVE",
  },
  {
    id: "pat-05",
    mrn: "MRN-2026-001850",
    name: "James Wilson",
    dob: "1985-07-30",
    age: 41,
    gender: "Male",
    bloodGroup: "O-",
    phone: "+1 (555) 678-9012",
    email: "j.wilson@example.com",
    alertsCount: 3,
    lastVisit: "Today (Triage Emergency)",
    status: "ACTIVE",
  },
];

export default function PatientsDirectoryPage() {
  const [genderFilter, setGenderFilter] = useState("ALL");

  // TanStack React Query with Axios
  const { data: patients = INITIAL_PATIENTS, isLoading } = useQuery<PatientRecord[]>({
    queryKey: ["patients-directory"],
    queryFn: async () => {
      try {
        const res = await api.get("/patients");
        if (res.data?.data && Array.isArray(res.data.data)) {
          return res.data.data;
        }
      } catch {
        // Fallback to local deterministic records
      }
      return INITIAL_PATIENTS;
    },
    staleTime: 60 * 1000,
  });

  const filteredData = React.useMemo(() => {
    if (genderFilter === "ALL") return patients;
    return patients.filter((p) => p.gender.toUpperCase() === genderFilter.toUpperCase());
  }, [patients, genderFilter]);

  // TanStack Table Column Definitions
  const columns = React.useMemo<ColumnDef<PatientRecord>[]>(
    () => [
      {
        accessorKey: "mrn",
        header: "MRN",
        cell: ({ getValue }) => (
          <span className="font-mono font-bold text-xs text-primary">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "name",
        header: "Patient Name",
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-on-surface block">{row.original.name}</span>
            <span className="text-xs text-on-surface-variant/70">{row.original.email}</span>
          </div>
        ),
      },
      {
        header: "Demographics",
        accessorFn: (row) => `${row.age} yrs • ${row.gender}`,
        cell: ({ getValue }) => (
          <span className="text-xs text-on-surface">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "bloodGroup",
        header: "Blood Group",
        cell: ({ getValue }) => (
          <span className="font-mono font-bold text-xs bg-surface-container-high px-2 py-0.5 rounded text-on-surface">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        header: "Contact Phone",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-on-surface-variant">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "alertsCount",
        header: "Medical Alerts",
        cell: ({ getValue }) => {
          const count = getValue() as number;
          return count > 0 ? (
            <Badge variant="error" className="text-[10px]">
              {count} Alerts
            </Badge>
          ) : (
            <span className="text-xs text-outline">None</span>
          );
        },
      },
      {
        accessorKey: "lastVisit",
        header: "Last Visit",
        cell: ({ getValue }) => (
          <span className="text-xs text-outline">{getValue() as string}</span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Link href={`/patients/${row.original.id}`}>
              <Button size="sm" variant="outline" className="text-xs gap-1 py-1 h-8">
                <span className="material-symbols-outlined text-sm">folder_shared</span>
                Chart
              </Button>
            </Link>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-space-6 pb-space-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <div className="flex items-center gap-space-3">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                Patient Master Index (MPI)
              </h1>
              <Badge variant="primary" className="text-xs">
                PAT-01 TanStack Table
              </Badge>
            </div>
            <p className="font-body-md text-on-surface-variant mt-1">
              Search by MRN, Name, Phone or National ID • Medical Alerts & Patient Profiles
            </p>
          </div>

          <div className="flex items-center gap-space-3">
            <Link href="/patients/register">
              <Button className="bg-primary text-white hover:bg-primary/90 gap-1 shadow-xs font-semibold">
                <span className="material-symbols-outlined text-base">person_add</span>
                Register New Patient
              </Button>
            </Link>
          </div>
        </div>

        {/* Gender Filter Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant font-semibold">Filter Gender:</span>
          {["ALL", "FEMALE", "MALE"].map((g) => (
            <button
              key={g}
              onClick={() => setGenderFilter(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                genderFilter === g
                  ? "bg-primary text-white"
                  : "bg-surface-container-high text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* TanStack Table View */}
        <div className="bg-surface rounded-2xl border border-outline-variant/30 p-4 shadow-xs">
          <DataTable
            columns={columns}
            data={filteredData}
            isLoading={isLoading}
            searchKey="name"
            searchPlaceholder="Search patients by name, MRN, phone..."
          />
        </div>
      </div>
    </AppLayout>
  );
}
