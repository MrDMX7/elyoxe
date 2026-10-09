"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Mark from "./Mark";
import { reducedMotion } from "@/lib/useReveal";
import { SRC, meylisOf, tifoOf, type Pulse } from "@/lib/pulse";

/* elyoxe.com since 2026-10-09 (owner: «واجهة احترافية مبسطة… 4 مربعات… حية بأرقام المنتجات»).
 *
 * One ink ground, one strip of four squares split by rules, not four cards. Each square is a window on a
 * product: its name, what it is in one line, and its live figure in Plex Mono saffron. Verdigris appears
 * only when something is happening right now (a Tifo match being played, a Meylis room open).
 * The one motion of its own is the four figures counting up together when the curtain lifts; the rest
 * answers the visitor (hover and focus turn a square to paper). */

type Tile = {
  id: string; name: string; en: string; url: string; line: string;
  num: number | null; label: string; live: boolean; empty?: string;
};

function tiles(p: Pulse): Tile[] {
  const t = p.tifo, live = !!t && t.live > 0;
  const rooms = p.meylis?.rooms ?? 0;
  return [
    { id: "cinema", name: "سينما", en: "Cinema", url: "https://cinema.elyoxe.com/", line: "مواعيد الأفلام وأسعارها بكل سينمات الإمارات",
      num: p.cinema?.cinemas ?? null, label: "سينما", live: false },
    { id: "tools", name: "أدوات", en: "Tools", url: "/tools/", line: "أدوات مجانية بالعربي، تشتغل بدون تسجيل",
      num: p.tools?.count ?? null, label: "أداة", live: false },
    { id: "tifo", name: "تيفو", en: "Tifo", url: "https://tifo.elyoxe.com/", line: "نتايج ومواعيد الكورة العربية والعالمية",
      num: t ? (live ? t.live : t.today) : null, label: live ? "مباراة شغّالة الحين" : "مباراة اليوم", live },
    { id: "meylis", name: "الميلس", en: "Meylis", url: "https://meylis.elyoxe.com/", line: "غرف صوت تسولف فيها مع الربع",
      num: rooms > 0 ? rooms : null, label: "غرفة مفتوحة الحين", live: rooms > 0, empty: "افتح أول غرفة" },
    // owner 2026-10-09: «مربع حق بطاقات الدعوة وخلها مجانية»; Cards has no price anywhere, so its figure is that: 0 درهم
    { id: "cards", name: "دعوات", en: "Invitations", url: "https://cards.elyoxe.com/", line: "بطاقة دعوة لأي مناسبة، وترسلها لكل ضيف على الواتساب",
      num: 0, label: "درهم، مجانية بالكامل", live: false },
  ];
}

/* Each product's sign, drawn in line and moving the way the product does: a film strip running, tools
 * lighting up one after another, a ball crossing a pitch, a voice. currentColor throughout, so a square
 * turned to paper redraws its sign in ink; reduced motion leaves each one still (portal.css). */
function Sign({ id }: { id: string }) {
  if (id === "cinema")
    return (
      <svg className="pt-sig sig-film" viewBox="0 0 240 64" aria-hidden="true">
        <g className="film-run">
          {Array.from({ length: 24 }, (_, i) => (
            <g key={i}>
              <rect x={i * 20 + 4} y="4" width="10" height="7" />
              <rect x={i * 20 + 4} y="53" width="10" height="7" />
              {i % 2 === 0 && <rect className="film-frame" x={i * 20 + 1} y="17" width="36" height="30" />}
            </g>
          ))}
        </g>
      </svg>
    );
  if (id === "tools")
    return (
      <svg className="pt-sig sig-grid" viewBox="0 0 240 64" aria-hidden="true">
        {Array.from({ length: 30 }, (_, i) => (
          <rect key={i} x={(i % 10) * 24 + 2} y={Math.floor(i / 10) * 21 + 2} width="16" height="16" style={{ animationDelay: `${((i * 7) % 30) * 0.18}s` }} />
        ))}
      </svg>
    );
  if (id === "tifo")
    return (
      <svg className="pt-sig sig-pitch" viewBox="0 0 240 64" aria-hidden="true">
        <rect x="1" y="1" width="238" height="62" />
        <line x1="120" y1="1" x2="120" y2="63" />
        <circle cx="120" cy="32" r="13" />
        <rect x="1" y="17" width="22" height="30" />
        <rect x="217" y="17" width="22" height="30" />
        <circle className="ball" r="3.5" cx="0" cy="0" />
      </svg>
    );
  if (id === "cards")
    return (
      <svg className="pt-sig sig-cards" viewBox="0 0 240 64" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} className="card" style={{ animationDelay: `${i * 0.5}s` }}>
            <rect x={i * 48 + 10} y="6" width="30" height="52" />
            <line x1={i * 48 + 16} y1="40" x2={i * 48 + 34} y2="40" />
            <line x1={i * 48 + 19} y1="46" x2={i * 48 + 31} y2="46" />
            <circle cx={i * 48 + 25} cy="22" r="5" />
          </g>
        ))}
      </svg>
    );
  return (
    <svg className="pt-sig sig-voice" viewBox="0 0 240 64" aria-hidden="true">
      {Array.from({ length: 21 }, (_, i) => (
        <rect key={i} x={i * 11.5 + 2} y="4" width="5" height="56" style={{ animationDelay: `${(Math.sin(i * 1.7) * 0.5 + 0.5) * 1.2}s` }} />
      ))}
    </svg>
  );
}

