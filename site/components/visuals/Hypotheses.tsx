"use client";
import { useCallback, useEffect, useRef } from "react";
import { useScrub, reducedMotion } from "@/lib/useReveal";
import type { Lang } from "@/content/i18n";
import { copy } from "@/content/copy";

/* The quantitative method: nine hypotheses, written down before they were
   tested, and every one falsified.
 *
 * The resting state of this component — the static HTML, no-JS, reduced motion,
 * a ScrollTrigger that never fires — is the FINISHED record: nine lines struck,
 * the verdict on every one of them, the tally at 9/9. Script only ever takes
 * that away (`is-running`, `is-pending`) to replay how the record was made.
 * A negative result is the deliverable here, so it is what the DOM says first.
 *
 * Per row, three beats: registered (the rule is drawn, the entry is written),
 * tested (the mono goes from stone to ink), struck (a saffron rule pulled
 * through the entry from the reading start, then the verdict flips). Rows
 * overlap so the sequence is continuous — which is what makes the hold before
 * the ninth read as a hold and not as the rhythm.
 *
 * The three marks at the end of every row are the shared gate — three
 * independent out-of-sample checks that each line passed through. They are
 * static and identical on every row on purpose: the record is one process
 * applied nine times, not nine sets of per-row results, and nothing here may
 * imply data we do not have. */

const N = 9;

const ORD: Record<Lang, string[]> = {
  ar: ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة", "الثامنة", "التاسعة"],
  en: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine"],
};

/* Local strings — candidates for content/copy.ts, see the report. */
const T = {
  label: {
    ar: "سجلّ الفرضيات: تسع فرضيات سُجّلت قبل اختبارها",
    en: "Hypothesis ledger: nine hypotheses registered before they were tested",
  },
  withheld: {
    ar: "نصّ الفرضيات غير منشور؛ المسجَّل هنا ترتيبها وحالتها.",
    en: "The statements are not published. Their order and their status are.",
  },
  gate: {
    ar: "ثلاثة فحوص مستقلة خارج العيّنة، يمرّ بها كل سطر.",
    en: "Three independent out-of-sample checks, on every line.",
  },
} satisfies Record<string, Record<Lang, string>>;

/* Scroll timeline, in beats. Rows are struck on a 0.70 stride while each row's
   own act runs 1.00, so a strike lands while the next line is still being
   written. The ninth waits GAP beats in silence and then takes half again as
   long as the others. */
const STRIDE = 0.7;
const DUR = 1;
const GAP = 1.1;
const DUR_LAST = 1.45;
const TAIL = 0.45;
const START = Array.from({ length: N }, (_, i) => (i < N - 1 ? i * STRIDE : (N - 1) * STRIDE + GAP));
const TOTAL = START[N - 1] + DUR_LAST + TAIL;

/* Phases inside one row's act, as a fraction of its own duration. */
const P_REG = 0.2; // registered by here
const P_TEST = 0.3; // under test from here
const P_STRIKE = 0.44; // the rule starts moving
const P_STRIKE_D = 0.34; // …and lands 0.34 later
const FLIP = 0.55; // strike progress at which the verdict is written

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const outCubic = (x: number) => 1 - (1 - x) * (1 - x) * (1 - x);

const SCRUB = { start: "top 85%", end: "bottom 45%" };
/* Must match SCRUB.start: above that line the scrub is already producing
   progress, so the visitor has genuinely begun reading the ledger. */
const ARM_ABOVE = 0.85;

