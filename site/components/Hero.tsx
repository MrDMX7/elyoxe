"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { copy } from "@/content/copy";
import { caseStudies } from "@/content/case-studies";
import { nodes } from "@/content/systems";
import { dirOf, href, type Lang } from "@/content/i18n";
import { heroBus } from "@/lib/heroBus";
import { reducedMotion } from "@/lib/useReveal";
import Ledger, { ledgerRows } from "./Ledger";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

/* The signature moment. One timeline on load:
   1. the headline reveals line by line;
   2. the real numbers surface at the node they belong to in the systems field
      and travel, in the page's reading direction, into their ledger slots;
   3. the field settles into the labelled systems map behind.
   With reduced motion none of this runs: the headline is set, the ledger is
   full, and the map is its static labels. */
export default function Hero({ lang }: { lang: Lang }) {
  const dir = dirOf(lang);
  const ref = useRef<HTMLElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const fragsRef = useRef<HTMLDivElement>(null);
  const rows = ledgerRows(lang);
  const [sceneOn, setSceneOn] = useState(false);

  // The scene is the heaviest thing on the page. It mounts after the document
  // has loaded and the main thread is idle, so the first paint and the headline
  // never wait for three.js. `?noscene` disables it for measurement.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("noscene")) return;
    let idle = 0;
    const arm = () => {
      const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
      if (ric) idle = ric(() => setSceneOn(true), { timeout: 900 });
      else idle = window.setTimeout(() => setSceneOn(true), 250);
    };
    if (document.readyState === "complete") arm();
    else window.addEventListener("load", arm, { once: true });
    return () => { window.removeEventListener("load", arm); window.clearTimeout(idle); };
  }, []);

  useEffect(() => {
    heroBus.labels = labelsRef.current;
    const el = ref.current;
    if (!el) return;
    if (reducedMotion()) { heroBus.settle(); return; }
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const hooks: (() => void)[] = [];
    const ctx = gsap.context(() => {
      const lines = el.querySelectorAll<HTMLElement>(".hero-title .mask > span");
      const soft = el.querySelectorAll<HTMLElement>("[data-soft]");
      const ledger = el.querySelector<HTMLElement>(".ledger");
      const slots = Array.from(el.querySelectorAll<HTMLElement>("[data-slot]"));
      const frags = Array.from(el.querySelectorAll<HTMLElement>(".frag"));
      gsap.set(lines, { yPercent: 110 });
      gsap.set(soft, { opacity: 0, y: 14 });
      gsap.set(ledger, { opacity: 0, y: 18 });
      slots.forEach((s) => s.style.setProperty("--slot-opacity", "0"));

      // The load-in waits for the preloader's curtain to lift (a synchronous
      // flag first, then the event), and never waits on the event alone.
      const tl = gsap.timeline({ paused: true });
      let started = false;
      const play = () => { if (started) return; started = true; tl.play(); };
      const w = window as Window & { __elyoxeReady?: boolean };
      let startFallback = 0;
      if (w.__elyoxeReady) play();
      else {
        window.addEventListener("elyoxe:ready", play, { once: true });
        startFallback = window.setTimeout(play, 1400);
      }
      hooks.push(() => { window.removeEventListener("elyoxe:ready", play); window.clearTimeout(startFallback); });
      tl.to(lines, { yPercent: 0, duration: 1.25, ease: "expo.out", stagger: 0.11 }, 0)
        .to(soft, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.08 }, 0.55)
        .to(ledger, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out" }, 0.75);

      // fragments: launch from the node that owns the number, land in the slot.
      // They wait for the scene (so they really come from their node), capped at
      // 2.4s after which they launch from the reading-start edge instead.
      const heroRect = () => el.getBoundingClientRect();
      tl.addPause(1.05, () => {
        const go = () => tl.play();
        if (heroBus.ready) { go(); return; }
        const t0 = performance.now();
        const poll = () => { if (heroBus.ready || performance.now() - t0 > 1400) go(); else requestAnimationFrame(poll); };
        requestAnimationFrame(poll);
      });
      tl.add(() => {
        const hr = heroRect();
        frags.forEach((frag, i) => {
          const id = frag.dataset.frag!;
          const slot = slots.find((s) => s.dataset.slot === id);
          if (!slot) return;
          const node = heroBus.ready ? heroBus.nodes.get(id === "cost" ? "s3" : id) : null;
          const start = node
            ? { x: node.x, y: node.y }
            : { x: (dir === "rtl" ? 0.82 : 0.18) * hr.width + (i - 2) * 40, y: hr.height * (0.12 + i * 0.07) };
          const sr = slot.getBoundingClientRect();
          const fr = frag.getBoundingClientRect();
          const end = { x: sr.left - hr.left + sr.width / 2, y: sr.top - hr.top + sr.height / 2 };
          const scale = sr.height / Math.max(1, fr.height);
          gsap.set(frag, { x: start.x, y: start.y, xPercent: -50, yPercent: -50, scale: isMobile ? 0.7 : 1, opacity: 0 });
          const sub = gsap.timeline({ delay: i * 0.13 });
          sub.to(frag, { opacity: 1, duration: 0.35, ease: "power2.out" })
            .to(frag, { x: end.x, y: end.y, scale, duration: 1.15, ease: "expo.inOut" }, 0.25)
            .add(() => {
              frag.style.opacity = "0";
              slot.style.setProperty("--slot-opacity", "1");
              gsap.fromTo(slot, { color: "#F4F2ED" }, { color: "#F0BC5A", duration: 0.7, ease: "power2.out" });
              const row = slot.closest<HTMLElement>(".ledger-row, .ledger-foot");
              if (row) gsap.fromTo(row, { backgroundColor: "rgba(240,188,90,0.14)" }, { backgroundColor: "rgba(240,188,90,0)", duration: 1.1, ease: "power2.out" });
            });
        });
      }, 1.05);
      tl.add(() => heroBus.settle(), 1.05 + frags.length * 0.13 + 1.35);
      if (fine) tl.add(() => el.querySelector(".hero-canvas")?.classList.add("is-interactive"), ">");
    }, el);
    // Safety net: whatever the timeline did not reach by 7s becomes visible.
    // A hero with no headline is worse than a hero with no choreography.
    const safety = window.setTimeout(() => {
      gsap.to(el.querySelectorAll(".hero-title .mask > span, [data-soft], .ledger"), { yPercent: 0, y: 0, opacity: 1, duration: 0.4, overwrite: "auto" });
      el.querySelectorAll<HTMLElement>("[data-slot]").forEach((s) => s.style.setProperty("--slot-opacity", "1"));
      el.querySelectorAll<HTMLElement>(".frag").forEach((f) => { f.style.opacity = "0"; });
      heroBus.settle();
    }, 7000);
    return () => { window.clearTimeout(safety); hooks.forEach((h) => h()); ctx.revert(); };
  }, [dir]);

  return (
    <section className="hero" ref={ref} aria-labelledby="hero-title">
      <div className="hero-canvas" aria-hidden="true">
        {sceneOn && <HeroScene dir={dir} />}
        <div className="hero-labels" ref={labelsRef}>
          {nodes.map((n) => (
            <span key={n.id} data-node={n.id} className={`hero-label${n.kind === "anchor" ? " is-anchor" : ""}${n.live ? " is-live" : ""}`}>{n.label}</span>
          ))}
        </div>
      </div>
      <div className="hero-frags" ref={fragsRef} aria-hidden="true">
        {rows.map((r) => <span key={r.id} className="frag" data-frag={r.id}>{r.value}</span>)}
      </div>
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <h1 id="hero-title" className="display hero-title">
            {copy.hero.lines[lang].map((line, i) => (
              <span className="mask" key={i}><span>{i === 1 ? <span className="accent">{line}</span> : line}</span></span>
            ))}
          </h1>
          <p className="lead hero-lead">{copy.hero.lead[lang]}</p>
          <div className="hero-actions" data-soft>
            <a className="btn" href={`${href(lang)}#contact`}>{copy.hero.cta[lang]}</a>
            <a className="link" href={`${href(lang)}#work`}>{copy.hero.cta2[lang]}</a>
          </div>
        </div>
        <Ledger lang={lang} />
      </div>
      <span className="visually-hidden" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{copy.hero.canvasLabel[lang]}</span>
      {caseStudies.length === 0 && <Link href={href(lang)} />}
    </section>
  );
}
