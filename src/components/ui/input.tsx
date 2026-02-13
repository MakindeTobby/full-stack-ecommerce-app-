import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-md border border-black/15 bg-white px-3 text-sm text-black placeholder:text-gray-400 focus:border-black/30 focus:outline-none",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
