import type { Job, JobSearchProvider, JobSearchQuery } from "@/types/jobs";

/**
 * DEVELOPMENT ONLY (JOB_PROVIDER=mock). These are clearly labelled placeholders so the UI can be
 * exercised without API keys. They are not real jobs and must never be used in production.
 */
export class MockProvider implements JobSearchProvider {
  readonly name = "MOCK DATA (development only)";

  async searchJobs(query: JobSearchQuery): Promise<Job[]> {
    const base = query.keywords || "Developer";
    const jobs: Job[] = [1, 2, 3].map((n) => ({
      id: `mock-${n}`,
      title: `[MOCK] ${base} #${n}`,
      company: "Mock Company (not real)",
      location: "Anywhere",
      description: `MOCK job description for local UI testing only. Looking for a ${base} with experience in JavaScript, TypeScript, React, Git, REST APIs and teamwork. Responsibilities include building features, debugging, code reviews and collaborating with designers. Nice to have: Docker, CI/CD.`,
      url: `https://example.com/mock-jobs/${n}`,
      source: "MOCK DATA (development only)",
      descriptionIsSnippet: false,
    }));
    return jobs.slice(0, query.limit);
  }
}
