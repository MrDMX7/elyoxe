"use client";
import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { copy } from "@/content/copy";
import { services, type Service } from "@/content/services";
import { bySlug } from "@/content/case-studies";
import { href, type L, type Lang } from "@/content/i18n";
import { reducedMotion, useReveal } from "@/lib/useReveal";

gsap.registerPlugin(ScrollTrigger);

/* Four parallel fields — no numbering, no cards, no icons.
 *
 * Each row is a rule, a paragraph, a proof figure lifted from a real case
 * study, and one instrument drawn on a single 480×180 grid at one hairline
 * weight. The instrument is not a picture of the service: it performs it.
 * A fine pointer runs it on hover; a coarse one runs it once on scroll-enter;
 * reduced motion never builds a timeline, so the markup's resting state — the
 * finished drawing — is what shows.
 *
 * Everything is authored in left-to-right coordinates and mirrored once, at
 * the group, for Arabic; every "forward" motion therefore runs in the reading
 * direction without a second set of numbers.
 */

const W = 480;
const H = 180;
const mirror = (ar: boolean) => (ar ? `translate(${W} 0) scale(-1 1)` : undefined);

/* ── gsap helpers ─────────────────────────────────────────────── */

const all = (root: SVGSVGElement, sel: string) =>
  gsap.utils.toArray<SVGGeometryElement>(root.querySelectorAll(sel));

const one = (root: SVGSVGElement, sel: string) => root.querySelector<SVGGeometryElement>(sel);

/** Sets a dash pattern equal to the element's own length and returns it. */
function dashOf(el: SVGGeometryElement): number {
  if (typeof el.getTotalLength !== "function") return 0;
  let len = 0;
  try {
    len = el.getTotalLength();
  } catch {
    return 0;
  }
  if (!len || !Number.isFinite(len)) return 0;
  el.style.strokeDasharray = String(len);
  return len;
}

/** Draws elements in along their own path, staggered. */
function drawIn(
  tl: gsap.core.Timeline,
  els: SVGGeometryElement[],
  at: number,
  dur: number,
  stagger = 0,
  ease = "power2.out",
) {
  els.forEach((el, i) => {
    const len = dashOf(el);
    if (!len) return;
    tl.fromTo(
      el,
      { strokeDashoffset: len },
      { strokeDashoffset: 0, duration: dur, ease },
      at + i * stagger,
    );
  });
}

/* ── instrument 1 · web — one layout, mirrored ────────────────── */

function WebView({ ar }: { ar: boolean }) {
  const body = [
    [24, 114, 192],
    [24, 126, 180],
    [24, 138, 198],
    [24, 150, 126],
  ];
  return (
    <g transform={mirror(ar)}>
      <g className="svc-page">
        <rect className="svc-ink" x={24} y={18} width={14} height={14} />
        <line className="svc-stone" x1={398} y1={25} x2={416} y2={25} />
        <line className="svc-stone" x1={422} y1={25} x2={440} y2={25} />
        <line className="svc-stone" x1={446} y1={25} x2={456} y2={25} />
        <line className="svc-rule" x1={24} y1={44} x2={456} y2={44} />
        <line className="svc-ink svc-tl" x1={24} y1={64} x2={324} y2={64} />
        <line className="svc-ink svc-tl" x1={24} y1={84} x2={270} y2={84} />
        <line className="svc-acc svc-tick" x1={24} y1={54} x2={24} y2={94} />
        {body.map(([x, y, w]) => (
          <line className="svc-stone svc-tl" key={y} x1={x} y1={y} x2={x + w} y2={y} />
        ))}
        <line className="svc-rule" x1={300} y1={94} x2={366} y2={94} />
        <rect className="svc-stone svc-rail" x={300} y={104} width={156} height={22} />
        <rect className="svc-stone svc-rail" x={300} y={132} width={156} height={22} />
        <line className="svc-rule" x1={24} y1={166} x2={456} y2={166} />
      </g>
    </g>
  );
}

function buildWeb(root: SVGSVGElement): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true });
  const page = root.querySelector<SVGGElement>(".svc-page");
  const rails = all(root, ".svc-rail");
  const tick = one(root, ".svc-tick");
  drawIn(tl, all(root, ".svc-tl"), 0, 0.5, 0.06);
  if (rails.length) tl.fromTo(rails, { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.09 }, 0.3);
  if (page)
    tl.fromTo(
      page,
      { scaleX: -1 },
      { scaleX: 1, duration: 1.05, ease: "power3.inOut", svgOrigin: `${W / 2} ${H / 2}` },
      0.45,
    );
  if (tick)
    tl.fromTo(
      tick,
      { scaleY: 0, opacity: 0 },
      { scaleY: 1, opacity: 1, duration: 0.45, ease: "power2.out", svgOrigin: "24 94" },
      1.28,
    );
  return tl;
}

