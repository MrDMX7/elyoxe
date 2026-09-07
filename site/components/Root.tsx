import "@/app/globals.css";
import { fontClass } from "@/lib/fonts";
import { dirOf, type Lang } from "@/content/i18n";
import { copy } from "@/content/copy";
import Cursor from "./Cursor";
import SmoothScroll from "./SmoothScroll";
import Preloader from "./Preloader";
import PageTransition from "./PageTransition";

/* The one document shell. Each language has its own root layout so <html>
   carries the right lang and dir in the static HTML, not after hydration. */
export default function Root({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return (
    <html lang={lang} dir={dirOf(lang)} className={fontClass}>
      <body>
        <a className="skip" href="#main">{copy.nav.skip[lang]}</a>
        <Preloader lang={lang} />
        <PageTransition />
        <Cursor openLabel={copy.ledger.open[lang]} />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
