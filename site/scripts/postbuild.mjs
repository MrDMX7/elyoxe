// Runs after `next build`. Makes the static export drop into S3 + CloudFront:
//  · out/404.html and out/404/ from the /notfound/ route (the distribution's custom error page)
//  · sitemap.xml with hreflang pairs, robots.txt
//  · a check that every /en/ page really carries lang="en" dir="ltr"
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, copyFileSync, cpSync, rmSync, renameSync } from "node:fs";
import { join, sep } from "node:path";

const out = "out";
const site = process.env.SITE_URL || "https://elyoxe.com";
const preview = !!process.env.PREVIEW;

const walk = (dir, acc = []) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, acc); else if (p.endsWith(".html")) acc.push(p);
  }
  return acc;
};
// Next 16.4 on Windows writes each page's prefetch segments as nested folders
// (__next.!KGFyKQ/about/__PAGE__.txt) while the client asks for the dotted name
// (__next.!KGFyKQ.about.__PAGE__.txt): the export joins a path.relative() result, which carries
// backslashes there. Every prefetch then 404s. Flatten them to the dotted names; on Linux (CI)
// they are already flat and this finds nothing.
const flatten = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (!statSync(p).isDirectory()) continue;
    if (!f.startsWith("__next.")) { flatten(p); continue; }
    const lift = (d, prefix) => {
      for (const g of readdirSync(d)) {
        const q = join(d, g);
        if (statSync(q).isDirectory()) lift(q, `${prefix}.${g}`); else renameSync(q, join(dir, `${prefix}.${g}`));
      }
    };
    lift(p, f);
    rmSync(p, { recursive: true, force: true });
  }
};
flatten(out);

// 404 — Next 16 writes its own bare English page to /404/ and /_not-found/ (two root layouts, so no
// shared not-found), which overwrote the Arabic route of the same name. The page now lives at
// /notfound/ and is moved over Next's copy here, before anything below reads the tree.
const nfSrc = join(out, "notfound");
if (existsSync(nfSrc)) {
  cpSync(nfSrc, join(out, "404"), { recursive: true, force: true });
  rmSync(nfSrc, { recursive: true, force: true });
}
rmSync(join(out, "_not-found"), { recursive: true, force: true });
const nf = join(out, "404", "index.html");
if (existsSync(nf)) copyFileSync(nf, join(out, "404.html"));

const pages = walk(out);

// html lang/dir sanity — the two root layouts must not leak into each other
let bad = 0;
for (const p of pages) {
  const html = readFileSync(p, "utf8");
  // walk() builds paths with the platform separator, so a hard-coded "/en/" test never matches on
  // Windows and every English page gets graded against the Arabic rule — the build then exits 1 on
  // the laptop while passing on the phone. Split on the real separator instead.
  const en = p.split(sep).includes("en");
  const ok = en ? /<html[^>]*lang="en"[^>]*dir="ltr"/.test(html) : /<html[^>]*lang="ar"[^>]*dir="rtl"/.test(html);
  if (!ok) { console.error("wrong lang/dir:", p); bad++; }
}
if (bad) process.exit(1);

// sitemap: one URL per public page, with hreflang to its mirror
// paths go through "/" first: on Windows walk() returns out\en\work\…, which once shipped a sitemap of
// https://elyoxe.com/\en\work\ahlam\ and let the 404 page through
const rel = (p) => p.slice(out.length).split(sep).join("/");
const toUrl = (p) => site + rel(p).replace(/index\.html$/, "").replace(/^\/?/, "/");
const isPublic = (p) => !/\/404\//.test(rel(p)) && !rel(p).endsWith("404.html");
const urls = pages.filter(isPublic).map(toUrl);
const broken = urls.filter((u) => /\\|\/\/|\s/.test(u.replace(/^https?:\/\//, "")));
if (broken.length) { console.error("sitemap: malformed URLs", broken.slice(0, 5)); process.exit(1); }
// a page's other-language twin, when it has one: /about/ (the studio page, 2026-10-09) is Arabic-only for now,
// and its English is still /en/, so a twin that was not built is never claimed
const TWIN = { "/about/": "/en/", "/en/": "/about/" };
const built = new Set(urls);
const mirror = (u) => {
  const path = u.slice(site.length);
  if (TWIN[path]) return site + TWIN[path];
  const m = path.startsWith("/en/") ? site + path.slice(3) : site + "/en" + path;
  return built.has(m) ? m : u;
};
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map((u) => {
  const ar = u.includes("/en/") ? mirror(u) : u;
  const en = u.includes("/en/") ? u : mirror(u);
  return `  <url><loc>${u}</loc><xhtml:link rel="alternate" hreflang="ar" href="${ar}"/><xhtml:link rel="alternate" hreflang="en" href="${en}"/><xhtml:link rel="alternate" hreflang="x-default" href="${ar}"/></url>`;
}).join("\n")}
</urlset>
`;
writeFileSync(join(out, "sitemap.xml"), xml);
writeFileSync(join(out, "robots.txt"), preview ? "User-agent: *\nDisallow: /\n" : `User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\nSitemap: ${site}/tools/sitemap.xml\nSitemap: ${site}/quran/sitemap.xml\n`);
console.log(`postbuild: ${pages.length} pages, ${urls.length} in sitemap${preview ? " (preview, noindex)" : ""}`);
