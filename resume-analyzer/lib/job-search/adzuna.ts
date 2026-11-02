import { z } from "zod";
import type { Job, JobSearchProvider, JobSearchQuery } from "@/types/jobs";

const ResponseSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]),
        title: z.string(),
        description: z.string().default(""),
        redirect_url: z.string(),
        created: z.string().optional(),
        company: z.object({ display_name: z.string().optional() }).optional(),
        location: z.object({ display_name: z.string().optional() }).optional(),
      }),
    )
    .default([]),
});

const strip = (s: string) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

/**
 * Adzuna Jobs API (https://developer.adzuna.com/). Free API keys required.
 * NOTE: Adzuna only returns a short excerpt of each description, flagged via descriptionIsSnippet.
 */
export class AdzunaProvider implements JobSearchProvider {
  readonly name = "Adzuna";

  constructor(
    private appId: string,
    private appKey: string,
    private country = "us",
  ) {}

  async searchJobs(query: JobSearchQuery): Promise<Job[]> {
    const params = new URLSearchParams({
      app_id: this.appId,
      app_key: this.appKey,
      results_per_page: String(Math.min(query.limit, 50)),
      what: query.keywords,
      "content-type": "application/json",
    });
    if (query.location) params.set("where", query.location);

    const res = await fetch(
      `https://api.adzuna.com/v1/api/jobs/${encodeURIComponent(this.country)}/search/1?${params}`,
      { signal: AbortSignal.timeout(15_000), cache: "no-store" },
    );
    if (!res.ok) throw new Error(`Adzuna responded with ${res.status}`);
    const data = ResponseSchema.parse(await res.json());

    return data.results.map((r) => ({
      id: `adzuna-${r.id}`,
      title: strip(r.title),
      company: r.company?.display_name ?? "Company not listed",
      location: r.location?.display_name,
      description: strip(r.description),
      url: r.redirect_url,
      source: "Adzuna",
      postedDate: r.created,
      descriptionIsSnippet: true,
    }));
  }
}
