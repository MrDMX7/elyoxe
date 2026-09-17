"use client";
import { useCallback, useRef, useState } from "react";
import type { Lang } from "@/content/i18n";

/* The coin, run by the visitor.
 *
 * The section's whole argument is that a convincing pattern proves nothing on
 * its own. Stated in prose that is a claim the visitor has to take on trust;
 * flipped in their hand it is something they watched happen. Two numbers move
 * in opposite directions and that opposition IS the law of large numbers: the
 * ratio converges on 0.5 while the absolute gap between heads and tails grows
 * without bound, at roughly 0.8*sqrt(n). Nothing corrects the gap. It is only
 * ever outrun by a bigger denominator.
 *
 * The streak is the third number because it is the one that feels wrong: long
 * runs are ordinary, and a visitor who has just produced a run of 12 by
 * pressing a button twice is inoculated against reading one off a chart.
 *
 * No animation loop and no timers: a press does the whole batch synchronously
 * and writes once. Nothing here is persisted or sent anywhere. */

const T = {
  title: { ar: "جرّبها بنفسك", en: "Try it yourself" },
  flip10: { ar: "ارمِ 10", en: "Flip 10" },
  flip1k: { ar: "ارمِ 1,000", en: "Flip 1,000" },
  reset: { ar: "من البداية", en: "Start over" },
  flips: { ar: "رمية", en: "flips" },
  ratio: { ar: "نسبة الصورة", en: "Heads ratio" },
  gap: { ar: "الفرق المطلق", en: "Absolute gap" },
  streak: { ar: "أطول سلسلة", en: "Longest streak" },
  ratioNote: { ar: "تقترب من 0.5", en: "converges on 0.5" },
  gapNote: { ar: "ولا تتوقّف عن الكبر", en: "and keeps growing" },
  idle: {
    ar: "اضغط وشوف الرقمين يتحرّكان في اتجاهين متعاكسين.",
    en: "Press, and watch the two numbers move in opposite directions.",
  },
  payoff: {
    ar: "النسبة تقترب من 0.5، والفرق المطلق يكبر معها لا ضدّها. فلا شيء «يصحّح» سلسلة سابقة — الفجوة تتّسع، ويغرقها مقامٌ أكبر. وهذا وحده يكفي ليجعل نمطاً مقنعاً بلا معنى.",
    en: "The ratio closes on 0.5 while the absolute gap grows alongside it, not against it. Nothing “corrects” an earlier run — the gap widens and a bigger denominator drowns it. That alone is enough to make a convincing pattern meaningless.",
  },
} satisfies Record<string, Record<Lang, string>>;

type S = { n: number; heads: number; streak: number; run: number; last: 0 | 1 | -1 };
const ZERO: S = { n: 0, heads: 0, streak: 0, run: 0, last: -1 };

export default function CoinRun({ lang }: { lang: Lang }) {
  const [s, setS] = useState<S>(ZERO);
  const live = useRef<HTMLParagraphElement | null>(null);

  const flip = useCallback((count: number) => {
    setS((p) => {
      let { n, heads, streak, run, last } = p;
      for (let i = 0; i < count; i++) {
        const f: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
        n++;
        if (f === 1) heads++;
        run = f === last ? run + 1 : 1;
        last = f;
        if (run > streak) streak = run;
      }
      return { n, heads, streak, run, last };
    });
  }, []);

  const tails = s.n - s.heads;
  const gap = Math.abs(s.heads - tails);
  const ratio = s.n ? s.heads / s.n : 0.5;
  /* The deviation bar is clamped at 0.1 either side: past that the bar stops
     being informative, and early runs routinely blow through it. */
  const dev = Math.max(-1, Math.min(1, (ratio - 0.5) / 0.1));

  return (
    <div className="coin" data-dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="coin-bar">
        <h4 className="coin-title">{T.title[lang]}</h4>
        <div className="coin-btns">
          <button type="button" onClick={() => flip(10)}>{T.flip10[lang]}</button>
          <button type="button" onClick={() => flip(1000)}>{T.flip1k[lang]}</button>
          <button
            type="button"
            className="coin-reset"
            onClick={() => setS(ZERO)}
            disabled={s.n === 0}
          >
            {T.reset[lang]}
          </button>
        </div>
      </div>

      <div className="coin-grid">
        <div className="coin-stat">
          <span className="coin-v">{s.n}</span>
          <span className="coin-k">{T.flips[lang]}</span>
        </div>
        <div className="coin-stat is-accent">
          <span className="coin-v">{s.n ? ratio.toFixed(4) : "—"}</span>
          <span className="coin-k">{T.ratio[lang]} · {T.ratioNote[lang]}</span>
        </div>
        <div className="coin-stat is-accent">
          <span className="coin-v">{s.n ? gap : "—"}</span>
          <span className="coin-k">{T.gap[lang]} · {T.gapNote[lang]}</span>
        </div>
        <div className="coin-stat">
          <span className="coin-v">{s.streak || "—"}</span>
          <span className="coin-k">{T.streak[lang]}</span>
        </div>
      </div>

      <div className="coin-dev" aria-hidden="true">
        <i className="coin-mid" />
        <i
          className="coin-dot"
          style={{ transform: `translate3d(${(dev * 50).toFixed(2)}%,0,0)` }}
        />
      </div>

      <p className="coin-note" ref={live} aria-live="polite">
        {s.n >= 100 ? T.payoff[lang] : T.idle[lang]}
      </p>
    </div>
  );
}
