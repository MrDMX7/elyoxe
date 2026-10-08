/* The products' live figures for the portal (components/Portal.tsx), read once while the static export
 * is built, so every square has a true number in the HTML before any script runs. The portal then asks
 * Tifo and Meylis again from the browser; until those answer elyoxe.com's CORS, the build's figures stay.
 * Any source that fails gives null, and its square says what it is without a number: never a made-up one. */

export type Pulse = {
  at: string;
  tifo: { live: number; today: number } | null;
  cinema: { cinemas: number } | null;
  tools: { count: number } | null;
  meylis: { rooms: number } | null;
};

export const SRC = {
  tifoLive: "https://tifo.elyoxe.com/v1/live.json",
  cinemas: "https://cinema.elyoxe.com/data/cinemas.json",
  toolsMap: "https://elyoxe.com/tools/sitemap.xml",
  meylisRooms: "https://meylis.elyoxe.com/v1/rooms",
};

type Match = { status: string; kickoff_uae: string };

/** UAE calendar day of a date, as YYYY-MM-DD. */
const uaeDay = (d: Date) => new Date(d.getTime() + 4 * 3600e3).toISOString().slice(0, 10);

export function tifoOf(j: { live?: number; matches?: Match[] }) {
  const today = uaeDay(new Date());
  const ms = j.matches ?? [];
  return { live: ms.filter((m) => m.status === "live").length || (j.live ?? 0), today: ms.filter((m) => m.kickoff_uae.slice(0, 10) === today).length };
}

export const meylisOf = (j: { rooms?: unknown[] }) => ({ rooms: (j.rooms ?? []).length });

async function get<T>(url: string, as: "json" | "text" = "json"): Promise<T | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    return (as === "json" ? await r.json() : await r.text()) as T;
  } catch {
    return null;
  }
}

export async function readPulse(): Promise<Pulse> {
  const [live, cinemas, map, rooms] = await Promise.all([
    get<{ live?: number; matches?: Match[] }>(SRC.tifoLive),
    get<Record<string, unknown>>(SRC.cinemas),
    get<string>(SRC.toolsMap, "text"),
    get<{ rooms?: unknown[] }>(SRC.meylisRooms),
  ]);
  // a tool's page is /tools/<section>/<tool>/ in Arabic; the sections' own pages and the English mirror are not tools
  const tools = map ? new Set(map.match(/https:\/\/elyoxe\.com\/tools\/[^/<]+\/[^/<]+\//g) ?? []).size : 0;
  return {
    at: new Date().toISOString(),
    tifo: live ? tifoOf(live) : null,
    cinema: cinemas && Object.keys(cinemas).length ? { cinemas: Object.keys(cinemas).length } : null,
    tools: tools ? { count: tools } : null,
    meylis: rooms ? meylisOf(rooms) : null,
  };
}
