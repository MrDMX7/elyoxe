"use client";
import { useEffect, useRef, useState } from "react";
import { useScrub } from "@/lib/useReveal";
import type { Lang } from "@/content/i18n";
import { copy } from "@/content/copy";
import { ahlamPassage as a } from "@/content/ahlam-passage";

/* Ahlam: a real entry, and a line traced from the symbol to the printed page
   it came from. Every passage on the live site carries this citation. */
export default function Citation({ lang }: { lang: Lang }) {
  const [traced, setTraced] = useState(false);
  const ref = useScrub<HTMLDivElement>((p) => { if (p > 0.25) setTraced(true); });
  const symRef = useRef<HTMLSpanElement>(null);
  const pageRef = useRef<HTMLSpanElement>(null);
  const [d, setD] = useState("");
  useEffect(() => {
    const host = ref.current, s = symRef.current, g = pageRef.current;
    if (!host || !s || !g) return;
    const calc = () => {
      const h = host.getBoundingClientRect(), sr = s.getBoundingClientRect(), gr = g.getBoundingClientRect();
      const x1 = sr.left - h.left + sr.width / 2, y1 = sr.bottom - h.top + 2;
      const x2 = gr.left - h.left + gr.width / 2, y2 = gr.top - h.top - 2;
      const c = (y2 - y1) * 0.6;
      setD(`M${x1} ${y1} C ${x1} ${y1 + c}, ${x2} ${y2 - c}, ${x2} ${y2}`);
    };
    calc();
    const ro = new ResizeObserver(calc); ro.observe(host);
    document.fonts?.ready.then(calc);
    return () => ro.disconnect();
  }, [ref]);
  return (
    <figure className={`cite${traced ? " is-traced" : ""}`} ref={ref} style={{ margin: 0 }}>
      <svg className="trace" aria-hidden="true"><path d={d} pathLength={1} /></svg>
      <blockquote className="passage" lang="ar" style={{ margin: 0 }}>
        <span className="sym" ref={symRef}>{a.symbol}</span>{" "}{a.text}
      </blockquote>
      <figcaption className="source">
        <span className="ref">
          {a.book[lang]} · {a.author[lang]} · {copy.work.volume[lang]} <span className="mono">{a.volume}</span> · {copy.work.printedPage[lang]} <span className="mono" ref={pageRef}>{a.page}</span>
        </span>
        <span>{a.chapter}</span>
        <span className="links">
          <a className="ulink" href={a.scan} target="_blank" rel="noopener">{copy.work.scan[lang]}</a>
          <a className="ulink" href={a.entry} target="_blank" rel="noopener">{copy.work.entry[lang]}</a>
        </span>
      </figcaption>
    </figure>
  );
}
