import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "destructive"
    | "default"
    | "inverted"
    | "surface";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-label-lg rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      primary:
        "bg-primary text-on-primary hover:bg-primary-container shadow-sm active:scale-[0.99]",
      default:
        "bg-primary text-on-primary hover:bg-primary-container shadow-sm active:scale-[0.99]",
      secondary:
        "bg-secondary text-on-secondary hover:bg-secondary/90 shadow-sm active:scale-[0.99]",
      outline:
        "border border-outline/30 bg-surface-container-lowest text-on-surface hover:bg-surface-container-high active:scale-[0.99]",
      ghost: "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
      danger: "bg-error text-on-error hover:bg-error/90 shadow-sm",
      destructive: "bg-error text-on-error hover:bg-error/90 shadow-sm",
      inverted: "bg-inverse-surface text-inverse-on-surface hover:bg-inverse-surface/90 shadow-sm",
      surface: "bg-surface-container-high hover:bg-surface-container-highest text-on-surface",
    };

    const sizes = {
      sm: "h-8 px-3 text-label-sm gap-1.5",
      md: "h-11 px-4 text-label-lg gap-2",
      lg: "h-12 px-6 text-label-lg gap-2.5",
      icon: "h-10 w-10 p-0 shrink-0",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
