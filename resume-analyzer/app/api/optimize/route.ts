import { NextResponse } from "next/server";
import { readJson, withErrorHandling } from "@/lib/api/errors";
import { optimizeResume } from "@/lib/gemini/service";
import { OptimizeRequestSchema } from "@/lib/validation/api";

export const runtime = "nodejs";
export const maxDuration = 120;

export const POST = withErrorHandling(async (req) => {
  const { resume, resumeText, common } = await readJson(req, OptimizeRequestSchema);
  return NextResponse.json({ optimized: await optimizeResume(resume, resumeText, common) });
});
