"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/components/providers/AppProvider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/resume", label: "Optimized Resume" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, reset } = useApp();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-indigo-600 text-sm text-white">R</span>
          AI Resume Analyzer
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {state.resume &&
            NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-md px-3 py-1.5 font-medium",
                  pathname.startsWith(n.href) ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100",
                )}
              >
                {n.label}
              </Link>
            ))}
          <Link
            href="/upload"
            onClick={(e) => {
              if (state.resume) {
                e.preventDefault();
                reset();
                router.push("/upload");
              }
            }}
            className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700"
          >
            {state.resume ? "New analysis" : "Upload resume"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
