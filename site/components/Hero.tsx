"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { copy } from "@/content/copy";
import { dirOf, href, type Lang } from "@/content/i18n";
import { reducedMotion } from "@/lib/useReveal";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

/* Machines without hardware GL (headless browsers, some VMs) get paper only:
   the field is a simulation, and a software rasteriser would burn the main
   thread on every frame for nothing. */
function hasHardwareGL(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const r = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return !/swiftshader|llvmpipe|softpipe|software|mesa offscreen|basic render/i.test(r);
  } catch { return false; }
}

/* The hero: the headline over the field. One timeline on load — the headline
   reveals line by line as the preloader's curtain lifts, then the actions
   fade in. The field runs its own resolve sweep once it mounts. */
export default function Hero({ lang }: { lang: Lang }) {
  const dir = dirOf(lang);
  const ref = useRef<HTMLElement>(null);
  const [sceneOn, setSceneOn] = useState(false);

  // The scene mounts after the document has loaded and the main thread is
  // idle, so the first paint never waits for three.js. `?noscene` disables it.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.has("noscene")) return;
    const force = q.has("forcescene"); // for screenshot tools on software GL
    let idle = 0;
    const arm = () => {
      const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
      const pick = () => { if (force || hasHardwareGL()) setSceneOn(true); };
      if (ric) idle = ric(pick, { timeout: 900 });
      else idle = window.setTimeout(pick, 250);
    };
    if (document.readyState === "complete") arm();
    else window.addEventListener("load", arm, { once: true });
    return () => { window.removeEventListener("load", arm); window.clearTimeout(idle); };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const hooks: (() => void)[] = [];
    const ctx = gsap.context(() => {
      const lines = el.querySelectorAll<HTMLElement>(".hero-title .mask > span");
      const soft = el.querySelectorAll<HTMLElement>("[data-soft]");
      gsap.set(lines, { yPercent: 110 });
      gsap.set(soft, { opacity: 0, y: 14 });
      const tl = gsap.timeline({ paused: true });
      tl.to(lines, { yPercent: 0, duration: 1.25, ease: "expo.out", stagger: 0.11 }, 0)
        .to(soft, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.08 }, 0.55);
      // wait for the preloader's curtain (flag first, then the event), never on the event alone
      let started = false;
      const play = () => { if (started) return; started = true; tl.play(); };
      const w = window as Window & { __elyoxeReady?: boolean };
      let fallback = 0;
      if (w.__elyoxeReady) play();
      else { window.addEventListener("elyoxe:ready", play, { once: true }); fallback = window.setTimeout(play, 1400); }
      hooks.push(() => { window.removeEventListener("elyoxe:ready", play); window.clearTimeout(fallback); });
    }, el);
    // safety net: a hero with no headline is worse than a hero with no choreography
    const safety = window.setTimeout(() => {
      gsap.to(el.querySelectorAll(".hero-title .mask > span, [data-soft]"), { yPercent: 0, y: 0, opacity: 1, duration: 0.4, overwrite: "auto" });
    }, 6000);
    return () => { window.clearTimeout(safety); hooks.forEach((h) => h()); ctx.revert(); };
  }, [dir]);

  return (
    <section className="hero" ref={ref} aria-labelledby="hero-title">
      <div className="hero-canvas" aria-hidden="true">
        {sceneOn && <HeroScene dir={dir} />}
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
      </div>
      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{copy.hero.canvasLabel[lang]}</span>
    </section>
  );
}
