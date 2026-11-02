"use client";

import Link from "next/link";
import { AtsIssuesList, IssuesList, SuggestionsList } from "@/components/analysis/IssuesList";
import { CategoryBreakdown } from "@/components/analysis/CategoryBreakdown";
import { matchTone } from "@/components/jobs/JobCard";
import { RequireResume } from "@/components/layout/RequireResume";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/ui/score-ring";
import { Tabs } from "@/components/ui/tabs";

export default function DashboardPage() {
  return (
    <RequireResume>
      {({ analysis, fileName, jobs, matches, jobsError }) => {
        const ranked = jobs
          .map((job) => ({ job, match: matches[job.id] }))
          .sort((a, b) => (b.match?.matchScore ?? -1) - (a.match?.matchScore ?? -1));

        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Resume dashboard</h1>
              {fileName && <p className="text-sm text-slate-500">{fileName}</p>}
            </div>

            <Card>
              <div className="grid items-center gap-6 sm:grid-cols-[auto_auto_1fr]">
                <ScoreRing score={analysis.ats.atsScore} label="ATS Score" />
                <ScoreRing score={analysis.score.overallScore} label="Resume Score" />
                <div className="space-y-2 text-sm text-slate-600">
                  <Badge tone={analysis.ats.status === "Excellent" || analysis.ats.status === "Good" ? "green" : "amber"}>
                    ATS: {analysis.ats.status}
                  </Badge>
                  <p>{analysis.ats.explanation}</p>
                  <p className="text-xs text-slate-500">
                    AI-based assessments. They do not guarantee passing a real employer&apos;s ATS or getting an interview.
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardTitle title="Resume strengths" />
                {analysis.strengths.length === 0 ? (
                  <p className="text-sm text-slate-500">No specific strengths were identified.</p>
                ) : (
                  <ul className="space-y-2 text-sm text-slate-700">
                    {analysis.strengths.map((s) => (
                      <li key={s} className="flex gap-2">
                        <span className="text-green-600" aria-hidden>
                          ✓
                        </span>
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <Card>
                <CardTitle title="Score breakdown" description="Why each category got its score" />
                <CategoryBreakdown score={analysis.score} />
              </Card>
            </div>

            <Card>
              <CardTitle title="Mistakes & suggestions" />
              <Tabs
                tabs={[
                  { id: "issues", label: `Mistakes (${analysis.issues.length})`, content: <IssuesList issues={analysis.issues} /> },
                  {
                    id: "suggestions",
                    label: `Suggestions (${analysis.suggestions.length})`,
                    content: <SuggestionsList suggestions={analysis.suggestions} />,
                  },
                  {
                    id: "ats",
                    label: `ATS check (${analysis.ats.issues.length})`,
                    content: <AtsIssuesList issues={analysis.ats.issues} passed={analysis.ats.passedChecks} />,
                  },
                ]}
              />
            </Card>

            <Card>
              <CardTitle
                title="Top job matches"
                action={
                  <Link href="/jobs" className={buttonClasses("secondary", "sm")}>
                    View all jobs
                  </Link>
                }
              />
              {jobsError && <Alert tone="warning" title="Job search issue">{jobsError}</Alert>}
              {!jobsError && ranked.length === 0 && (
                <p className="text-sm text-slate-500">No matching jobs were found for this profile right now.</p>
              )}
              <ul className="divide-y divide-slate-100">
                {ranked.slice(0, 5).map(({ job, match }) => (
                  <li key={job.id} className="flex items-center gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/jobs/${encodeURIComponent(job.id)}`} className="block truncate font-medium text-slate-900 hover:text-indigo-700">
                        {job.title}
                      </Link>
                      <p className="truncate text-sm text-slate-500">{job.company}</p>
                    </div>
                    {match ? (
                      <div className="flex w-40 items-center gap-2">
                        <Progress value={match.matchScore} />
                        <Badge tone={matchTone(match.matchScore)}>{match.matchScore}%</Badge>
                      </div>
                    ) : (
                      <Badge>Not analyzed</Badge>
                    )}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="flex flex-wrap items-center justify-between gap-4 bg-indigo-50">
              <div>
                <h2 className="font-semibold text-slate-900">Generate optimized resume</h2>
                <p className="text-sm text-slate-600">
                  Built only from facts in your resume, tuned to the common requirements of the jobs found.
                </p>
              </div>
              <Link href="/resume" className={buttonClasses("primary", "lg")}>
                Generate Optimized Resume
              </Link>
            </Card>
          </div>
        );
      }}
    </RequireResume>
  );
}
