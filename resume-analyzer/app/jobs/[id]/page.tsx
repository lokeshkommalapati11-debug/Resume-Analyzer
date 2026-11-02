"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { matchTone } from "@/components/jobs/JobCard";
import { RequireResume } from "@/components/layout/RequireResume";
import { Alert } from "@/components/ui/alert";
import { Badge, ChipList } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ScoreRing } from "@/components/ui/score-ring";
import { isHttpUrl } from "@/lib/utils";

const levelTone = { strong: "green", moderate: "amber", weak: "red", unclear: "gray" } as const;

function decode(id: string) {
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const id = decode(params.id);

  return (
    <RequireResume>
      {({ jobs, matches }) => {
        const job = jobs.find((j) => j.id === id);
        const match = matches[id];

        if (!job) {
          return (
            <Card className="mx-auto max-w-xl text-center">
              <h1 className="text-xl font-semibold">Job not found</h1>
              <p className="mt-2 text-sm text-slate-600">This job isn&apos;t part of your current session.</p>
              <div className="mt-4">
                <Link href="/jobs" className={buttonClasses("primary")}>
                  Back to jobs
                </Link>
              </div>
            </Card>
          );
        }

        return (
          <div className="space-y-6">
            <Link href="/jobs" className="text-sm text-indigo-700 hover:underline">
              ← All jobs
            </Link>

            <Card>
              <CardTitle title="Job information" />
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Title</dt>
                  <dd className="font-medium">{job.title}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Company</dt>
                  <dd className="font-medium">{job.company}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Location</dt>
                  <dd className="font-medium">{job.location ?? "Not specified"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Source</dt>
                  <dd className="font-medium">{job.source}</dd>
                </div>
              </dl>
              {isHttpUrl(job.url) && (
                <a href={job.url} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary", "md", "mt-4")}>
                  View original listing / Apply
                </a>
              )}
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer font-medium text-indigo-700">Job description</summary>
                {job.descriptionIsSnippet && (
                  <p className="mt-2 text-xs text-amber-700">Excerpt only - see the original listing for the full text.</p>
                )}
                <p className="mt-2 whitespace-pre-line rounded-md bg-slate-50 p-3 text-slate-700">{job.description}</p>
              </details>
            </Card>

            {!match ? (
              <Alert tone="warning" title="Not analyzed yet">
                This job hasn&apos;t been compared with your resume. Go back to the jobs page and choose &ldquo;Analyze remaining&rdquo;.
              </Alert>
            ) : (
              <>
                <Card>
                  <CardTitle title="Resume match" />
                  <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
                    <ScoreRing score={match.matchScore} label="Match score" />
                    <div className="space-y-2 text-sm text-slate-700">
                      <p>{match.summary}</p>
                      <p className="text-slate-600">
                        <span className="font-medium">How this score was reached: </span>
                        {match.scoreExplanation}
                      </p>
                      <p className="text-xs text-slate-500">
                        An estimate of fit only - not a prediction of interview or hiring outcomes.
                      </p>
                    </div>
                  </div>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardTitle title="Matched skills" />
                    <ChipList items={[...match.matchedSkills, ...match.matchedTechnologies]} tone="green" />
                  </Card>
                  <Card>
                    <CardTitle title="Missing skills" description="Requested by the job, not shown in your resume" />
                    <ChipList items={[...match.missingSkills, ...match.missingTechnologies]} tone="red" />
                  </Card>
                </div>

                <Card>
                  <CardTitle title="Keyword analysis" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-sm font-medium">Keywords found in your resume</p>
                      <ChipList items={match.matchedKeywords} tone="green" />
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium">Keywords missing</p>
                      <ChipList items={match.missingKeywords} tone="amber" />
                    </div>
                  </div>
                </Card>

                <Card>
                  <CardTitle title="Fit overview" />
                  <div className="flex flex-wrap gap-4 text-sm">
                    {(
                      [
                        ["Experience", match.experienceMatch],
                        ["Education", match.educationMatch],
                        ["Responsibilities", match.responsibilitiesMatch],
                      ] as const
                    ).map(([label, level]) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="text-slate-600">{label}:</span>
                        <Badge tone={levelTone[level]}>{level}</Badge>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-1 text-sm font-medium">Strengths</p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                        {match.strengths.length ? match.strengths.map((s) => <li key={s}>{s}</li>) : <li>None identified</li>}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-medium">Gaps</p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                        {match.gaps.length ? match.gaps.map((s) => <li key={s}>{s}</li>) : <li>None identified</li>}
                      </ul>
                    </div>
                  </div>
                </Card>

                <Card>
                  <CardTitle title="Recommendations" />
                  <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {match.recommendations.length ? match.recommendations.map((s) => <li key={s}>{s}</li>) : <li>No recommendations.</li>}
                  </ul>
                  <div className="mt-3">
                    <Badge tone={matchTone(match.matchScore)}>{match.matchScore}% match</Badge>
                  </div>
                </Card>
              </>
            )}
          </div>
        );
      }}
    </RequireResume>
  );
}
