import Link from "next/link";
import Mark from "./Mark";
import { copy } from "@/content/copy";
import { href, other, type Lang } from "@/content/i18n";

/* Evaluated once, in the Node process that runs the static export, and baked
   into every emitted HTML file — so the date shown is the date this copy of
   the site was built. This component stays a server component for exactly
   that reason: there is no client evaluation to disagree with it. */
const BUILT = new Date().toISOString().slice(0, 10);

const T = {
  build: { ar: "آخر بناء", en: "Last build" },
  sections: { ar: "أقسام الصفحة", en: "Sections" },
};

export default function Footer({ lang, switchPath = "" }: { lang: Lang; switchPath?: string }) {
  const home = href(lang);
  const alt = other(lang);
  return (
    <footer className="footer on-ink">
      <div className="wrap">
        <div className="ftr-top">
          <div className="ftr-id">
            <Link href={home} className="brand"><Mark size={40} onInk /><span>Elyoxe</span></Link>
            {/* the site describing itself, which is the only claim here that
                the visitor can verify by looking at the page they are on */}
            <p className="ftr-self">{copy.footer.self[lang]}</p>
          </div>

          <nav className="ftr-nav" aria-label={T.sections[lang]}>
            <a href={`${home}#services`}>{copy.nav.services[lang]}</a>
            <a href={`${home}#work`}>{copy.nav.work[lang]}</a>
            <a href={`${home}#approach`}>{copy.nav.approach[lang]}</a>
            <a href={`${home}#contact`}>{copy.nav.contact[lang]}</a>
          </nav>

          <nav className="ftr-nav" aria-label={copy.brand}>
            <a href={`https://${copy.footer.github}`} target="_blank" rel="noopener" className="ftr-repo">{copy.footer.github}</a>
            <a href={href(alt, switchPath)} hrefLang={alt} lang={alt}>{copy.nav.switch[lang]}</a>
          </nav>
        </div>

        <div className="ftr-bottom">
          <span className="ftr-c">© 2026 {copy.brand}</span>
          <span>{copy.footer.place[lang]}</span>
          <span className="ftr-built">{T.build[lang]} <span className="ftr-date">{BUILT}</span></span>
        </div>
      </div>

      <div className="ftr-wordmark" aria-hidden="true">
        <div className="wrap"><span>Elyoxe</span></div>
      </div>
    </footer>
  );
}
