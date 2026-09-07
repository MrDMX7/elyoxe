"use client";
import { useState } from "react";
import { copy } from "@/content/copy";
import type { Lang } from "@/content/i18n";
import { CONTACT_ENDPOINT } from "@/content/endpoint";
import { useReveal } from "@/lib/useReveal";

const MIN = 10;

/* Field furniture and the one descriptive line about the path. The path is the
   one documented in content/endpoint.ts — API Gateway, a function, then email —
   described, not claimed: the privacy sentence itself lives in copy.ts. */
const T = {
  path: { ar: "المسار كله: متصفحك، ثم دالة واحدة، ثم البريد.", en: "The whole path: your browser, one function, then the mailbox." },
  minChars: { ar: "الحد الأدنى عشرة أحرف", en: "minimum ten characters" },
  chars: { ar: "حرفاً", en: "characters" },
};

export default function Contact({ lang }: { lang: Lang }) {
  const ref = useReveal<HTMLElement>();
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [len, setLen] = useState(0);
  const c = copy.contact;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const fd = new FormData(form);
    setState("sending");
    try {
      const r = await fetch(CONTACT_ENDPOINT, {
        method: "POST", mode: "cors", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fd.get("name"), email: fd.get("email"), message: fd.get("message"), website: fd.get("website") ?? "", lang }),
      });
      if (!r.ok) throw new Error(String(r.status));
      form.reset(); setLen(0); setState("ok");
    } catch { setState("err"); }
  }

  return (
    <section id="contact" className="section ctc" ref={ref} aria-labelledby="contact-title">
      <div className="wrap contact">
        <div className="ctc-intro">
          <h2 id="contact-title" className="display h1">
            {c.title[lang].map((l, i) => <span className="mask" key={i}><span>{l}</span></span>)}
          </h2>
          <p className="lead" data-reveal>{c.lead[lang]}</p>
          {/* the privacy sentence carries the section, so it is set like a statement */}
          <div className="ctc-privacy" data-reveal>
            <p className="ctc-privacy-line">{c.pitch[lang]}</p>
            <p className="ctc-privacy-note">{c.pitchBody[lang]}</p>
          </div>
        </div>

        <form className="ctc-form" onSubmit={submit} data-reveal noValidate={false}>
          <div className="ctc-field">
            <span className="ctc-idx" aria-hidden="true">01</span>
            <div className="ctc-input">
              <input id="f-name" name="name" required autoComplete="name" placeholder=" " />
              <label htmlFor="f-name" className="ctc-label">{c.name[lang]}</label>
              <span className="ctc-rule" aria-hidden="true" />
            </div>
          </div>

          <div className="ctc-field">
            <span className="ctc-idx" aria-hidden="true">02</span>
            <div className="ctc-input">
              <input id="f-email" name="email" type="email" required autoComplete="email" dir="ltr" placeholder=" " />
              <label htmlFor="f-email" className="ctc-label">{c.email[lang]}</label>
              <span className="ctc-rule" aria-hidden="true" />
            </div>
          </div>

          <div className="ctc-field">
            <span className="ctc-idx" aria-hidden="true">03</span>
            <div className="ctc-input">
              <textarea
                id="f-msg" name="message" required minLength={MIN} placeholder=" " rows={5}
                onChange={(e) => setLen(e.currentTarget.value.length)}
              />
              <label htmlFor="f-msg" className="ctc-label is-block">{c.message[lang]}</label>
              <span className="ctc-rule" aria-hidden="true" />
            </div>
            <p className="ctc-meter" data-on={len > 0} data-short={len < MIN} aria-hidden="true">
              <span className="ctc-count">{len < MIN ? `${len}/${MIN}` : len}</span>
              <span>{len < MIN ? T.minChars[lang] : T.chars[lang]}</span>
            </p>
          </div>

          <label className="hp" aria-hidden="true">website<input name="website" tabIndex={-1} autoComplete="off" /></label>

          <div className="ctc-foot">
            <button className="ctc-send" type="submit" data-state={state} disabled={state === "sending"}>
              <span>{state === "sending" ? c.sending[lang] : c.send[lang]}</span>
              <i className="ctc-sweep" aria-hidden="true" />
            </button>
            <p className={`ctc-status is-${state}`} role="status" aria-live="polite">
              {state === "ok" ? c.done[lang] : state === "err" ? c.fail[lang] : ""}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
