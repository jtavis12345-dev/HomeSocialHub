"use client";
import { cn } from "@/lib/utils";
import * as React from "react";

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-lg border border-[#2a2a2a] bg-[#0b0b0b] px-3 py-2 text-sm text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-[#D4AF37]/30",
        props.className
      )}
    />
  );
}
