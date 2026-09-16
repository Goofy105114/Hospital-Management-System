import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", icon, ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative w-full flex items-center">
          <span className="material-symbols-outlined absolute left-space-3 text-outline text-[20px] pointer-events-none">
            {icon}
          </span>
          <input
            type={type}
            ref={ref}
            className={cn(
              "w-full h-10 pl-10 pr-space-4 bg-surface-container-low text-on-surface placeholder:text-outline font-body-md text-body-md rounded-lg focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all",
              className
            )}
            {...props}
          />
        </div>
      );
    }

    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "w-full h-10 px-space-4 bg-surface-container-low text-on-surface placeholder:text-outline font-body-md text-body-md rounded-lg focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
