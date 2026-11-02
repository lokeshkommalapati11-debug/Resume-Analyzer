import { AppError } from "@/lib/api/errors";
import { MIN_RESUME_CHARS } from "@/lib/config";
import { validateFileMeta } from "@/lib/validation/file";
import { sanitizeResumeText } from "./sanitize";

const startsWith = (buf: Uint8Array, sig: number[]) => sig.every((b, i) => buf[i] === b);

async function parsePdf(buffer: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : text;
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ buffer });
  return value;
}

export async function parseResumeFile(file: File): Promise<string> {
  const metaError = validateFileMeta(file);
  if (metaError) throw new AppError("INVALID_FILE", metaError, 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  const isPdf = file.name.toLowerCase().endsWith(".pdf");

  // Check magic bytes rather than trusting the extension / MIME type.
  if (isPdf && !startsWith(buffer, [0x25, 0x50, 0x44, 0x46])) {
    throw new AppError("CORRUPT_FILE", "This file does not look like a valid PDF.", 400);
  }
  if (!isPdf && !startsWith(buffer, [0x50, 0x4b])) {
    throw new AppError("CORRUPT_FILE", "This file does not look like a valid DOCX document.", 400);
  }

  let raw: string;
  try {
    raw = isPdf ? await parsePdf(buffer) : await parseDocx(buffer);
  } catch {
    throw new AppError(
      "PARSE_FAILED",
      "We couldn't read this file. It may be corrupted or password-protected. Try re-exporting it.",
      422,
    );
  }

  const text = sanitizeResumeText(raw);
  if (text.length < MIN_RESUME_CHARS) {
    throw new AppError(
      "EMPTY_RESUME",
      isPdf
        ? "We couldn't find readable text. If this PDF is a scan or image, export a text-based PDF or upload a DOCX."
        : "We couldn't find enough readable text in this document.",
      422,
    );
  }
  return text;
}