/* ── instrument 2 · ai — one lane, both scripts ───────────────── */

const AI_X = [0, 1, 2, 3, 4, 5].map((i) => 30 + i * 44);
const AI_AR = [0, 2, 3, 5];
const AI_BIN = [0, 1, 0, 2, 1, 1];
const AI_BAR = (() => {
  const seen = [0, 0, 0];
  return AI_BIN.map((b) => {
    const level = seen[b]++;
    const bx = 336 + b * 42;
    return { x1: bx + 4, x2: bx + 26, y: 148 - level * 9 };
  });
})();
const AI_T = AI_X.map((ox) => 0.8 + 1.2 * ((ox + 13 - 24) / 276));

function AiView({ ar }: { ar: boolean }) {
  return (
    <g transform={mirror(ar)}>
      <line className="svc-rule svc-lane" x1={24} y1={64} x2={312} y2={64} />
      {AI_X.map((ox, i) => (
        <g className="svc-doc" key={ox}>
          <rect className="svc-ink" x={ox} y={48} width={26} height={32} />
          <line className="svc-stone" x1={ox + 5} y1={58} x2={ox + 21} y2={58} />
          <line className="svc-stone" x1={ox + 5} y1={66} x2={ox + 16} y2={66} />
          {AI_AR.includes(i) ? <line className="svc-acc" x1={ox} y1={48} x2={ox} y2={80} /> : null}
        </g>
      ))}
      {AI_X.map((ox) => (
        <line className="svc-acc svc-mark" key={ox} x1={ox + 3} y1={88} x2={ox + 23} y2={88} />
      ))}
      <line className="svc-stone svc-gate" x1={312} y1={26} x2={312} y2={154} />
      {[0, 1, 2].map((b) => (
        <line className="svc-stone svc-chute" key={b} x1={312} y1={64} x2={351 + b * 42} y2={116} />
      ))}
      <line className="svc-acc svc-head" x1={300} y1={34} x2={300} y2={94} />
      {[0, 1, 2].map((b) => (
        <path
          className="svc-ink svc-bin"
          key={b}
          d={`M${336 + b * 42} 116 L${336 + b * 42} 152 L${336 + b * 42 + 30} 152 L${336 + b * 42 + 30} 116`}
        />
      ))}
      {AI_BAR.map((bar, i) => (
        <line className="svc-stone svc-bar" key={i} x1={bar.x1} y1={bar.y} x2={bar.x2} y2={bar.y} />
      ))}
    </g>
  );
}

function buildAi(root: SVGSVGElement): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true });
  const lane = one(root, ".svc-lane");
  const gate = one(root, ".svc-gate");
  const head = one(root, ".svc-head");
  const docs = gsap.utils.toArray<SVGGElement>(root.querySelectorAll(".svc-doc"));
  const marks = all(root, ".svc-mark");
  const bars = all(root, ".svc-bar");
  if (lane) drawIn(tl, [lane], 0, 0.45);
  if (docs.length)
    tl.fromTo(
      docs,
      { opacity: 0, x: -26 },
      { opacity: 1, x: 0, duration: 0.5, ease: "power2.out", stagger: 0.07 },
      0.12,
    );
  if (gate) drawIn(tl, [gate], 0.5, 0.4);
  drawIn(tl, all(root, ".svc-chute"), 0.55, 0.45, 0.06);
  drawIn(tl, all(root, ".svc-bin"), 0.62, 0.5, 0.08);
  if (head) tl.fromTo(head, { x: -276 }, { x: 0, duration: 1.2, ease: "none" }, 0.8);
  marks.forEach((m, i) => drawIn(tl, [m], AI_T[i], 0.24));
  bars.forEach((b, i) =>
    tl.fromTo(
      b,
      { scaleY: 0, opacity: 0 },
      { scaleY: 1, opacity: 1, duration: 0.32, ease: "power2.out", svgOrigin: "0 152" },
      AI_T[i] + 0.16,
    ),
  );
  return tl;
}

/* ── instrument 3 · software — a process that survives a kill ─── */

/* A sampled sensor signal, frozen into the source so the server-rendered and
   hydrated markup are byte-identical. 73 samples, x = 24 → 456, y = 57 → 103. */
