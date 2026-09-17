"use client";
import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useScrub, reducedMotion } from "@/lib/useReveal";
import { href, type Lang } from "@/content/i18n";
import { copy } from "@/content/copy";
import CoinRun from "./CoinRun";

/* The method, as a ledger of closed exits.
 *
 * This component used to count falsified hypotheses — nine of nine. That
 * number was never sourced: the record on the box says ten dead, one
 * explicitly NOT falsified, one unrefuted result on a forward book, and six
 * more registered under a no-look clause until 2026-10-01. A tally is also a
 * maintenance debt: it goes stale the moment the research moves. So the count
 * is gone and the rows are the standing rules instead, which do not move.
 *
 * Each row is one way to fool yourself, and the rule from the written policy
 * that closes it. The strike is what closes the route — so the resting state,
 * the static HTML with no JS, is every route already struck: the method as it
 * stands. Script only ever winds that back to replay how each one was closed.
 *
 * The three marks on every row are the shared gate — three independent
 * out-of-sample checks. They are identical on every row on purpose: one
 * process applied throughout, not per-row results, and nothing here may imply
 * data we do not have. */

const T = {
  label: {
    ar: "سجلّ المنهج: كل طريق لخداع النفس، والقاعدة التي تغلقه",
    en: "The method as a ledger: each way of fooling yourself, and the rule that closes it",
  },
  source: {
    ar: "قواعد قائمة، مكتوبة في سياسة المشروع قبل أي تشغيل — لا حصيلة نتائج.",
    en: "Standing rules, written into the project's policy before any run — not a tally of results.",
  },
  gate: {
    ar: "ثلاثة فحوص مستقلة خارج العيّنة، يمرّ بها كل سطر.",
    en: "Three independent out-of-sample checks, on every line.",
  },
  why: {
    ar: "عشر رميات عملة على وجه واحد ليست نادرة، ومع بيانات كافية ستجد دائماً قاعدة تبدو صحيحة. لهذا وحده يوجد هذا السجل: كل سطر فيه طريق كان يمكن أن نخدع فيه أنفسنا، وقاعدةٌ كُتبت مسبقاً لتغلقه.",
    en: "Ten coin flips the same way is not rare, and in enough data you will always find a rule that looks true. That alone is why this ledger exists: every line is a way we could have fooled ourselves, and a rule written in advance that closes it.",
  },
  readOn: {
    ar: "الحجّة كاملة: القاعدة التي تبدو صحيحة",
    en: "The argument in full: the rule that looks true",
  },
  foot: {
    ar: "لا يوجد عدّاد هنا عمداً. عدد النتائج السلبية يتغيّر كل أسبوع، أما ما يجعل النتيجة جديرة بالتصديق فهو هذه القواعد، وهي لا تتغيّر.",
    en: "There is deliberately no counter here. The number of negative results changes every week; what makes a result worth believing is these rules, and they do not.",
  },
} satisfies Record<string, Record<Lang, string>>;

/* Route → the rule that closes it. Every rule is in the written policy; none
   of them is a claim about a result, so none of them goes stale. */
