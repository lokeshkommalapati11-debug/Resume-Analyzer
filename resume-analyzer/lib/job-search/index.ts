import { AppError } from "@/lib/api/errors";
import type { Job, JobSearchProvider } from "@/types/jobs";
import type { CandidateProfile } from "@/types/resume";
import { AdzunaProvider } from "./adzuna";
import { MockProvider } from "./mock";
import { RemotiveProvider } from "./remotive";

/** Add a new provider by implementing JobSearchProvider and registering it here. */
export function getJobProvider(): JobSearchProvider {
  const wanted = process.env.JOB_PROVIDER?.toLowerCase();
  const { ADZUNA_APP_ID: id, ADZUNA_APP_KEY: key, ADZUNA_COUNTRY: country } = process.env;

  if (wanted === "mock") return new MockProvider();
  if (wanted === "remotive") return new RemotiveProvider();
  if (wanted === "adzuna" || (!wanted && id && key)) {
    if (!id || !key) {
      throw new AppError(
        "CONFIG",
        "Job search is not configured. Set ADZUNA_APP_ID and ADZUNA_APP_KEY, or use JOB_PROVIDER=remotive.",
        500,
      );
    }
    return new AdzunaProvider(id, key, country || "us");
  }
  return new RemotiveProvider();
}

const dedupeKey = (j: Job) => `${j.title}|${j.company}`.toLowerCase().replace(/\s+/g, " ");

/** Searches the primary role first, then alternative roles, until `limit` unique jobs are found. */
export async function findJobsForProfile(
  profile: Pick<CandidateProfile, "primaryRole" | "alternativeRoles" | "preferredLocations">,
  limit: number,
): Promise<{ jobs: Job[]; provider: string }> {
  const provider = getJobProvider();
  const roles = [profile.primaryRole, ...profile.alternativeRoles]
    .map((r) => r.trim())
    .filter(Boolean)
    .slice(0, 4);
  const location = profile.preferredLocations[0];

  const found = new Map<string, Job>();
  let succeeded = 0;
  let lastError: unknown;

  for (const role of roles) {
    if (found.size >= limit) break;
    try {
      const jobs = await provider.searchJobs({ keywords: role, location, limit: limit * 2 });
      succeeded++;
      for (const job of jobs) {
        if (found.size >= limit) break;
        if (!job.title || !job.url || !job.description) continue;
        if (!found.has(dedupeKey(job))) found.set(dedupeKey(job), job);
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (succeeded === 0 && lastError) {
    console.error("[jobs] provider failed:", provider.name);
    throw new AppError(
      "JOB_API",
      "We couldn't reach the job search service. Please try again in a moment.",
      502,
    );
  }
  return { jobs: [...found.values()].slice(0, limit), provider: provider.name };
}
