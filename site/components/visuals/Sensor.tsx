"use client";
import { useId, useRef } from "react";
import { useScrub } from "@/lib/useReveal";
import type { Lang } from "@/content/i18n";
import { copy } from "@/content/copy";

/* Khutwa — the invariant, as an instrument rather than a chart.
 *
 * Two traces on one time axis. The stepped one is the store: it only knows a
 * number at the moment it writes. The continuous one is the hardware step
 * counter, which is the sole authority on totals and does not stop for anything.
 * Underneath, the step detector's ticks: timing only, never a total.
 *
 * Halfway across, the process dies. The store's line goes dashed — it is no
 * longer writing, it is only the last value it held — while the counter keeps
 * climbing and the delta opens. On restart the store does not replay anything:
 * it reads the counter once and lands on it, which is the tall riser. From the
 * last write to the end, delta reads exactly 0 and holds.
 *
 * Scroll is the only clock. Everything below is derived from one 0..1 progress
 * value, written straight to the DOM — no React state, no re-render.
 */

/* ── geometry ─────────────────────────────────────────────────
   One viewBox holds the plot band and the cadence strip so they can never
   drift apart, and so one clip reveals both. */
const W = 680, HT = 300, PAD = 10;
const PTOP = 18, PBOT = 228;          // plot band
const SBASE = 292;                    // baseline of the cadence strip
const N = 181;                        // samples along the time axis
const TOTAL = 8240;                   // illustrative, not a measurement
const YMAX = TOTAL * 1.06;

const T_DEATH = 0.52;                 // the process is killed here
const T_RESUME = 0.635;               // it comes back and reads the counter
const T_LAST = 0.82;                  // the last write; delta holds at 0 after it

/* Cadence: a warm-up, a pause partway, and a stop near the end. Deterministic —
   no randomness, so the server render and the client render agree. */
const rate = (t: number) => {
  const walk = 0.62 + 0.30 * Math.sin(t * 8.1 + 0.9) + 0.16 * Math.sin(t * 21.7 + 2.2);
  const pause = 0.88 * Math.exp(-(((t - 0.30) / 0.05) ** 2));
  const warm = Math.min(1, 0.30 + t * 9);
  const tail = t < 0.70 ? 1 : t > 0.80 ? 0 : (1 - (t - 0.70) / 0.10) ** 2;
  return Math.max(0.03, walk * (1 - pause)) * tail * warm;
};

const LIVE: number[] = (() => {
  const raw = [0];
  for (let i = 1; i < N; i++) raw.push(raw[i - 1] + rate(i / (N - 1)));
  const k = TOTAL / raw[N - 1];
  return raw.map((v) => Math.round(v * k));
})();

const liveAt = (t: number) => {
  const x = Math.max(0, Math.min(1, t)) * (N - 1);
  const i = Math.min(N - 2, Math.floor(x));
  return LIVE[i] + (LIVE[i + 1] - LIVE[i]) * (x - i);
};

/* Every write the store makes. Nothing between 0.45 and the restart: that gap
   is the whole point. */
const CKS = [0.045, 0.09, 0.135, 0.18, 0.225, 0.27, 0.315, 0.36, 0.405, 0.45, T_RESUME, 0.68, 0.725, 0.77, T_LAST];
const T_DEAD_FROM = 0.45;

const storedAt = (t: number) => {
  let v = 0;
  for (const c of CKS) { if (c <= t + 1e-9) v = liveAt(c); else break; }
  return v;
};

/* Progress runs with the reading direction: left→right in English, right→left
   in Arabic. Every x in the drawing comes through here, so the mirror is in the
   geometry rather than in a text alignment. */
const X = (t: number, rtl: boolean) => (rtl ? W - PAD - t * (W - 2 * PAD) : PAD + t * (W - 2 * PAD));
const Y = (v: number) => PBOT - (v / YMAX) * (PBOT - PTOP);
/* Distance of X(t) from the *start* edge, as a fraction — the same number in
   both directions, which is what `inset-inline-start` wants. */
const startPct = (t: number) => ((PAD + t * (W - 2 * PAD)) / W) * 100;

const n2 = (v: number) => v.toFixed(2);

const livePathOf = (rtl: boolean) =>
  LIVE.map((v, i) => `${i ? "L" : "M"}${n2(X(i / (N - 1), rtl))} ${n2(Y(v))}`).join(" ");

/* The store, in three pieces: writing, gone, writing again. The middle piece is
   dashed — a value still held, but nothing behind it. */
