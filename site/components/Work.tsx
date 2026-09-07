"use client";
import Link from "next/link";
import { copy } from "@/content/copy";
import { caseStudies } from "@/content/case-studies";
import { href, type Lang } from "@/content/i18n";
import { useReveal } from "@/lib/useReveal";
import CaseVisual from "./visuals";

/* Chapters, not cards. Each project gets its own visual language, its figures,
   and the live link when there is one. The list grows from the content file. */
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
              <div className="figs">
                {c.figures.slice(0, 3).map((f, j) => (
                  <div className={`fig${f.accent ? " is-accent" : ""}`} key={j} data-reveal>
                    <span className="value">{f.value}</span>
                    <span className="label">{f.label[lang]}</span>
                  </div>
                ))}
              </div>
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
