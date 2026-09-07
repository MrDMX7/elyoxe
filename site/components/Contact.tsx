"use client";
import { useState } from "react";
import { copy } from "@/content/copy";
import type { Lang } from "@/content/i18n";
import { CONTACT_ENDPOINT } from "@/content/endpoint";
import { useReveal } from "@/lib/useReveal";

export default function Contact({ lang }: { lang: Lang }) {
  const ref = useReveal<HTMLElement>();
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");
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
      form.reset(); setState("ok");
    } catch { setState("err"); }
  }
  return (
    <section id="contact" className="section" ref={ref} aria-labelledby="contact-title">
      <div className="wrap contact">
        <div>
          <h2 id="contact-title" className="display h1">
            {c.title[lang].map((l, i) => <span className="mask" key={i}><span>{l}</span></span>)}
          </h2>
          <p className="lead" data-reveal style={{ marginBlockStart: "1.5rem" }}>{c.lead[lang]}</p>
        </div>
        <form className="form" onSubmit={submit} data-reveal noValidate={false}>
          <div className="field"><label htmlFor="f-name">{c.name[lang]}</label><input id="f-name" name="name" required autoComplete="name" /></div>
          <div className="field"><label htmlFor="f-email">{c.email[lang]}</label><input id="f-email" name="email" type="email" required autoComplete="email" dir="ltr" /></div>
          <div className="field"><label htmlFor="f-msg">{c.message[lang]}</label><textarea id="f-msg" name="message" required minLength={10} /></div>
          <label className="hp" aria-hidden="true">website<input name="website" tabIndex={-1} autoComplete="off" /></label>
          <div className="form-foot">
            <button className="btn" type="submit" disabled={state === "sending"}>{state === "sending" ? c.sending[lang] : c.send[lang]}</button>
            <span className="small muted">{c.privacy[lang]}</span>
          </div>
          <p className={`form-status ${state === "ok" ? "ok" : state === "err" ? "err" : ""}`} role="status" aria-live="polite">
            {state === "ok" ? c.done[lang] : state === "err" ? c.fail[lang] : ""}
          </p>
        </form>
      </div>
    </section>
  );
}
