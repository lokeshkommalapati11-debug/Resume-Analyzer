import { ALLOWED_EXTENSIONS, MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "@/lib/config";

/** Shared by the browser (fast feedback) and the server (authoritative check). */
export function validateFileMeta(file: { name: string; size: number }): string | null {
  const lower = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    return "Unsupported file type. Please upload a PDF or DOCX resume.";
  }
  if (file.size === 0) return "This file is empty. Please choose a different file.";
  if (file.size > MAX_UPLOAD_BYTES) {
    return `This file is too large. The maximum size is ${MAX_UPLOAD_MB} MB.`;
  }
  return null;
}
