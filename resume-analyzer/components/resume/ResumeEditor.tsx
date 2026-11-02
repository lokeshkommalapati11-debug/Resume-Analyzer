"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import type { EducationEntry, ExperienceEntry, ProjectEntry, ResumeData } from "@/types/resume";

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input className={inputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Area({ label, value, onChange, rows = 4, hint }: { label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <textarea className={inputCls} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

/** Edits a string[] as free text and commits on blur so typing separators feels natural. */
function ListField({
  label,
  values,
  onChange,
  separator,
  hint,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  separator: "comma" | "line";
  hint?: string;
}) {
  const join = separator === "comma" ? ", " : "\n";
  const [text, setText] = useState(values.join(join));
  const commit = () => {
    const parsed = text
      .split(separator === "comma" ? /,|\n/ : /\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    onChange(parsed);
    setText(parsed.join(join));
  };
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <textarea
        className={inputCls}
        rows={separator === "comma" ? 3 : 4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
      />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function replaceAt<T>(list: T[], i: number, item: T): T[] {
  return list.map((x, idx) => (idx === i ? item : x));
}

export function ResumeEditor({ value, onChange }: { value: ResumeData; onChange: (r: ResumeData) => void }) {
  const set = <K extends keyof ResumeData>(key: K, v: ResumeData[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="space-y-5">
      <Card>
        <CardTitle title="Contact information" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" value={value.name} onChange={(v) => set("name", v)} />
          <Field label="Email" value={value.email ?? ""} onChange={(v) => set("email", v || undefined)} />
          <Field label="Phone" value={value.phone ?? ""} onChange={(v) => set("phone", v || undefined)} />
          <Field label="Location" value={value.location ?? ""} onChange={(v) => set("location", v || undefined)} />
        </div>
        <div className="mt-3">
          <ListField label="Links (LinkedIn, GitHub, portfolio)" values={value.links ?? []} onChange={(v) => set("links", v)} separator="line" hint="One per line" />
        </div>
      </Card>

      <Card>
        <CardTitle title="Professional summary" />
        <Area label="Summary" value={value.summary ?? ""} onChange={(v) => set("summary", v || undefined)} rows={4} />
      </Card>

      <Card>
        <CardTitle title="Skills" />
        <ListField label="Skills" values={value.skills} onChange={(v) => set("skills", v)} separator="comma" hint="Comma-separated. Only list skills you genuinely have." />
      </Card>

      <Card>
        <CardTitle
          title="Experience"
          action={
            <Button size="sm" variant="secondary" onClick={() => set("experience", [...value.experience, { company: "", role: "", description: "" }])}>
              Add
            </Button>
          }
        />
        <div className="space-y-5">
          {value.experience.map((e, i) => {
            const up = (patch: Partial<ExperienceEntry>) => set("experience", replaceAt(value.experience, i, { ...e, ...patch }));
            return (
              <div key={i} className="space-y-3 rounded-lg border border-slate-200 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Role" value={e.role} onChange={(v) => up({ role: v })} />
                  <Field label="Company" value={e.company} onChange={(v) => up({ company: v })} />
                  <Field label="Start date" value={e.startDate ?? ""} onChange={(v) => up({ startDate: v || undefined })} />
                  <Field label="End date" value={e.endDate ?? ""} onChange={(v) => up({ endDate: v || undefined })} />
                </div>
                <Area label="Description" value={e.description} onChange={(v) => up({ description: v })} rows={5} hint="One bullet point per line" />
                <ListField label="Technologies" values={e.technologies ?? []} onChange={(v) => up({ technologies: v })} separator="comma" />
                <Button size="sm" variant="ghost" onClick={() => set("experience", value.experience.filter((_, idx) => idx !== i))}>
                  Remove entry
                </Button>
              </div>
            );
          })}
          {value.experience.length === 0 && <p className="text-sm text-slate-500">No experience entries.</p>}
        </div>
      </Card>

      <Card>
        <CardTitle
          title="Projects"
          action={
            <Button size="sm" variant="secondary" onClick={() => set("projects", [...value.projects, { name: "", description: "" }])}>
              Add
            </Button>
          }
        />
        <div className="space-y-5">
          {value.projects.map((p, i) => {
            const up = (patch: Partial<ProjectEntry>) => set("projects", replaceAt(value.projects, i, { ...p, ...patch }));
            return (
              <div key={i} className="space-y-3 rounded-lg border border-slate-200 p-4">
                <Field label="Project name" value={p.name} onChange={(v) => up({ name: v })} />
                <Area label="Description" value={p.description} onChange={(v) => up({ description: v })} rows={4} hint="One bullet point per line" />
                <ListField label="Technologies" values={p.technologies ?? []} onChange={(v) => up({ technologies: v })} separator="comma" />
                <Button size="sm" variant="ghost" onClick={() => set("projects", value.projects.filter((_, idx) => idx !== i))}>
                  Remove entry
                </Button>
              </div>
            );
          })}
          {value.projects.length === 0 && <p className="text-sm text-slate-500">No project entries.</p>}
        </div>
      </Card>

      <Card>
        <CardTitle
          title="Education"
          action={
            <Button size="sm" variant="secondary" onClick={() => set("education", [...value.education, { institution: "" }])}>
              Add
            </Button>
          }
        />
        <div className="space-y-5">
          {value.education.map((e, i) => {
            const up = (patch: Partial<EducationEntry>) => set("education", replaceAt(value.education, i, { ...e, ...patch }));
            return (
              <div key={i} className="space-y-3 rounded-lg border border-slate-200 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Institution" value={e.institution} onChange={(v) => up({ institution: v })} />
                  <Field label="Degree" value={e.degree ?? ""} onChange={(v) => up({ degree: v || undefined })} />
                  <Field label="Field" value={e.field ?? ""} onChange={(v) => up({ field: v || undefined })} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Start" value={e.startDate ?? ""} onChange={(v) => up({ startDate: v || undefined })} />
                    <Field label="End" value={e.endDate ?? ""} onChange={(v) => up({ endDate: v || undefined })} />
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => set("education", value.education.filter((_, idx) => idx !== i))}>
                  Remove entry
                </Button>
              </div>
            );
          })}
          {value.education.length === 0 && <p className="text-sm text-slate-500">No education entries.</p>}
        </div>
      </Card>

      <Card>
        <CardTitle title="Certifications & achievements" />
        <div className="grid gap-4 md:grid-cols-2">
          <ListField label="Certifications" values={value.certifications} onChange={(v) => set("certifications", v)} separator="line" hint="One per line" />
          <ListField label="Achievements" values={value.achievements} onChange={(v) => set("achievements", v)} separator="line" hint="One per line" />
        </div>
      </Card>
    </div>
  );
}
