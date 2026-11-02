import Link from "next/link";
import { Badge, ChipList, type Tone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { isHttpUrl } from "@/lib/utils";
import type { Job, JobMatch } from "@/types/jobs";

export function matchTone(score: number): Tone {
  return score >= 75 ? "green" : score >= 55 ? "amber" : "red";
}

export function JobCard({ job, match }: { job: Job; match?: JobMatch }) {
  const skills = match ? [...match.matchedSkills, ...match.matchedTechnologies] : [];
  const missing = match ? [...match.missingSkills, ...match.missingTechnologies] : [];
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900">{job.title}</h3>
          <p className="text-sm text-slate-600">
            {job.company}
            {job.location ? ` · ${job.location}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">via {job.source}</p>
        </div>
        {match ? (
          <Badge tone={matchTone(match.matchScore)} className="shrink-0 text-sm">
            {match.matchScore}%
          </Badge>
        ) : (
          <Badge>Not analyzed</Badge>
        )}
      </div>

      {match && <Progress value={match.matchScore} />}

      {match && (
        <div className="space-y-2">
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-slate-500">Matched skills</p>
            <ChipList items={skills.slice(0, 8)} tone="green" empty="None detected" />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-slate-500">Missing skills</p>
            <ChipList items={missing.slice(0, 8)} tone="red" empty="None detected" />
          </div>
        </div>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer font-medium text-indigo-700">View JD</summary>
        {job.descriptionIsSnippet && (
          <p className="mt-2 text-xs text-amber-700">This job board only provides an excerpt. See the original listing for the full text.</p>
        )}
        <p className="mt-2 max-h-56 overflow-y-auto whitespace-pre-line rounded-md bg-slate-50 p-3 text-slate-700">
          {job.description}
        </p>
      </details>

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <Link href={`/jobs/${encodeURIComponent(job.id)}`} className={buttonClasses("secondary", "sm")}>
          Detailed analysis
        </Link>
        {isHttpUrl(job.url) && (
          <a href={job.url} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary", "sm")}>
            Apply
          </a>
        )}
      </div>
    </Card>
  );
}
