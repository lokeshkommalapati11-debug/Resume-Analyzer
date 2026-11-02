import { computeScore } from "@/lib/scoring";
import type { AppState } from "@/components/providers/AppProvider";
import type { AtsResult, ResumeAnalysis, ResumeIssue, ResumeSuggestion } from "@/types/analysis";
import type { CommonRequirements, Job, JobMatch } from "@/types/jobs";
import type { CandidateProfile, OptimizedResume, ResumeData } from "@/types/resume";
import { JOB_COUNT } from "@/lib/config";
import { apiPost, uploadResumeFile } from "./api";

export const uploadResume = uploadResumeFile;

export async function extractResume(resumeText: string): Promise<ResumeData> {
  const { resume } = await apiPost<{ resume: ResumeData }>("/api/analyze", { step: "extract", resumeText });
  return resume;
}

type ScoreResponse = {
  categories: Parameters<typeof computeScore>[1];
  strengths: string[];
};

export async function analyzeResume(
  resumeText: string,
  resume: ResumeData,
): Promise<{ analysis: ResumeAnalysis; profile: CandidateProfile }> {
  const call = <T>(step: string) => apiPost<T>("/api/analyze", { step, resumeText, resume });
  const [atsRes, scoreRes, issuesRes, profileRes] = await Promise.all([
    call<{ ats: AtsResult }>("ats"),
    call<ScoreResponse>("score"),
    call<{ issues: ResumeIssue[]; suggestions: ResumeSuggestion[] }>("issues"),
    call<{ profile: CandidateProfile }>("profile"),
  ]);
  const score = computeScore(
    { score: atsRes.ats.atsScore, reason: atsRes.ats.explanation },
    scoreRes.categories,
  );
  return {
    analysis: {
      ats: atsRes.ats,
      score,
      strengths: scoreRes.strengths,
      issues: issuesRes.issues,
      suggestions: issuesRes.suggestions,
    },
    profile: profileRes.profile,
  };
}

export async function matchJobs(
  resume: ResumeData,
  resumeText: string,
  jobs: Job[],
  onResult: (jobId: string, match: JobMatch | null) => void,
  concurrency = 3,
): Promise<void> {
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const job = jobs[next++];
      try {
        const { match } = await apiPost<{ match: JobMatch }>("/api/jobs/match", { resume, resumeText, job });
        onResult(job.id, { ...match, jobId: job.id });
      } catch {
        onResult(job.id, null);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));
}

export async function fetchCommonRequirements(jobs: Job[]): Promise<CommonRequirements> {
  const { common } = await apiPost<{ common: CommonRequirements }>("/api/jobs/common", { jobs });
  return common;
}

export async function generateOptimizedResume(
  resume: ResumeData,
  resumeText: string,
  common?: CommonRequirements,
): Promise<OptimizedResume> {
  const { optimized } = await apiPost<{ optimized: OptimizedResume }>("/api/optimize", {
    resume,
    resumeText,
    common,
  });
  return optimized;
}

type Updater = (patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void;

/** Job search -> per-job matching -> common requirements. Never throws; reports via state. */
export async function runJobPhase(args: {
  profile: CandidateProfile;
  resume: ResumeData;
  resumeText: string;
  update: Updater;
  onStep?: (step: "jobs" | "match" | "common", detail?: string) => void;
}): Promise<void> {
  const { profile, resume, resumeText, update, onStep } = args;
  try {
    if (!profile.primaryRole) {
      update({ jobsError: "We couldn't determine a target job role from this resume, so job search was skipped." });
      return;
    }
    onStep?.("jobs");
    update({ jobsError: undefined });
    const { jobs, provider } = await apiPost<{ jobs: Job[]; provider: string }>("/api/jobs", {
      profile,
      limit: JOB_COUNT,
    });
    update({ jobs, jobProvider: provider, matches: {}, common: undefined });
    if (jobs.length === 0) return;

    onStep?.("match", `0/${jobs.length}`);
    let done = 0;
    await matchJobs(resume, resumeText, jobs, (id, m) => {
      done++;
      if (m) update((s) => ({ matches: { ...s.matches, [id]: m } }));
      onStep?.("match", `${done}/${jobs.length}`);
    });

    onStep?.("common");
    try {
      update({ common: await fetchCommonRequirements(jobs) });
    } catch {
      /* The resume page retries this if needed. */
    }
  } catch (e) {
    update({ jobsError: e instanceof Error ? e.message : "Job search failed. Please try again." });
  }
}
