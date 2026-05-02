import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "primary" | "accent" | "destructive";

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  const tones: Record<Tone, string> = {
    neutral: "border-[#1e1b4b] bg-white/80 text-[#1e1b4b]",
    primary: "border-[#1e1b4b] bg-[#a3e635] text-[#1e1b4b]",
    accent: "border-[#1e1b4b] bg-[#fef08a] text-[#1e1b4b]",
    destructive: "border-[#1e1b4b] bg-[#f43f5e] text-white",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
