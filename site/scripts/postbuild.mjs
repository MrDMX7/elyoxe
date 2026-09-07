// Runs after `next build`. Makes the static export drop into S3 + CloudFront:
//  · out/404.html from the /404/ route (the distribution's custom error page)
//  · sitemap.xml with hreflang pairs, robots.txt
//  · a check that every /en/ page really carries lang="en" dir="ltr"
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, copyFileSync } from "node:fs";
import { join } from "node:path";

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
const pages = walk(out);

// 404
const nf = join(out, "404", "index.html");
if (existsSync(nf)) copyFileSync(nf, join(out, "404.html"));

// html lang/dir sanity — the two root layouts must not leak into each other
let bad = 0;
for (const p of pages) {
  const html = readFileSync(p, "utf8");
  const en = p.includes(`${out}/en/`);
  const ok = en ? /<html[^>]*lang="en"[^>]*dir="ltr"/.test(html) : /<html[^>]*lang="ar"[^>]*dir="rtl"/.test(html);
  if (!ok) { console.error("wrong lang/dir:", p); bad++; }
}
if (bad) process.exit(1);

// sitemap: one URL per public page, with hreflang to its mirror
const toUrl = (p) => site + p.slice(out.length).replace(/index\.html$/, "").replace(/^\/?/, "/");
const isPublic = (p) => !/\/(404)\//.test(p) && !p.endsWith("404.html");
const urls = pages.filter(isPublic).map(toUrl);
const mirror = (u) => {
  const path = u.slice(site.length);
  return path.startsWith("/en/") ? site + path.slice(3) : site + "/en" + path;
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
writeFileSync(join(out, "robots.txt"), preview ? "User-agent: *\nDisallow: /\n" : `User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`);
console.log(`postbuild: ${pages.length} pages, ${urls.length} in sitemap${preview ? " (preview, noindex)" : ""}`);
