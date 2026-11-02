import { AppError } from "@/lib/api/errors";
import { MAX_JD_CHARS } from "@/lib/config";
import { atsStatus } from "@/lib/scoring";
import { runAtsHeuristics } from "@/lib/scoring/heuristics";
import { appearsIn, dedupeCaseInsensitive } from "@/lib/text/match";
import type { AtsResult } from "@/types/analysis";
import type { CommonRequirements, Job, JobMatch, RankedTerm } from "@/types/jobs";
import type { CandidateProfile, OptimizedResume, ResumeData } from "@/types/resume";
import { generateJson } from "./client";
import * as prompts from "./prompts";
import {
  AtsModelSchema,
  CandidateProfileSchema,
  CommonModelSchema,
  IssuesModelSchema,
  JobMatchModelSchema,
  OptimizedModelSchema,
  ResumeDataSchema,
  ScoringModelSchema,
} from "./schemas";

const json = (v: unknown) => JSON.stringify(v);

/* ---------- resume analysis ---------- */

export async function extractResumeData(text: string): Promise<ResumeData> {
  return generateJson({
    prompt: prompts.resumeExtractionPrompt(text),
    schema: ResumeDataSchema,
    temperature: 0.1,
  });
}

export async function analyzeAts(text: string, resume: ResumeData): Promise<AtsResult> {
  const heuristics = runAtsHeuristics(text);
  const r = await generateJson({
    prompt: prompts.atsPrompt(text, json(resume), json(heuristics)),
    schema: AtsModelSchema,
  });
  return { ...r, status: atsStatus(r.atsScore) };
}

export async function scoreResume(text: string, resume: ResumeData) {
  return generateJson({
    prompt: prompts.scoringPrompt(text, json(resume)),
    schema: ScoringModelSchema,
  });
}

export async function detectIssues(text: string, resume: ResumeData) {
  const r = await generateJson({
    prompt: prompts.issuesPrompt(text, json(resume)),
    schema: IssuesModelSchema,
  });
  // A suggestion's "current" text must really exist in the resume; otherwise drop the claim.
  const flat = text.replace(/\s+/g, " ").toLowerCase();
  r.suggestions = r.suggestions.map((s) =>
    s.current && !flat.includes(s.current.replace(/\s+/g, " ").toLowerCase().slice(0, 40))
      ? { ...s, current: undefined }
      : s,
  );
  return r;
}

export async function extractProfile(text: string, resume: ResumeData): Promise<CandidateProfile> {
  return generateJson({
    prompt: prompts.profilePrompt(text, json(resume)),
    schema: CandidateProfileSchema,
  });
}

/* ---------- job matching ---------- */

export async function matchJob(resume: ResumeData, text: string, job: Job): Promise<JobMatch> {
  const description = job.description.slice(0, MAX_JD_CHARS);
  const raw = await generateJson({
    prompt: prompts.jobMatchPrompt(text, resume.skills, {
      title: job.title,
      company: job.company,
      description,
      snippet: Boolean(job.descriptionIsSnippet),
    }),
    schema: JobMatchModelSchema,
  });

  // Verify model claims against the source texts.
  const corpus = `${text}\n${resume.skills.join("\n")}`;
  const reconcile = (matched: string[], missing: string[]): [string[], string[]] => {
    const m: string[] = [];
    const x: string[] = [];
    for (const term of dedupeCaseInsensitive([...matched, ...missing])) {
      if (appearsIn(corpus, term)) m.push(term);
      else if (appearsIn(description, term)) x.push(term);
    }
    return [m, x];
  };
  const [matchedSkills, missingSkills] = reconcile(raw.matchedSkills, raw.missingSkills);
  const [matchedTechnologies, missingTechnologies] = reconcile(
    raw.matchedTechnologies,
    raw.missingTechnologies,
  );
  const [matchedKeywords, missingKeywords] = reconcile(raw.matchedKeywords, raw.missingKeywords);

  return {
    ...raw,
    matchedSkills,
    missingSkills,
    matchedTechnologies,
    missingTechnologies,
    matchedKeywords,
    missingKeywords,
    jobId: job.id,
  };
}

/* ---------- common requirements ---------- */

