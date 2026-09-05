import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hasError, leftIcon, rightElement, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={twMerge(
            clsx(
              'flex h-10 w-full rounded-xl border bg-white px-3.5 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
              leftIcon && 'pl-10',
              rightElement && 'pr-10',
              hasError
                ? 'border-rose-400 focus-visible:ring-rose-200'
                : 'border-slate-300 hover:border-slate-400 focus-visible:ring-brand-200',
              className
            )
          )}
          ref={ref}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
