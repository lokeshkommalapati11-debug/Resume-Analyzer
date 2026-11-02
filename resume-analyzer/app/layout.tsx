import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProvider } from "@/components/providers/AppProvider";
import { Header } from "@/components/layout/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Resume Analyzer",
  description: "Analyze your resume with Gemini AI, match it to real jobs and generate an ATS-friendly version.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="mx-auto max-w-6xl px-4 pb-10 text-center text-xs text-slate-500">
            Scores are AI-based estimates and do not guarantee interviews, offers or passing any employer&apos;s ATS.
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}
