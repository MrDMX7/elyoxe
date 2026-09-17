"use client";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/content/i18n";
import { DEMO_ENDPOINT } from "@/content/endpoint";

/* The reply engine, reachable from the page.
 *
 * Every other visual on this site is inert by design — the validator never
 * uploads the invoice, the citation never leaves the tab. This one is the
 * opposite and says so: each reply is a real call to the production handler in
 * ~/workspace/saas/whatsapp-agent/src/agent.py, with the production prompt and
 * the production escalation rule, and it costs real money. So the page prints
 * what it cost: latency, which model answered, the model's own confidence, and
 * the fils. A demo that hides its bill is a brochure.
 *
 * Three things it deliberately does not do:
 *   — no WhatsApp trade dress. No green, no bubbles, no logo. The channel is
 *     named in the prose; the chrome is this site's.
 *   — nothing is persisted, here or there. The endpoint writes two counters and
 *     no message, which is the opposite of what the paying businesses get.
 *   — no pretending when it is down. Missing key, hit cap, network: the page
 *     says which one, and falls back to the tone examples that live in the
 *     business profile — labelled as profile text, not as model output.
 */

type Meta = {
  latency_ms: number;
  cost_fils: number;
  confidence: number;
  models: string[];
  escalated: boolean;
  intent: string;
  handoff: boolean;
};
type Turn = { role: "user" | "agent"; text: string; meta?: Meta };
type Status = "unknown" | "idle" | "sending" | "capped" | "down";

const MAX = 300;

const T = {
  demoTag: { ar: "منشأة تجريبية", en: "Fictional business" },
  switchLabel: { ar: "نفس المحرّك، ملف ثاني", en: "Same engine, another file" },
  live: { ar: "المحرّك حيّ", en: "Engine live" },
  offline: { ar: "الديمو موقوف", en: "Demo paused" },
  checking: { ar: "يتحقّق…", en: "checking…" },
  you: { ar: "انت", en: "You" },
  agent: { ar: "الوكيل", en: "Agent" },
  placeholder: { ar: "اكتب رسالتك…", en: "Type a message…" },
  send: { ar: "أرسل", en: "Send" },
  sending: { ar: "يكتب…", en: "Typing…" },
  try: { ar: "جرّب", en: "Try" },
  seconds: { ar: "ث", en: "s" },
  fils: { ar: "فلس", en: "fils" },
  conf: { ar: "ثقة", en: "confidence" },
  escalated: { ar: "صُعِّد إلى sonnet", en: "escalated to sonnet" },
  outOfScope: { ar: "خارج النطاق — رُفض", en: "out of scope — refused" },
  handoff: { ar: "حُوِّل لبشري", en: "handed to a human" },
  left: { ar: "ردّاً باقياً اليوم", en: "replies left today" },
  noStore: {
    ar: "ما يُحفظ شي من هالمحادثة. المكتوب الوحيد عدّادان: حدّ اليوم وحدّك انت.",
    en: "Nothing here is stored. The only writes are two counters: today's cap and yours.",
  },
  cappedMsg: {
    ar: "وصلنا للحد اليومي لهذا العرض. هذي أمثلة النبرة المكتوبة في ملف المنشأة — نص المالك، مب نص النموذج.",
    en: "The demo has spent its budget for today. Below are the tone examples written into the business profile — the owner's text, not the model's.",
  },
  downMsg: {
    ar: "الديمو غير مُفعَّل الحين. هذي أمثلة النبرة المكتوبة في ملف المنشأة — نص المالك، مب نص النموذج.",
    en: "The demo is not enabled right now. Below are the tone examples written into the business profile — the owner's text, not the model's.",
  },
  fromProfile: { ar: "من ملف المنشأة", en: "From the profile" },
  aria: {
    ar: "محادثة تجريبية مع وكيل الرد: اكتب سؤالاً كما يكتبه زبون، ويرد الوكيل بالإماراتية من ملف منشأة واحدة. تحت كل رد يظهر زمنه والنموذج الذي أجابه وكلفته بالفلس.",
    en: "A demo conversation with the reply agent: write as a customer would and it answers in Emirati Arabic from one business profile. Under each reply are its latency, the model that answered, and its cost in fils.",
  },
} as const;

/* Two businesses on one engine. The switch is the multi-tenant claim made
   visible: same prompt, same rules, a different file — and each one has its own
   thing it must refuse. The salon must not write code; the clinic must not
   answer a medical question, however the patient phrases it.
   Keys match PROFILES in ~/workspace/saas/whatsapp-agent/src/demo.py. */
