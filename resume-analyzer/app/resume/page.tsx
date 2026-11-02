"use client";

import { useEffect, useState } from "react";
import { CommonRequirementsPanel } from "@/components/jobs/CommonRequirementsPanel";
import { RequireResume } from "@/components/layout/RequireResume";
import { useApp } from "@/components/providers/AppProvider";
import { ResumeEditor } from "@/components/resume/ResumeEditor";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { downloadResumePdf } from "@/lib/client/api";
import { fetchCommonRequirements, generateOptimizedResume } from "@/lib/client/pipeline";
import type { ResumeData } from "@/types/resume";

export default function ResumePage() {
  const { state, ready, update } = useApp();
  const toast = useToast();

  const [draft, setDraft] = useState<ResumeData | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !draft) setDraft(state.editedResume ?? state.optimized?.resume ?? null);
  }, [ready, draft, state.editedResume, state.optimized]);

  return (
    <RequireResume>
      {({ resume, resumeText, jobs, common, optimized }) => {
        const generate = async () => {
          try {
            let c = common;
            if (!c && jobs.length > 0) {
              setBusy("Analyzing common requirements...");
              try {
                c = await fetchCommonRequirements(jobs);
                update({ common: c });
              } catch {
                toast("Couldn't analyze job requirements; optimizing wording only.", "info");
              }
            }
            setBusy("Generating optimized resume...");
            const result = await generateOptimizedResume(resume, resumeText, c);
            update({ optimized: result, editedResume: undefined });
            setDraft(result.resume);
            setResetKey((k) => k + 1);
            toast("Optimized resume ready", "success");
          } catch (e) {
            toast(e instanceof Error ? e.message : "Could not generate the resume", "error");
          } finally {
            setBusy(null);
          }
        };

        const download = async () => {
          if (!draft) return;
          setBusy("Creating PDF...");
          try {
            await downloadResumePdf(draft);
          } catch (e) {
            toast(e instanceof Error ? e.message : "PDF generation failed", "error");
          } finally {
            setBusy(null);
          }
        };

        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Optimized resume</h1>
              <p className="text-sm text-slate-500">
                Rebuilt only from information in your uploaded resume. Skills you don&apos;t have are never added.
              </p>
            </div>

            {busy && (
              <Alert tone="info">
                <span className="inline-flex items-center gap-2">
                  <Spinner /> {busy}
                </span>
              </Alert>
            )}

            {jobs.length === 0 && !optimized && (
              <Alert tone="info" title="No job data available">
                No jobs were found, so the resume will be optimized for clarity and wording only, without job-specific keywords.
              </Alert>
            )}

            {!optimized || !draft ? (
              <Card className="text-center">
                <h2 className="text-lg font-semibold">Generate your optimized resume</h2>
                <p className="mx-auto mt-1 max-w-lg text-sm text-slate-600">
                  We&apos;ll use your resume{jobs.length ? ` and the common requirements of ${jobs.length} job${jobs.length === 1 ? "" : "s"}` : ""} to create a clean,
                  single-column, ATS-friendly version you can edit and download.
                </p>
                <div className="mt-4">
                  <Button size="lg" onClick={generate} disabled={!!busy}>
                    Generate Optimized Resume
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                {optimized.warnings.length > 0 && (
                  <Alert tone="warning" title="Please review">
                    <ul className="list-disc space-y-1 pl-5">
                      {optimized.warnings.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </Alert>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardTitle title="What changed" />
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {optimized.changeNotes.length ? optimized.changeNotes.map((n) => <li key={n}>{n}</li>) : <li>Wording and structure were tidied.</li>}
                    </ul>
                  </Card>
                  <Card>
                    <CardTitle title="Recommended to learn" description="Requested by the jobs but not in your resume, so not added to it" />
                    {optimized.recommendedToLearn.length === 0 ? (
                      <p className="text-sm text-slate-500">Nothing missing was found among the common requirements.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {optimized.recommendedToLearn.map((s) => (
                          <Badge key={s} tone="amber">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>

                <div className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
                  <div className="flex gap-2">
                    <Button variant={mode === "edit" ? "primary" : "secondary"} size="sm" onClick={() => setMode("edit")}>
                      Edit
                    </Button>
                    <Button variant={mode === "preview" ? "primary" : "secondary"} size="sm" onClick={() => setMode("preview")}>
                      Preview
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        update({ editedResume: draft });
                        toast("Changes saved", "success");
                      }}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setDraft(optimized.resume);
                        update({ editedResume: undefined });
                        setResetKey((k) => k + 1);
                        toast("Reset to the generated version", "info");
                      }}
                    >
                      Reset
                    </Button>
                    <Button size="sm" onClick={download} disabled={!!busy}>
                      Download PDF
                    </Button>
                  </div>
                </div>

                {mode === "edit" ? (
                  <ResumeEditor key={resetKey} value={draft} onChange={setDraft} />
                ) : (
                  <ResumePreview resume={draft} />
                )}

                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={generate} disabled={!!busy}>
                    Regenerate from scratch
                  </Button>
                </div>
              </>
            )}

            {common && <CommonRequirementsPanel common={common} />}
          </div>
        );
      }}
    </RequireResume>
  );
}
