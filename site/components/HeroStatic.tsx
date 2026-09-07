"use client";
import { useEffect, useMemo, useRef } from "react";
import { nodes, edges } from "@/content/systems";
import { heroBus } from "@/lib/heroBus";

/* The systems map without WebGL: one SVG of hairlines and marks, positioned
   exactly where the scene would put the nodes. Used when the machine has no
   hardware GL (headless browsers, some VMs) — the map is then a drawing, not a
   simulation, and costs nothing. It honours the same heroBus contract, so the
   number fragments still launch from their nodes. */
const COLOR = { live: "#1B6F5A", anchor: "#8F5400", infra: "#141A17" };

export default function HeroStatic({ dir }: { dir: "rtl" | "ltr" }) {
  const host = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const idx = useMemo(() => new Map(nodes.map((n, i) => [n.id, i])), []);

  useEffect(() => {
    const el = host.current, s = svg.current;
    if (!el || !s) return;
    const labels = heroBus.labels;
    const labelEls = new Map(labels ? Array.from(labels.querySelectorAll<HTMLElement>("[data-node]")).map((e) => [e.dataset.node!, e]) : []);
    const layout = () => {
      const r = el.getBoundingClientRect();
      const w = Math.max(1, r.width), h = Math.max(1, r.height);
      const mobile = window.matchMedia("(max-width: 1023px)").matches;
      const pts = nodes.map((n) => {
        let nx = dir === "rtl" ? 1 - n.x : n.x;
        let ny = n.y;
        if (mobile) { nx = 0.07 + nx * 0.86; ny = 0.10 + n.y * 1.55; }
        return { x: nx * w, y: ny * h };
      });
      s.setAttribute("viewBox", `0 0 ${w} ${h}`);
      const lines = s.querySelectorAll<SVGLineElement>("line");
      edges.forEach(([a, b], i) => {
        const p = pts[idx.get(a)!], q = pts[idx.get(b)!], l = lines[i];
        if (!l) return;
        l.setAttribute("x1", p.x.toFixed(1)); l.setAttribute("y1", p.y.toFixed(1));
        l.setAttribute("x2", q.x.toFixed(1)); l.setAttribute("y2", q.y.toFixed(1));
      });
      const marks = s.querySelectorAll<SVGGElement>("g[data-id]");
      marks.forEach((g) => {
        const p = pts[idx.get(g.dataset.id!)!];
        g.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      });
      nodes.forEach((n, i) => {
        const p = pts[i];
        heroBus.nodes.set(n.id, p);
        if (n.slug) heroBus.nodes.set(n.slug, p);
        const le = labelEls.get(n.id);
        if (le) {
          le.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-50%, 0)`;
          le.style.opacity = n.kind === "anchor" ? "1" : "0.75";
        }
      });
      heroBus.ready = true;
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(el);
    return () => ro.disconnect();
  }, [dir, idx]);

  return (
    <div ref={host} style={{ position: "absolute", inset: 0 }}>
      <svg ref={svg} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} preserveAspectRatio="none">
        <g stroke="#8E8B82" strokeWidth="1" strokeOpacity="0.45">
          {edges.map(([a, b]) => <line key={`${a}-${b}`} x1="0" y1="0" x2="0" y2="0" />)}
        </g>
        {nodes.map((n) => {
          const c = n.kind === "anchor" ? (n.live ? COLOR.live : COLOR.anchor) : COLOR.infra;
          const r = n.kind === "anchor" ? 5 : 3;
          return (
            <g key={n.id} data-id={n.id}>
              {n.kind === "anchor" && <circle r={r + 6} fill="none" stroke={c} strokeWidth="1" strokeOpacity="0.5" />}
              <circle r={r} fill={c} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
