import { z } from "zod";
import type { Job, JobSearchProvider, JobSearchQuery } from "@/types/jobs";
import { htmlToText } from "./html";

const ResponseSchema = z.object({
  jobs: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]),
        url: z.string(),
        title: z.string(),
        company_name: z.string(),
        candidate_required_location: z.string().optional(),
        publication_date: z.string().optional(),
        description: z.string().default(""),
      }),
    )
    .default([]),
});

/**
 * Remotive public API (https://github.com/remotive-io/remote-jobs-api). No key needed.
 * Remote jobs only. Their terms ask for attribution/backlinks and infrequent requests.
 */
export class RemotiveProvider implements JobSearchProvider {
  readonly name = "Remotive";

  async searchJobs(query: JobSearchQuery): Promise<Job[]> {
    const params = new URLSearchParams({ search: query.keywords, limit: String(query.limit) });
    const res = await fetch(`https://remotive.com/api/remote-jobs?${params}`, {
      signal: AbortSignal.timeout(15_000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Remotive responded with ${res.status}`);
    const data = ResponseSchema.parse(await res.json());

    return data.jobs.map((j) => ({
      id: `remotive-${j.id}`,
      title: j.title,
      company: j.company_name,
      location: j.candidate_required_location || "Remote",
      description: htmlToText(j.description),
      url: j.url,
      source: "Remotive",
      postedDate: j.publication_date,
      descriptionIsSnippet: false,
    }));
  }
}
