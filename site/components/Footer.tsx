import Link from "next/link";
import Mark from "./Mark";
import { copy } from "@/content/copy";
import { href, other, type Lang } from "@/content/i18n";

export default function Footer({ lang, switchPath = "" }: { lang: Lang; switchPath?: string }) {
  const home = href(lang);
  const alt = other(lang);
  return (
    <footer className="footer on-ink">
      <div className="wrap">
        <div className="cols">
          <div>
            <Link href={home} className="brand"><Mark size={40} onInk /><span>Elyoxe</span></Link>
            <p className="self small muted">{copy.footer.self[lang]}</p>
          </div>
          <nav aria-label={copy.nav.menu[lang]}>
            <a href={`${home}#services`}>{copy.nav.services[lang]}</a>
            <a href={`${home}#work`}>{copy.nav.work[lang]}</a>
            <a href={`${home}#approach`}>{copy.nav.approach[lang]}</a>
            <a href={`${home}#contact`}>{copy.nav.contact[lang]}</a>
          </nav>
          <nav aria-label="Elyoxe">
            <a href={`https://${copy.footer.github}`} target="_blank" rel="noopener" className="mono">{copy.footer.github}</a>
            <a href={href(alt, switchPath)} hrefLang={alt} lang={alt}>{copy.nav.switch[lang]}</a>
          </nav>
        </div>
        <div className="bottom">
          <span>© 2026 Elyoxe · {copy.footer.place[lang]}</span>
          <span className="mono">S3 · CloudFront · GitHub Actions</span>
        </div>
      </div>
    </footer>
  );
}
