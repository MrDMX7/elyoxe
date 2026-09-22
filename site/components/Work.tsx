"use client";
import { useRef } from "react";
import Link from "next/link";
import { copy } from "@/content/copy";
import { caseStudies, type CaseStudy } from "@/content/case-studies";
import { href, type Lang } from "@/content/i18n";
import { useReveal } from "@/lib/useReveal";
import { useCountUp } from "@/lib/useCountUp";
import CaseVisual from "./visuals";

/* Chapters, not cards. Each project gets its own visual language, one figure,
   and the live link when there is one. The list grows from the content file.
 *
 * One figure, not three. A visitor deciding whether we can build their thing
 * does not buy our line count or our page count — those measure our effort,
 * not their result. The rest of the measurements are still published; they
 * live on the project's own page, which is where someone goes to check. */
function Figure({ f, lang }: { f: CaseStudy["figures"][number]; lang: Lang }) {
  const ref = useRef<HTMLSpanElement>(null);
  useCountUp(ref, f.value);
  return (
    <div className="figs">
      <div className={`fig${f.accent ? " is-accent" : ""}`} data-reveal>
        <span className="value" ref={ref}>{f.value}</span>
        <span className="label">{f.label[lang]}</span>
      </div>
    </div>
  );
}
export default function Work({ lang }: { lang: Lang }) {
  const ref = useReveal<HTMLElement>();
  return (
    <section id="work" className="section" ref={ref} aria-labelledby="work-title">
      <div className="wrap">
        <div className="section-head">
          <h2 id="work-title" className="display h1"><span className="mask"><span>{copy.work.title[lang]}</span></span></h2>
          <p className="lead" data-reveal>{copy.work.lead[lang]}</p>
        </div>
        {caseStudies.map((c, i) => (
          <article className={`chapter${i % 2 ? " is-flipped" : ""}`} key={c.slug} id={`work-${c.slug}`}>
            <div className="chapter-copy">
              <div className="kicker" data-reveal>
                <span className="name">{c.name[lang]}</span>
                <span className={`status${c.ledger.live ? " is-live" : ""}`}>{c.status[lang]} · {c.kicker[lang]}</span>
              </div>
              <p className="tagline" data-reveal>{c.tagline[lang]}</p>
              <Figure f={c.figures[0]} lang={lang} />
              <div className="chapter-actions" data-reveal>
                <Link className="link" href={href(lang, `work/${c.slug}`)}>{copy.work.caseStudy[lang]}</Link>
                {c.link && <a className="ulink" href={c.link.href} target="_blank" rel="noopener" data-cursor="open"><span className="mono">{c.link.label}</span></a>}
              </div>
            </div>
            <div className="chapter-visual" data-reveal>
              <CaseVisual visual={c.visual} lang={lang} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
