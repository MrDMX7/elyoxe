"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let refreshHooked = false;
function hookRefresh() {
  if (refreshHooked) return;
  refreshHooked = true;
  // Fonts and the WebGL canvas both shift layout after first paint.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
  const ro = new ResizeObserver(() => ScrollTrigger.refresh());
  ro.observe(document.body);
}

export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* `.mask > span` lines and `[data-reveal]` items reveal as they enter the viewport,
   batched so neighbours stagger. Nothing is pinned; nothing stays hidden if a
   trigger misfires — a safety net forces everything visible after 5s. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    hookRefresh();
    let safety = 0;
    const ctx = gsap.context(() => {
      const lines = Array.from(el.querySelectorAll<HTMLElement>(".mask > span"));
      const items = Array.from(el.querySelectorAll<HTMLElement>("[data-reveal]"));
      if (lines.length) {
        gsap.set(lines, { yPercent: 110 });
        ScrollTrigger.batch(lines, { start: "top 92%", once: true, onEnter: (b) => gsap.to(b, { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.08, overwrite: true }) });
      }
      if (items.length) {
        gsap.set(items, { opacity: 0, y: 20 });
        ScrollTrigger.batch(items, { start: "top 94%", once: true, onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.06, overwrite: true }) });
      }
      safety = window.setTimeout(() => gsap.to([...lines, ...items], { yPercent: 0, opacity: 1, y: 0, duration: 0.5, overwrite: "auto" }), 5000);
    }, el);
    return () => { window.clearTimeout(safety); ctx.revert(); };
  }, []);
  return ref;
}

/* A scroll-scrubbed progress value (0..1) for a section, for the case-study
   visuals. Reduced motion resolves to 1 immediately so the finished state shows. */
export function useScrub<T extends HTMLElement>(onProgress: (p: number) => void, opts: { start?: string; end?: string } = {}) {
  const ref = useRef<T>(null);
  const cb = useRef(onProgress);
  cb.current = onProgress;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion()) { cb.current(1); return; }
    hookRefresh();
    const st = ScrollTrigger.create({
      trigger: el,
      start: opts.start ?? "top 80%",
      end: opts.end ?? "bottom 55%",
      onUpdate: (self) => cb.current(self.progress),
    });
    return () => st.kill();
  }, [opts.start, opts.end]);
  return ref;
}
