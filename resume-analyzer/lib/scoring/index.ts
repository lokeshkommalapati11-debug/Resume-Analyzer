import type { AtsResult, CategoryKey, ScoreResult } from "@/types/analysis";

/** Transparent weights: the overall score is computed in code, not by the model. */
export const CATEGORY_WEIGHTS: Record<CategoryKey, number> = {
  ats: 0.15,
  skills: 0.15,
  experience: 0.2,
  projects: 0.08,
  education: 0.07,
  achievements: 0.08,
  keywords: 0.1,
  clarity: 0.08,
  impact: 0.09,
};

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  ats: "ATS compatibility",
  skills: "Skills",
  experience: "Experience",
  projects: "Projects",
  education: "Education",
  achievements: "Achievements",
  keywords: "Keyword optimization",
  clarity: "Clarity",
  impact: "Impact",
};

type RawCategory = { score: number; reason: string; applicable: boolean };

export function computeScore(
  ats: { score: number; reason: string },
  categories: Record<Exclude<CategoryKey, "ats">, RawCategory>,
): ScoreResult {
  const raw: Record<CategoryKey, RawCategory> = {
    ats: { ...ats, applicable: true },
    ...categories,
  };
  const keys = Object.keys(raw) as CategoryKey[];
  const weightSum = keys.reduce((s, k) => (raw[k].applicable ? s + CATEGORY_WEIGHTS[k] : s), 0);
  const total = keys.reduce(
    (s, k) => (raw[k].applicable ? s + raw[k].score * CATEGORY_WEIGHTS[k] : s),
    0,
  );
  const out = {} as ScoreResult["categories"];
  for (const k of keys) {
    out[k] = {
      ...raw[k],
      weight: raw[k].applicable && weightSum > 0 ? CATEGORY_WEIGHTS[k] / weightSum : 0,
    };
  }
  return { overallScore: weightSum > 0 ? Math.round(total / weightSum) : 0, categories: out };
}

export function atsStatus(score: number): AtsResult["status"] {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 55) return "Needs Improvement";
  return "Poor";
}

export function scoreTone(score: number): "green" | "amber" | "red" {
  if (score >= 75) return "green";
  if (score >= 55) return "amber";
  return "red";
}
