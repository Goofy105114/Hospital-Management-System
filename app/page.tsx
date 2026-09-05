'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { LoginCard } from '@/components/auth/LoginCard';
import { QuickStaffDirectory } from '@/components/auth/QuickStaffDirectory';
import { SessionBanner } from '@/components/auth/SessionBanner';
import { SecurityInspector } from '@/components/auth/SecurityInspector';
import { AdminWorkspace } from '@/components/workspaces/AdminWorkspace';
import { DoctorWorkspace } from '@/components/workspaces/DoctorWorkspace';
import { PatientWorkspace } from '@/components/workspaces/PatientWorkspace';
import { ReceptionWorkspace } from '@/components/workspaces/ReceptionWorkspace';
import { PharmacyWorkspace } from '@/components/workspaces/PharmacyWorkspace';
import { StaffWorkspace } from '@/components/workspaces/StaffWorkspace';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Building2,
  FileCode2,
  Users,
  Activity,
  HeartPulse,
  Lock,
  Stethoscope,
  Clock,
} from 'lucide-react';

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore();
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isSecurityInspectorOpen, setIsSecurityInspectorOpen] = useState(false);
  const [selectedIdentifier, setSelectedIdentifier] = useState('');
  const [selectedPassword, setSelectedPassword] = useState('');

  const handleSelectPersona = (id: string, pw: string) => {
    setSelectedIdentifier(id);
    setSelectedPassword(pw);
    setIsDirectoryOpen(false);
  };

  const renderWorkspace = () => {
    if (!user) return null;

    switch (user.role) {
      case 'ADMIN':
        return <AdminWorkspace />;
      case 'DOCTOR':
        return <DoctorWorkspace />;
      case 'PATIENT':
        return <PatientWorkspace />;
      case 'RECEPTIONIST':
        return <ReceptionWorkspace />;
      case 'PHARMACIST':
        return <PharmacyWorkspace />;
      default:
        return <StaffWorkspace />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Clinical Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base">
                  Going Merry Medical Center
                </span>
                <Badge variant="outline" size="sm" className="hidden sm:inline-flex text-[10px]">
                  NABH Accredited
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                Hospital Information & Clinical Management System (HIMS)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {!isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDirectoryOpen(true)}
                className="text-xs"
              >
                <Users className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Staff Directory
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSecurityInspectorOpen(true)}
              className="text-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
              Security Audit
            </Button>

            <a
              href="/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-medium transition-colors"
            >
              <FileCode2 className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              OpenAPI Docs
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {isAuthenticated ? (
          <div className="pb-16">
            <SessionBanner />
            {renderWorkspace()}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Hospital Presentation */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
                  <Activity className="w-3.5 h-3.5 text-teal-600" />
                  Clinical Portal v2.4 • Production Ready
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Enterprise Health Information System
                </h1>

                <p className="text-base text-slate-600 max-w-xl leading-relaxed">
                  Unified clinical workstations, patient health records, pharmacy fulfillment, and outpatient triage with strict role-based access control and cryptographic audit logging.
                </p>

                {/* Key Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <Stethoscope className="w-4 h-4 text-teal-600" />
                      Clinical Workstations
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Role-tailored interfaces for Physicians, Reception, Pharmacy, Nursing, and Administration.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <Lock className="w-4 h-4 text-indigo-600" />
                      IAM-01 Security Core
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Stateless JWT with family rotation, 5-attempt brute-force protection, and audit telemetry.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    PostgreSQL / Neon DB Online
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Upstash Redis Cache Ready
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    QStash Event Queue Ready
                  </span>
                </div>
              </div>

              {/* Right Column: Secure Login Card */}
              <div className="lg:col-span-5 flex justify-center">
                <LoginCard
                  selectedIdentifier={selectedIdentifier}
                  selectedPassword={selectedPassword}
                  onOpenDirectory={() => setIsDirectoryOpen(true)}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Drawers & Modals */}
      <QuickStaffDirectory
        isOpen={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
        onSelectPersona={handleSelectPersona}
      />

      <SecurityInspector
        isOpen={isSecurityInspectorOpen}
        onClose={() => setIsSecurityInspectorOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>Going Merry Medical Center • Department of Hospital IT</span>
          </div>
          <div>
            Built with Next.js, Prisma, Tailwind, TanStack Query & shadcn/ui
          </div>
        </div>
      </footer>
    </div>
  );
}