type Biz = {
  key: string;
  name: { ar: string; en: string };
  intro: { ar: string; en: string };
  chips: { ar: string; en: string }[];
};

const BUSINESSES: Biz[] = [
  {
    key: "salon",
    name: { ar: "صالون نور", en: "Salon Noor" },
    intro: {
      ar: "اكتب له مثل ما يكتب له زبون. ملفه فيه خمس خدمات وأسعارها وأوقات الدوام — وما عنده غيرها.",
      en: "Write to it the way a customer would. Its file holds five services, their prices and the opening hours — and nothing else.",
    },
    chips: [
      { ar: "كم سعر القص؟", en: "How much is a haircut?" },
      { ar: "متى تسكرون يوم الجمعة؟", en: "What time do you close on Friday?" },
      { ar: "أبغى أحجز صبغة بكرة العصر", en: "I want to book colouring tomorrow afternoon" },
      { ar: "إنت روبوت؟", en: "Are you a bot?" },
      { ar: "اكتب لي كود بايثون يقرأ ملف", en: "Write me Python that reads a file" },
    ],
  },
  {
    key: "clinic",
    name: { ar: "عيادة الواحة", en: "Al Waha Dental" },
    intro: {
      ar: "نفس المحرّك بملف عيادة: يحجز ويسعّر، ولا يشخّص ولا يسمّي دواء مهما سألته.",
      en: "The same engine on a clinic's file: it books and quotes, and it will not diagnose or name a medicine however it is asked.",
    },
    chips: [
      { ar: "كم سعر التنظيف؟", en: "How much is a cleaning?" },
      { ar: "تقبلون تأمين؟", en: "Do you take insurance?" },
      { ar: "أبغى موعد بكرة الصبح", en: "I want an appointment tomorrow morning" },
      { ar: "سني يعورني وايد، شو آخذ؟", en: "My tooth really hurts, what should I take?" },
      { ar: "الجمعة مفتوحين؟", en: "Are you open on Friday?" },
    ],
  },
];

/* Verbatim from demo_profile.json → dialect_examples. Shown only when the live
   path is unavailable, and always labelled as profile text. */
const PROFILE_EXAMPLES = [
  { q: "كم سعر القص؟", a: "القص بـ 120 درهم ويأخذ حوالي 45 دقيقة. تبا أحجز لك؟" },
  { q: "متى تسكرون؟", a: "نسكر 10 مساءً من الأحد للخميس، والجمعة والسبت 11 مساءً." },
  { q: "عندكم عروض؟", a: "هالشي أحتاج أتأكد منه من الفريق، خلني أحوّلك لهم." },
];

const shortModel = (m: string) => (m.includes("sonnet") ? "sonnet" : "haiku");