const storePathsOf = (rtl: boolean) => {
  const riser = (c: number, v: number, nv: number) =>
    ` L${n2(X(c, rtl))} ${n2(Y(v))} L${n2(X(c, rtl))} ${n2(Y(nv))}`;
  let d = `M${n2(X(0, rtl))} ${n2(Y(0))}`;
  let v = 0;
  for (const c of CKS) {
    if (c > T_DEAD_FROM) break;
    const nv = liveAt(c);
    d += riser(c, v, nv); v = nv;
  }
  const vDead = v;
  /* Between the last write and the death the store is simply between writes —
     still solid. It goes dashed only once there is no process behind the value. */
  d += ` L${n2(X(T_DEATH, rtl))} ${n2(Y(vDead))}`;
  const dead = `M${n2(X(T_DEATH, rtl))} ${n2(Y(vDead))} L${n2(X(T_RESUME, rtl))} ${n2(Y(vDead))}`;
  let after = `M${n2(X(T_RESUME, rtl))} ${n2(Y(vDead))}`;
  v = vDead;
  for (const c of CKS) {
    if (c < T_RESUME) continue;
    const nv = liveAt(c);
    after += riser(c, v, nv); v = nv;
  }
  after += ` L${n2(X(1, rtl))} ${n2(Y(v))}`;
  return { before: d, dead, after, vDead };
};

/* The debt: everything the counter recorded that the store has not written. */
const gapPathOf = (rtl: boolean, vDead: number) => {
  const base = Y(vDead);
  let d = `M${n2(X(T_DEAD_FROM, rtl))} ${n2(base)}`;
  for (let i = 0; i <= 32; i++) {
    const t = T_DEAD_FROM + (T_RESUME - T_DEAD_FROM) * (i / 32);
    d += ` L${n2(X(t, rtl))} ${n2(Y(liveAt(t)))}`;
  }
  return d + ` L${n2(X(T_RESUME, rtl))} ${n2(base)} Z`;
};

/* One tick per fixed number of steps, so density *is* cadence; height is the
   local rate, so the pause reads as a thinning rather than a gap in the axis. */
const TICKS: { t: number; h: number }[] = (() => {
  const out: { t: number; h: number }[] = [];
  const every = TOTAL / 140;
  let next = every, rMax = 0;
  for (let i = 1; i < N; i++) rMax = Math.max(rMax, LIVE[i] - LIVE[i - 1]);
  for (let i = 1; i < N; i++) {
    const d = LIVE[i] - LIVE[i - 1];
    while (LIVE[i] >= next && next <= TOTAL) {
      const f = d > 0 ? (next - LIVE[i - 1]) / d : 0;
      out.push({ t: (i - 1 + f) / (N - 1), h: 7 + 26 * Math.min(1, d / rMax) });
      next += every;
    }
  }
  return out;
})();

const tickPathOf = (rtl: boolean) =>
  TICKS.map((k) => `M${n2(X(k.t, rtl))} ${SBASE} L${n2(X(k.t, rtl))} ${n2(SBASE - k.h)}`).join(" ");

/* A small filled square at every write. */
const ckPathOf = (rtl: boolean) =>
  CKS.map((c) => {
    const x = X(c, rtl), y = Y(liveAt(c));
    return `M${n2(x - 2.5)} ${n2(y - 2.5)}h5v5h-5Z`;
  }).join(" ");

const GEO = {
  ltr: (() => { const s = storePathsOf(false); return { live: livePathOf(false), store: s, gap: gapPathOf(false, s.vDead), ticks: tickPathOf(false), cks: ckPathOf(false) }; })(),
  rtl: (() => { const s = storePathsOf(true); return { live: livePathOf(true), store: s, gap: gapPathOf(true, s.vDead), ticks: tickPathOf(true), cks: ckPathOf(true) }; })(),
};

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/* 0 below a, 1 above b. */
const ramp = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));

/* Strings that have no home in copy.ts yet — see the report. */
const S = {
  invariant: { ar: "الثابتة", en: "The invariant" },
  caption: { ar: "رسم توضيحي للثابتة — الأرقام تمثيلية", en: "An illustration of the invariant — figures are representative" },
  detector: {
    ar: "كاشف الخطوة يعطي الإيقاع فقط. المجموع ليس من شأنه.",
    en: "The step detector supplies timing only. The total is never its job.",
  },
  death: { ar: "موت العملية", en: "Process death" },
  reconciled: { ar: "يقرأ العدّاد ويطابقه", en: "reads the counter, matches it" },
  awaiting: { ar: "ما لم يُكتب بعد", en: "not written yet" },
  died: { ar: "العملية ماتت، والعدّاد لم يتوقّف", en: "the process died, the counter did not" },
  matched: { ar: "مطابق، وثابت", en: "matched, and holding" },
  desc: {
    ar: "رسم توضيحي: العدّاد في العتاد يواصل العدّ عبر موت العملية، بينما يتوقّف السجلّ المخزَّن عند آخر قيمة كتبها؛ وعند العودة يقرأ العدّاد مرّة واحدة ويطابقه. الفرق بين مجموع السجلّ والعدّاد الحي يستقر على صفر بالضبط ويبقى عليه.",
    en: "An illustration: the hardware counter keeps counting across a process death while the stored history stops at the last value it wrote; on restart it reads the counter once and lands on it. The delta between the stored total and the live counter settles on exactly zero and stays there.",
  },
} as const;

