"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Card className="mx-auto max-w-lg text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-slate-600">An unexpected error occurred. Please try again.</p>
      <div className="mt-4">
        <Button onClick={reset}>Try again</Button>
      </div>
    </Card>
  );
}
