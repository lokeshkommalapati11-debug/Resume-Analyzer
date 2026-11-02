import { z } from "zod";

/* ---------- helpers: tolerant of null/undefined from the model, strict on shape ---------- */
const reqStr = z.string().nullish().transform((v) => v?.trim() ?? "");
const optStr = z
  .string()
  .nullish()
  .transform((v) => {
    const t = v?.trim();
    return t ? t : undefined;
  });
const arr = <T extends z.ZodTypeAny>(item: T) =>
  z.array(item).nullish().transform((v) => v ?? []);
const strList = arr(reqStr).transform((a) => a.filter((s) => s.length > 0));
const score = z.coerce
  .number()
  .transform((n) => Math.round(Math.min(100, Math.max(0, Number.isFinite(n) ? n : 0))));
const severity = z.preprocess(
  (v) => (typeof v === "string" ? v.toLowerCase().trim() : v),
  z.enum(["high", "medium", "low"]).catch("medium"),
);
const level = z.preprocess(
  (v) => (typeof v === "string" ? v.toLowerCase().trim() : v),
  z.enum(["strong", "moderate", "weak", "unclear"]).catch("unclear"),
);

/* ---------- resume ---------- */
export const EducationSchema = z.object({
  institution: reqStr,
  degree: optStr,
  field: optStr,
  startDate: optStr,
  endDate: optStr,
});

export const ExperienceSchema = z.object({
  company: reqStr,
  role: reqStr,
  startDate: optStr,
  endDate: optStr,
  description: reqStr,
  technologies: strList.optional(),
});

export const ProjectSchema = z.object({
  name: reqStr,
  description: reqStr,
  technologies: strList.optional(),
});

export const ResumeDataSchema = z.object({
  name: reqStr,
  email: optStr,
  phone: optStr,
  location: optStr,
  links: strList.optional(),
  summary: optStr,
  skills: strList,
  education: arr(EducationSchema),
  experience: arr(ExperienceSchema),
  projects: arr(ProjectSchema),
  certifications: strList,
  achievements: strList,
  languages: strList,
});

/* ---------- ATS ---------- */
export const AtsIssueSchema = z.object({
  severity,
  title: reqStr,
  description: reqStr,
  suggestion: reqStr,
});

export const AtsModelSchema = z.object({
  atsScore: score,
  issues: arr(AtsIssueSchema),
  passedChecks: strList,
  explanation: reqStr,
});

/* ---------- scoring ---------- */
const CategoryScoreSchema = z.object({
  score,
  reason: reqStr,
  applicable: z.boolean().nullish().transform((v) => v ?? true),
});

export const ScoringModelSchema = z.object({
  categories: z.object({
    skills: CategoryScoreSchema,
    experience: CategoryScoreSchema,
    projects: CategoryScoreSchema,
    education: CategoryScoreSchema,
    achievements: CategoryScoreSchema,
    keywords: CategoryScoreSchema,
    clarity: CategoryScoreSchema,
    impact: CategoryScoreSchema,
  }),
  strengths: strList,
});

/* ---------- issues + suggestions ---------- */
export const ResumeIssueSchema = z.object({
  severity,
  section: reqStr,
  problem: reqStr,
  explanation: reqStr,
  recommendation: reqStr,
});

export const ResumeSuggestionSchema = z.object({
  section: reqStr,
  current: optStr,
  problem: reqStr,
  improved: reqStr,
  reason: reqStr,
});

export const IssuesModelSchema = z.object({
  issues: arr(ResumeIssueSchema),
  suggestions: arr(ResumeSuggestionSchema),
});

/* ---------- candidate profile ---------- */
export const CandidateProfileSchema = z.object({
  primaryRole: reqStr,
  alternativeRoles: strList,
  technicalSkills: strList,
  softSkills: strList,
  yearsOfExperience: z.number().nullish().transform((v) => v ?? undefined),
  experienceLevel: reqStr,
  education: strList,
  technologies: strList,
  domains: strList,
  certifications: strList,
  preferredLocations: strList,
});

/* ---------- job match ---------- */
export const JobMatchModelSchema = z.object({
  matchScore: score,
  scoreExplanation: reqStr,
  matchedSkills: strList,
  missingSkills: strList,
  matchedTechnologies: strList,
  missingTechnologies: strList,
  matchedKeywords: strList,
  missingKeywords: strList,
  experienceMatch: level,
  educationMatch: level,
  responsibilitiesMatch: level,
  strengths: strList,
  gaps: strList,
  recommendations: strList,
  summary: reqStr,
});

/* ---------- common requirements ---------- */
export const CommonModelSchema = z.object({
  commonSkills: strList,
  commonTechnologies: strList,
  commonKeywords: strList,
  commonResponsibilities: strList,
  commonQualifications: strList,
  commonExperienceRequirements: strList,
});

/* ---------- optimized resume ---------- */
export const OptimizedModelSchema = z.object({
  resume: ResumeDataSchema,
  changeNotes: strList,
});
