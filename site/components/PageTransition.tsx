"use client";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ══ The ink wipe ══════════════════════════════════════════════════════════
 *
 * Covers a route swap inside one language — home ↔ case study, case ↔ case.
 * The panel sweeps in from where the line starts and, after the swap, keeps
 * going and leaves where the line ends: one continuous movement in the
 * reading direction, so it reads as forward in Arabic and in English.
 *
 *   click → wipe out 450ms → scroll top + router.push → wipe in 450ms
 *                                                     + a soft reveal of #main
 *
 * What it deliberately does not touch, letting the browser or next/link do
 * its normal thing:
 *   · anything with a hash — next/link still navigates these client-side,
 *     they just arrive without a wipe, and Lenis keeps its anchor offset
 *   · cross-language links — /  ↔ /en/ are two root layouts, a full document
 *     load, so there is no swap to cover
 *   · modified clicks, target=_blank, download, rel=external, other origins
 *   · reduced motion — no listener is attached at all, navigation is plain
 *
 * Safety: next/link's own handler checks `e.defaultPrevented`, so calling
 * preventDefault() here cannot produce a second router.push. If a navigation
 * never commits, a 1.2s timer wipes back in anyway; if even that fails, a
 * 3.2s timer parks the panel off-screen. The overlay can never be left
 * covering the page.
 * ────────────────────────────────────────────────────────────────────────── */

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const OUT = 0.45;
const IN = 0.45;

const stripBase = (p: string) => (BASE && p.startsWith(BASE) ? p.slice(BASE.length) || "/" : p);

/** basePath off, /index.html off, trailing slashes off — one comparable form. */
const norm = (p: string) => {
  const s = stripBase(p).replace(/\/index\.html$/, "").replace(/\/+$/, "");
  return s === "" ? "/" : s;
};

const langOf = (p: string) => (p === "/en" || p.startsWith("/en/") ? "en" : "ar");

export default function PageTransition() {
  const panelRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const revealRef = useRef<(() => void) | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Derived from the document, not the language prop: the panel enters from
    // the start of the line and exits past its end. LTR → in from the left,
    // out to the right. RTL → the exact mirror.
    const sign = document.documentElement.dir === "rtl" ? -1 : 1;
    const from = -110 * sign;
    const to = 110 * sign;

    let navTimer = 0;
    let hardTimer = 0;
    let revealing = false;

    const main = () => document.getElementById("main");

    const park = () => {
      gsap.killTweensOf(panel);
      gsap.set(panel, { xPercent: from, x: 0, y: 0 });
      panel.style.visibility = "hidden";
      panel.style.pointerEvents = "none";
    };

    const reset = () => {
      window.clearTimeout(navTimer);
      window.clearTimeout(hardTimer);
      navTimer = 0;
      hardTimer = 0;
      revealing = false;
      busyRef.current = false;
      park();
      const m = main();
      if (m) {
        gsap.killTweensOf(m);
        // clear before refreshing, or the transform is baked into every
        // ScrollTrigger measurement on the page we just navigated to
        gsap.set(m, { clearProps: "opacity,transform,willChange" });
      }
      try { ScrollTrigger.refresh(); } catch { /* nothing to refresh */ }
    };

    const reveal = () => {
      // once per transition: a navigation that commits *after* the 1.2s
      // timeout already brought the panel back must not restart it
      if (!busyRef.current || revealing) return;
      revealing = true;
      window.clearTimeout(navTimer);
      navTimer = 0;

      // Lenis re-syncs to a native scroll whenever it is not mid-animation
      // (onNativeScroll: animatedScroll = targetScroll = actualScroll), so a
      // plain scrollTo is enough. The second pass beats the router's own.
      window.scrollTo(0, 0);
      requestAnimationFrame(() => window.scrollTo(0, 0));

      const m = main();
      const tl = gsap.timeline({ onComplete: reset });
      if (m) gsap.set(m, { opacity: 0, y: 14 });
      tl.to(panel, { xPercent: to, duration: IN, ease: "power2.inOut" }, 0.06);
      // starts with the panel, not after it: expo.out is already well up by the
      // time the first sliver of page is uncovered, so nothing shows blank
      if (m) tl.to(m, { opacity: 1, y: 0, duration: 0.6, ease: "expo.out" }, 0.06);
    };
    revealRef.current = reveal;

    const go = (target: string) => {
      // Armed FIRST, before anything that can throw and before busy is set.
      // The click that got here was already preventDefault()ed, so a throw
      // below would otherwise strand busy=true and make every later link
      // dead until a manual reload — this timer is what makes that
      // impossible, whatever happens next.
      hardTimer = window.setTimeout(reset, 3200);
      busyRef.current = true;
      try {
        panel.style.visibility = "visible";
        panel.style.pointerEvents = "auto";
        gsap.killTweensOf(panel);
        gsap.fromTo(
          panel,
          { xPercent: from, x: 0, y: 0 },
          {
            xPercent: 0,
            duration: OUT,
            ease: "power2.inOut",
            onComplete: () => {
              window.scrollTo(0, 0);
              router.push(target);
              // if the pathname never changes, come back anyway
              navTimer = window.setTimeout(reveal, 1200);
            },
          },
        );
      } catch {
        // no wipe is better than a stuck page: go there plainly.
        // `target` is basePath-stripped for router.push, so put it back.
        reset();
        location.href = BASE + target;
      }
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const t = e.target;
      if (!(t instanceof Element)) return;
      const a = t.closest<HTMLAnchorElement>("a[href]");
      if (!a) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;
      const rel = a.getAttribute("rel");
      if (rel && /\bexternal\b/.test(rel)) return;

      let url: URL;
      try { url = new URL(a.href, location.href); } catch { return; }
      if (url.origin !== location.origin) return;
      if (url.hash) return; // handled natively / by next/link + Lenis

      const here = norm(location.pathname);
      const there = norm(url.pathname);
      if (there === here && url.search === location.search) return;
      if (langOf(there) !== langOf(here)) return; // full document load

      // From here it is ours. next/link checks defaultPrevented, so this
      // replaces its navigation rather than doubling it.
      e.preventDefault();
      if (busyRef.current) return; // already wiping; swallow the click
      go(stripBase(url.pathname) + url.search);
    };

    // Capture, so the wipe starts before next/link sees the click.
    document.addEventListener("click", onClick, true);
    park();

    return () => {
      document.removeEventListener("click", onClick, true);
      revealRef.current = null;
      window.clearTimeout(navTimer);
      window.clearTimeout(hardTimer);
      busyRef.current = false;
      gsap.killTweensOf(panel);
      const m = main();
      if (m) { gsap.killTweensOf(m); gsap.set(m, { clearProps: "opacity,transform,willChange" }); }
    };
  }, [router]);

  // The new route has committed: wipe back in. A navigation we did not start
  // (back button, a hash link, the language switch) finds busy false and is
  // left alone.
  useEffect(() => {
    if (!busyRef.current) return;
    revealRef.current?.();
  }, [pathname]);

  return <div className="pt-panel" ref={panelRef} aria-hidden="true" />;
}
