import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const FEATURES = [
  ["ATS & resume score", "Transparent, category-by-category scoring with the reasoning behind every number."],
  ["Mistakes & rewrites", "Concrete problems and improved wording - never invented metrics or achievements."],
  ["10 real jobs", "Live listings from a job API, each compared against your resume with matched and missing skills."],
  ["Common requirements", "See which skills and keywords repeat across the jobs, and what to consider learning."],
  ["Optimized resume", "An ATS-friendly single-column resume built only from facts in your own resume."],
  ["Edit & download", "Tweak every section, preview, and export a text-based A4 PDF."],
];

const STEPS = ["Upload PDF or DOCX", "AI analysis & scoring", "Find & match 10 jobs", "Generate, edit, download"];

export default function Landing() {
  return (
    <div className="space-y-14">
      <section className="mx-auto max-w-3xl pt-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Turn your resume into a job-ready, <span className="text-indigo-600">ATS-friendly</span> one
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Upload your resume, get an honest AI review, compare it against real job descriptions, and download an
          optimized version - without a single fabricated skill or achievement.
        </p>
        <div className="mt-8">
          <Link href="/upload" className={buttonClasses("primary", "lg")}>
            Analyze my resume
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
              {i + 1}
            </span>
            <span className="text-sm font-medium text-slate-800">{s}</span>
          </div>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(([title, text]) => (
          <Card key={title}>
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{text}</p>
          </Card>
        ))}
      </section>

      <p className="mx-auto max-w-2xl text-center text-xs text-slate-500">
        Your resume is sent to Google Gemini for analysis and is kept only in this browser tab&apos;s session storage.
        Scores are AI-based estimates, not guarantees.
      </p>
    </div>
  );
}
