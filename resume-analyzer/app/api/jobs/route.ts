import { NextResponse } from "next/server";
import { readJson, withErrorHandling } from "@/lib/api/errors";
import { findJobsForProfile } from "@/lib/job-search";
import { JobsRequestSchema } from "@/lib/validation/api";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = withErrorHandling(async (req) => {
  const { profile, limit } = await readJson(req, JobsRequestSchema);
  const { jobs, provider } = await findJobsForProfile(profile, limit);
  // An empty list is a valid result: we never pad with fabricated jobs.
  return NextResponse.json({ jobs, provider, requested: limit });
});
