"use client";

import { useState } from "react";
import { CommonRequirementsPanel } from "@/components/jobs/CommonRequirementsPanel";
import { JobCard } from "@/components/jobs/JobCard";
import { RequireResume } from "@/components/layout/RequireResume";
import { useApp } from "@/components/providers/AppProvider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { fetchCommonRequirements, matchJobs, runJobPhase } from "@/lib/client/pipeline";
import { JOB_COUNT } from "@/lib/config";

export default function JobsPage() {
  const { update } = useApp();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  return (
    <RequireResume>
      {({ profile, resume, resumeText, jobs, matches, common, jobsError, jobProvider }) => {
        const ranked = jobs
          .map((job) => ({ job, match: matches[job.id] }))
          .sort((a, b) => (b.match?.matchScore ?? -1) - (a.match?.matchScore ?? -1));
        const unmatched = jobs.filter((j) => !matches[j.id]);

        const search = async () => {
          setBusy("Searching for jobs...");
          await runJobPhase({
            profile,
            resume,
            resumeText,
            update,
            onStep: (step, d) =>
              setBusy(
                step === "jobs"
                  ? "Finding relevant jobs..."
                  : step === "match"
                    ? `Comparing resume with jobs... ${d ?? ""}`
                    : "Analyzing common requirements...",
              ),
          });
          setBusy(null);
        };

        const retryMatches = async () => {
          setBusy("Comparing resume with jobs...");
          await matchJobs(resume, resumeText, unmatched, (id, m) => {
            if (m) update((s) => ({ matches: { ...s.matches, [id]: m } }));
          });
          setBusy(null);
          toast("Finished analyzing remaining jobs", "success");
        };

        const retryCommon = async () => {
          setBusy("Analyzing common requirements...");
          try {
            update({ common: await fetchCommonRequirements(jobs) });
          } catch (e) {
            toast(e instanceof Error ? e.message : "Could not analyze requirements", "error");
          }
          setBusy(null);
        };

        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold">Job matches</h1>
                <p className="text-sm text-slate-500">
                  Showing {jobs.length} of up to {JOB_COUNT} live listings for &ldquo;{profile.primaryRole || "your profile"}&rdquo;
                  {jobProvider ? ` · source: ${jobProvider}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                {unmatched.length > 0 && (
                  <Button variant="secondary" onClick={retryMatches} disabled={!!busy}>
                    Analyze remaining ({unmatched.length})
                  </Button>
                )}
                <Button variant="secondary" onClick={search} disabled={!!busy}>
                  {jobs.length ? "Search again" : "Find jobs"}
                </Button>
              </div>
            </div>

            {busy && (
              <Alert tone="info">
                <span className="inline-flex items-center gap-2">
                  <Spinner /> {busy}
                </span>
              </Alert>
            )}
            {jobsError && (
              <Alert tone="error" title="Job search failed">
                {jobsError}
              </Alert>
            )}
            {jobProvider?.includes("MOCK") && (
              <Alert tone="warning" title="Development mock data">
                These are placeholder jobs for local testing, not real listings. Configure a real provider before use.
              </Alert>
            )}
            {!jobsError && !busy && jobs.length === 0 && (
              <Alert tone="info" title="No jobs found">
                No listings matched this profile right now. We never pad results with made-up jobs. Try searching again later or
                switch job provider in your environment settings.
              </Alert>
            )}
            {jobs.length > 0 && jobs.length < JOB_COUNT && !busy && (
              <Alert tone="info">
                Only {jobs.length} legitimate listing{jobs.length === 1 ? "" : "s"} could be found, so that is what is shown.
              </Alert>
            )}
            {jobs.some((j) => j.descriptionIsSnippet) && (
              <Alert tone="warning" title="Descriptions are excerpts">
                This job source returns only a short excerpt of each description, so match scores are less complete than with full
                descriptions. Open the original listing for full details.
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {ranked.map(({ job, match }) => (
                <JobCard key={job.id} job={job} match={match} />
              ))}
            </div>

            {common ? (
              <CommonRequirementsPanel common={common} />
            ) : (
              jobs.length > 0 &&
              !busy && (
                <Button variant="secondary" onClick={retryCommon}>
                  Analyze common requirements
                </Button>
              )
            )}
          </div>
        );
      }}
    </RequireResume>
  );
}
