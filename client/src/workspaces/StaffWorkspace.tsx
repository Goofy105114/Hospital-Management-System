import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { UserCheck, ShieldCheck, Building } from 'lucide-react';

export const StaffWorkspace: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Badge variant="staff" size="md" dot>
            Hospital Staff Portal
          </Badge>
          <span className="text-xs text-slate-500">
            Active Role: {user?.role}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Welcome, {user?.name}
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Authorized hospital clinical staff workstation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Departmental Clinical Operations</CardTitle>
            <CardDescription>Role-specific workflow modules ready for integration</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-600 text-xs">
            <div className="font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Building className="w-4 h-4 text-brand-600" />
              <span>Departmental Clinical Operations</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Verified session for role <strong>{user?.role}</strong>. Departmental clinical workflows and specialized operation modules attach here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