export default function Sensor({ lang }: { lang: Lang }) {
  const rtl = lang === "ar";
  const g = rtl ? GEO.rtl : GEO.ltr;
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "");
  const cid = `snr-clip-${uid}`;

  const clip = useRef<SVGRectElement | null>(null);
  const sweep = useRef<SVGGElement | null>(null);
  const hLive = useRef<SVGGElement | null>(null);
  const hStore = useRef<SVGGElement | null>(null);
  const gapEl = useRef<SVGPathElement | null>(null);
  const deathEl = useRef<SVGGElement | null>(null);
  const annD = useRef<HTMLSpanElement | null>(null);
  const annR = useRef<HTMLSpanElement | null>(null);
  const vStore = useRef<HTMLSpanElement | null>(null);
  const vLive = useRef<HTMLSpanElement | null>(null);
  const vDelta = useRef<HTMLSpanElement | null>(null);
  const box = useRef<HTMLDivElement | null>(null);
  const state = useRef<HTMLParagraphElement | null>(null);

  /* Cheap write guards: the scrub fires at scroll rate and most of these values
     do not actually change from frame to frame. */
  const prev = useRef({ s: -1, l: -1, d: -1, phase: "", locked: false });

  const draw = (p: number) => {
    const t = clamp01(p);
    const x = X(t, rtl);
    const lv = liveAt(t), sv = storedAt(t);
    const s = Math.round(sv), l = Math.round(lv), d = Math.max(0, l - s);
    const q = prev.current;

    clip.current?.setAttribute("transform", `translate(${n2(x)} 0)`);
    const on = `${ramp(t, 0, 0.015)}`;
    if (hLive.current) { hLive.current.setAttribute("transform", `translate(${n2(x)} ${n2(Y(lv))})`); hLive.current.style.opacity = on; }
    if (hStore.current) { hStore.current.setAttribute("transform", `translate(${n2(x)} ${n2(Y(sv))})`); hStore.current.style.opacity = on; }

    /* The sweep line rides the reveal edge and retires once the counter stops. */
    if (sweep.current) {
      sweep.current.setAttribute("transform", `translate(${n2(x)} 0)`);
      sweep.current.style.opacity = `${ramp(t, 0, 0.02) * (1 - ramp(t, T_LAST - 0.04, T_LAST + 0.02))}`;
    }
    /* The debt opens with the death and is gone the moment it is settled. */
    if (gapEl.current) gapEl.current.style.opacity = `${ramp(t, T_DEAD_FROM, T_DEATH) * (1 - ramp(t, T_RESUME, T_RESUME + 0.05))}`;
    if (deathEl.current) deathEl.current.style.opacity = `${ramp(t, T_DEATH, T_DEATH + 0.02) * (1 - 0.55 * ramp(t, T_RESUME, T_RESUME + 0.08))}`;
    if (annD.current) annD.current.style.opacity = `${ramp(t, T_DEATH, T_DEATH + 0.02) * (1 - 0.5 * ramp(t, T_RESUME, T_RESUME + 0.08))}`;
    if (annR.current) annR.current.style.opacity = `${ramp(t, T_RESUME, T_RESUME + 0.03)}`;

    if (s !== q.s && vStore.current) { vStore.current.textContent = fmt(s); q.s = s; }
    if (l !== q.l && vLive.current) { vLive.current.textContent = fmt(l); q.l = l; }
    if (d !== q.d && vDelta.current) { vDelta.current.textContent = `Δ ${fmt(d)}`; q.d = d; }

    /* Hysteresis, so a thumb resting on the boundary cannot retrigger the settle. */
    const locked = q.locked ? t > T_LAST - 0.04 : t >= T_LAST;
    if (locked !== q.locked) { q.locked = locked; box.current?.classList.toggle("is-locked", locked); }

    const phase = locked ? "matched" : t >= T_DEATH && t < T_RESUME ? "died" : "awaiting";
    if (phase !== q.phase) {
      q.phase = phase;
      state.current?.setAttribute("data-phase", phase);
    }
  };

  const ref = useScrub<HTMLDivElement>(draw, { start: "top 85%", end: "bottom 45%" });

  const vDead = g.store.vDead;
  return (
    <div className="snr on-ink" ref={ref} role="img" aria-label={S.desc[lang]}>
      <div className="snr-head">
        <span className="snr-inv">{S.invariant[lang]}<b className="snr-eq">Δ = 0</b></span>
        <span className="snr-cap">{S.caption[lang]}</span>
      </div>

      <div className="snr-plot">
        <svg viewBox={`0 0 ${W} ${HT}`} aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">
          <defs>
            <clipPath id={cid} clipPathUnits="userSpaceOnUse">
              {/* One rect, moved by transform: the whole reveal is a single
                  attribute write, and it sweeps the way the language reads. */}
              <rect ref={clip} x={rtl ? 0 : -W} y="0" width={W} height={HT}
                transform={`translate(${n2(X(0, rtl))} 0)`} />
            </clipPath>
          </defs>

          {/* the instrument: present before any data is */}
          <g className="snr-grid">
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1={PAD} x2={W - PAD} y1={n2(Y(YMAX * f))} y2={n2(Y(YMAX * f))} />
            ))}
            <line className="snr-axis" x1={PAD} x2={W - PAD} y1={PBOT} y2={PBOT} />
            <line className="snr-axis" x1={PAD} x2={W - PAD} y1={SBASE} y2={SBASE} />
          </g>

          {/* the data: revealed by the sweep, nothing else */}
          <g className="snr-data" clipPath={`url(#${cid})`}>
            <path ref={gapEl} className="snr-gap" d={g.gap} />
            <path className="snr-ticks" d={g.ticks} />
            <path className="snr-store" d={g.store.before} />
            <path className="snr-store is-dead" d={g.store.dead} />
            <path className="snr-store" d={g.store.after} />
            <path className="snr-live" d={g.live} />
            <path className="snr-ck" d={g.cks} />
            {/* what the store came back holding, and where it landed */}
            <circle className="snr-restart" cx={n2(X(T_DEATH, rtl))} cy={n2(Y(vDead))} r="5" />
            <circle className="snr-join" cx={n2(X(T_RESUME, rtl))} cy={n2(Y(liveAt(T_RESUME)))} r="4.5" />
          </g>

          <g ref={deathEl} className="snr-death">
            <line x1={n2(X(T_DEATH, rtl))} x2={n2(X(T_DEATH, rtl))} y1={PTOP - 6} y2={SBASE} />
          </g>

          <g ref={sweep} className="snr-sweep" transform={`translate(${n2(X(0, rtl))} 0)`}>
            <line x1="0" x2="0" y1={PTOP - 6} y2={SBASE} />
          </g>
          {/* store first and a shade larger: at the end the two heads land on the
              same point, and the overlap should read as deliberate */}
          <g ref={hStore} className="snr-head-store" transform={`translate(${n2(X(1, rtl))} ${n2(Y(TOTAL))})`}>
            <rect x="-3.5" y="-3.5" width="7" height="7" />
          </g>
          <g ref={hLive} className="snr-head-live" transform={`translate(${n2(X(1, rtl))} ${n2(Y(TOTAL))})`}>
            <circle r="3.25" />
          </g>
        </svg>

        <div className="snr-ann" aria-hidden="true">
          <span ref={annD} className="snr-a snr-a-death" style={{ insetInlineStart: `${startPct(T_DEATH).toFixed(2)}%` }}>
            {S.death[lang]}
          </span>
          <span ref={annR} className="snr-a snr-a-rec" style={{ insetInlineEnd: `${(100 - startPct(T_RESUME)).toFixed(2)}%` }}>
            {S.reconciled[lang]}
          </span>
        </div>
      </div>

      <p className="snr-note">{S.detector[lang]}</p>

      <div className="snr-out">
        <div className="snr-cell">
          <span ref={vStore} className="snr-v">0</span>
          <span className="snr-lbl">{copy.work.stored[lang]}</span>
        </div>
        <div className="snr-cell">
          <span ref={vLive} className="snr-v is-live">0</span>
          <span className="snr-lbl">{copy.work.liveCounter[lang]}</span>
        </div>
        <div className="snr-cell snr-d" ref={box}>
          <span ref={vDelta} className="snr-v">Δ 0</span>
          <span className="snr-lbl">{copy.work.delta[lang]}</span>
        </div>
      </div>
      <p ref={state} className="snr-state" data-phase="awaiting" aria-hidden="true">
        <span data-st="awaiting">{S.awaiting[lang]}</span>
        <span data-st="died">{S.died[lang]}</span>
        <span data-st="matched">{S.matched[lang]}</span>
      </p>
    </div>
  );
}
