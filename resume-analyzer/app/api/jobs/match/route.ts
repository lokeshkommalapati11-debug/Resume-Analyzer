import { NextResponse } from "next/server";
import { readJson, withErrorHandling } from "@/lib/api/errors";
import { matchJob } from "@/lib/gemini/service";
import { MatchRequestSchema } from "@/lib/validation/api";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = withErrorHandling(async (req) => {
  const { resume, resumeText, job } = await readJson(req, MatchRequestSchema);
  return NextResponse.json({ match: await matchJob(resume, resumeText, job) });
});
