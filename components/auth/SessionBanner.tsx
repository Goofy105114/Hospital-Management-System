'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  RotateCw,
  LogOut,
  User,
  Check,
} from 'lucide-react';

export const SessionBanner: React.FC = () => {
  const { user, timeToExpiry, refreshSession, logout, decrementTimer } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      decrementTimer();
    }, 1000);
    return () => clearInterval(timer);
  }, [decrementTimer]);

  if (!user) return null;

  const minutes = Math.floor(timeToExpiry / 60);
  const seconds = timeToExpiry % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshSuccess(false);
    try {
      await refreshSession();
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to extend session:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const isLowTime = timeToExpiry < 120;

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'DOCTOR': return 'doctor';
      case 'PATIENT': return 'patient';
      case 'ADMIN': return 'admin';
      default: return 'staff';
    }
  };

  return (
    <div className="w-full bg-white/95 border-b border-slate-200/90 px-4 py-2.5 backdrop-blur-md sticky top-16 z-20 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: User identity & role */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 font-bold text-xs">
            {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900">{user.name}</span>
              <Badge variant={getRoleBadgeVariant(user.role) as any} size="sm" dot>
                {user.role}
              </Badge>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">{user.email || user.phone}</span>
          </div>
        </div>

        {/* Center: Token Expiry Countdown */}
        <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <Clock className={`w-3.5 h-3.5 ${isLowTime ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
          <span className="text-slate-500 text-[11px]">Session Timer:</span>
          <span className={`font-mono font-bold ${isLowTime ? 'text-rose-600' : 'text-slate-700'}`}>
            {timeFormatted}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={refreshing}
            leftIcon={refreshSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <RotateCw className="w-3.5 h-3.5 text-slate-500" />}
            title="Rotate authentication session token"
          >
            {refreshSuccess ? 'Session Extended' : 'Extend Session'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
            title="Sign out and revoke session token"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};
