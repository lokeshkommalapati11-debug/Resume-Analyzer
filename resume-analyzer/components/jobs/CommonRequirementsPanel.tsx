import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import type { CommonRequirements, RankedTerm } from "@/types/jobs";

function Terms({ title, terms, total }: { title: string; terms: RankedTerm[]; total: number }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-800">{title}</p>
      {terms.length === 0 ? (
        <span className="text-sm text-slate-400">None found</span>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {terms.map((t) => (
            <Badge key={t.name} tone="indigo">
              {t.name} · {t.jobCount}/{total}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function Bullets({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-800">{title}</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

export function CommonRequirementsPanel({ common }: { common: CommonRequirements }) {
  return (
    <Card>
      <CardTitle
        title="Common requirements across jobs"
        description={`Counted from the ${common.analyzedJobs} job descriptions found (n/${common.analyzedJobs} = jobs mentioning it).`}
      />
      <div className="space-y-5">
        <Terms title="Most requested skills" terms={common.commonSkills} total={common.analyzedJobs} />
        <Terms title="Common technologies" terms={common.commonTechnologies} total={common.analyzedJobs} />
        <Terms title="Common keywords" terms={common.commonKeywords} total={common.analyzedJobs} />
        <div className="grid gap-5 md:grid-cols-3">
          <Bullets title="Responsibilities" items={common.commonResponsibilities} />
          <Bullets title="Qualifications" items={common.commonQualifications} />
          <Bullets title="Experience" items={common.commonExperienceRequirements} />
        </div>
      </div>
    </Card>
  );
}
