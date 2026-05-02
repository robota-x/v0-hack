"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "neo-shadow-hover bg-[#a3e635] text-[#1e1b4b] border-[#1e1b4b] shadow-[2px_2px_0px_0px_rgba(30,27,75,1)]",
  secondary:
    "neo-shadow-hover bg-[#fef08a] text-[#1e1b4b] border-[#1e1b4b] shadow-[2px_2px_0px_0px_rgba(30,27,75,1)]",
  ghost:
    "bg-white/75 text-[#1e1b4b] border-[#1e1b4b] hover:bg-white/90 hover:-translate-y-0.5",
  destructive:
    "neo-shadow-hover bg-[#f43f5e] text-white border-[#1e1b4b] shadow-[2px_2px_0px_0px_rgba(30,27,75,1)]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 rounded-lg px-3 text-xs",
  md: "h-11 rounded-xl px-4 text-sm",
  lg: "h-12 rounded-xl px-5 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 border-2 font-extrabold uppercase tracking-wider transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f43f5e]",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
