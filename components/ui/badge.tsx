import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none select-none leading-none',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-brand-600 text-white shadow-xs',
        secondary: 'border-transparent bg-slate-100 text-slate-900',
        destructive: 'border-transparent bg-rose-500 text-white',
        outline: 'text-slate-700 border-slate-300',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        warning: 'border-amber-200 bg-amber-50 text-amber-800',
        danger: 'border-rose-200 bg-rose-50 text-rose-700',
        info: 'border-sky-200 bg-sky-50 text-sky-700',
        doctor: 'border-teal-200 bg-teal-50 text-teal-800',
        patient: 'border-blue-200 bg-blue-50 text-blue-700',
        admin: 'border-indigo-200 bg-indigo-50 text-indigo-700',
        staff: 'border-purple-200 bg-purple-50 text-purple-700',
      },
      size: {
        default: 'text-xs px-2.5 py-1',
        sm: 'text-[11px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-1',
        lg: 'text-sm px-3 py-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <div className={twMerge(clsx(badgeVariants({ variant, size }), className))} {...props}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
      <span>{children}</span>
    </div>
  );
}

export { Badge, badgeVariants };