const TRACE =
  "24.0,71.6 30.0,68.6 36.0,66.1 42.0,64.2 48.0,63.0 54.0,62.3 60.0,62.1 66.0,62.4 72.0,62.9 78.0,63.6 84.0,64.4 90.0,65.2 96.0,65.7 102.0,66.0 108.0,66.0 114.0,65.6 120.0,64.9 126.0,63.9 132.0,62.6 138.0,61.3 144.0,59.9 150.0,58.6 156.0,57.6 162.0,56.9 168.0,56.8 174.0,57.1 180.0,58.2 186.0,59.8 192.0,62.2 198.0,65.1 204.0,68.6 210.0,72.5 216.0,76.7 222.0,81.0 228.0,85.3 234.0,89.5 240.0,93.2 246.0,96.5 252.0,99.3 258.0,101.3 264.0,102.6 270.0,103.3 276.0,103.2 282.0,102.5 288.0,101.2 294.0,99.5 300.0,97.6 306.0,95.5 312.0,93.3 318.0,91.3 324.0,89.6 330.0,88.1 336.0,87.0 342.0,86.4 348.0,86.1 354.0,86.1 360.0,86.5 366.0,87.0 372.0,87.6 378.0,88.1 384.0,88.5 390.0,88.6 396.0,88.3 402.0,87.5 408.0,86.3 414.0,84.6 420.0,82.3 426.0,79.7 432.0,76.7 438.0,73.5 444.0,70.3 450.0,67.1 456.0,64.1";
const KILL_Y = 103.3;
const BACK_Y = 97.6;

function SoftwareView({ ar }: { ar: boolean }) {
  return (
    <g transform={mirror(ar)}>
      <line className="svc-rule" x1={24} y1={120} x2={456} y2={120} />
      <polyline className="svc-ink svc-trace" points={TRACE} />
      <circle className="svc-ink svc-dot" cx={270} cy={KILL_Y} r={3.5} />
      <circle className="svc-ink svc-dot" cx={300} cy={BACK_Y} r={3.5} />
      <line className="svc-stone svc-dash svc-drop" x1={270} y1={KILL_Y + 5} x2={270} y2={132} />
      <line className="svc-stone svc-dash svc-drop" x1={300} y1={BACK_Y + 5} x2={300} y2={130} />
      <line className="svc-stone svc-life" x1={24} y1={142} x2={258} y2={142} />
      <line className="svc-stone svc-life2" x1={300} y1={142} x2={456} y2={142} />
      <g className="svc-kill">
        <line className="svc-acc" x1={264} y1={136} x2={276} y2={148} />
        <line className="svc-acc" x1={276} y1={136} x2={264} y2={148} />
      </g>
      <line className="svc-acc svc-back" x1={300} y1={134} x2={300} y2={150} />
      <path className="svc-rule svc-gap" d="M258 156 L258 162 L300 162 L300 156" />
    </g>
  );
}

function buildSoftware(root: SVGSVGElement): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true });
  const trace = one(root, ".svc-trace");
  const life = one(root, ".svc-life");
  const life2 = one(root, ".svc-life2");
  const gap = one(root, ".svc-gap");
  const kill = root.querySelector<SVGGElement>(".svc-kill");
  const back = one(root, ".svc-back");
  const dots = all(root, ".svc-dot");
  const drops = all(root, ".svc-drop");
  if (trace) drawIn(tl, [trace], 0, 1.35, 0, "none");
  if (life) drawIn(tl, [life], 0.1, 0.5);
  if (kill)
    tl.fromTo(
      kill,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)", svgOrigin: "270 142" },
      0.72,
    );
  if (drops[0]) tl.fromTo(drops[0], { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.8);
  if (dots[0])
    tl.fromTo(dots[0], { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, svgOrigin: `270 ${KILL_Y}` }, 0.86);
  if (back)
    tl.fromTo(
      back,
      { scaleY: 0, opacity: 0 },
      { scaleY: 1, opacity: 1, duration: 0.3, ease: "power2.out", svgOrigin: "300 142" },
      1.0,
    );
  if (life2) drawIn(tl, [life2], 1.05, 0.5);
  if (drops[1]) tl.fromTo(drops[1], { opacity: 0 }, { opacity: 1, duration: 0.3 }, 1.14);
  if (dots[1])
    tl.fromTo(dots[1], { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, svgOrigin: `300 ${BACK_Y}` }, 1.2);
  if (gap) drawIn(tl, [gap], 1.32, 0.4);
  return tl;
}

/* ── instrument 4 · cloud — origin, distribution, edge, $0 ────── */

const CLOUD_EDGE_Y = [51, 90, 129];

