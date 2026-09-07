"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { Lang } from "@/content/i18n";

declare global {
  interface Window {
    /** True once the page is free to run its own load-in. Set synchronously by
     *  the gate script below, so Hero can read it during its first effect
     *  instead of racing the `elyoxe:ready` event. */
    __elyoxeReady?: boolean;
  }
}

/* ══ The one load-in ═══════════════════════════════════════════════════════
 *
 * An ink curtain with the mark drawing itself — the E traced and filled, the
 * italic x wiped in, then the saffron arrow — and a lift that runs in the
 * page's reading direction.
 *
 * It shows on the home page, on the first visit of a session, and never with
 * reduced motion. It is server-rendered so there is never a frame of page
 * before it; the gate script below runs while the body is still being parsed
 * and hides it before paint on every load that must not show it.
 *
 * Nothing here can trap the page. Four independent exits:
 *   1.  the timeline's own onComplete           → lift at ~0.90s
 *   2.  a hard cap timer                        → lift forced at 1.10s
 *   3.  a failsafe timer                        → curtain removed at 1.60s
 *   4.  a CSS animation in the critical block   → curtain gone at 1.60s with
 *                                                 no JavaScript at all
 * Every one of them calls signal() first, so the hero is never left waiting.
 *
 * Hand-over: `window.__elyoxeReady` flips to true and a `elyoxe:ready`
 * CustomEvent fires on window at the *start* of the lift, so the hero's own
 * timeline is already moving as the ink rises off it.
 * ────────────────────────────────────────────────────────────────────────── */

const READY = "elyoxe:ready";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/* The mark geometry, matching components/Mark.tsx exactly. */
const E_PATH = "M8 26 h30 v11 H19 v9 h16 v11 H19 v9 h19 v11 H8 z";
const X_A = "M44 46 h11 L80 77 h-11 z";
const X_B = "M44 77 h11 L80 46 h-11 z";
const ARROW_LINE = "M50 76 L84 34";
const ARROW_HEAD = "M90 27 L88.6 37.5 L80 30.5 z";

/* Duplicated from app/css/preloader.css on purpose: this block is parsed with
 * the markup, so the curtain is opaque even if the stylesheet link resolves a
 * beat later, and it carries the no-JS failsafe. Keep the two in sync. */
const CRITICAL =
  '.pl{position:fixed;left:-6vw;top:-10vh;width:112vw;height:120vh;z-index:9000;' +
  'background:#141A17;display:grid;place-items:center;transform-origin:50% 50%;' +
  'will-change:transform;animation:pl-failsafe 300ms linear 1600ms forwards}' +
  '@keyframes pl-failsafe{to{opacity:0;visibility:hidden}}' +
  '@media (prefers-reduced-motion:reduce){.pl{display:none!important}}' +
  'html[data-pl="off"] .pl{display:none!important}';

/* The gate. Runs synchronously, before the curtain markup after it is parsed,
 * so a page that must not show the curtain never paints one.
 *
 * It hides the curtain by inserting a rule into the critical <style>'s own
 * CSSOM sheet — that leaves the element's text content untouched, so React
 * hydrates it without a mismatch. The data-pl attribute is a fallback for the
 * (never observed) case of a style element with no sheet.
 *
 * `__elyoxeReady` is fail-open: true from the first statement, flipped to
 * false only once the intro is confirmed. Any throw in here leaves the hero
 * free to start on its own rather than waiting for a curtain that never armed. */
const GATE =
  '(function(){var w=window;w.__elyoxeReady=true;' +
  'var o=function(){try{var s=document.getElementById("pl-crit");' +
  'if(s&&s.sheet){s.sheet.insertRule(".pl{display:none!important}",s.sheet.cssRules.length);return}}catch(e){}' +
  'try{document.documentElement.setAttribute("data-pl","off")}catch(e){}};' +
  'try{var b=' + JSON.stringify(BASE) + ';var p=location.pathname;' +
  'if(b&&p.indexOf(b)===0)p=p.slice(b.length);' +
  'p=p.replace(/\\/index\\.html$/,"").replace(/\\/+$/,"");' +
  'var h=(p===""||p==="/en");' +
  'var r=!!(w.matchMedia&&w.matchMedia("(prefers-reduced-motion: reduce)").matches);' +
  'var v=false;try{v=sessionStorage.getItem("elyoxe:intro")==="1"}catch(e){}' +
  'if(h&&!r&&!v){w.__elyoxeReady=false;try{sessionStorage.setItem("elyoxe:intro","1")}catch(e){}}' +
  'else{o()}}catch(e){w.__elyoxeReady=true;o()}})();';

