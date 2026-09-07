"use client";
import { useEffect, useRef, useState } from "react";
import { useScrub } from "@/lib/useReveal";
import type { Lang, L } from "@/content/i18n";
import { copy } from "@/content/copy";
import { ahlamPassage as a } from "@/content/ahlam-passage";

/* Ahlam — provenance, made visible.
 *
 * A page-like block carrying one real entry: the book's running head, the
 * passage exactly as printed, and the bibliographic line underneath. As the
 * visitor scrolls, a hairline leaves the marked symbol, runs down the margin,
 * crosses under the rule and arrives at the printed page number — then a second,
 * shorter line carries on out to the scan of that page. Every line here can be
 * checked against the page it came from.
 *
 * Nothing on this block is generated. The passage is a quotation from a named
 * scholar; the site adds the citation and nothing else.
 *
 * Geometry is measured, never assumed: the lane, the turns and both endpoints
 * come from element rects, so the Arabic root (bibliographic line RTL, the page
 * number at the far end — a long right-to-left run) and the English mirror
 * (caption LTR, the number under the symbol's own side — a short drop) derive
 * themselves from the same code. The passage is Arabic and RTL on both.
 */

/* Local strings — for the director to move into copy.ts. */
const SHORT: L = { ar: "تعطير الأنام", en: "Taʿṭīr al-anām" };
const NOTE: L = {
  ar: "النصّ منقول من الكتاب المطبوع كما هو. الموقع ينقل ولا يفسّر.",
  en: "The text is reproduced from the printed book as it stands. The site retrieves; it does not interpret.",
};
const SEP: L = { ar: "، ", en: ", " };

const scanHost = new URL(a.scan).host.replace(/^www\./, "");

type Pt = [number, number];

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
/* Decelerate into each endpoint so the line settles on the number. */
const ease = (t: number) => 1 - (1 - t) ** 2;
/* Half-pixel grid: a 1px stroke on horizontal and vertical runs stays crisp. */
const snap = (n: number) => Math.round(n) + 0.5;
const f = (n: number) => (Math.round(n * 10) / 10).toString();

/* A polyline with rounded corners. Points closer than 2px collapse, so a target
   sitting directly below its source degrades to a straight drop instead of
   producing a zero-length segment (and a NaN that would silently blank the path). */
function elbow(raw: Pt[], r: number): string {
  const pts: Pt[] = [];
  for (const q of raw) {
    const p: Pt = [snap(q[0]), snap(q[1])];
    const n = pts.length;
    if (n === 0 || Math.abs(pts[n - 1][0] - p[0]) > 1 || Math.abs(pts[n - 1][1] - p[1]) > 1) pts.push(p);
  }
  if (pts.length < 2) return "";
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const [cx, cy] = pts[i + 1];
    const la = Math.hypot(bx - ax, by - ay);
    const lc = Math.hypot(cx - bx, cy - by);
    const rr = Math.min(r, la / 2, lc / 2);
    d += ` L${f(bx + ((ax - bx) / la) * rr)} ${f(by + ((ay - by) / la) * rr)}`;
    d += ` Q${f(bx)} ${f(by)} ${f(bx + ((cx - bx) / lc) * rr)} ${f(by + ((cy - by) / lc) * rr)}`;
  }
  const [ex, ey] = pts[pts.length - 1];
  return `${d} L${f(ex)} ${f(ey)}`;
}

/* Beats, in scrub progress. */
const A0 = 0.06, A1 = 0.54; // symbol → printed page number
const B0 = 0.6, B1 = 0.88; // printed page number → the scan
const LANE = 11; // how far past the text edge the margin stem runs
const UNDER = 4.5; // matches .cit-sym::after — the stem leaves the symbol's own rule
const R = 8; // corner radius

