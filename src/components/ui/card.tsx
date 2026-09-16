import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "lowest" | "low" | "high";
}

export function Card({ className, variant = "lowest", children, ...props }: CardProps) {
  const bgClasses = {
    lowest: "bg-surface-container-lowest shadow-sm",
    low: "bg-surface-container-low",
    high: "bg-surface-container-high",
  };

  return (
    <div className={cn("rounded-xl relative", bgClasses[variant], className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 p-space-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-title-md font-bold leading-none tracking-tight text-on-surface",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("font-body-sm text-outline", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-space-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center p-space-6 pt-0", className)} {...props} />;
}