const ROWS: { route: Record<Lang, string>; rule: Record<Lang, string> }[] = [
  {
    route: { ar: "نُجرّب حتى ينجح شيء", en: "Test until something passes" },
    rule: {
      ar: "تُسجَّل الفرضية كتابةً قبل تشغيلها: السكّان، والأفق، والسمة، والاتجاه المتوقَّع — ومعها الشرط الذي يُبطلها.",
      en: "The hypothesis is registered in writing before it runs: population, horizon, feature, predicted direction — and the condition that would falsify it.",
    },
  },
  {
    route: { ar: "نُفسّر النتيجة بعد ظهورها", en: "Interpret the result after seeing it" },
    rule: {
      ar: "يبقى النصّ حرفياً كما كُتب، ويُنشر الدحض بدل أن يُحرَّر النصّ.",
      en: "The statement stands verbatim as written, and the falsification is reported rather than edited away.",
    },
  },
  {
    route: { ar: "ذراعٌ واحدة تبدو جيدة", en: "A single arm that looks good" },
    rule: {
      ar: "تُسجَّل الفرضيات أزواجاً متعارضة — ذراع منفردة تبدو جيدة لا يمكن دحضها أصلاً.",
      en: "Hypotheses are registered as opposed pairs — a single arm that looks good cannot be falsified at all.",
    },
  },
  {
    route: { ar: "لا نعرف كيف تبدو الصدفة", en: "Not knowing what chance looks like" },
    rule: {
      ar: "ضابط عدم يُشغَّل على المسار نفسه: مسارٌ يجد ميزة في بيانات مُبعثرة مسارٌ معطوب، ويجب أن يُكتشف قبل أن يكلّف مالاً.",
      en: "A null control runs through the same pipeline: one that finds an edge in shuffled data is broken, and that has to be found before it costs money.",
    },
  },
  {
    route: { ar: "نُطالع البيانات كلّما زادت", en: "Look again every time the data grows" },
    rule: {
      ar: "لا نظرة قبل التاريخ المسجَّل ولا قبل بلوغ العدد المطلوب، أيّهما أبعد — وأي نظرة أبكر تُكتب أولاً.",
      en: "No look before the registered date or the required count, whichever is later — and any earlier look is written down first.",
    },
  },
  {
    route: { ar: "نختبر على ما طوّرنا عليه", en: "Test on what you developed on" },
    rule: {
      ar: "عيّنة محجوزة من أدوات لم تدخل التطوير إطلاقاً، ولا تُحلَّل ولا يُصرف عليها نظر.",
      en: "A holdout of instruments never used in development, not analysed and with no look spent on it.",
    },
  },
  {
    route: { ar: "نُشغّل ما أعجبنا", en: "Run whatever looks good" },
    rule: {
      ar: "بوابة مكتوبة تحكم ما يعمل حياً، ومعها قاطع إيقاف وسقوف مخاطرة وسجلّ أمامي يقيّد كل إشارة من لحظتها.",
      en: "A written gate governs what runs live, with a kill switch, risk caps, and a forward ledger that records every signal from the moment it fires.",
    },
  },
];

const N = ROWS.length;

/* Scroll timeline, in beats. Rows close on a 0.70 stride while each row's own
   act runs 1.00, so one route is struck while the next is still being written.
   The last waits GAP beats in silence and then takes half again as long. */
const STRIDE = 0.7;
const DUR = 1;
const GAP = 1.1;
const DUR_LAST = 1.45;
const TAIL = 0.45;
const START = Array.from({ length: N }, (_, i) => (i < N - 1 ? i * STRIDE : (N - 1) * STRIDE + GAP));
const TOTAL = START[N - 1] + DUR_LAST + TAIL;

/* Phases inside one row's act, as a fraction of its own duration. */
const P_REG = 0.2; // written by here
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
     Otherwise every update is ignored and the finished ledger simply stands. */
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
        c.done = done;
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
      <p className="hyl-why">{T.why[lang]}</p>
      <CoinRun lang={lang} />

      <div className="hyl-head">
        <p className="hyl-withheld">{T.source[lang]}</p>
        <p className="hyl-gate">{marks}{T.gate[lang]}</p>
      </div>

      <ol className="hyl-list" aria-label={T.label[lang]}>
        {ROWS.map((r, i) => (
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
              <span className="hyl-name">{r.route[lang]}</span>
              <span
                className="hyl-strike"
                aria-hidden="true"
                ref={(node) => {
                  el.current.strikes[i] = node;
                }}
              />
            </span>
            <span className="hyl-rule">{r.rule[lang]}</span>
            <span
              className="hyl-end"
              ref={(node) => {
                el.current.ends[i] = node;
              }}
            >
              {marks}
              <span className="hyl-verdict">
                <span className="hyl-v-reg" aria-hidden="true">{copy.work.openRoute[lang]}</span>
                <span className="hyl-v-fal">{copy.work.closedRoute[lang]}</span>
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
        <p className="hyl-foot-note">{T.foot[lang]}</p>
        <p className="hyl-foot-link">
          <Link className="ulink" href={href(lang, "writing/the-rule-that-looks-true")}>
            {T.readOn[lang]}
          </Link>
        </p>
      </div>
    </div>
  );
}
