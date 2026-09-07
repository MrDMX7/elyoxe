"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Mark from "./Mark";
import { copy } from "@/content/copy";
import { href, other, type Lang } from "@/content/i18n";

/* Header plus a drawer that is a sibling of the header, not a child: the
   header's backdrop-filter would otherwise trap a fixed drawer inside it. */
export default function Nav({ lang, switchPath = "" }: { lang: Lang; switchPath?: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const home = href(lang);
  const alt = other(lang);
  const items = [
    ["services", copy.nav.services[lang]],
    ["work", copy.nav.work[lang]],
    ["approach", copy.nav.approach[lang]],
    ["contact", copy.nav.contact[lang]],
  ] as const;

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("keydown", esc); document.documentElement.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <header className={`header${scrolled ? " is-scrolled" : ""}`}>
        <div className="wrap">
          <Link href={home} className="brand" aria-label="Elyoxe"><Mark size={32} /><span>Elyoxe</span></Link>
          <nav className="nav" aria-label={copy.nav.menu[lang]}>
            {items.map(([id, label]) => <a key={id} href={`${home}#${id}`}>{label}</a>)}
            <a className="switch" href={href(alt, switchPath)} hrefLang={alt} lang={alt}>{copy.nav.switch[lang]}</a>
          </nav>
          <button className="nav-toggle" aria-expanded={open} aria-controls="drawer" onClick={() => setOpen(true)}>
            <span>{copy.nav.menu[lang]}</span><i aria-hidden="true" />
          </button>
        </div>
      </header>
      <div id="drawer" className="drawer" data-open={open} aria-hidden={!open}>
        <div className="drawer-top">
          <span className="brand"><Mark size={32} onInk /><span>Elyoxe</span></span>
          <button onClick={() => setOpen(false)} className="nav-toggle" style={{ display: "inline-flex" }}>{copy.nav.close[lang]}</button>
        </div>
        <nav aria-label={copy.nav.menu[lang]}>
          {items.map(([id, label]) => <a key={id} href={`${home}#${id}`} onClick={() => setOpen(false)}>{label}</a>)}
          <a className="switch" href={href(alt, switchPath)} hrefLang={alt} lang={alt}>{copy.nav.switch[lang]}</a>
        </nav>
        <div className="drawer-foot">{copy.footer.place[lang]}</div>
      </div>
    </>
  );
}
