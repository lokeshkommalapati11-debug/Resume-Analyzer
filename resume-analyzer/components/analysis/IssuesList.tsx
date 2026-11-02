import { Badge, severityTone } from "@/components/ui/badge";
import type { AtsIssue, ResumeIssue, ResumeSuggestion } from "@/types/analysis";

export function IssuesList({ issues }: { issues: ResumeIssue[] }) {
  if (issues.length === 0) return <p className="text-sm text-slate-500">No significant issues were found.</p>;
  const order = { high: 0, medium: 1, low: 2 } as const;
  return (
    <ul className="space-y-3">
      {[...issues]
        .sort((a, b) => order[a.severity] - order[b.severity])
        .map((i, idx) => (
          <li key={idx} className="rounded-lg border border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={severityTone(i.severity)}>{i.severity}</Badge>
              <Badge>{i.section || "General"}</Badge>
            </div>
            <p className="mt-2 font-medium text-slate-900">{i.problem}</p>
            <p className="mt-1 text-sm text-slate-600">{i.explanation}</p>
            <p className="mt-2 text-sm text-slate-800">
              <span className="font-medium">Recommendation: </span>
              {i.recommendation}
            </p>
          </li>
        ))}
    </ul>
  );
}

export function SuggestionsList({ suggestions }: { suggestions: ResumeSuggestion[] }) {
  if (suggestions.length === 0) return <p className="text-sm text-slate-500">No rewrite suggestions were generated.</p>;
  return (
    <ul className="space-y-3">
      {suggestions.map((s, idx) => (
        <li key={idx} className="rounded-lg border border-slate-200 p-4">
          <Badge tone="indigo">{s.section || "General"}</Badge>
          <p className="mt-2 text-sm text-slate-600">{s.problem}</p>
          {s.current && (
            <div className="mt-3 rounded-md bg-red-50 p-3 text-sm">
              <p className="text-xs font-semibold uppercase text-red-700">Current</p>
              <p className="mt-1 whitespace-pre-line text-slate-800">{s.current}</p>
            </div>
          )}
          <div className="mt-2 rounded-md bg-green-50 p-3 text-sm">
            <p className="text-xs font-semibold uppercase text-green-700">Improved</p>
            <p className="mt-1 whitespace-pre-line text-slate-800">{s.improved}</p>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            <span className="font-medium">Why: </span>
            {s.reason}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function AtsIssuesList({ issues, passed }: { issues: AtsIssue[]; passed: string[] }) {
  return (
    <div className="space-y-4">
      {issues.length === 0 ? (
        <p className="text-sm text-slate-500">No ATS issues detected from the extracted text.</p>
      ) : (
        <ul className="space-y-3">
          {issues.map((i, idx) => (
            <li key={idx} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <Badge tone={severityTone(i.severity)}>{i.severity}</Badge>
                <span className="font-medium text-slate-900">{i.title}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{i.description}</p>
              <p className="mt-1 text-sm text-slate-800">
                <span className="font-medium">Fix: </span>
                {i.suggestion}
              </p>
            </li>
          ))}
        </ul>
      )}
      {passed.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-slate-800">Checks passed</p>
          <ul className="space-y-1 text-sm text-slate-600">
            {passed.map((p) => (
              <li key={p}>✓ {p}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-slate-500">
        AI-based assessment of your resume&apos;s extracted text. Layout details (columns, images, icons) can only be
        inferred, and no score guarantees passing a real employer&apos;s ATS.
      </p>
    </div>
  );
}
