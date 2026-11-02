import type { z } from "zod";
import type {
  ResumeDataSchema,
  EducationSchema,
  ExperienceSchema,
  ProjectSchema,
  CandidateProfileSchema,
} from "@/lib/gemini/schemas";

export type ResumeData = z.infer<typeof ResumeDataSchema>;
export type EducationEntry = z.infer<typeof EducationSchema>;
export type ExperienceEntry = z.infer<typeof ExperienceSchema>;
export type ProjectEntry = z.infer<typeof ProjectSchema>;
export type CandidateProfile = z.infer<typeof CandidateProfileSchema>;

export interface OptimizedResume {
  resume: ResumeData;
  /** Skills requested by the jobs that are NOT in the resume. Never added to the resume itself. */
  recommendedToLearn: string[];
  changeNotes: string[];
  /** Verification warnings produced by code (removed unsupported items, unverified figures...). */
  warnings: string[];
}
