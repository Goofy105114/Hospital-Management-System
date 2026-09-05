import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        default: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
        destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
        outline: 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700',
        secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
        ghost: 'hover:bg-slate-100 text-slate-600 hover:text-slate-900',
        link: 'text-brand-600 underline-offset-4 hover:underline',
        teal: 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm',
      },
      size: {
        default: 'h-10 px-4 py-2 gap-2',
        sm: 'h-8 rounded-lg px-3 text-xs gap-1.5',
        md: 'h-10 px-4 py-2 gap-2',
        lg: 'h-11 rounded-xl px-6 text-base gap-2.5',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={twMerge(clsx(buttonVariants({ variant, size, className })))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
