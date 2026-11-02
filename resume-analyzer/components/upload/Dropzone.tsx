"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MAX_UPLOAD_MB } from "@/lib/config";
import { cn, formatBytes } from "@/lib/utils";

interface Props {
  file: File | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  progress: number | null;
  disabled?: boolean;
  error?: string | null;
}

export function Dropzone({ file, onSelect, onRemove, progress, disabled, error }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = (files: FileList | null) => {
    const f = files?.[0];
    if (f) onSelect(f);
  };

  if (file) {
    const ext = file.name.split(".").pop()?.toUpperCase();
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{file.name}</p>
            <p className="text-sm text-slate-500">
              {ext} · {formatBytes(file.size)}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove} disabled={disabled}>
            Remove
          </Button>
        </div>
        {progress !== null && (
          <div className="mt-3 space-y-1">
            <Progress value={progress} />
            <p className="text-xs text-slate-500">Upload {progress}%</p>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) pick(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-white px-6 py-12 text-center transition-colors",
          dragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300",
        )}
      >
        <p className="font-medium text-slate-800">Drag &amp; drop your resume here</p>
        <p className="text-sm text-slate-500">PDF or DOCX, up to {MAX_UPLOAD_MB} MB</p>
        <Button variant="secondary" onClick={() => input.current?.click()} disabled={disabled}>
          Browse files
        </Button>
        <input
          ref={input}
          type="file"
          className="hidden"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => {
            pick(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
