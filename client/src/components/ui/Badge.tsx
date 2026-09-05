import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'doctor' | 'patient' | 'admin' | 'staff';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    doctor: 'bg-teal-50 text-teal-800 border-teal-200',
    patient: 'bg-blue-50 text-blue-700 border-blue-200',
    admin: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    staff: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-slate-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    doctor: 'bg-teal-500',
    patient: 'bg-blue-500',
    admin: 'bg-indigo-500',
    staff: 'bg-purple-500',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-full font-medium',
    md: 'text-xs px-2.5 py-1 rounded-full font-medium',
  };

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center gap-1.5 border leading-none tracking-wide select-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )
      )}
      {...props}
    >
      {dot && (
        <span className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", dotColors[variant])} />
      )}
      <span>{children}</span>
    </span>
  );
};
