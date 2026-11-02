"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useApp, type AppState } from "@/components/providers/AppProvider";
import { Card } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/** Renders children only when a resume analysis exists in this session. */
export function RequireResume({
  children,
}: {
  children: (state: AppState & Required<Pick<AppState, "resume" | "resumeText" | "analysis" | "profile">>) => ReactNode;
}) {
  const { state, ready } = useApp();

  if (!ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { resume, resumeText, analysis, profile } = state;
  if (!resume || !resumeText || !analysis || !profile) {
    return (
      <Card className="mx-auto max-w-xl text-center">
        <h1 className="text-xl font-semibold">No resume analyzed yet</h1>
        <p className="mt-2 text-sm text-slate-600">Upload a resume to see your scores, job matches and optimized resume.</p>
        <div className="mt-4">
          <Link href="/upload" className={buttonClasses("primary", "md")}>
            Upload resume
          </Link>
        </div>
      </Card>
    );
  }
  return <>{children({ ...state, resume, resumeText, analysis, profile })}</>;
}
