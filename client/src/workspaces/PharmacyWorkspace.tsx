import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import {
  Pill,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';

export const PharmacyWorkspace: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="warning" size="md" dot>
              Hospital Central Pharmacy
            </Badge>
            <span className="text-xs text-slate-500">Dispensing Counter #2</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Pharmacy Dispensing — {user?.name || 'Pharmacist'}
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Electronic prescription fulfillment, medication verification, and stock inventory ledger management with authorized pharmacist access.
          </p>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Prescriptions</span>
          <div className="text-2xl font-bold text-amber-600 mt-2">7 Orders</div>
          <div className="text-xs text-slate-500 mt-1">Awaiting pharmacist verification</div>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dispensed Today</span>
          <div className="text-2xl font-bold text-slate-900 mt-2">64 Orders</div>
          <div className="text-xs text-slate-500 mt-1">100% barcode verified</div>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Alert Warnings</span>
          <div className="text-2xl font-bold text-emerald-600 mt-2">0 Critical</div>
          <div className="text-xs text-slate-500 mt-1">All essential formulary stocked</div>
        </Card>
      </div>

      {/* Medication Dispensing */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Pharmacy Dispensing & Inventory</CardTitle>
            <CardDescription>e-Prescription queue and inventory ledger</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-600 text-xs">
            <div className="font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Pill className="w-4 h-4 text-brand-600" />
              <span>Medication Dispensing & Formulary Verification</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Barcode-verified medication fulfillment, dosage confirmation, batch dispensing, and real-time inventory ledger updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
