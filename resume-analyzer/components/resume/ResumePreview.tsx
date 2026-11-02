import type { ResumeData } from "@/types/resume";

const dates = (s?: string, e?: string) => [s, e].filter(Boolean).join(" - ");

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h3 className="border-b border-slate-400 pb-0.5 text-[11px] font-bold uppercase tracking-wide">{title}</h3>
      <div className="mt-1.5 space-y-2">{children}</div>
    </section>
  );
}

function Bullets({ text }: { text: string }) {
  const items = text
    .split("\n")
    .map((l) => l.replace(/^\s*[-•*▪◦●]\s*/, "").trim())
    .filter(Boolean);
  return (
    <ul className="list-disc space-y-0.5 pl-5">
      {items.map((i, idx) => (
        <li key={idx}>{i}</li>
      ))}
    </ul>
  );
}

/** Plain, single-column, ATS-style preview that mirrors the PDF structure. */
export function ResumePreview({ resume }: { resume: ResumeData }) {
  const contact = [resume.email, resume.phone, resume.location, ...(resume.links ?? [])].filter(Boolean);
  return (
    <div className="mx-auto max-w-[794px] rounded-lg border border-slate-300 bg-white p-8 text-[13px] leading-relaxed text-slate-900 shadow-sm">
      {resume.name && <h2 className="text-2xl font-bold">{resume.name}</h2>}
      {contact.length > 0 && <p className="text-xs text-slate-600">{contact.join("  |  ")}</p>}

      {resume.summary && (
        <Section title="Professional Summary">
          <p>{resume.summary}</p>
        </Section>
      )}
      {resume.skills.length > 0 && (
        <Section title="Technical Skills">
          <p>{resume.skills.join(", ")}</p>
        </Section>
      )}
      {resume.experience.length > 0 && (
        <Section title="Professional Experience">
          {resume.experience.map((e, i) => (
            <div key={i}>
              <p className="font-semibold">{[e.role, e.company].filter(Boolean).join(" - ")}</p>
              {dates(e.startDate, e.endDate) && <p className="text-xs text-slate-600">{dates(e.startDate, e.endDate)}</p>}
              {e.description && <Bullets text={e.description} />}
              {e.technologies && e.technologies.length > 0 && (
                <p className="text-xs text-slate-600">Technologies: {e.technologies.join(", ")}</p>
              )}
            </div>
          ))}
        </Section>
      )}
      {resume.projects.length > 0 && (
        <Section title="Projects">
          {resume.projects.map((p, i) => (
            <div key={i}>
              <p className="font-semibold">{p.name}</p>
              {p.description && <Bullets text={p.description} />}
              {p.technologies && p.technologies.length > 0 && (
                <p className="text-xs text-slate-600">Technologies: {p.technologies.join(", ")}</p>
              )}
            </div>
          ))}
        </Section>
      )}
      {resume.education.length > 0 && (
        <Section title="Education">
          {resume.education.map((e, i) => (
            <div key={i}>
              <p className="font-semibold">{e.institution}</p>
              {[e.degree, e.field].filter(Boolean).length > 0 && <p>{[e.degree, e.field].filter(Boolean).join(", ")}</p>}
              {dates(e.startDate, e.endDate) && <p className="text-xs text-slate-600">{dates(e.startDate, e.endDate)}</p>}
            </div>
          ))}
        </Section>
      )}
      {resume.certifications.length > 0 && (
        <Section title="Certifications">
          <Bullets text={resume.certifications.join("\n")} />
        </Section>
      )}
      {resume.achievements.length > 0 && (
        <Section title="Achievements">
          <Bullets text={resume.achievements.join("\n")} />
        </Section>
      )}
      {resume.languages.length > 0 && (
        <Section title="Languages">
          <p>{resume.languages.join(", ")}</p>
        </Section>
      )}
    </div>
  );
}
