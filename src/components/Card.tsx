import { cn } from "@/lib/utils";
import * as React from "react";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)]", className)} {...props} />;
}
