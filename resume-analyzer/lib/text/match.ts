/**
 * Conservative term matching used to verify AI output against source text.
 * Word-boundary based so "Java" does not match "JavaScript".
 */
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9+#]+/g, " ").trim();
}

function variants(term: string): string[] {
  const n = norm(term);
  if (!n) return [];
  const v = new Set<string>([n]);
  if (n.endsWith("s") && n.length > 3) v.add(n.slice(0, -1));
  if (n.endsWith(" js")) v.add(n.slice(0, -3));
  else v.add(`${n} js`);
  return [...v];
}

export function appearsIn(haystack: string, term: string): boolean {
  const h = ` ${norm(haystack)} `;
  return variants(term).some((v) => h.includes(` ${v} `));
}

export function dedupeCaseInsensitive(values: string[]): string[] {
  const seen = new Map<string, string>();
  for (const v of values) {
    const t = v.trim();
    if (t && !seen.has(t.toLowerCase())) seen.set(t.toLowerCase(), t);
  }
  return [...seen.values()];
}
