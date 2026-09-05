import * as React from 'react';
import { clsx } from 'clsx';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  id?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  error,
  hint,
  required,
  className,
  children,
}) => {
  return (
    <div className={clsx('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 tracking-wide uppercase"
        >
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
        {hint && !error && (
          <span className="text-xs text-slate-400">{hint}</span>
        )}
      </div>

      {children}

      {error && (
        <p className="text-xs font-medium text-rose-600 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
