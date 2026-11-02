// NEXT_PUBLIC_* must be referenced literally so Next can inline it for the client bundle.
const parsedMb = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB);

export const MAX_UPLOAD_MB = Number.isFinite(parsedMb) && parsedMb > 0 ? parsedMb : 5;
export const MAX_UPLOAD_BYTES = Math.floor(MAX_UPLOAD_MB * 1024 * 1024);
export const ALLOWED_EXTENSIONS = [".pdf", ".docx"] as const;
export const MIN_RESUME_CHARS = 80;
export const MAX_RESUME_CHARS = 30_000;
export const MAX_JD_CHARS = 6_000;
export const JOB_COUNT = 10;
