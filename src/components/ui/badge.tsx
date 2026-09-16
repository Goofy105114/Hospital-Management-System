import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    "primary" | "secondary" | "success" | "warning" | "error" | "danger" | "neutral" | "outline";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "primary",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-sm uppercase tracking-wider font-semibold text-[11px] leading-[14px]";

  const variants = {
    primary: "bg-primary-fixed/50 text-on-primary-fixed",
    secondary: "bg-secondary-fixed/60 text-on-secondary-fixed-variant",
    success: "bg-surface-container-lowest text-primary font-bold shadow-sm",
    warning: "bg-amber-100 text-amber-800",
    error: "bg-error-container text-on-error-container font-bold",
    danger: "bg-error-container text-on-error-container font-bold",
    neutral: "bg-surface-container text-on-surface-variant",
    outline: "border border-outline/30 text-on-surface-variant bg-surface-container-lowest",
  };

  const dotColors = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    success: "bg-primary",
    warning: "bg-amber-600",
    error: "bg-error",
    danger: "bg-error",
    neutral: "bg-outline",
    outline: "bg-outline",
  };

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />}
      {children}
    </div>
  );
}
