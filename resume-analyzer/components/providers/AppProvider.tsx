"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ResumeAnalysis } from "@/types/analysis";
import type { CommonRequirements, Job, JobMatch } from "@/types/jobs";
import type { CandidateProfile, OptimizedResume, ResumeData } from "@/types/resume";
import { ToastProvider } from "@/components/ui/toast";

export interface AppState {
  fileName?: string;
  resumeText?: string;
  resume?: ResumeData;
  analysis?: ResumeAnalysis;
  profile?: CandidateProfile;
  jobs: Job[];
  jobProvider?: string;
  jobsError?: string;
  matches: Record<string, JobMatch>;
  common?: CommonRequirements;
  optimized?: OptimizedResume;
  editedResume?: ResumeData;
}

type Patch = Partial<AppState> | ((s: AppState) => Partial<AppState>);

interface Ctx {
  state: AppState;
  /** False until sessionStorage has been read (avoid hydration flicker / false redirects). */
  ready: boolean;
  update: (patch: Patch) => void;
  reset: () => void;
}

const KEY = "ai-resume-analyzer:v1";
const initial: AppState = { jobs: [], matches: {} };
const AppContext = createContext<Ctx | null>(null);

/**
 * Session state lives only in this browser tab (sessionStorage) - there is no database.
 * It is cleared when the tab closes or when the user starts a new analysis.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) setState({ ...initial, ...(JSON.parse(raw) as Partial<AppState>) });
    } catch {
      /* ignore corrupted storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable */
    }
  }, [state, ready]);

  const update = useCallback((patch: Patch) => {
    setState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
  }, []);

  const reset = useCallback(() => setState(initial), []);

  const value = useMemo(() => ({ state, ready, update, reset }), [state, ready, update, reset]);

  return (
    <AppContext.Provider value={value}>
      <ToastProvider>{children}</ToastProvider>
    </AppContext.Provider>
  );
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
