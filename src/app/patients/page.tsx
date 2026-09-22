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
import { UserPlus, FolderGit2 } from "lucide-react";

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

export default function PatientsDirectoryPage() {
  const [genderFilter, setGenderFilter] = useState("ALL");

  // TanStack React Query with Axios
  const { data: patients = [], isLoading } = useQuery<PatientRecord[]>({
    queryKey: ["patients-directory"],
    queryFn: async () => {
      try {
        const res = await api.get("/patients");
        if (res.data?.data && Array.isArray(res.data.data)) {
          return res.data.data;
        }
      } catch (err) {
        console.error("Failed to fetch patients", err);
      }
      return [];
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
        cell: ({ getValue, row }) => (
          <Link
            href={`/patients/${row.original.id}`}
            className="whitespace-nowrap font-mono font-semibold text-xs text-teal-700 hover:underline inline-block"
          >
            {getValue() as string}
          </Link>
        ),
      },
      {
        accessorKey: "name",
        header: "Patient Name",
        cell: ({ row }) => (
          <div className="min-w-[150px]">
            <span className="font-semibold text-slate-900 block text-xs">{row.original.name}</span>
            <span className="text-[11px] text-slate-400 block truncate">{row.original.email}</span>
          </div>
        ),
      },
      {
        header: "Demographics",
        accessorFn: (row) => `${row.age} yrs • ${row.gender}`,
        cell: ({ getValue }) => (
          <span className="text-xs text-slate-600 whitespace-nowrap">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "bloodGroup",
        header: "Blood Group",
        cell: ({ getValue }) => (
          <span className="inline-flex items-center justify-center font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60 text-slate-700 whitespace-nowrap">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        header: "Contact Phone",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-slate-600 whitespace-nowrap">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "alertsCount",
        header: "Medical Alerts",
        cell: ({ getValue }) => {
          const count = getValue() as number;
          return count > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {count} Alert{count > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="text-xs text-slate-400">None</span>
          );
        },
      },
      {
        accessorKey: "lastVisit",
        header: "Last Visit",
        cell: ({ getValue }) => (
          <span className="text-xs text-slate-500 whitespace-nowrap">{getValue() as string}</span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Link href={`/patients/${row.original.id}`}>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs gap-1.5 rounded-lg border-slate-200 hover:border-teal-600 hover:text-teal-700 hover:bg-teal-50/40 text-slate-700 transition-colors"
              >
                <FolderGit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Chart</span>
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
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Patient Master Index (MPI)
              </h1>
              <Badge variant="outline" className="text-[11px] font-semibold bg-teal-50 text-teal-700 border-teal-200/60">
                Directory
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Search by MRN, Name, Phone or National ID • Medical Alerts & Patient Profiles
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/patients/register">
              <Button className="h-9 px-3.5 text-xs font-semibold bg-teal-700 text-white hover:bg-teal-800 gap-1.5 rounded-xl shadow-2xs transition-colors">
                <UserPlus className="w-4 h-4" />
                <span>Register New Patient</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Gender Filter Segmented Control */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-500 font-medium">Filter Gender:</span>
          <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/70">
            {(["ALL", "FEMALE", "MALE"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  genderFilter === g
                    ? "bg-white text-teal-800 font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {g === "ALL" ? "All" : g === "FEMALE" ? "Female" : "Male"}
              </button>
            ))}
          </div>
        </div>

        {/* TanStack Table View */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
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
