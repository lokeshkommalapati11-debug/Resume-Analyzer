import type { z } from "zod";
import type { JobMatchModelSchema } from "@/lib/gemini/schemas";

export interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  description: string;
  url: string;
  source: string;
  postedDate?: string;
  /** True when the provider only returns a short excerpt of the job description. */
  descriptionIsSnippet?: boolean;
}

export interface JobSearchQuery {
  keywords: string;
  location?: string;
  limit: number;
}

export interface JobSearchProvider {
  readonly name: string;
  searchJobs(query: JobSearchQuery): Promise<Job[]>;
}

export type JobMatch = z.infer<typeof JobMatchModelSchema> & { jobId: string };

export interface RankedTerm {
  name: string;
  jobCount: number;
}

export interface CommonRequirements {
  analyzedJobs: number;
  commonSkills: RankedTerm[];
  commonTechnologies: RankedTerm[];
  commonKeywords: RankedTerm[];
  commonResponsibilities: string[];
  commonQualifications: string[];
  commonExperienceRequirements: string[];
}
