'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Badge } from '@/components/ui/badge';
import {
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Building,
  KeyRound,
} from 'lucide-react';

const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, 'Identifier must be at least 3 characters')
    .refine(
      (val) => val.includes('@') || /^\+?[0-9\s-]{7,15}$/.test(val),
      'Please enter a valid email address or mobile phone number'
    ),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

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
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    code: string;
    message: string;
    attemptsRemaining?: number;
    lockedUntil?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: selectedIdentifier,
      password: selectedPassword,
      rememberMe: true,
    },
  });

  const identifierValue = watch('identifier') || '';

  useEffect(() => {
    if (selectedIdentifier) setValue('identifier', selectedIdentifier);
    if (selectedPassword) setValue('password', selectedPassword);
    setErrorDetails(null);
  }, [selectedIdentifier, selectedPassword, setValue]);

  const onSubmit = async (data: LoginFormData) => {
    setErrorDetails(null);
    try {
      await login(data.identifier.trim(), data.password);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorDetails({
        code: err.code || 'AUTH_FAILED',
        message: err.message || 'Unable to authenticate. Please verify your credentials.',
        attemptsRemaining: err.details?.attemptsRemaining,
        lockedUntil: err.details?.lockedUntil,
      });
    }
  };

  const isPhone = /^\+?[0-9\s-]+$/.test(identifierValue) && identifierValue.length > 5;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-7 sm:p-8 relative">
        {/* Header */}
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
                <span>Staff Directory</span>
                <span className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded border border-brand-200">
                  Quick Select
                </span>
              </button>
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Sign In to Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Authorized clinical access for physicians, patients, and staff.
          </p>
        </div>

        {/* Error Alert */}
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

        {/* React Hook Form + Zod Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Email or Registered Mobile"
            id="identifier"
            hint="e.g. doctor.sharma@goingmerry.com or +919876543210"
            required
            error={errors.identifier?.message}
          >
            <Input
              id="identifier"
              type="text"
              placeholder="name@goingmerry.com or phone"
              autoComplete="username"
              leftIcon={isPhone ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
              hasError={!!errors.identifier}
              {...register('identifier')}
            />
          </FormField>

          <FormField
            label="Security Password"
            id="password"
            required
            error={errors.password?.message}
          >
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your security password"
              autoComplete="current-password"
              leftIcon={<Lock className="w-4 h-4" />}
              hasError={!!errors.password}
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
              {...register('password')}
            />
          </FormField>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                {...register('rememberMe')}
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
              variant="default"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              leftIcon={<KeyRound className="w-4 h-4" />}
            >
              Sign In to Medical Workspace
            </Button>
          </div>
        </form>

        {/* Security & Compliance Footer */}
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
