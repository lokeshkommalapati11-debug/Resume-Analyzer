import { NextResponse } from "next/server";
import { AppError, withErrorHandling } from "@/lib/api/errors";
import { parseResumeFile } from "@/lib/resume-parser";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = withErrorHandling(async (req) => {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new AppError("INVALID_REQUEST", "Please upload a PDF or DOCX file.", 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) throw new AppError("INVALID_REQUEST", "No file was uploaded.", 400);

  const text = await parseResumeFile(file);
  return NextResponse.json({ text, fileName: file.name, characters: text.length });
});
