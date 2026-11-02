# AI Resume Analyzer

Upload a resume (PDF/DOCX), analyze it with **Google Gemini**, find up to 10 **real** job listings, compare your resume with each job description, and generate an editable, ATS-friendly optimized resume you can download as a text-based PDF.

The app never invents jobs, candidate facts, skills, metrics or certifications. Where a job asks for a skill the resume doesn't show, it is listed as **Recommended to learn** instead of being added to the resume.

## Features

- Drag-and-drop upload with validation (type, size, empty/corrupt files, magic-byte check) and upload progress
- PDF and DOCX text extraction, normalized into a typed `ResumeData` object
- Gemini analysis: ATS assessment, category scores with reasons, mistakes, rewrite suggestions, candidate profile
- Job search behind a provider interface (Adzuna, Remotive, dev-only mock)
- Per-job resume ↔ JD matching with matched/missing skills, technologies and keywords
- Common requirements across all found jobs (frequencies counted in code from the real descriptions)
- Optimized resume generation with anti-fabrication checks, in-browser editor, preview, A4 PDF export

## Tech stack

Next.js 15 (App Router) · TypeScript (strict) · React 19 · Tailwind CSS 3 · `@google/genai` · Zod · `unpdf` (PDF parsing) · `mammoth` (DOCX parsing) · `pdf-lib` (PDF generation)

## Architecture

```
app/                     Pages (landing, upload, dashboard, jobs, jobs/[id], resume) + API routes
  api/resume/parse       File upload -> validated, sanitized text
  api/analyze            One Gemini operation per `step`: extract | ats | score | issues | profile
  api/jobs               Job search via provider
  api/jobs/match         Resume <-> one job description
  api/jobs/common        Common requirements across jobs
  api/optimize           Optimized resume generation
  api/resume/pdf         Resume JSON -> PDF (selectable text, A4, single column)
components/              ui/ · upload/ · analysis/ · jobs/ · resume/ · layout/ · providers/
lib/
  gemini/                client.ts (JSON mode, retry, Zod validation) · prompts.ts · schemas.ts · service.ts
  resume-parser/         PDF/DOCX parsing + sanitizing
  job-search/            provider interface + adzuna / remotive / mock
  scoring/               weighted scoring (computed in code) + ATS heuristics
  pdf/                   pdf-lib generator
  validation/            request + file schemas
  client/                fetch helpers and the client-side pipeline
types/                   resume.ts · jobs.ts · analysis.ts (inferred from Zod schemas)
```

**How trust is enforced in code (not just prompts)**

- Every Gemini response is parsed as JSON and validated with Zod; invalid output triggers a retry with feedback, then a safe error.
- The overall resume score is a weighted average computed by the app from per-category scores (weights in `lib/scoring/index.ts`).
- Matched skills must appear in the resume text; "missing" skills must appear in the job description (`matchJob`).
- Common-requirement frequencies are counted from the actual job descriptions.
- In the optimized resume, skills/companies/institutions/projects/certifications not traceable to the original text are removed and reported as warnings; unfamiliar numbers/percentages are flagged. Contact details are copied from the original, never regenerated.
- "Recommended to learn" is computed in code (job-requested skills absent from the resume).

## Installation

Requires Node.js 18.18+ (Node 20+ recommended).

```bash
npm install
cp .env.example .env.local     # then edit .env.local
npm run dev                    # http://localhost:3000
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | yes | Gemini API key (server-side only) |
| `GEMINI_MODEL` | no | Default `gemini-2.5-flash` |
| `NEXT_PUBLIC_MAX_UPLOAD_MB` | no | Max upload size in MB (default 5) |
| `JOB_PROVIDER` | no | `adzuna`, `remotive` or `mock`. Default: Adzuna if keys are set, otherwise Remotive |
| `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | for Adzuna | Free keys from developer.adzuna.com |
| `ADZUNA_COUNTRY` | no | `us`, `gb`, `in`, `au`, `ca`, ... (default `us`) |

Secrets live in `.env.local` (git-ignored). Only `NEXT_PUBLIC_MAX_UPLOAD_MB` is exposed to the browser.

## Gemini API setup

1. Create a key at <https://aistudio.google.com/apikey>.
2. Put it in `.env.local` as `GEMINI_API_KEY`.
3. Free-tier keys have rate limits; the client retries 429/5xx with backoff. A full run makes about 6 + 10 + 2 model calls (extraction, ATS/score/issues/profile, one per job, common requirements, later optimization).

## Job API setup

- **Adzuna (recommended, all countries above):** register at <https://developer.adzuna.com/>, set `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, and `ADZUNA_COUNTRY`. Adzuna returns only a short **excerpt** of each description; the UI labels this and matching is less complete.
- **Remotive (no key):** remote jobs only, full descriptions. Their terms ask for attribution and infrequent requests; results are cached for an hour. Review their terms before production use.
- **Mock:** `JOB_PROVIDER=mock` shows three clearly labelled placeholder jobs for UI testing. Never use in production.
- **Add a provider:** implement `JobSearchProvider` (`types/jobs.ts`) and register it in `lib/job-search/index.ts`.

If fewer than 10 real jobs are found, the app shows the number actually found.

## Commands

```bash
npm run dev        # development server
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npm run build      # production build
npm start          # run production build
```

## Deployment

Works on any Node host (Vercel, Docker, etc.). Set the environment variables in the host's dashboard. Analysis routes set `maxDuration` up to 120 s; some plans (e.g. Vercel Hobby) cap functions at lower limits, so use a plan that allows it or a self-hosted Node server. Routes use the Node.js runtime (not Edge).

## Security considerations

- Gemini and job-API keys are used only in server code; nothing secret reaches the client.
- Uploads are validated by extension, size, non-empty check and magic bytes; extracted text is sanitized and length-capped.
- All API inputs are validated with Zod; job URLs must be `http(s)`; external links use `rel="noopener noreferrer"`.
- Resume text is never logged; API errors are mapped to generic messages.
- Prompts wrap resume/JD text in tags and instruct the model to treat it as data (prompt-injection mitigation - not a complete guarantee).
- Your resume is sent to Google Gemini for processing; review Google's terms/privacy for your use. State is kept in the browser's `sessionStorage` only (no database).

## Known limitations

- **No authentication or rate limiting.** Add both before exposing publicly, or anyone can spend your Gemini quota.
- Scanned/image-only PDFs are not OCR'd; use a text-based PDF or DOCX.
- ATS analysis sees extracted text, not the original layout, so columns/images/icons are inferred only from text artefacts. Scores are AI estimates, not guarantees.
- Job descriptions from Adzuna are excerpts; Remotive is remote-only.
- Standard PDF fonts only support Latin characters; other scripts are dropped in the PDF.
- Session state is per-tab; closing the tab clears it.
- The project was generated without an installed toolchain: run `npm install && npm run typecheck && npm run build` first and fix any version-related type errors.
