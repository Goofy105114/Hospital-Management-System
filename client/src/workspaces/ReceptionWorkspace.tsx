import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import {
  Building2,
  Ticket,
  Users,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  UserCheck
} from 'lucide-react';

export const ReceptionWorkspace: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Reception Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="staff" size="md" dot>
              Outpatient Reception & Triage Desk
            </Badge>
            <span className="text-xs text-slate-500">Terminal: DESK-01</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Front Desk — {user?.name || 'Receptionist'}
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Patient registration check-in, walk-in triage tokens, and doctor room assignment with secure staff credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" size="md" leftIcon={<Ticket className="w-4 h-4" />}>
            Issue Walk-in Token
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patients Checked In Today</span>
          <div className="text-2xl font-bold text-slate-900 mt-2">42 Patients</div>
          <div className="text-xs text-slate-500 mt-1">35 Scheduled • 7 Walk-ins</div>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Queue Tokens</span>
          <div className="text-2xl font-bold text-brand-600 mt-2">14 In Waiting Area</div>
          <div className="text-xs text-slate-500 mt-1">Across 4 Outpatient Departments</div>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Wait Time</span>
          <div className="text-2xl font-bold text-emerald-600 mt-2">18 mins</div>
          <div className="text-xs text-slate-500 mt-1">Well within 30m SLA</div>
        </Card>
      </div>

      {/* Check-in Management */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Queue & Patient Check-in</CardTitle>
            <CardDescription>Front-desk patient check-in eligibility and queue entry</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-600 text-xs">
            <div className="font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-600" />
              <span>Outpatient Check-in & Triage System</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Patient check-in eligibility verification, MRN lookup, room assignment, and electronic queue token generation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