export default function Hypotheses({ lang }: { lang: Lang }) {
  const rtl = lang === "ar";
  const el = useRef({
    root: null as HTMLDivElement | null,
    tally: null as HTMLSpanElement | null,
    rows: [] as (HTMLLIElement | null)[],
    entries: [] as (HTMLSpanElement | null)[],
    ends: [] as (HTMLSpanElement | null)[],
    strikes: [] as (HTMLSpanElement | null)[],
    lines: [] as (HTMLSpanElement | null)[],
  });
  /* Integer thousandths, so the comparison that skips a write is exact. */
  const seen = useRef({
    reg: new Int16Array(N).fill(-1),
    strike: new Int16Array(N).fill(-1),
    state: new Int8Array(N).fill(-1),
    done: -1,
  });
  /* The sequence only runs if it was wound back before the visitor reached it.
     Otherwise every update is ignored and the finished record simply stands. */
  const armed = useRef(false);

  const apply = useCallback(
    (p: number) => {
      if (!armed.current) return;
      const d = el.current;
      const c = seen.current;
      const t = p * TOTAL;
      let done = 0;
      for (let i = 0; i < N; i++) {
        const q = clamp01((t - START[i]) / (i === N - 1 ? DUR_LAST : DUR));
        const reg = Math.round(clamp01(q / P_REG) * 1000);
        const s = Math.round(outCubic(clamp01((q - P_STRIKE) / P_STRIKE_D)) * 1000);
        const state = s > FLIP * 1000 ? 2 : q >= P_TEST ? 1 : 0;
        if (state === 2) done++;

        if (c.reg[i] !== reg) {
          c.reg[i] = reg;
          const line = d.lines[i];
          const entry = d.entries[i];
          const end = d.ends[i];
          /* The line is ruled at full strength first, then the entry is
             written onto it from the reading-start side: right in RTL, left in
             LTR — and the verdict column arrives with it. */
          if (line) line.style.transform = `scaleX(${reg / 1000})`;
          if (entry) {
            entry.style.opacity = `${reg / 1000}`;
            entry.style.transform = `translate3d(${(((rtl ? 1 : -1) * (1000 - reg) * 7) / 1000).toFixed(2)}px,0,0)`;
          }
          if (end) end.style.opacity = `${reg / 1000}`;
        }
        if (c.strike[i] !== s) {
          c.strike[i] = s;
          const strike = d.strikes[i];
          if (strike) strike.style.transform = `scaleX(${s / 1000})`;
        }
        if (c.state[i] !== state) {
          c.state[i] = state;
          const row = d.rows[i];
          if (row) {
            row.classList.toggle("is-pending", state < 2);
            row.classList.toggle("is-tested", state === 1);
          }
        }
      }
      if (c.done !== done) {
        const prev = c.done;
        c.done = done;
        if (d.tally) {
          d.tally.textContent = String(done);
          if (prev >= 0 && done > prev && !reducedMotion()) {
            d.tally.animate(
              [{ transform: "scale(1.16)" }, { transform: "scale(1)" }],
              { duration: 300, easing: "cubic-bezier(0.16,1,0.3,1)" },
            );
          }
        }
        d.root?.classList.toggle("is-running", done < N);
      }
    },
    [rtl],
  );

  const scrub = useScrub<HTMLDivElement>(apply, SCRUB);

  useEffect(() => {
    const root = scrub.current;
    if (!root || reducedMotion()) return;
    /* Only wind the ledger back if the visitor has not reached it yet —
       landing mid-page (a deep link, a refresh) must never hide the record. */
    if (root.getBoundingClientRect().top <= window.innerHeight * ARM_ABOVE) return;
    el.current.root = root;
    armed.current = true;
    apply(0);
  }, [apply, scrub]);

  const marks = (
    <span className="hyl-marks" aria-hidden="true">
      <i /><i /><i />
    </span>
  );

  return (
    <div className="hyl" data-dir={rtl ? "rtl" : "ltr"} ref={scrub}>
      <div className="hyl-head">
        <p className="hyl-withheld">{T.withheld[lang]}</p>
        <p className="hyl-gate">{marks}{T.gate[lang]}</p>
      </div>

      <ol className="hyl-list" aria-label={T.label[lang]}>
        {ORD[lang].map((ord, i) => (
          <li
            className="hyl-row"
            key={i}
            ref={(node) => {
              el.current.rows[i] = node;
            }}
          >
            <span
              className="hyl-entry"
              ref={(node) => {
                el.current.entries[i] = node;
              }}
            >
              <span className="hyl-id">H-{String(i + 1).padStart(2, "0")}</span>
              <span className="hyl-name">
                {rtl ? `ال${copy.work.hypothesis.ar} ${ord}` : `${copy.work.hypothesis.en} ${ord}`}
              </span>
              <span
                className="hyl-strike"
                aria-hidden="true"
                ref={(node) => {
                  el.current.strikes[i] = node;
                }}
              />
            </span>
            <span
              className="hyl-end"
              ref={(node) => {
                el.current.ends[i] = node;
              }}
            >
              {marks}
              <span className="hyl-verdict">
                <span className="hyl-v-reg" aria-hidden="true">{copy.work.registered[lang]}</span>
                <span className="hyl-v-fal">{copy.work.falsified[lang]}</span>
              </span>
            </span>
            <span
              className="hyl-line"
              aria-hidden="true"
              ref={(node) => {
                el.current.lines[i] = node;
              }}
            />
          </li>
        ))}
      </ol>

      <div className="hyl-foot">
        <p className="hyl-count">
          <span className="hyl-tally">
            <span
              className="n"
              ref={(node) => {
                el.current.tally = node;
              }}
            >
              9
            </span>
            <span className="of">/9</span>
          </span>
          <span className="hyl-word">{copy.work.falsified[lang]}</span>
        </p>
        <p className="hyl-foot-note">{copy.work.ledgerFoot[lang]}</p>
      </div>
    </div>
  );
}