export default function Agent({ lang }: { lang: Lang }) {
  const [biz, setBiz] = useState<Biz>(BUSINESSES[0]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [status, setStatus] = useState<Status>("unknown");
  const [value, setValue] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const down = status === "down" || status === "capped";

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, status]);

  /* Ask the endpoint whether it can answer before the widget says it can. The
     key can be absent and the day's budget can be spent, and in both cases the
     visitor should read that on arrival rather than discover it by typing. */
  useEffect(() => {
    let alive = true;
    fetch(DEMO_ENDPOINT, { method: "GET", mode: "cors" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setRemaining(typeof d.remaining_today === "number" ? d.remaining_today : null);
        setStatus(d.live && d.remaining_today > 0 ? "idle" : "down");
      })
      .catch(() => { if (alive) setStatus("down"); });
    return () => { alive = false; };
  }, []);

  async function ask(text: string) {
    const message = text.trim().slice(0, MAX);
    if (!message || status === "sending") return;
    const history = turns.map((t) => ({
      role: t.role === "agent" ? "assistant" : "user",
      text: t.text,
    }));
    setTurns((t) => [...t, { role: "user", text: message }]);
    setValue("");
    setStatus("sending");
    try {
      const r = await fetch(DEMO_ENDPOINT, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, business: biz.key }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.status === 429) { setStatus("capped"); return; }
      if (!r.ok || !data.reply) { setStatus("down"); return; }
      setRemaining(typeof data.remaining_today === "number" ? data.remaining_today : null);
      setTurns((t) => [...t, {
        role: "agent",
        text: data.reply,
        meta: {
          latency_ms: data.latency_ms ?? 0,
          cost_fils: data.cost_fils ?? 0,
          confidence: data.confidence ?? 0,
          models: data.models ?? [],
          escalated: !!data.escalated,
          intent: data.intent ?? "other",
          handoff: !!data.handoff,
        },
      }]);
      setStatus("idle");
    } catch {
      setStatus("down");
    }
  }

  return (
    <div className="agt" role="group" aria-label={T.aria[lang]}>
      <div className="agt-head">
        <div className="agt-who">
          <span className="agt-name">{biz.name[lang]}</span>
          <span className="agt-tag">{T.demoTag[lang]}</span>
        </div>
        <p className={`agt-state${status === "unknown" ? "" : down ? "" : " is-live"}`}>
          <span className="agt-dot" aria-hidden="true" />
          {status === "unknown" ? T.checking[lang] : down ? T.offline[lang] : T.live[lang]}
        </p>
      </div>

      <div className="agt-switch">
        <span className="agt-switch-label">{T.switchLabel[lang]}</span>
        {BUSINESSES.map((b) => (
          <button
            key={b.key}
            type="button"
            className={`agt-biz${b.key === biz.key ? " is-on" : ""}`}
            aria-pressed={b.key === biz.key}
            onClick={() => {
              if (b.key === biz.key) return;
              /* A transcript belongs to one business; carrying it across would
                 feed the clinic the salon's prices as context. */
              setBiz(b);
              setTurns([]);
              if (status === "capped" || status === "down") return;
              setStatus("idle");
            }}
          >
            {b.name[lang]}
          </button>
        ))}
      </div>

      <p className="agt-intro">{biz.intro[lang]}</p>

      <div className="agt-log" ref={logRef} aria-live="polite">
        {turns.map((t, i) => (
          <div className={`agt-turn is-${t.role}`} key={i}>
            <span className="agt-role">{t.role === "user" ? T.you[lang] : T.agent[lang]}</span>
            <p className="agt-text">{t.text}</p>
            {t.meta && (
              <p className="agt-meta">
                {/* mono carries the digits only: IBM Plex Mono has no Arabic, so a
                    mono span around an Arabic word falls back to a face that sets
                    it with the letters pulled apart. */}
                <span><span className="mono">{(t.meta.latency_ms / 1000).toFixed(1)}</span> {T.seconds[lang]}</span>
                <span className="mono">{t.meta.models.map(shortModel).join(" → ")}</span>
                <span>{T.conf[lang]} <span className="mono">{t.meta.confidence.toFixed(2)}</span></span>
                <span><span className="mono">{t.meta.cost_fils.toFixed(2)}</span> {T.fils[lang]}</span>
                {t.meta.escalated && <span className="is-note">{T.escalated[lang]}</span>}
                {t.meta.intent === "out_of_scope" && <span className="is-note">{T.outOfScope[lang]}</span>}
                {t.meta.handoff && <span className="is-note">{T.handoff[lang]}</span>}
              </p>
            )}
          </div>
        ))}

        {status === "sending" && <p className="agt-typing">{T.sending[lang]}</p>}

        {down && (
          <div className="agt-fallback">
            <p className="agt-fallback-note">{status === "capped" ? T.cappedMsg[lang] : T.downMsg[lang]}</p>
            {PROFILE_EXAMPLES.map((ex, i) => (
              <div className="agt-turn is-profile" key={i}>
                <span className="agt-role">{T.fromProfile[lang]}</span>
                <p className="agt-text agt-q">{ex.q}</p>
                <p className="agt-text">{ex.a}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <form
        className="agt-form"
        onSubmit={(e) => { e.preventDefault(); ask(value); }}
      >
        <label className="agt-field">
          <span className="agt-sr">{T.placeholder[lang]}</span>
          <input
            value={value}
            maxLength={MAX}
            disabled={down || status === "unknown"}
            placeholder={T.placeholder[lang]}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
        <button type="submit" className="agt-send" disabled={down || status === "unknown" || status === "sending" || !value.trim()}>
          {status === "sending" ? T.sending[lang] : T.send[lang]}
        </button>
      </form>

      <div className="agt-chips">
        <span className="agt-chips-label">{T.try[lang]}</span>
        {biz.chips.map((c, i) => (
          <button key={i} type="button" className="agt-chip" disabled={down || status === "unknown" || status === "sending"} onClick={() => ask(c[lang])}>
            {c[lang]}
          </button>
        ))}
      </div>

      <p className="agt-foot">
        {remaining !== null && <span className="agt-left"><span className="mono">{remaining}</span> {T.left[lang]}</span>}
        <span>{T.noStore[lang]}</span>
      </p>
    </div>
  );
}
