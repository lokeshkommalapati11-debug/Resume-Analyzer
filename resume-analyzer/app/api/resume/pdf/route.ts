import { readJson, withErrorHandling } from "@/lib/api/errors";
import { generateResumePdf } from "@/lib/pdf/generate";
import { PdfRequestSchema } from "@/lib/validation/api";

export const runtime = "nodejs";

export const POST = withErrorHandling(async (req) => {
  const { resume } = await readJson(req, PdfRequestSchema);
  const bytes = await generateResumePdf(resume);
  const safeName =
    (resume.name || "resume").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 60) ||
    "resume";
  return new Response(Buffer.from(bytes) as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}_Optimized_Resume.pdf"`,
      "Cache-Control": "no-store",
    },
  });
});
