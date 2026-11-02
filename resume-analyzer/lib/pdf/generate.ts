import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ResumeData } from "@/types/resume";

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 50;
const COLOR = rgb(0.1, 0.1, 0.1);
const MUTED = rgb(0.35, 0.35, 0.35);

/** Standard PDF fonts only support WinAnsi; map common Unicode punctuation and drop the rest. */
function clean(s: string): string {
  return s
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[\u00A0\u2009\u202F]/g, " ")
    .replace(/[^\x20-\x7E\xA1-\xFF\u2022]/g, "");
}

export async function generateResumePdf(resume: ResumeData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${clean(resume.name) || "Resume"} - Resume`);
  doc.setProducer("AI Resume Analyzer");
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = doc.addPage(A4);
  let y = A4[1] - MARGIN;
  const width = A4[0] - MARGIN * 2;

  const ensure = (h: number) => {
    if (y - h < MARGIN) {
      page = doc.addPage(A4);
      y = A4[1] - MARGIN;
    }
  };

  const wrap = (text: string, font: PDFFont, size: number, maxWidth: number): string[] => {
    const lines: string[] = [];
    for (const para of clean(text).split("\n")) {
      let line = "";
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const test = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(test, size) <= maxWidth) line = test;
        else {
          if (line) lines.push(line);
          line = word;
        }
      }
      lines.push(line);
    }
    return lines;
  };

  const write = (
    text: string,
    opts: { font?: PDFFont; size?: number; indent?: number; color?: ReturnType<typeof rgb>; gap?: number } = {},
  ) => {
    const { font = regular, size = 10, indent = 0, color = COLOR, gap = 2 } = opts;
    const lh = size * 1.35;
    for (const line of wrap(text, font, size, width - indent)) {
      ensure(lh);
      y -= lh;
      if (line) page.drawText(line, { x: MARGIN + indent, y, size, font, color });
    }
    y -= gap;
  };

  const heading = (title: string) => {
    ensure(34);
    y -= 10;
    write(title.toUpperCase(), { font: bold, size: 11, gap: 1 });
    page.drawLine({
      start: { x: MARGIN, y: y + 1 },
      end: { x: A4[0] - MARGIN, y: y + 1 },
      thickness: 0.6,
      color: MUTED,
    });
    y -= 4;
  };

  const bullets = (text: string) => {
    for (const raw of text.split("\n")) {
      const t = raw.replace(/^\s*[-•*▪◦●]\s*/, "").trim();
      if (!t) continue;
      const lh = 10 * 1.35;
      const lines = wrap(t, regular, 10, width - 14);
      ensure(lh);
      lines.forEach((line, i) => {
        ensure(lh);
        y -= lh;
        if (i === 0) page.drawText("\u2022", { x: MARGIN + 3, y, size: 10, font: regular, color: COLOR });
        page.drawText(line, { x: MARGIN + 14, y, size: 10, font: regular, color: COLOR });
      });
      y -= 1.5;
    }
  };

  const dates = (s?: string, e?: string) => [s, e].filter(Boolean).join(" - ");

  // Header
  if (resume.name) write(resume.name, { font: bold, size: 20, gap: 4 });
  const contact = [resume.email, resume.phone, resume.location, ...(resume.links ?? [])].filter(Boolean);
  if (contact.length) write(contact.join("  |  "), { size: 9.5, color: MUTED, gap: 4 });

  if (resume.summary) {
    heading("Professional Summary");
    write(resume.summary);
  }
  if (resume.skills.length) {
    heading("Technical Skills");
    write(resume.skills.join(", "));
  }
  if (resume.experience.length) {
    heading("Professional Experience");
    for (const e of resume.experience) {
      const title = [e.role, e.company].filter(Boolean).join(" - ");
      write(title, { font: bold, size: 10.5, gap: 0 });
      const d = dates(e.startDate, e.endDate);
      if (d) write(d, { size: 9, color: MUTED, gap: 2 });
      if (e.description) bullets(e.description);
      if (e.technologies?.length) write(`Technologies: ${e.technologies.join(", ")}`, { size: 9, color: MUTED });
      y -= 4;
    }
  }
  if (resume.projects.length) {
    heading("Projects");
    for (const p of resume.projects) {
      write(p.name, { font: bold, size: 10.5, gap: 1 });
      if (p.description) bullets(p.description);
      if (p.technologies?.length) write(`Technologies: ${p.technologies.join(", ")}`, { size: 9, color: MUTED });
      y -= 4;
    }
  }
  if (resume.education.length) {
    heading("Education");
    for (const ed of resume.education) {
      const line = [ed.degree, ed.field].filter(Boolean).join(", ");
      write(ed.institution, { font: bold, size: 10.5, gap: 0 });
      if (line) write(line, { gap: 0 });
      const d = dates(ed.startDate, ed.endDate);
      if (d) write(d, { size: 9, color: MUTED });
      y -= 4;
    }
  }
  if (resume.certifications.length) {
    heading("Certifications");
    bullets(resume.certifications.join("\n"));
  }
  if (resume.achievements.length) {
    heading("Achievements");
    bullets(resume.achievements.join("\n"));
  }
  if (resume.languages.length) {
    heading("Languages");
    write(resume.languages.join(", "));
  }

  return doc.save();
}
