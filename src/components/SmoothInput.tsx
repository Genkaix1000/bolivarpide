import React, { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export type SmoothInputType = "text" | "password" | "email" | "tel" | "number";

export interface SmoothInputProps extends Omit<ComponentPropsWithoutRef<"input">, "type"> {
  type?: SmoothInputType;
  wrapperClassName?: string;
}

export const SmoothInput = forwardRef<HTMLInputElement, SmoothInputProps>(
  ({ className, wrapperClassName, type = "text", ...props }, ref) => {
    return (
      <div className={cn("relative w-full flex items-center", wrapperClassName)}>
        <input
          ref={ref}
          type={type}
          className={cn(
            "w-full bg-transparent outline-none placeholder:text-foreground/45 border-none p-0 focus:ring-0 caret-[#9a0002]",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

SmoothInput.displayName = "SmoothInput";

