"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Dropzone } from "@/components/upload/Dropzone";
import { useApp } from "@/components/providers/AppProvider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { analyzeResume, extractResume, runJobPhase, uploadResume } from "@/lib/client/pipeline";
import { validateFileMeta } from "@/lib/validation/file";
import { cn } from "@/lib/utils";

const STEPS = [
  "Uploading resume...",
  "Extracting resume...",
  "Analyzing resume with Gemini...",
  "Checking ATS compatibility...",
  "Finding relevant jobs...",
  "Comparing resume with jobs...",
  "Analyzing common requirements...",
] as const;

export default function UploadPage() {
  const router = useRouter();
  const toast = useToast();
  const { update, reset } = useApp();

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState(-1);
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSelect = (f: File) => {
    const err = validateFileMeta(f);
    setFileError(err);
    setError(null);
    setFile(err ? null : f);
  };

  async function run() {
    if (!file) return;
    setRunning(true);
    setError(null);
    setDetail("");
    reset();

    try {
      setCurrent(0);
      const { text } = await uploadResume(file, (p) => {
        setProgress(p);
        if (p >= 100) setCurrent(1);
      });
      update({ fileName: file.name, resumeText: text });

      setCurrent(2);
      const resume = await extractResume(text);
      update({ resume });

      setCurrent(3);
      const { analysis, profile } = await analyzeResume(text, resume);
      update({ analysis, profile });

      await runJobPhase({
        profile,
        resume,
        resumeText: text,
        update,
        onStep: (step, d) => {
          setCurrent(step === "jobs" ? 4 : step === "match" ? 5 : 6);
          setDetail(d ?? "");
        },
      });

      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      toast("Analysis failed", "error");
      setRunning(false);
      setProgress(null);
      setCurrent(-1);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload your resume</h1>
        <p className="mt-1 text-sm text-slate-600">
          We&apos;ll analyze it with Gemini AI, find relevant jobs and compare your resume against each one.
        </p>
      </div>

      <Dropzone
        file={file}
        onSelect={onSelect}
        onRemove={() => {
          setFile(null);
          setProgress(null);
          setError(null);
        }}
        progress={progress}
        disabled={running}
        error={fileError}
      />

      {error && (
        <Alert tone="error" title="We couldn't analyze your resume">
          {error}
        </Alert>
      )}

      {running && (
        <Card>
          <ul className="space-y-2">
            {STEPS.map((label, i) => (
              <li
                key={label}
                className={cn(
                  "flex items-center gap-2 text-sm",
                  i < current && "text-green-700",
                  i === current && "font-medium text-slate-900",
                  i > current && "text-slate-400",
                )}
              >
                {i < current ? (
                  <span aria-hidden>✓</span>
                ) : i === current ? (
                  <Spinner className="text-indigo-600" />
                ) : (
                  <span className="w-4 text-center" aria-hidden>
                    ·
                  </span>
                )}
                {label}
                {i === current && detail && <span className="text-slate-500">({detail})</span>}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500">This can take a minute. Please keep this tab open.</p>
        </Card>
      )}

      <Button size="lg" className="w-full" onClick={run} disabled={!file || running}>
        {running ? "Analyzing..." : "Analyze Resume"}
      </Button>
    </div>
  );
}