export async function analyzeCommonRequirements(jobs: Job[]): Promise<CommonRequirements> {
  if (jobs.length === 0) throw new AppError("NO_JOBS", "There are no jobs to analyze.", 400);
  const trimmed = jobs.map((j) => ({
    title: j.title,
    company: j.company,
    description: j.description.slice(0, 3500),
  }));
  const raw = await generateJson({
    prompt: prompts.commonRequirementsPrompt(trimmed),
    schema: CommonModelSchema,
  });

  // Frequencies are counted in code from the real descriptions, not trusted from the model.
  const minJobs = jobs.length >= 5 ? 2 : 1;
  const rank = (terms: string[]): RankedTerm[] =>
    dedupeCaseInsensitive(terms)
      .map((name) => ({ name, jobCount: jobs.filter((j) => appearsIn(j.description, name)).length }))
      .filter((t) => t.jobCount >= minJobs)
      .sort((a, b) => b.jobCount - a.jobCount)
      .slice(0, 25);

  return {
    analyzedJobs: jobs.length,
    commonSkills: rank(raw.commonSkills),
    commonTechnologies: rank(raw.commonTechnologies),
    commonKeywords: rank(raw.commonKeywords),
    commonResponsibilities: raw.commonResponsibilities.slice(0, 12),
    commonQualifications: raw.commonQualifications.slice(0, 12),
    commonExperienceRequirements: raw.commonExperienceRequirements.slice(0, 8),
  };
}

/* ---------- optimized resume ---------- */

export async function optimizeResume(
  resume: ResumeData,
  text: string,
  common?: CommonRequirements,
): Promise<OptimizedResume> {
  const commonForPrompt = common
    ? {
        skills: common.commonSkills.map((t) => t.name),
        technologies: common.commonTechnologies.map((t) => t.name),
        keywords: common.commonKeywords.map((t) => t.name),
        responsibilities: common.commonResponsibilities,
        qualifications: common.commonQualifications,
      }
    : { note: "No job data available. Only improve clarity and wording." };

  const raw = await generateJson({
    prompt: prompts.optimizeResumePrompt(text, json(resume), json(commonForPrompt)),
    schema: OptimizedModelSchema,
    temperature: 0.3,
  });

  const warnings: string[] = [];
  const out = raw.resume;
  const supported = (value: string) => !value || appearsIn(text, value);

  // Anti-fabrication guard: anything not traceable to the original resume text is removed.
  const skills = out.skills.filter((s) => {
    const ok = appearsIn(`${text}\n${resume.skills.join("\n")}`, s);
    if (!ok) warnings.push(`Removed skill "${s}" because it is not in your original resume.`);
    return ok;
  });
  const experience = out.experience.filter((e) => {
    const ok = supported(e.company) && Boolean(e.company || e.role);
    if (!ok) warnings.push(`Removed experience at "${e.company}" because it was not found in your original resume.`);
    return ok;
  });
  const education = out.education.filter((e) => {
    const ok = supported(e.institution);
    if (!ok) warnings.push(`Removed education entry "${e.institution}" because it was not found in your original resume.`);
    return ok;
  });
  const projects = out.projects.filter((p) => {
    const ok = supported(p.name);
    if (!ok) warnings.push(`Removed project "${p.name}" because it was not found in your original resume.`);
    return ok;
  });
  const certifications = out.certifications.filter((c) => {
    const ok = supported(c);
    if (!ok) warnings.push(`Removed certification "${c}" because it was not found in your original resume.`);
    return ok;
  });

  // Never lose sections that existed originally (e.g. model dropped an entry).
  if (experience.length < resume.experience.length) {
    warnings.push("Some work experience entries from your original resume are missing. Please review the result.");
  }

  const optimized: ResumeData = {
    ...out,
    // Contact details are copied from the original, never regenerated.
    name: resume.name || out.name,
    email: resume.email,
    phone: resume.phone,
    location: resume.location,
    links: resume.links,
    skills,
    experience,
    education,
    projects,
    certifications,
    achievements: out.achievements,
    languages: resume.languages,
  };

  // Flag figures (percentages, amounts) that do not appear in the original resume.
  const original = new Set(text.match(/\d[\d,.]*%?/g) ?? []);
  const generatedText = [
    optimized.summary ?? "",
    ...optimized.experience.map((e) => e.description),
    ...optimized.projects.map((p) => p.description),
    ...optimized.achievements,
  ].join("\n");
  const unsupported = dedupeCaseInsensitive(
    (generatedText.match(/\d[\d,.]*%?/g) ?? []).filter((n) => !original.has(n)),
  );
  if (unsupported.length) {
    warnings.push(
      `These figures were not found in your original resume - verify or remove them: ${unsupported.join(", ")}.`,
    );
  }

  // "Recommended to learn": requested by jobs but absent from the resume. Computed in code.
  const recommendedToLearn = common
    ? dedupeCaseInsensitive(
        [...common.commonSkills, ...common.commonTechnologies].map((t) => t.name),
      )
        .filter((t) => !appearsIn(`${text}\n${resume.skills.join("\n")}`, t))
        .slice(0, 15)
    : [];

  return { resume: optimized, recommendedToLearn, changeNotes: raw.changeNotes, warnings };
}