export default function Citation({ lang }: { lang: Lang }) {
  const [p, setP] = useState(0);
  /* Quantised: the whole traversal is at most 200 renders, and React bails on
     the ticks in between. */
  const ref = useScrub<HTMLElement>((v) => setP(Math.round(v * 200) / 200), { start: "top 82%", end: "bottom 58%" });
  const symRef = useRef<HTMLElement>(null);
  const pageRef = useRef<HTMLSpanElement>(null);
  const capRef = useRef<HTMLElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [d, setD] = useState<{ a: string; b: string }>({ a: "", b: "" });

  useEffect(() => {
    const host = ref.current, sym = symRef.current, page = pageRef.current;
    const cap = capRef.current, link = linkRef.current;
    if (!host || !sym || !page || !cap || !link) return;

    const calc = () => {
      const h = host.getBoundingClientRect();
      if (h.width < 40) return;
      const s = sym.getBoundingClientRect();
      const g = page.getBoundingClientRect();
      const c = cap.getBoundingClientRect();
      const k = link.getBoundingClientRect();
      const X = (v: number) => v - h.left;
      const Y = (v: number) => v - h.top;

      /* Which margin does the symbol sit against? The passage is RTL on both
         languages, so in practice this is the block's end side — but read it
         off the rect rather than assuming the page's direction. */
      const out = X(s.left + s.width / 2) > h.width / 2 ? 1 : -1;
      const edge = out > 0 ? X(s.right) : X(s.left);
      const lane = Math.min(h.width - 6, Math.max(6, edge + out * LANE));
      const base = Y(s.bottom) + UNDER;
      /* The horizontal run sits in the gutter just above the caption's rule. */
      const run = Math.max(base + 16, Y(c.top) - 11);
      const gx = X(g.left + g.width / 2);
      const gTop = Y(g.top) - 3, gBot = Y(g.bottom) + 3;
      /* The second trace meets the link at whatever point of it sits nearest the
         number — a plain drop when the two already line up, which is what the
         end-aligned colophon row is arranged to produce in both directions. */
      const kc = X(k.left + k.width / 2), kTop = Y(k.top) - 3;
      const kL = Math.min(X(k.left) + 9, kc), kR = Math.max(X(k.right) - 9, kc);
      const kx = gx <= kL ? kL : gx >= kR ? kR : gx;
      const mid = (gBot + kTop) / 2;

      setD({
        a: elbow([[edge, base], [lane, base], [lane, run], [gx, run], [gx, gTop]], R),
        b: kTop > gBot + 6 ? elbow([[gx, gBot], [gx, mid], [kx, mid], [kx, kTop]], R) : "",
      });
    };

    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(host);
    ro.observe(cap);
    document.fonts?.ready.then(calc);
    return () => ro.disconnect();
  }, [ref]);

  const ta = clamp01((p - A0) / (A1 - A0));
  const tb = clamp01((p - B0) / (B1 - B0));
  const atPage = ta > 0.995;
  const atSource = tb > 0.995;
  const cls = `cit${atPage ? " is-at-page" : ""}${atSource ? " is-at-source" : ""}`;

  return (
    <figure className={cls} ref={ref}>
      {/* the book's own apparatus: short title one side, section the other */}
      <div className="cit-head">
        <span>{SHORT[lang]}</span>
        <span className="cit-chapter" lang="ar" dir="rtl">{a.chapter}</span>
      </div>

      <svg className="cit-trace" aria-hidden="true" focusable="false">
        <path d={d.a} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(ta)} />
        {d.b ? <path d={d.b} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(tb)} /> : null}
      </svg>

      <blockquote className="cit-passage" lang="ar" dir="rtl" cite={a.scan}>
        <b className="cit-sym" ref={symRef}>{a.symbol}</b> {a.text}
      </blockquote>

      <figcaption className="cit-cap" ref={capRef}>
        <p className="cit-bib">
          <span className="cit-from">{copy.work.citationFrom[lang]}</span>{" "}
          {a.author[lang]}{SEP[lang]}
          <cite>{a.book[lang]}</cite>{SEP[lang]}
          {copy.work.volume[lang]}{" "}<span className="mono">{a.volume}</span>{SEP[lang]}
          {copy.work.printedPage[lang]}{" "}<span className="mono cit-page" ref={pageRef}>{a.page}</span>.
        </p>
        <p className="cit-links">
          <span className="cit-src">
            <a className="cit-open" href={a.scan} target="_blank" rel="noopener" data-cursor="open" ref={linkRef}>
              {copy.work.scan[lang]}
            </a>
            <span className="cit-host mono">{scanHost}</span>
          </span>
          <a className="cit-entry" href={a.entry} target="_blank" rel="noopener" data-cursor="open">
            {copy.work.entry[lang]}
          </a>
        </p>
        <p className="cit-note">{NOTE[lang]}</p>
      </figcaption>
    </figure>
  );
}