export default function Preloader({ lang }: { lang: Lang }) {
  const [gone, setGone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const eTraceRef = useRef<SVGPathElement>(null);
  const eFillRef = useRef<SVGPathElement>(null);
  const xClipRef = useRef<SVGRectElement>(null);
  const armRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    let sent = false;
    const signal = () => {
      if (sent) return;
      sent = true;
      window.__elyoxeReady = true;
      window.dispatchEvent(new CustomEvent(READY));
    };

    // The gate arms the intro by setting __elyoxeReady to false. Anything else
    // — a case page, a repeat visit, reduced motion, a throw in the gate, no
    // gate at all — means there is no intro on this load.
    const el = rootRef.current;
    if (window.__elyoxeReady !== false || !el) {
      signal();
      setGone(true);
      return;
    }

    // Direction is the page's own, with the language as the fallback for a
    // document that somehow lost its dir attribute.
    const dir = document.documentElement.dir || (lang === "ar" ? "rtl" : "ltr");
    // +1: the reveal runs left→right and the ink drifts right as it lifts, so
    // the leading (left) corner clears first — forward in LTR.
    // -1: mirrored, so the right corner clears first — forward in RTL.
    const sign = dir === "rtl" ? -1 : 1;

    let lifted = false;
    let done = false;
    let capTimer = 0;
    let failTimer = 0;

    const unlock = () => document.documentElement.classList.remove("pl-lock");

    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(capTimer);
      window.clearTimeout(failTimer);
      unlock();
      signal();
      setGone(true);
    };

    const ctx = gsap.context(() => {}, el);

    const startLift = () => {
      if (lifted || done) return;
      lifted = true;
      window.clearTimeout(capTimer);
      unlock();
      signal(); // the hero starts moving now, under the rising ink
      try {
        ctx.add(() => {
          gsap.to(stageRef.current, { opacity: 0, duration: 0.24, ease: "power2.in" });
          gsap.to(el, {
            yPercent: -112,
            xPercent: sign * 3,
            skewY: sign * 3.5,
            duration: 0.52,
            ease: "power3.inOut",
            onComplete: finish,
          });
        });
      } catch {
        finish();
      }
    };

    document.documentElement.classList.add("pl-lock");

    // Armed before any animation code runs, so a throw below still resolves.
    failTimer = window.setTimeout(finish, 1600);
    // JavaScript is demonstrably alive; it owns the removal from here, and the
    // CSS net would otherwise fire in the middle of a slow lift.
    el.style.animation = "none";
    // Hard cap: the curtain lifts at 1.1s whatever the draw is doing.
    capTimer = window.setTimeout(startLift, 1100);

    try {
      ctx.add(() => {
        // Exact dash lengths replace the generous CSS placeholder.
        const dash = (p: SVGPathElement | null) => {
          if (!p) return;
          let len = 260;
          try {
            const t = p.getTotalLength();
            if (t > 0 && Number.isFinite(t)) len = t;
          } catch { /* keep the placeholder from the stylesheet */ }
          gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
        };
        dash(eTraceRef.current);
        dash(armRef.current);
        gsap.set(headRef.current, { transformOrigin: "50% 50%" });

        const tl = gsap.timeline({ onComplete: startLift });
        // the E: traced, then inked in as the outline fades
        tl.to(eTraceRef.current, { strokeDashoffset: 0, duration: 0.34, ease: "power1.inOut" }, 0.04)
          .to(eFillRef.current, { opacity: 1, duration: 0.2, ease: "power1.out" }, 0.26)
          .to(eTraceRef.current, { opacity: 0, duration: 0.16 }, 0.32)
          // the italic x: a clip rect sweeping across both bars
          .to(xClipRef.current, { attr: { width: 54 }, duration: 0.28, ease: "power3.out" }, 0.34)
          // the saffron arrow: shaft drawn, then the head lands
          .to(armRef.current, { strokeDashoffset: 0, duration: 0.22, ease: "power2.out" }, 0.5)
          .fromTo(
            headRef.current,
            { opacity: 0, scale: 0.35 },
            { opacity: 1, scale: 1, duration: 0.22, ease: "back.out(2.4)" },
            0.62,
          )
          // a beat before the lift — total draw 0.90s, inside the 1.1s cap
          .to({}, { duration: 0.06 }, 0.84);
      });
    } catch {
      finish();
    }

    return () => {
      window.clearTimeout(capTimer);
      window.clearTimeout(failTimer);
      unlock();
      ctx.revert();
      // React StrictMode remounts this effect in dev; let the intro replay
      // rather than swallowing it.
      if (!sent) window.__elyoxeReady = false;
    };
  }, [lang]);

  return (
    <>
      <style id="pl-crit" dangerouslySetInnerHTML={{ __html: CRITICAL }} />
      <script dangerouslySetInnerHTML={{ __html: GATE }} />
      {!gone && (
        <div className="pl" ref={rootRef} aria-hidden="true">
          <div className="pl-stage" ref={stageRef}>
            <svg className="pl-mark" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
              <defs>
                <clipPath id="pl-xw" clipPathUnits="userSpaceOnUse">
                  {/* root user space: the wipe is unambiguous, unaffected by the
                      skew transform on the group it reveals */}
                  <rect ref={xClipRef} x="34" y="40" width="0" height="46" />
                </clipPath>
              </defs>

              <path className="pl-draw pl-e-trace" ref={eTraceRef} d={E_PATH} />
              <path className="pl-e-fill" ref={eFillRef} d={E_PATH} />

              <g clipPath="url(#pl-xw)">
                <g transform="translate(12 0) skewX(-12)">
                  <path className="pl-x" d={X_A} opacity=".92" />
                  <path className="pl-x" d={X_B} />
                </g>
              </g>

              <g transform="translate(12 0) skewX(-12)">
                <path className="pl-draw pl-arrow-line" ref={armRef} d={ARROW_LINE} />
                <path className="pl-arrow-head" ref={headRef} d={ARROW_HEAD} />
              </g>
            </svg>
          </div>
        </div>
      )}
    </>
  );
}