function CloudView({ ar }: { ar: boolean }) {
  return (
    <g transform={mirror(ar)}>
      <rect className="svc-ink svc-node" x={24} y={72} width={48} height={36} />
      <line className="svc-stone" x1={24} y1={82} x2={72} y2={82} />
      <path className="svc-ink svc-node" d="M192 70 L212 90 L192 110 L172 90 Z" />
      <line className="svc-stone svc-wire" x1={72} y1={90} x2={172} y2={90} />
      {CLOUD_EDGE_Y.map((y) => (
        <line className="svc-stone svc-wire" key={`f${y}`} x1={212} y1={90} x2={324} y2={y} />
      ))}
      {CLOUD_EDGE_Y.map((y) => (
        <rect className="svc-ink svc-node" key={`e${y}`} x={324} y={y - 9} width={18} height={18} />
      ))}
      {CLOUD_EDGE_Y.map((y) => (
        <line className="svc-stone svc-wire" key={`v${y}`} x1={342} y1={y} x2={426} y2={y} />
      ))}
      {CLOUD_EDGE_Y.map((y) => (
        <line className="svc-stone" key={`t${y}`} x1={432} y1={y - 6} x2={432} y2={y + 6} />
      ))}
      <circle className="svc-fill svc-pulse" cx={333} cy={90} r={3.5} />
      <line className="svc-stone svc-meter" x1={24} y1={164} x2={180} y2={164} />
      {[0, 1, 2, 3, 4].map((i) => (
        <line className="svc-rule svc-meter" key={i} x1={24 + i * 39} y1={160} x2={24 + i * 39} y2={168} />
      ))}
      <line className="svc-acc svc-needle" x1={24} y1={154} x2={24} y2={172} />
    </g>
  );
}

function buildCloud(root: SVGSVGElement): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true });
  const pulse = one(root, ".svc-pulse");
  const needle = one(root, ".svc-needle");
  drawIn(tl, all(root, ".svc-wire"), 0, 0.5, 0.05);
  drawIn(tl, all(root, ".svc-node"), 0.05, 0.6, 0.05);
  drawIn(tl, all(root, ".svc-meter"), 0.35, 0.4, 0.03);
  if (pulse) {
    tl.fromTo(pulse, { x: 99, opacity: 0 }, { x: 99, opacity: 1, duration: 0.15 }, 0.7)
      .to(pulse, { x: 0, duration: 0.28, ease: "none" }, 0.85)
      .to(pulse, { x: -141, duration: 0.3, ease: "none" }, 1.13)
      .to(pulse, { x: -285, duration: 0.3, ease: "none" }, 1.43)
      .to(pulse, { x: 0, duration: 0.5, ease: "power2.inOut" }, 1.75)
      .to(pulse, { opacity: 0, duration: 0.12 }, 2.28)
      .set(pulse, { x: 99 }, 2.42)
      .to(pulse, { opacity: 1, duration: 0.12 }, 2.42)
      .to(pulse, { x: 0, duration: 0.22, ease: "none" }, 2.54);
  }
  if (needle) {
    tl.fromTo(needle, { x: 0 }, { x: 20, duration: 0.35, ease: "power2.out" }, 1.5).to(
      needle,
      { x: 0, duration: 0.7, ease: "power3.out" },
      1.9,
    );
  }
  return tl;
}

/* ── registry ─────────────────────────────────────────────────── */

type Instrument = { view: (ar: boolean) => ReactNode; build: (root: SVGSVGElement) => gsap.core.Timeline };

const INSTRUMENTS: Record<string, Instrument> = {
  web: { view: (ar) => <WebView ar={ar} />, build: buildWeb },
  ai: { view: (ar) => <AiView ar={ar} />, build: buildAi },
  software: { view: (ar) => <SoftwareView ar={ar} />, build: buildSoftware },
  cloud: { view: (ar) => <CloudView ar={ar} />, build: buildCloud },
};

/* Captions written for this section only — they name what the instrument does,
   in each language, rather than translating one into the other. */
const NOTE: Record<string, L> = {
  web: { ar: "تخطيط واحد ينعكس بين RTL وLTR", en: "One layout, mirrored between LTR and RTL" },
  ai: { ar: "مستندات عربية ولاتينية في مسارٍ واحد", en: "Arabic and Latin documents in one lane" },
  software: { ar: "إشارة SIGKILL ثم استئناف بلا فجوة في البيانات", en: "SIGKILL, then resume with no gap in the data" },
  cloud: { ar: "من S3 إلى CloudFront إلى الحافة، والعدّاد عند صفر", en: "S3 to CloudFront to the edge, the meter at zero" },
};

