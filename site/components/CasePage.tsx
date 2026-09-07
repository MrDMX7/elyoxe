import Link from "next/link";
import { copy } from "@/content/copy";
import { caseStudies, type CaseStudy } from "@/content/case-studies";
import { href, type Lang } from "@/content/i18n";
import Nav from "./Nav";
import Footer from "./Footer";
import CaseVisual from "./visuals";

export default function CasePage({ lang, c }: { lang: Lang; c: CaseStudy }) {
  const w = copy.work;
  const i = caseStudies.findIndex((x) => x.slug === c.slug);
  const next = caseStudies[(i + 1) % caseStudies.length];
  const path = `work/${c.slug}`;
  return (
    <>
      <Nav lang={lang} switchPath={path} />
      <main id="main">
        <div className="wrap">
          <header className="case-head">
            <p className="crumb"><Link href={`${href(lang)}#work`} className="ulink">{w.back[lang]}</Link> · {c.kicker[lang]}</p>
            <h1 className="display h1">{c.name[lang]}</h1>
            <p className="lead">{c.tagline[lang]}</p>
            <dl className="case-meta">
              <div><dt>{w.role[lang]}</dt><dd>{c.role[lang]}</dd></div>
              <div><dt>{w.period[lang]}</dt><dd className="mono">{c.period}</dd></div>
              <div><dt>{w.status[lang]}</dt><dd>{c.status[lang]}</dd></div>
              {c.link && <div><dt>{w.visit[lang]}</dt><dd><a className="ulink mono" href={c.link.href} target="_blank" rel="noopener" data-cursor="open">{c.link.label}</a></dd></div>}
            </dl>
          </header>
          <CaseVisual visual={c.visual} lang={lang} />
          <section className="case-body">
            <h2>{w.problem[lang]}</h2>
            <p className="prose">{c.problem[lang]}</p>
          </section>
          <hr className="rule" />
          <section className="case-body">
            <h2>{w.approach[lang]}</h2>
            <ol>{c.approach[lang].map((p, j) => <li key={j}>{p}</li>)}</ol>
          </section>
          <hr className="rule" />
          <section className="case-body">
            <h2>{w.measured[lang]}</h2>
            <div className="figs">
              {c.figures.map((f, j) => (
                <div className={`fig${f.accent ? " is-accent" : ""}`} key={j}><span className="value">{f.value}</span><span className="label">{f.label[lang]}</span></div>
              ))}
            </div>
          </section>
          <hr className="rule" />
          <section className="case-body">
            <h2>{w.built[lang]}</h2>
            <ul className="stack">{c.stack.map((s) => <li key={s}>{s}</li>)}</ul>
          </section>
          <hr className="rule" />
          <section className="case-body">
            <h2>{w.caveat[lang]}</h2>
            <p className="prose caveat">{c.caveat[lang]}</p>
          </section>
          <div className="case-next">
            <span className="eyebrow">{w.next[lang]}</span>
            <Link href={href(lang, `work/${next.slug}`)}>{next.name[lang]}</Link>
          </div>
        </div>
      </main>
      <Footer lang={lang} switchPath={path} />
    </>
  );
}
