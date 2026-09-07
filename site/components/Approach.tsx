"use client";
import { copy } from "@/content/copy";
import { approach } from "@/content/approach";
import type { Lang } from "@/content/i18n";
import { useReveal } from "@/lib/useReveal";

const ORD = { ar: ["البند الأول", "البند الثاني", "البند الثالث", "البند الرابع"], en: ["Clause one", "Clause two", "Clause three", "Clause four"] };

/* Set as the document it is: four clauses that exist before any work starts. */
export default function Approach({ lang }: { lang: Lang }) {
  const ref = useReveal<HTMLElement>();
  return (
    <section id="approach" className="section" ref={ref} aria-labelledby="approach-title">
      <div className="wrap">
        <div className="section-head">
          <h2 id="approach-title" className="display h1"><span className="mask"><span>{copy.approach.title[lang]}</span></span></h2>
          <p className="lead" data-reveal>{copy.approach.lead[lang]}</p>
        </div>
        <div className="doc" data-reveal>
          <div className="doc-head">
            <span>{lang === "ar" ? "يُكتب قبل بدء العمل" : "Written before work starts"}</span>
            <span className="mono">Elyoxe · Dubai</span>
          </div>
          <ol className="clauses">
            {approach.map((c, i) => (
              <li className="clause" key={i}>
                <span className="ord">{ORD[lang][i]}</span>
                <div>
                  <h3 className="display h3">{c.title[lang]}</h3>
                  <p>{c.body[lang]}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="doc-foot">
            <p className="eyebrow">{copy.approach.engagement[lang]}</p>
            <p>{copy.approach.engagementBody[lang]}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
