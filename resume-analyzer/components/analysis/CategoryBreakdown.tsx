import { Progress } from "@/components/ui/progress";
import { CATEGORY_LABELS } from "@/lib/scoring";
import type { CategoryKey, ScoreResult } from "@/types/analysis";

export function CategoryBreakdown({ score }: { score: ScoreResult }) {
  const keys = Object.keys(score.categories) as CategoryKey[];
  return (
    <div className="space-y-4">
      {keys.map((k) => {
        const c = score.categories[k];
        return (
          <div key={k} className={c.applicable ? "" : "opacity-60"}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium text-slate-800">{CATEGORY_LABELS[k]}</span>
              <span className="text-slate-500">
                {c.applicable ? `${c.score}/100 · weight ${Math.round(c.weight * 100)}%` : "Not applicable"}
              </span>
            </div>
            {c.applicable && <Progress value={c.score} />}
            <p className="mt-1 text-sm text-slate-600">{c.reason}</p>
          </div>
        );
      })}
      <p className="text-xs text-slate-500">
        The overall score is a weighted average of the applicable categories above (calculated by the app, not the AI).
      </p>
    </div>
  );
}
