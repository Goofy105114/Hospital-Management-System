import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { ApiError } from '../../services/api.js';
import { FormField } from '../ui/FormField.js';
import { Input } from '../ui/Input.js';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import {
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Building,
  KeyRound
} from 'lucide-react';

interface LoginCardProps {
  onSuccess?: () => void;
  selectedIdentifier?: string;
  selectedPassword?: string;
  onOpenDirectory?: () => void;
}

export const LoginCard: React.FC<LoginCardProps> = ({
  onSuccess,
  selectedIdentifier = '',
  selectedPassword = '',
  onOpenDirectory,
}) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState(selectedIdentifier);
  const [password, setPassword] = useState(selectedPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    code: string;
    message: string;
    attemptsRemaining?: number;
    lockedUntil?: string;
  } | null>(null);

  // Sync state if selected persona changes
  useEffect(() => {
    if (selectedIdentifier) setIdentifier(selectedIdentifier);
    if (selectedPassword) setPassword(selectedPassword);
    setErrorDetails(null);
  }, [selectedIdentifier, selectedPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;

    setLoading(true);
    setErrorDetails(null);

    try {
      await login(identifier.trim(), password);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorDetails({
          code: err.code,
          message: err.message,
          attemptsRemaining: err.details?.attemptsRemaining,
          lockedUntil: err.details?.lockedUntil,
        });
      } else {
        setErrorDetails({
          code: 'AUTH_FAILED',
          message: err.message || 'Unable to authenticate. Please verify your credentials.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const isPhone = /^\+?[0-9\s-]+$/.test(identifier) && identifier.length > 5;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-7 sm:p-8 relative">
        {/* Card Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="info" size="sm" dot>
              Clinical Access
            </Badge>
            {onOpenDirectory && (
              <button
                type="button"
                onClick={onOpenDirectory}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
              >
                <span>Directory</span>
                <span className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded border border-brand-200">Test Accounts</span>
              </button>
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Sign In to Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Authorized access for patients, physicians, and clinical staff.
          </p>
        </div>

        {/* Error Notification Alert */}
        {errorDetails && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-900">{errorDetails.message}</p>
              {errorDetails.attemptsRemaining !== undefined && (
                <p className="mt-1 text-[11px] text-rose-700 font-medium">
                  Security notice: {errorDetails.attemptsRemaining} failed attempt(s) remaining before automatic 30-minute lockout.
                </p>
              )}
              {errorDetails.lockedUntil && (
                <p className="mt-1 text-[11px] text-rose-700">
                  Account locked until: {new Date(errorDetails.lockedUntil).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Email or Registered Mobile"
            id="identifier"
            hint="e.g. doctor.sharma@goingmerry.com or +919876543210"
            required
          >
            <Input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="name@goingmerry.com or phone"
              required
              autoComplete="username"
              leftIcon={isPhone ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
            />
          </FormField>

          <FormField
            label="Password"
            id="password"
            required
          >
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your security password"
              required
              autoComplete="current-password"
              leftIcon={<Lock className="w-4 h-4" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          </FormField>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-xs text-slate-600 font-medium">Remember terminal</span>
            </label>
            <span className="text-xs text-brand-600 hover:underline cursor-pointer">
              Forgot password?
            </span>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={loading}
              leftIcon={<KeyRound className="w-4 h-4" />}
            >
              Sign In to Medical Workspace
            </Button>
          </div>
        </form>

        {/* Security / Compliance Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit Encrypted Session</span>
          </div>
          <div className="flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>NABH Accredited</span>
          </div>
        </div>
      </div>
    </div>
  );
};
