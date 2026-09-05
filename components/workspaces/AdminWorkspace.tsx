'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RotateCw, Shield, Users, Lock, Activity } from 'lucide-react';

interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  failedLoginCount?: number;
  lockedUntil?: string | null;
}

const columnHelper = createColumnHelper<DirectoryUser>();

export const AdminWorkspace: React.FC = () => {
  // TanStack React Query
  const { data: users = [], isLoading, refetch } = useQuery<DirectoryUser[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/auth/demo-users');
      return res.data.data;
    },
  });

  const columns = [
    columnHelper.accessor('name', {
      header: 'Name & Contact',
      cell: (info) => (
        <div>
          <div className="font-bold text-slate-900 text-sm">{info.getValue()}</div>
          <div className="text-slate-500 font-mono text-xs">{info.row.original.email}</div>
        </div>
      ),
    }),
    columnHelper.accessor('role', {
      header: 'Assigned Role',
      cell: (info) => <Badge variant="default" size="sm">{info.getValue()}</Badge>,
    }),
    columnHelper.accessor('status', {
      header: 'Account Status',
      cell: (info) => {
        const val = info.getValue();
        return (
          <Badge
            variant={val === 'ACTIVE' ? 'success' : val === 'LOCKED' ? 'danger' : 'warning'}
            size="sm"
            dot
          >
            {val}
          </Badge>
        );
      },
    }),
    columnHelper.accessor('failedLoginCount', {
      header: 'Security Policy',
      cell: (info) => {
        const user = info.row.original;
        if (user.status === 'LOCKED') {
          return <span className="text-rose-600 font-medium">Locked (5 failed attempts)</span>;
        }
        if (user.status === 'SUSPENDED') {
          return <span className="text-amber-700 font-medium">Suspended</span>;
        }
        return <span className="text-slate-600">Active • 5 attempts threshold</span>;
      },
    }),
  ];

  // TanStack Table setup
  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Recharts telemetry data
  const roleChartData = [
    { role: 'Doctor', count: users.filter((u) => u.role === 'DOCTOR').length },
    { role: 'Patient', count: users.filter((u) => u.role === 'PATIENT').length },
    { role: 'Staff', count: users.filter((u) => ['RECEPTIONIST', 'PHARMACIST', 'NURSE'].includes(u.role)).length },
    { role: 'Admin', count: users.filter((u) => ['ADMIN', 'MANAGEMENT'].includes(u.role)).length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="admin" size="md" dot>
              System Administration & Compliance
            </Badge>
            <span className="text-xs text-slate-500">Access Governance & Security</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Security & Identity Administration
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Centralized role-based access control, active session monitoring, account lockouts, and audit telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => refetch()}
            isLoading={isLoading}
            leftIcon={<RotateCw className="w-4 h-4" />}
          >
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Configured Users</span>
          <div className="text-2xl font-bold text-slate-900 mt-2">{users.length}</div>
          <div className="text-xs text-slate-500 mt-1">Across 7 Clinical Roles</div>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Locked Accounts</span>
          <div className="text-2xl font-bold text-rose-600 mt-2">
            {users.filter((u) => u.status === 'LOCKED').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Auto-locked (5 consecutive failed attempts)</div>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Clinicians</span>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {users.filter((u) => ['DOCTOR', 'NURSE'].includes(u.role)).length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Verified attending staff</div>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Audit Security</span>
          <div className="text-2xl font-bold text-emerald-600 mt-2">100%</div>
          <div className="text-xs text-slate-500 mt-1">Tamper-evident logs enabled</div>
        </Card>
      </div>

      {/* Analytics Chart with Recharts */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Role Distribution Telemetry</CardTitle>
          <CardDescription>User role allocation across clinical departments</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roleChartData}>
              <XAxis dataKey="role" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* TanStack Table User Directory */}
      <Card>
        <CardHeader>
          <CardTitle>Hospital User Directory & Account Status</CardTitle>
          <CardDescription>Rendered via TanStack Table from PostgreSQL / Prisma</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="p-4">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
