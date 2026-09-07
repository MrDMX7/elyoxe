"use client";
import { useState } from "react";
import { useScrub } from "@/lib/useReveal";
import type { Lang } from "@/content/i18n";
import { copy } from "@/content/copy";

/* The quantitative method: nine hypotheses, registered before they were tested,
   and every one falsified. Scroll strikes them out one by one. Nothing is
   softened: a negative result shown as plainly as a positive one would be. */
const ORD = {
  ar: ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة", "الثامنة", "التاسعة"],
  en: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine"],
};
export default function Hypotheses({ lang }: { lang: Lang }) {
  const [p, setP] = useState(0);
  const ref = useScrub<HTMLDivElement>(setP, { start: "top 75%", end: "bottom 60%" });
  const done = Math.round(p * 9);
  return (
    <div ref={ref}>
      <ol className="hyp" style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {ORD[lang].map((o, i) => (
          <li key={i} className={`hyp-row${i < done ? " is-falsified" : ""}`}>
            <span className="id">H-{String(i + 1).padStart(2, "0")}</span>
            <span className="name">{copy.work.hypothesis[lang]} {o}</span>
            <span className="state">{i < done ? copy.work.falsified[lang] : copy.work.registered[lang]}</span>
          </li>
        ))}
      </ol>
      <div className="hyp-foot">
        <span className="tally">{done}/9</span>
        <p className="small muted">{copy.work.ledgerFoot[lang]}</p>
      </div>
    </div>
  );
}