function Count({ to, go }: { to: number; go: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !go || reducedMotion() || to < 2) return;
    let raf = 0; const t0 = performance.now(), dur = 1100;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = String(Math.round(to * e));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    el.textContent = "0"; raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, go]);
  return <span ref={ref}>{to}</span>;
}

export default function Portal({ pulse }: { pulse: Pulse }) {
  const [p, setP] = useState(pulse);
  const [go, setGo] = useState(false);

  // the count-up starts with the curtain's lift (Preloader), or at once when there is none
  useEffect(() => {
    const w = window as Window & { __elyoxeReady?: boolean };
    const play = () => setGo(true);
    if (w.__elyoxeReady) { play(); return; }
    window.addEventListener("elyoxe:ready", play, { once: true });
    const t = window.setTimeout(play, 1400);
    return () => { window.removeEventListener("elyoxe:ready", play); window.clearTimeout(t); };
  }, []);

  // Tifo and Meylis move by the minute; ask them again while the page is open
  useEffect(() => {
    let stop = false;
    const tick = async () => {
      const [l, r] = await Promise.all([
        fetch(SRC.tifoLive, { cache: "no-store" }).then((x) => (x.ok ? x.json() : null)).catch(() => null),
        fetch(SRC.meylisRooms, { cache: "no-store" }).then((x) => (x.ok ? x.json() : null)).catch(() => null),
      ]);
      if (stop) return;
      setP((q) => ({ ...q, tifo: l ? tifoOf(l) : q.tifo, meylis: r ? meylisOf(r) : q.meylis }));
    };
    tick();
    const id = window.setInterval(() => { if (!document.hidden) tick(); }, 60_000);
    return () => { stop = true; window.clearInterval(id); };
  }, []);

  return (
    <div className="pt">
      <header className="pt-top">
        <Link href="/" className="brand" aria-label="Elyoxe"><Mark size={34} /><span>Elyoxe</span></Link>
        <nav className="pt-nav" aria-label="روابط">
          <Link href="/about/">عنّا</Link>
          <Link href="/en/" hrefLang="en" lang="en">English</Link>
        </nav>
      </header>

      <main id="main" className="pt-main">
        <h1 className="pt-title">Elyoxe: سينما، أدوات، تيفو، الميلس، دعوات</h1>
        <ul className="pt-grid">
          {tiles(p).map((t) => (
            <li key={t.id} className={`pt-tile pt-${t.id}`}>
              <a href={t.url} className="pt-link">
                <span className="pt-name">{t.name}<span className="pt-en" lang="en">{t.en}</span></span>
                <span className="pt-line">{t.line}</span>
                <span className={`pt-sigbox${t.live ? " is-live" : ""}`}><Sign id={t.id} /></span>
                <span className="pt-fig">
                  {t.num != null ? (
                    <>
                      <span className="pt-num"><Count to={t.num} go={go} /></span>
                      <span className="pt-label">{t.live && <i className="pt-dot" aria-hidden="true" />}{t.label}</span>
                    </>
                  ) : (
                    <span className="pt-label">{t.empty ?? "افتح"}</span>
                  )}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </main>

      <footer className="pt-foot">
        <a href="mailto:hello@elyoxe.com" lang="en">hello@elyoxe.com</a>
        <span dir="ltr">© 2026 Elyoxe</span>
      </footer>
    </div>
  );
}
