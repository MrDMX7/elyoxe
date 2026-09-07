import Link from "next/link";
import { copy } from "@/content/copy";
import { caseStudies } from "@/content/case-studies";
import { href, type Lang } from "@/content/i18n";

export type Row = { id: string; value: string; label: string; isText: boolean; unit: string; href: string | null; live: boolean; slug: string };

/* One row per project, generated from the case-study records, plus the cost
   line. The same numbers appear in the case studies — by construction. */
export function ledgerRows(lang: Lang): (Row | { id: "cost"; value: "$0" })[] {
  const rows: Row[] = caseStudies.map((c) => ({
    id: c.slug,
    value: c.ledger.value,
    label: typeof c.ledger.label === "string" ? c.ledger.label : c.ledger.label[lang],
    isText: typeof c.ledger.label !== "string",
    unit: c.ledger.unit[lang],
    href: c.ledger.href,
    live: c.ledger.live,
    slug: c.slug,
  }));
  return [...rows, { id: "cost", value: "$0" }];
}

export default function Ledger({ lang }: { lang: Lang }) {
  const rows = ledgerRows(lang).filter((r): r is Row => r.id !== "cost");
  return (
    <aside className="ledger on-ink" aria-labelledby="ledger-title">
      <div className="ledger-head">
        <h2 id="ledger-title">{copy.ledger.title[lang]}</h2>
        <p className="eyebrow">{copy.ledger.live[lang]}</p>
      </div>
      <div className="ledger-rows">
        {rows.map((r) => (
          <div key={r.id} className={`ledger-row${r.live ? " is-live" : ""}`}>
            <span className={`label${r.isText ? " is-text" : ""}`}>{r.label}</span>
            <span className="value" data-slot={r.id}>{r.value}</span>
            <span className="unit">{r.unit}</span>
            {r.href ? (
              <a className="action" href={r.href} target="_blank" rel="noopener" data-cursor="open">{copy.ledger.open[lang]}</a>
            ) : (
              <Link className="action" href={href(lang, `work/${r.slug}`)}>{copy.ledger.read[lang]}</Link>
            )}
          </div>
        ))}
      </div>
      <div className="ledger-foot">
        <span>{copy.ledger.cost[lang]}</span>
        <span className="value" data-slot="cost">$0</span>
      </div>
    </aside>
  );
}
