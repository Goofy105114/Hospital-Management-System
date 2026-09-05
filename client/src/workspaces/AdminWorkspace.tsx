import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { authApi } from '../services/api.js';
import { DemoUser, SecurityEvent, AuditLog } from '../types/auth.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import {
  Shield,
  Users,
  Lock,
  RotateCw,
  UserCheck,
  AlertTriangle,
  FileText,
  KeyRound,
  ShieldCheck
} from 'lucide-react';

export const AdminWorkspace: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uData, secData] = await Promise.all([
        authApi.getDemoUsers(),
        authApi.getSecurityOverview(),
      ]);
      setUsers(uData);
      setSecurityEvents(secData.securityEvents);
      setAuditLogs(secData.auditLogs);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="admin" size="md" dot>
              System Administration & Compliance
            </Badge>
            <span className="text-xs text-slate-500">
              Access Governance & Security
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Security & Identity Administration
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Centralized role-based access control, active session monitoring, account lockouts, and tamper-evident audit logging.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={loadData}
            isLoading={loading}
            leftIcon={<RotateCw className="w-4 h-4" />}
          >
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* Admin KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Configured Users</span>
          <div className="text-2xl font-bold text-slate-900 mt-2">{users.length}</div>
          <div className="text-xs text-slate-500 mt-1">Across 7 Clinical Roles</div>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Locked Accounts</span>
          <div className="text-2xl font-bold text-rose-600 mt-2">
            {users.filter(u => u.status === 'LOCKED').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Auto-locked (5 consecutive failed attempts)</div>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Security Events</span>
          <div className="text-2xl font-bold text-slate-900 mt-2">{securityEvents.length}</div>
          <div className="text-xs text-slate-500 mt-1">Recorded in security event log</div>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Audit Trail</span>
          <div className="text-2xl font-bold text-slate-900 mt-2">{auditLogs.length}</div>
          <div className="text-xs text-slate-500 mt-1">Immutable audit entries</div>
        </Card>
      </div>

      {/* User Directory Table */}
      <Card className="mb-8">
        <CardHeader>
          <div>
            <CardTitle>Hospital User Directory & Account Status</CardTitle>
            <CardDescription>All clinical staff, patients, and administrative accounts</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                  <th className="p-4">Name & Identifier</th>
                  <th className="p-4">Assigned Role</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4">Lockout / Security Policy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                      <div className="text-slate-500 font-mono mt-0.5">{u.email || u.phone}</div>
                    </td>
                    <td className="p-4">
                      <Badge variant="default" size="sm">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={u.status === 'ACTIVE' ? 'success' : u.status === 'LOCKED' ? 'danger' : 'warning'}
                        size="sm"
                        dot
                      >
                        {u.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-slate-500">
                      {u.status === 'LOCKED' ? (
                        <span className="text-rose-600 font-medium">Locked (5 consecutive failed logins)</span>
                      ) : u.status === 'SUSPENDED' ? (
                        <span className="text-amber-700 font-medium">Admin Suspension Active</span>
                      ) : (
                        <span className="text-slate-600">Active • 5 attempts lockout threshold</span>
                      )}
                    </td>
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
