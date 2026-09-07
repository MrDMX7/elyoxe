"use client";
import Link from "next/link";
import { copy } from "@/content/copy";
import { services } from "@/content/services";
import { bySlug } from "@/content/case-studies";
import { href, type Lang } from "@/content/i18n";
import { useReveal } from "@/lib/useReveal";

/* Four parallel fields. Each row ends in a proof figure lifted from its own
   case study, which is why nothing here is numbered. */
export default function Services({ lang }: { lang: Lang }) {
  const ref = useReveal<HTMLElement>();
  return (
    <section id="services" className="section" ref={ref} aria-labelledby="services-title">
      <div className="wrap">
        <div className="section-head">
          <h2 id="services-title" className="display h1"><span className="mask"><span>{copy.services.title[lang]}</span></span></h2>
          <p className="lead" data-reveal>{copy.services.lead[lang]}</p>
        </div>
        <div className="services">
          {services.map((s) => {
            const c = bySlug(s.proof.slug)!;
            const f = c.figures[s.proof.figure];
            return (
              <article className="service" key={s.slug} data-reveal>
                <h3 className="display h3">{s.title[lang]}</h3>
                <p>{s.body[lang]}</p>
                <div className="proof">
                  <span className="value">{f.value}</span>
                  <span className="what">{f.label[lang]}</span>
                  <Link href={href(lang, `work/${c.slug}`)} className="ulink">{copy.services.proof[lang]}: {c.name[lang]}</Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
