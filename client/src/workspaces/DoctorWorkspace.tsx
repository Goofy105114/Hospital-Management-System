import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import {
  Stethoscope,
  Users,
  Clock,
  PhoneCall,
  Calendar,
  FileText,
  Activity,
  AlertCircle,
  Building2,
  CheckCircle2
} from 'lucide-react';

export const DoctorWorkspace: React.FC = () => {
  const { user } = useAuth();
  const [activeToken, setActiveToken] = useState<string>('DR07-013');
  const [calledNext, setCalledNext] = useState<boolean>(false);

  const handleCallNext = () => {
    setActiveToken('DR07-014');
    setCalledNext(true);
    setTimeout(() => setCalledNext(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Clinician Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="doctor" size="md" dot>
              Physician Consultation Desk
            </Badge>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Department of Cardiology • Consultation Room 204</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome, Dr. {user?.name || 'Physician'}
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Secure clinical workstation. Real-time patient queue calls, appointment schedules, and encounter records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={handleCallNext}
            leftIcon={<PhoneCall className="w-4 h-4" />}
            className="bg-teal-600 hover:bg-teal-700 focus:ring-teal-500"
          >
            {calledNext ? 'Token Called!' : 'Call Next Token'}
          </Button>
        </div>
      </div>

      {/* Clinical Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Waiting Queue</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">6 Patients</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-teal-600 font-semibold">Active Call: {activeToken}</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Appointments</span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">18 Booked</div>
          <div className="text-xs text-slate-500 mt-1">12 Completed • 6 Pending</div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Encounter Status</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">Ready</div>
          <div className="text-xs text-slate-500 mt-1">EMR-01 EHR Station Online</div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Critical Alerts</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">0 High Risk</div>
          <div className="text-xs text-slate-500 mt-1">No emergency escalations</div>
        </Card>
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Encounter Consultation Desk */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Active Consultation Encounter</CardTitle>
                <CardDescription>Current patient called to examination room</CardDescription>
              </div>
              <Badge variant="doctor" size="sm" dot>Token #{activeToken}</Badge>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">Johnathan Doe (MRN-2026-0042)</div>
                  <div className="text-xs text-slate-500 mt-0.5">Male, 45 yrs • Chief Complaint: Routine Hypertension Review</div>
                </div>
                <Badge variant="info" size="sm">OPD Consultation</Badge>
              </div>

              {/* Clinical Notes Container */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-600 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                  <FileText className="w-4 h-4 text-brand-600" />
                  <span>Clinical Notes & Examination Records</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Patient clinical history, examination observations, vitals recording, and digital prescription generator.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Department Queue & Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Live Outpatient Queue</CardTitle>
                <CardDescription>Patients waiting outside Room 204</CardDescription>
              </div>
              <Badge variant="default" size="sm">6 in queue</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {[
                  { token: 'DR07-014', name: 'Priya Sharma', time: '10:15 AM', status: 'Next In Line' },
                  { token: 'DR07-015', name: 'Rajesh Patel', time: '10:30 AM', status: 'Waiting' },
                  { token: 'DR07-016', name: 'Ananya Verma', time: '10:45 AM', status: 'Vitals Done' },
                ].map((p, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{p.token} • {p.name}</div>
                      <div className="text-[11px] text-slate-500">Scheduled: {p.time}</div>
                    </div>
                    <Badge variant={idx === 0 ? 'success' : 'default'} size="sm">
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
