import { NextResponse } from "next/server";
import { readJson, withErrorHandling } from "@/lib/api/errors";
import {
  analyzeAts,
  detectIssues,
  extractProfile,
  extractResumeData,
  scoreResume,
} from "@/lib/gemini/service";
import { AnalyzeRequestSchema } from "@/lib/validation/api";

export const runtime = "nodejs";
export const maxDuration = 120;

/** One endpoint, one Gemini operation per `step`, so the UI can show granular progress. */
export const POST = withErrorHandling(async (req) => {
  const body = await readJson(req, AnalyzeRequestSchema);

  switch (body.step) {
    case "extract":
      return NextResponse.json({ resume: await extractResumeData(body.resumeText) });
    case "ats":
      return NextResponse.json({ ats: await analyzeAts(body.resumeText, body.resume) });
    case "score":
      return NextResponse.json(await scoreResume(body.resumeText, body.resume));
    case "issues":
      return NextResponse.json(await detectIssues(body.resumeText, body.resume));
    case "profile":
      return NextResponse.json({ profile: await extractProfile(body.resumeText, body.resume) });
  }
});
