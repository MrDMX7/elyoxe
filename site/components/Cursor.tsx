"use client";
import { useEffect } from "react";
import gsap from "gsap";

/* A dot and a ring. Fine pointers only; hidden until the first move; the ring
   becomes a labelled disc over the ledger's live links. */
export default function Cursor({ openLabel }: { openLabel: string }) {
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    const dot = document.getElementById("cursor-dot");
    const ring = document.getElementById("cursor-ring");
    if (!dot || !ring) return;
    document.documentElement.classList.add("has-cursor");
    const dx = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power3" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power3" });
    const rx = gsap.quickTo(ring, "x", { duration: 0.38, ease: "power3" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.38, ease: "power3" });
    let shown = false;
    const move = (e: PointerEvent) => {
      if (!shown) { shown = true; gsap.set([dot, ring], { x: e.clientX, y: e.clientY }); dot.classList.add("shown"); ring.classList.add("shown"); }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor], a, button");
      ring.dataset.mode = t ? t.dataset.cursor ?? "link" : "";
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);
  return (
    <>
      <div id="cursor-dot" aria-hidden="true" />
      <div id="cursor-ring" aria-hidden="true" data-label={openLabel} />
    </>
  );
}
