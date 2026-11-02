import { MAX_RESUME_CHARS } from "@/lib/config";

/** Normalises extracted text: strips control chars, tames whitespace, caps length. */
export function sanitizeResumeText(input: string): string {
  return (
    input
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .replace(/\r\n?/g, "\n")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/ ?\n ?/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, MAX_RESUME_CHARS)
  );
}
