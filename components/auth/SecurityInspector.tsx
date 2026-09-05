'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  RotateCw,
  X,
  Lock,
  FileText,
} from 'lucide-react';

interface SecurityInspectorProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface SecurityEvent {
  id: string;
  userId: string | null;
  eventType: string;
  identifier: string;
  ipAddress: string | null;
  metadata: string | null;
  createdAt: string;
}

interface AuditLog {
  id: string;
  actorId: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  changes: string | null;
  timestamp: string;
}

export const SecurityInspector: React.FC<SecurityInspectorProps> = ({
  isOpen = false,
  onClose,
}) => {
  const [tab, setTab] = useState<'security' | 'audit'>('security');

  // TanStack React Query + Axios
  const { data, isLoading, refetch } = useQuery<{
    securityEvents: SecurityEvent[];
    auditLogs: AuditLog[];
  }>({
    queryKey: ['security-overview'],
    queryFn: async () => {
      const res = await api.get('/auth/security-overview');
      return res.data.data;
    },
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const securityEvents = data?.securityEvents || [];
  const auditLogs = data?.auditLogs || [];

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'ACCOUNT_LOCKED':
        return <Badge variant="danger" size="sm" dot>LOCKED</Badge>;
      case 'FAILED_LOGIN':
        return <Badge variant="warning" size="sm" dot>FAILED</Badge>;
      case 'LOGIN_SUCCESS':
        return <Badge variant="success" size="sm" dot>SUCCESS</Badge>;
      case 'TOKEN_REFRESH':
        return <Badge variant="info" size="sm" dot>REFRESH</Badge>;
      case 'LOGOUT':
        return <Badge variant="default" size="sm">LOGOUT</Badge>;
      case 'REPLAY_ATTACK_DETECTED':
        return <Badge variant="danger" size="sm" dot>REPLAY ATTACK</Badge>;
      default:
        return <Badge variant="default" size="sm">{type}</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-modal max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Security & Audit Trail</span>
                <Badge variant="info" size="sm">Audit Log</Badge>
              </h3>
              <p className="text-xs text-slate-500">
                Tamper-evident audit logs and live security events for compliance verification.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              isLoading={isLoading}
              leftIcon={<RotateCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Selector */}
        <div className="px-5 pt-3 border-b border-slate-200 flex items-center gap-4 bg-white text-xs">
          <button
            onClick={() => setTab('security')}
            className={`pb-2.5 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'security'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security Events ({securityEvents.length})</span>
          </button>
          <button
            onClick={() => setTab('audit')}
            className={`pb-2.5 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'audit'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>System Audit Logs ({auditLogs.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'security' ? (
            securityEvents.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No security events recorded yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {securityEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      {getEventBadge(evt.eventType)}
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(evt.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-700">
                      Target Identifier: <span className="font-semibold text-slate-900 font-mono">{evt.identifier}</span>
                    </div>
                    {evt.ipAddress && (
                      <div className="text-[11px] text-slate-400">
                        IP: {evt.ipAddress}
                      </div>
                    )}
                    {evt.metadata && (
                      <pre className="text-[10px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 font-mono overflow-x-auto">
                        {evt.metadata}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            auditLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No audit logs recorded yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="admin" size="sm">{log.action}</Badge>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-700">
                      Actor: <span className="font-semibold text-slate-900">{log.actorRole || 'SYSTEM'}</span> (ID: {log.actorId || 'system'})
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Entity: <span className="font-mono">{log.entityType}</span> • ID: <span className="font-mono">{log.entityId}</span>
                    </div>
                    {log.changes && (
                      <pre className="text-[10px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 font-mono overflow-x-auto">
                        {log.changes}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Going Merry Health System • Security & Governance Infrastructure</span>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