/* ── proof figure: counts once, on enter ──────────────────────── */

function useCountUp(ref: RefObject<HTMLSpanElement | null>, value: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const m = value.match(/[\d,.]+/);
    if (!m || m.index === undefined) return;
    const raw = m[0];
    const target = Number(raw.replace(/,/g, ""));
    if (!Number.isFinite(target)) return;
    const prefix = value.slice(0, m.index);
    const suffix = value.slice(m.index + raw.length);
    const dot = raw.indexOf(".");
    const dec = dot < 0 ? 0 : raw.length - dot - 1;
    const grouped = raw.includes(",");
    const fmt = (x: number) =>
      prefix +
      (grouped
        ? x.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec })
        : x.toFixed(dec)) +
      suffix;
    const o = { v: 0 };
    const write = () => {
      el.textContent = fmt(o.v);
    };
    const tl = gsap.timeline({
      paused: true,
      onComplete: () => {
        el.textContent = value;
      },
    });
    /* A figure whose honest answer is zero still deserves the sweep: the needle
       runs up and settles back on nothing. */
    if (target === 0) {
      tl.to(o, { v: 8, duration: 0.45, ease: "power2.out", onUpdate: write }).to(o, {
        v: 0,
        duration: 0.65,
        ease: "power3.inOut",
        onUpdate: write,
      });
    } else {
      tl.to(o, { v: target, duration: 1.15, ease: "power2.out", onUpdate: write });
    }
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 92%",
      once: true,
      onEnter: () => {
        el.textContent = fmt(0);
        tl.play(0);
      },
    });
    return () => {
      st.kill();
      tl.kill();
      el.textContent = value;
    };
  }, [ref, value]);
}

/* ── one row ──────────────────────────────────────────────────── */

function Row({ s, lang }: { s: Service; lang: Lang }) {
  const c = bySlug(s.proof.slug)!;
  const f = c.figures[s.proof.figure];
  const ar = lang === "ar";
  const instr = INSTRUMENTS[s.slug];
  const rowRef = useRef<HTMLLIElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);

  useCountUp(numRef, f.value);

  useEffect(() => {
    const row = rowRef.current;
    const svg = svgRef.current;
    if (!row || !svg || !instr || reducedMotion()) return;
    const tl = instr.build(svg);
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let st: ScrollTrigger | null = null;
    const run = () => {
      if (!tl.isActive()) tl.play(0);
    };
    if (fine) {
      /* Rest is the finished drawing; the visitor asks for it to run again. */
      tl.progress(1).pause();
      row.addEventListener("pointerenter", run);
      row.addEventListener("focusin", run);
    } else {
      tl.progress(0).pause();
      st = ScrollTrigger.create({ trigger: row, start: "top 80%", once: true, onEnter: run });
    }
    return () => {
      row.removeEventListener("pointerenter", run);
      row.removeEventListener("focusin", run);
      st?.kill();
      tl.kill();
    };
  }, [instr, ar]);

  return (
    <li className="svc-row" data-svc={s.slug} data-reveal ref={rowRef}>
      <div className="svc-copy">
        <h3 className="display h3">{s.title[lang]}</h3>
        <p className="svc-body">{s.body[lang]}</p>
        <div className="svc-proof">
          <span className="svc-figure" ref={numRef}>
            {f.value}
          </span>
          <span className="svc-what">{f.label[lang]}</span>
          <Link href={href(lang, `work/${c.slug}`)} className="ulink svc-link">
            {copy.services.proof[lang]}: {c.name[lang]}
          </Link>
        </div>
      </div>
      <figure className="svc-instr">
        <svg
          ref={svgRef}
          className="svc-svg"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          focusable="false"
        >
          {instr ? instr.view(ar) : null}
        </svg>
        <figcaption className="svc-note">{NOTE[s.slug]?.[lang]}</figcaption>
      </figure>
    </li>
  );
}

/* ── section ──────────────────────────────────────────────────── */

export default function Services({ lang }: { lang: Lang }) {
  const ref = useReveal<HTMLElement>();
  return (
    <section id="services" className="section" ref={ref} aria-labelledby="services-title">
      <div className="wrap">
        <div className="section-head">
          <h2 id="services-title" className="display h1">
            <span className="mask">
              <span>{copy.services.title[lang]}</span>
            </span>
          </h2>
          <p className="lead" data-reveal>
            {copy.services.lead[lang]}
          </p>
        </div>
        <ul className="svc-rows">
          {services.map((s) => (
            <Row key={s.slug} s={s} lang={lang} />
          ))}
        </ul>
      </div>
    </section>
  );
}
