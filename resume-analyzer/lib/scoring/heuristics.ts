/** Deterministic checks on extracted text. Passed to the model as ground truth for ATS analysis. */
const HEADINGS: Record<string, RegExp> = {
  summary: /\b(summary|profile|objective|about me)\b/i,
  skills: /\bskills\b/i,
  experience: /\b(experience|employment|work history)\b/i,
  education: /\beducation\b/i,
  projects: /\bprojects?\b/i,
  certifications: /\b(certifications?|licenses?)\b/i,
  achievements: /\b(achievements?|awards?|accomplishments?)\b/i,
};

export interface AtsHeuristics {
  hasEmail: boolean;
  hasPhone: boolean;
  detectedSections: string[];
  missingCoreSections: string[];
  wordCount: number;
  nonStandardCharRatio: number;
  shortLineRatio: number;
  bulletLineCount: number;
}

export function runAtsHeuristics(text: string): AtsHeuristics {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const detected = Object.entries(HEADINGS)
    .filter(([, re]) => lines.some((l) => l.length <= 40 && re.test(l)))
    .map(([k]) => k);
  const core = ["experience", "education", "skills"];
  const nonStandard = (
    text.match(/[^\x20-\x7E\n\t\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022]/g) ?? []
  ).length;
  return {
    hasEmail: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text),
    hasPhone: /(\+?\d[\d\s().-]{7,}\d)/.test(text),
    detectedSections: detected,
    missingCoreSections: core.filter((c) => !detected.includes(c)),
    wordCount: text.split(/\s+/).filter(Boolean).length,
    nonStandardCharRatio: text.length ? Number((nonStandard / text.length).toFixed(4)) : 0,
    shortLineRatio: lines.length
      ? Number((lines.filter((l) => l.length < 25).length / lines.length).toFixed(2))
      : 0,
    bulletLineCount: lines.filter((l) => /^[-•*▪◦●]/.test(l)).length,
  };
}
