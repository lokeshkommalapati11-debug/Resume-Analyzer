import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Tone = "gray" | "green" | "red" | "amber" | "blue" | "indigo";

const tones: Record<Tone, string> = {
  gray: "bg-slate-100 text-slate-700",
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-blue-100 text-blue-800",
  indigo: "bg-indigo-100 text-indigo-800",
};

export function Badge({ tone = "gray", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export function severityTone(s: "high" | "medium" | "low"): Tone {
  return s === "high" ? "red" : s === "medium" ? "amber" : "blue";
}

export function ChipList({ items, tone = "gray", empty = "None" }: { items: string[]; tone?: Tone; empty?: string }) {
  if (items.length === 0) return <span className="text-sm text-slate-400">{empty}</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <Badge key={i} tone={tone}>
          {i}
        </Badge>
      ))}
    </div>
  );
}
