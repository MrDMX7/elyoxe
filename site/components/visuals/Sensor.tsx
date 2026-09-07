"use client";
import { useState } from "react";
import { useScrub } from "@/lib/useReveal";
import type { Lang } from "@/content/i18n";
import { copy } from "@/content/copy";

/* Khutwa: the invariant. Stored daily totals must sum to exactly the live
   hardware counter. Two traces, one stepped (the store) and one continuous
   (the sensor), and a delta that has to read zero. */
const W = 600, H = 220, N = 40;
const live = Array.from({ length: N }, (_, i) => Math.round(9000 * (1 - Math.pow(1 - i / (N - 1), 1.6))));
const stored = live.map((v, i) => (i % 5 === 0 ? v : live[i - (i % 5)]));
const px = (i: number) => 24 + (i / (N - 1)) * (W - 48);
const py = (v: number) => H - 24 - (v / 9000) * (H - 56);
const livePath = live.map((v, i) => `${i ? "L" : "M"}${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(" ");
const storedPath = stored.map((v, i) => `${i ? "L" : "M"}${px(i).toFixed(1)} ${py(v).toFixed(1)}${i < N - 1 && (i + 1) % 5 === 0 ? ` L${px(i + 1).toFixed(1)} ${py(v).toFixed(1)}` : ""}`).join(" ");
const fmt = (n: number) => n.toLocaleString("en-US");

export default function Sensor({ lang }: { lang: Lang }) {
  const [p, setP] = useState(0);
  const ref = useScrub<HTMLDivElement>(setP);
  const i = Math.min(N - 1, Math.floor(p * (N - 1)));
  const l = live[i], s = stored[Math.min(N - 1, Math.round(p * (N - 1)))];
  const delta = p >= 0.98 ? 0 : Math.abs(l - s);
  const len = 1400;
  return (
    <div className="sensor on-ink" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <g stroke="#2E3934" strokeWidth="1">{[0.25, 0.5, 0.75].map((f) => <line key={f} x1="24" x2={W - 24} y1={py(9000 * f)} y2={py(9000 * f)} />)}</g>
        <path d={storedPath} fill="none" stroke="#A3A69F" strokeWidth="1.5" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
        <path d={livePath} fill="none" stroke="#5CC9A4" strokeWidth="2" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
        <circle cx={px(i)} cy={py(l)} r="4" fill="#5CC9A4" />
      </svg>
      <div className="readout">
        <div><span className="value">{fmt(s)}</span>{copy.work.stored[lang]}</div>
        <div><span className="value">{fmt(l)}</span>{copy.work.liveCounter[lang]}</div>
        <div className="delta"><span className="value">Δ {fmt(delta)}</span>{copy.work.delta[lang]}</div>
      </div>
    </div>
  );
}
