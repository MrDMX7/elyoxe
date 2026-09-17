import Link from "next/link";
import { copy } from "@/content/copy";
import { bySlug } from "@/content/case-studies";
import { type Piece } from "@/content/writing";
import { href, type Lang } from "@/content/i18n";
import Nav from "./Nav";
import Footer from "./Footer";

/* A written piece. It reuses the case page's shell and typography on purpose —
   this is the same site making the same kind of claim, not a blog bolted on.
 *
 * A paragraph opening with "## " is a heading. That is the whole formatting
 * language, and it stays that way until a piece genuinely needs more. */

export default function WritingPage({ lang, p }: { lang: Lang; p: Piece }) {
  const w = copy.work;
  const rel = p.related ? bySlug(p.related) : undefined;
  const path = `writing/${p.slug}`;
  return (
    <>
      <Nav lang={lang} switchPath={path} />
      <main id="main">
        <div className="wrap">
          <header className="case-head">
            <p className="crumb">
              <Link href={`${href(lang)}#work`} className="ulink">{w.back[lang]}</Link> · {p.kicker[lang]}
            </p>
            <h1 className="display h1">{p.title[lang]}</h1>
            <p className="lead">{p.lead[lang]}</p>
            <dl className="case-meta">
              <div>
                <dt>{w.period[lang]}</dt>
                <dd className="mono">{p.date}</dd>
              </div>
            </dl>
          </header>

          <section className="case-body">
            {p.body.map((b, i) =>
              b[lang].startsWith("## ") ? (
                <h2 key={i}>{b[lang].slice(3)}</h2>
              ) : (
                <p className="prose" key={i}>{b[lang]}</p>
              ),
            )}
          </section>

          {rel && (
            <div className="case-next">
              <span className="eyebrow">{copy.services.proof[lang]}</span>
              <Link href={href(lang, `work/${rel.slug}`)}>{rel.name[lang]}</Link>
            </div>
          )}
        </div>
      </main>
      <Footer lang={lang} switchPath={path} />
    </>
  );
}
