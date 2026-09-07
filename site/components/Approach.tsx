"use client";
import { useState } from "react";
import { copy } from "@/content/copy";
import { approach } from "@/content/approach";
import type { Lang } from "@/content/i18n";
import { useReveal, useScrub } from "@/lib/useReveal";

const ORD = {
  ar: ["البند الأول", "البند الثاني", "البند الثالث", "البند الرابع"],
  en: ["Clause one", "Clause two", "Clause three", "Clause four"],
};

/* Strings that exist only as document furniture; everything with meaning
   comes from content/copy.ts and content/approach.ts. */
const T = {
  written: { ar: "يُكتب قبل بدء العمل", en: "Written before work starts" },
  binding: { ar: "يسري على كل تعاقد", en: "Binding on every engagement" },
  signed: { ar: "يُوقَّع قبل العمل، لا بعده.", en: "Signed before the work, not after." },
};

/* Set as the document it is: four clauses that exist before any work starts.
   Scroll executes it — each clause's rule draws in reading direction, its
   ordinal settles into ink, and the signature block seals once all four hold.
   Reduced motion resolves the scrub to 1, so the instrument reads as signed. */
export default function Approach({ lang }: { lang: Lang }) {
  const ref = useReveal<HTMLElement>();
  /* One state value, quantised to the six states the document can be in, so a
     scroll tick that changes nothing re-renders nothing. 0–4 clauses in force,
     5 once the signature seals. */
  const [step, setStep] = useState(0);
  const doc = useScrub<HTMLDivElement>(
    (v) => {
      const next = v >= 0.98 ? 5 : Math.min(4, Math.floor(v * 4.6));
      setStep((s) => Math.max(s, next)); // scrolling back up does not repeal a clause
    },
    { start: "top 78%", end: "bottom 62%" },
  );
  const inForce = Math.min(4, step);
  const sealed = step === 5;

  return (
    <section id="approach" className="section apr" ref={ref} aria-labelledby="approach-title">
      <div className="wrap">
        <div className="section-head">
          <h2 id="approach-title" className="display h1"><span className="mask"><span>{copy.approach.title[lang]}</span></span></h2>
          <p className="lead" data-reveal>{copy.approach.lead[lang]}</p>
        </div>

        {/* running head, the way a printed instrument carries one */}
        <p className="apr-head" data-reveal aria-hidden="true">
          <span>Elyoxe</span><i /><span>Dubai</span><i /><span>2026</span>
        </p>

        <div className="apr-doc" ref={doc}>
          <div className="apr-doc-head">
            <span>{T.written[lang]}</span>
            <span>{T.binding[lang]}</span>
          </div>

          <ol className="apr-clauses">
            {approach.map((c, i) => (
              <li className="apr-clause" key={i} data-force={i < inForce}>
                <span className="apr-ord">
                  <span className="apr-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="apr-word">{ORD[lang][i]}</span>
                </span>
                <div className="apr-text">
                  <h3 className="display h3">{c.title[lang]}</h3>
                  <p>{c.body[lang]}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* the engagement model is the operative clause, so it carries the signature */}
          <div className="apr-sign" data-sealed={sealed}>
            <div className="apr-sign-terms">
              <p className="apr-sign-label">{copy.approach.engagement[lang]}</p>
              <p className="apr-sign-body">{copy.approach.engagementBody[lang]}</p>
            </div>
            <div className="apr-sign-mark">
              <span className="apr-sign-name">Elyoxe</span>
              <span className="apr-sign-rule" />
              <p className="apr-sign-note">{T.signed[lang]}</p>
              <svg className="apr-seal" viewBox="0 0 44 44" aria-hidden="true" focusable="false">
                <circle cx="22" cy="22" r="18.5" pathLength="1" />
                <path d="M14.5 29.5 L27 17" pathLength="1" />
                <path className="apr-seal-head" d="M30.5 13.5 L29.4 20.2 L23.8 16.4 Z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
