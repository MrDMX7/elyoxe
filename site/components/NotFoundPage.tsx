import Link from "next/link";
import { copy } from "@/content/copy";
import { href, type Lang } from "@/content/i18n";
import Nav from "./Nav";
import Footer from "./Footer";

export default function NotFoundPage({ lang }: { lang: Lang }) {
  return (
    <>
      <Nav lang={lang} />
      <main id="main">
        <div className="wrap nf">
          <span className="code" aria-hidden="true">404</span>
          <h1 className="display h2">{copy.notFound.title[lang]}</h1>
          <p className="lead">{copy.notFound.lead[lang]}</p>
          <p><Link className="btn" href={href(lang)}>{copy.notFound.home[lang]}</Link></p>
        </div>
      </main>
      <Footer lang={lang} />
    </>
  );
}
