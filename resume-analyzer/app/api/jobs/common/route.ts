import { NextResponse } from "next/server";
import { readJson, withErrorHandling } from "@/lib/api/errors";
import { analyzeCommonRequirements } from "@/lib/gemini/service";
import { CommonRequestSchema } from "@/lib/validation/api";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = withErrorHandling(async (req) => {
  const { jobs } = await readJson(req, CommonRequestSchema);
  return NextResponse.json({ common: await analyzeCommonRequirements(jobs) });
});
