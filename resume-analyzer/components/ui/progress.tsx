import { cn } from "@/lib/utils";

export function toneClass(score: number) {
  return score >= 75 ? "bg-green-500" : score >= 55 ? "bg-amber-500" : "bg-red-500";
}

export function Progress({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-200", className)}
    >
      <div className={cn("h-full rounded-full transition-all", toneClass(v))} style={{ width: `${v}%` }} />
    </div>
  );
}
