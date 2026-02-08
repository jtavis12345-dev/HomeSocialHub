"use client";
import { cn } from "@/lib/utils";
import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

export function Button({ className, variant="primary", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-[#D4AF37] text-black hover:bg-[#E6C75A]"
      : variant === "danger"
        ? "bg-rose-600 text-white hover:bg-rose-700"
        : "bg-transparent text-[#D4AF37] border border-[#D4AF37]/70 hover:bg-[#0f0f0f]/5";
  return <button className={cn(base, styles, className)} {...props} />;
}
