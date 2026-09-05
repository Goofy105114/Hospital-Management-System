import React, { useState } from 'react';
import { useAuth } from './context/AuthContext.js';
import { LoginCard } from './components/auth/LoginCard.js';
import { QuickStaffDirectory } from './components/auth/QuickStaffDirectory.js';
import { SessionBanner } from './components/SessionBanner.js';
import { SecurityInspector } from './components/SecurityInspector.js';
import { Badge } from './components/ui/Badge.js';
import { Button } from './components/ui/Button.js';

// Workspaces
import { PatientWorkspace } from './workspaces/PatientWorkspace.js';
import { DoctorWorkspace } from './workspaces/DoctorWorkspace.js';
import { ReceptionWorkspace } from './workspaces/ReceptionWorkspace.js';
import { PharmacyWorkspace } from './workspaces/PharmacyWorkspace.js';
import { AdminWorkspace } from './workspaces/AdminWorkspace.js';
import { StaffWorkspace } from './workspaces/StaffWorkspace.js';

import {
  HeartPulse,
  ShieldCheck,
  Building,
  Phone,
  Clock,
  Activity,
  FileText,
  Lock,
  Stethoscope,
  Pill,
  Users
} from 'lucide-react';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [selectedIdentifier, setSelectedIdentifier] = useState('');
  const [selectedPassword, setSelectedPassword] = useState('');
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  const handleSelectPersona = (identifier: string, pass: string) => {
    setSelectedIdentifier(identifier);
    setSelectedPassword(pass);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-sm animate-pulse">
          <HeartPulse className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-slate-600">Initializing Going Merry Health System...</p>
      </div>
    );
  }

  // Role-based Permitted Workspace Router
  const renderWorkspace = () => {
    if (!user) return null;

    switch (user.role) {
      case 'PATIENT':
        return <PatientWorkspace />;
      case 'DOCTOR':
        return <DoctorWorkspace />;
      case 'RECEPTIONIST':
        return <ReceptionWorkspace />;
      case 'PHARMACIST':
        return <PharmacyWorkspace />;
      case 'ADMIN':
      case 'SUPER_ADMIN':
      case 'MANAGEMENT':
        return <AdminWorkspace />;
      default:
        return <StaffWorkspace />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 font-sans selection:bg-brand-500 selection:text-white">
      {/* Top Hospital Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
                Going Merry <span className="text-brand-600 font-semibold">Health System</span>
              </span>
              <span className="block text-[11px] text-slate-500 -mt-0.5">
                Clinical Operations & Patient Portal
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {!user ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <Phone className="w-3.5 h-3.5 text-rose-500" />
                  <span>24/7 Helpline: <strong className="text-slate-800">108</strong> / <strong className="text-slate-800">+91 22 2456 7890</strong></span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDirectoryOpen(true)}
                  leftIcon={<Users className="w-3.5 h-3.5 text-brand-600" />}
                >
                  Test Accounts
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSecurityModalOpen(true)}
                  className="text-xs font-semibold text-slate-600 hover:text-brand-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Security Trail</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sub-Header Session Bar (if authenticated) */}
      {user && <SessionBanner />}

      {/* Main Content */}
      <main className="flex-1">
        {user ? (
          renderWorkspace()
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Hospital Overview & Clinical Branding */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-4">
                    <Building className="w-3.5 h-3.5" />
                    <span>NABH Accredited Tertiary Care Hospital</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    Compassionate Care, <br />
                    <span className="text-brand-600">Clinical Excellence.</span>
                  </h1>
                  <p className="text-slate-600 text-sm sm:text-base mt-3 max-w-xl leading-relaxed">
                    Going Merry Health System provides integrated inpatient and outpatient care. Sign in to your authorized medical workspace or patient portal to manage clinical encounters, appointments, and diagnostic records.
                  </p>
                </div>

                {/* 3 Clinical Feature Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-2.5">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-xs text-slate-900">OPD & Doctor Queue</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Electronic token dispatch and synchronized consultation tracking.
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center mb-2.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-xs text-slate-900">Unified Health Records</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      EHR notes, vitals monitoring, and diagnostic lab reports.
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-2.5">
                      <Pill className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-xs text-slate-900">Pharmacy Formulary</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Barcode-verified dispensing and live stock inventory ledgers.
                    </div>
                  </div>
                </div>

                {/* Emergency Notice Banner */}
                <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 text-xs text-rose-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 text-rose-600 font-bold">
                    108
                  </div>
                  <div>
                    <span className="font-bold">24/7 Emergency & Trauma Admissions:</span>{' '}
                    <span>Direct admission through Emergency Bay or call 108 for immediate critical ambulance dispatch.</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Centered Clinical Login Card */}
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

      {/* Hospital Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Going Merry Health System</span>
            <span>•</span>
            <span>Clinical Operations Platform</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSecurityModalOpen(true)}
              className="text-slate-600 hover:text-brand-600 flex items-center gap-1 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Compliance & Security Audit</span>
            </button>
            <span>•</span>
            <span>HIPAA / DISHA Compliant</span>
          </div>
        </div>
      </footer>

      {/* Quick Staff Directory Drawer */}
      <QuickStaffDirectory
        isOpen={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
        onSelectPersona={handleSelectPersona}
      />

      {/* Security & Audit Trail Modal */}
      <SecurityInspector
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </div>
  );
};
