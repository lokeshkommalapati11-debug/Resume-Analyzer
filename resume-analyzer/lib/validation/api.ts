import { z } from "zod";
import { MAX_JD_CHARS, MAX_RESUME_CHARS } from "@/lib/config";
import { ResumeDataSchema } from "@/lib/gemini/schemas";

export const resumeText = z.string().min(50).max(MAX_RESUME_CHARS + 1000);

export const JobSchema = z.object({
  id: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  company: z.string().max(300),
  location: z.string().max(300).optional(),
  description: z.string().max(MAX_JD_CHARS * 10),
  url: z
    .string()
    .max(2000)
    .refine((u) => /^https?:\/\//i.test(u), "URL must be http(s)"),
  source: z.string().max(100),
  postedDate: z.string().max(100).optional(),
  descriptionIsSnippet: z.boolean().optional(),
});

const rankedTerm = z.object({ name: z.string().max(200), jobCount: z.number() });
const shortList = z.array(z.string().max(500)).max(50);

export const CommonRequirementsSchema = z.object({
  analyzedJobs: z.number(),
  commonSkills: z.array(rankedTerm).max(50),
  commonTechnologies: z.array(rankedTerm).max(50),
  commonKeywords: z.array(rankedTerm).max(50),
  commonResponsibilities: shortList,
  commonQualifications: shortList,
  commonExperienceRequirements: shortList,
});

export const AnalyzeRequestSchema = z.discriminatedUnion("step", [
  z.object({ step: z.literal("extract"), resumeText }),
  z.object({ step: z.literal("ats"), resumeText, resume: ResumeDataSchema }),
  z.object({ step: z.literal("score"), resumeText, resume: ResumeDataSchema }),
  z.object({ step: z.literal("issues"), resumeText, resume: ResumeDataSchema }),
  z.object({ step: z.literal("profile"), resumeText, resume: ResumeDataSchema }),
]);

export const JobsRequestSchema = z.object({
  profile: z.object({
    primaryRole: z.string().min(1).max(200),
    alternativeRoles: z.array(z.string().max(200)).max(10).default([]),
    technicalSkills: z.array(z.string().max(200)).max(60).default([]),
    preferredLocations: z.array(z.string().max(200)).max(5).default([]),
  }),
  limit: z.number().int().min(1).max(10).default(10),
});

export const MatchRequestSchema = z.object({
  resume: ResumeDataSchema,
  resumeText,
  job: JobSchema,
});

export const CommonRequestSchema = z.object({ jobs: z.array(JobSchema).min(1).max(10) });

export const OptimizeRequestSchema = z.object({
  resume: ResumeDataSchema,
  resumeText,
  common: CommonRequirementsSchema.optional(),
});

export const PdfRequestSchema = z.object({ resume: ResumeDataSchema });
