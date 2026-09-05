'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  X,
  Stethoscope,
  UserCheck,
  Building2,
  Pill,
  Shield,
  HeartPulse,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

interface QuickStaffDirectoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPersona: (identifier: string, password: string) => void;
}

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

export const QuickStaffDirectory: React.FC<QuickStaffDirectoryProps> = ({
  isOpen,
  onClose,
  onSelectPersona,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CLINICAL' | 'PATIENT' | 'ADMIN' | 'EDGE_CASES'>('ALL');

  // TanStack React Query + Axios
  const { data: users = [], isLoading } = useQuery<DirectoryUser[]>({
    queryKey: ['directory-users'],
    queryFn: async () => {
      const res = await api.get('/auth/demo-users');
      return res.data.data;
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  if (!isOpen) return null;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'DOCTOR': return <Stethoscope className="w-4 h-4 text-teal-600" />;
      case 'PATIENT': return <UserCheck className="w-4 h-4 text-sky-600" />;
      case 'RECEPTIONIST': return <Building2 className="w-4 h-4 text-indigo-600" />;
      case 'PHARMACIST': return <Pill className="w-4 h-4 text-amber-600" />;
      case 'NURSE': return <HeartPulse className="w-4 h-4 text-rose-600" />;
      case 'ADMIN': return <Shield className="w-4 h-4 text-slate-700" />;
      default: return <UserCheck className="w-4 h-4 text-slate-500" />;
    }
  };

  const getPasswordForRole = (u: DirectoryUser): string => {
    switch (u.role) {
      case 'DOCTOR': return 'Doctor@123';
      case 'PATIENT': return 'Patient@123';
      case 'ADMIN': return 'Admin@123';
      case 'RECEPTIONIST': return 'Reception@123';
      case 'PHARMACIST': return 'Pharmacy@123';
      case 'NURSE': return 'Nurse@123';
      case 'MANAGEMENT': return 'Management@123';
      default: return 'Staff@123';
    }
  };

  const filteredUsers = users.filter((u) => {
    if (selectedFilter === 'CLINICAL') return ['DOCTOR', 'NURSE'].includes(u.role) && u.status === 'ACTIVE';
    if (selectedFilter === 'PATIENT') return u.role === 'PATIENT' && u.status === 'ACTIVE';
    if (selectedFilter === 'ADMIN') return ['ADMIN', 'RECEPTIONIST', 'PHARMACIST', 'MANAGEMENT'].includes(u.role) && u.status === 'ACTIVE';
    if (selectedFilter === 'EDGE_CASES') return u.status !== 'ACTIVE';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <span>Staff & Patient Directory</span>
              <Badge variant="info" size="sm">Active</Badge>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any profile to auto-fill credentials for clinical access.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="p-3 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs bg-white">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1 rounded-full font-medium transition-colors ${selectedFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            All ({users.length})
          </button>
          <button
            onClick={() => setSelectedFilter('CLINICAL')}
            className={`px-3 py-1 rounded-full font-medium transition-colors ${selectedFilter === 'CLINICAL' ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'}`}
          >
            Clinicians
          </button>
          <button
            onClick={() => setSelectedFilter('PATIENT')}
            className={`px-3 py-1 rounded-full font-medium transition-colors ${selectedFilter === 'PATIENT' ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'}`}
          >
            Patients
          </button>
          <button
            onClick={() => setSelectedFilter('ADMIN')}
            className={`px-3 py-1 rounded-full font-medium transition-colors ${selectedFilter === 'ADMIN' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
          >
            Staff & Admin
          </button>
          <button
            onClick={() => setSelectedFilter('EDGE_CASES')}
            className={`px-3 py-1 rounded-full font-medium transition-colors ${selectedFilter === 'EDGE_CASES' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
          >
            Special States
          </button>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Loading clinical directory...
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isLocked = u.status === 'LOCKED';
              const isSuspended = u.status === 'SUSPENDED';
              const isUnverified = u.status === 'PENDING_VERIFICATION';
              const pass = getPasswordForRole(u);

              return (
                <div
                  key={u.id}
                  onClick={() => {
                    onSelectPersona(u.email || u.phone, pass);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-brand-400 hover:shadow-sm bg-white hover:bg-slate-50/60 transition-all cursor-pointer group flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-50 transition-colors">
                      {getRoleIcon(u.role)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-brand-700">
                          {u.name}
                        </span>
                        {isLocked && <Badge variant="danger" size="sm">Locked</Badge>}
                        {isSuspended && <Badge variant="warning" size="sm">Suspended</Badge>}
                        {isUnverified && <Badge variant="info" size="sm">Pending</Badge>}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {u.email || u.phone}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Role: <span className="font-semibold text-slate-600">{u.role}</span> • Password: <code className="text-slate-600 font-mono bg-slate-100 px-1 py-0.5 rounded">{pass}</code>
                      </div>
                    </div>
                  </div>

                  <div className="text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all mt-2">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
          <span>Going Merry Health System • Internal Directory</span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
