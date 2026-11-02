import type { z } from "zod";
import type {
  AtsIssueSchema,
  ResumeIssueSchema,
  ResumeSuggestionSchema,
} from "@/lib/gemini/schemas";

export type Severity = "high" | "medium" | "low";
export type AtsIssue = z.infer<typeof AtsIssueSchema>;
export type ResumeIssue = z.infer<typeof ResumeIssueSchema>;
export type ResumeSuggestion = z.infer<typeof ResumeSuggestionSchema>;

export interface AtsResult {
  atsScore: number;
  status: "Excellent" | "Good" | "Needs Improvement" | "Poor";
  issues: AtsIssue[];
  passedChecks: string[];
  explanation: string;
}

export type CategoryKey =
  | "ats"
  | "skills"
  | "experience"
  | "projects"
  | "education"
  | "achievements"
  | "keywords"
  | "clarity"
  | "impact";

export interface CategoryScore {
  score: number;
  reason: string;
  applicable: boolean;
  /** Effective weight (0-1) after excluding non-applicable categories. */
  weight: number;
}

export interface ScoreResult {
  overallScore: number;
  categories: Record<CategoryKey, CategoryScore>;
}

export interface ResumeAnalysis {
  ats: AtsResult;
  score: ScoreResult;
  strengths: string[];
  issues: ResumeIssue[];
  suggestions: ResumeSuggestion[];
}
