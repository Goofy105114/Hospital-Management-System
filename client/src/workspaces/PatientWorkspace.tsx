import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import {
  User,
  Calendar,
  Clock,
  FileText,
  Pill,
  Heart,
  Shield,
  Activity,
  Phone,
  Building
} from 'lucide-react';

export const PatientWorkspace: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Patient Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="patient" size="md" dot>
              Patient Health Portal
            </Badge>
            <span className="text-xs text-slate-500 font-mono">
              MRN: GM-2026-88194
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Hello, {user?.name || 'Patient'}
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Access your verified medical records, upcoming outpatient appointments, medication refills, and clinical care team.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" size="md" leftIcon={<Calendar className="w-4 h-4" />}>
            Book Appointment
          </Button>
        </div>
      </div>

      {/* Patient Health Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Next Appointment</span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">Tomorrow, 10:30 AM</div>
          <div className="text-xs text-slate-500 mt-1">Dr. Sharma • Cardiology (Room 204)</div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Prescriptions</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">2 Medications</div>
          <div className="text-xs text-slate-500 mt-1">Amlodipine 5mg • Atorvastatin 10mg</div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lab Results</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">All Normal</div>
          <div className="text-xs text-slate-500 mt-1">Complete Blood Count (CBC) • 3 days ago</div>
        </Card>
      </div>

      {/* Workspace Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Upcoming Clinical Visits</CardTitle>
                <CardDescription>Scheduled consultations and follow-up reviews</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Follow-up Cardiology Checkup</div>
                    <div className="text-slate-500 mt-0.5">Dr. Sarah Sharma • Department of Cardiology</div>
                    <div className="text-slate-400 mt-1 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Tomorrow, 10:30 AM • OPD Room 204</span>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">Confirmed</Badge>
                </div>
              </div>

              {/* Appointment Booking Panel */}
              <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-600 text-xs">
                <div className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  <span>Book Consultations & Telehealth Visits</span>
                </div>
                <p className="text-slate-500">
                  Search specialist availability across departments, book new consultation slots, or manage outpatient follow-ups.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Hospital Care Contact</CardTitle>
                <CardDescription>24/7 Patient Assistance</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-xs space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <Phone className="w-4 h-4 text-brand-600" />
                <div>
                  <div className="font-bold text-slate-900">Hospital Helpline</div>
                  <div className="text-slate-500">+91 22 2456 7890 (Ext. 101)</div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800">
                <Heart className="w-4 h-4 text-rose-600" />
                <div>
                  <div className="font-bold text-rose-900">Emergency & Ambulance</div>
                  <div className="text-rose-700">Dial 108 for immediate dispatch</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
