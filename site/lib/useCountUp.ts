"use client";
import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { reducedMotion } from "@/lib/useReveal";

gsap.registerPlugin(ScrollTrigger);

/* Runs a figure up to its value once, when it comes into view.
 *
 * It lived inside the services section while every service row carried a proof
 * number. The rows no longer do — one number per project, in the work chapter,
 * is the whole budget — so the behaviour moved here rather than being deleted
 * with the markup that used to call it.
 *
 * The value is a string because these are written figures, not quantities:
 * "7,600" keeps its grouping, "0.07" its decimals, "5/5" never animates at
 * all. Whatever is not a leading number is preserved verbatim around it. */
export function useCountUp(ref: RefObject<HTMLSpanElement | null>, value: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const m = value.match(/[\d,.]+/);
    if (!m || m.index === undefined) return;
    const raw = m[0];
    const target = Number(raw.replace(/,/g, ""));
    if (!Number.isFinite(target)) return;
    const prefix = value.slice(0, m.index);
    const suffix = value.slice(m.index + raw.length);
    const dot = raw.indexOf(".");
    const dec = dot < 0 ? 0 : raw.length - dot - 1;
    const grouped = raw.includes(",");
    const fmt = (x: number) =>
      prefix +
      (grouped
        ? x.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec })
        : x.toFixed(dec)) +
      suffix;
    const o = { v: 0 };
    const write = () => {
      el.textContent = fmt(o.v);
    };
    const tl = gsap.timeline({
      paused: true,
      onComplete: () => {
        el.textContent = value;
      },
    });
    /* A figure whose honest answer is zero still deserves the sweep: the needle
       runs up and settles back on nothing. */
    if (target === 0) {
      tl.to(o, { v: 8, duration: 0.45, ease: "power2.out", onUpdate: write }).to(o, {
        v: 0,
        duration: 0.65,
        ease: "power3.inOut",
        onUpdate: write,
      });
    } else {
      tl.to(o, { v: target, duration: 1.15, ease: "power2.out", onUpdate: write });
    }
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 92%",
      once: true,
      onEnter: () => {
        el.textContent = fmt(0);
        tl.play(0);
      },
    });
    return () => {
      st.kill();
      tl.kill();
      el.textContent = value;
    };
  }, [ref, value]);
}
