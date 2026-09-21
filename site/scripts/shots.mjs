// Screenshots of the exported site for the design critique loop, run in CI:
//   node scripts/shots.mjs http://localhost:8080 [outdir]
// Desktop 1440 and mobile 390, both languages, top-of-page and full-page, plus
// console errors and horizontal-overflow checks. Exits non-zero on a blocking fault.
import { chromium, devices } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const base = (process.argv[2] || "http://localhost:8080").replace(/\/$/, "");
const out = process.argv[3] || "shots";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const report = { base, when: new Date().toISOString(), pages: {}, blocking: [] };
const targets = ["/", "/en/", "/work/quantitative-method/", "/en/work/invoiceready/", "/404/"];

// The export is served from localhost in CI, so the browser's origin is not the one our
// own backends allow-list: the reply-engine demo answers https://elyoxe.com and refuses
// this harness, and the page faithfully reports the refusal. That is the harness, not a
// fault in the site — checked by hand, the same GET carries access-control-allow-origin
// when the Origin header is the production one. So faults are bucketed by origin: off-site
// ones are recorded and printed, never blocking; anything the site itself serves still is.
const origin = new URL(base).origin;
const offsite = (u) => { try { return new URL(u, base).origin !== origin; } catch { return false; } };

for (const [name, ctxOpts] of [
  ["mobile", { ...devices["iPhone 13"] }],
  ["desktop", { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }],
]) {
  for (const path of targets) {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    const errors = [];
    const external = [];
    const bucket = (u) => (u && offsite(u) ? external : errors);
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const t = m.text();
      const u = t.match(/https?:\/\/[^\s'"]+/)?.[0];
      // "Failed to load resource: net::ERR_FAILED" carries no URL of its own; requestfailed
      // reports the same fault with one, so drop the anonymous twin instead of guessing.
      if (!u && /Failed to load resource/.test(t)) return;
      bucket(u).push(t);
    });
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("requestfailed", (r) => { const why = r.failure()?.errorText ?? "failed"; if (why.includes("ERR_ABORTED")) return; bucket(r.url()).push(`${why} ${r.url().slice(0, 120)}`); });
    page.on("response", (r) => { if (r.status() >= 400 && !r.url().endsWith("/404/")) bucket(r.url()).push(`${r.status()} ${r.url().slice(0, 120)}`); });
    await page.goto(base + path, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(3200); // the hero load-in
    const slug = (name + path.replace(/\//g, "_")).replace(/_+$/, "");
    await page.screenshot({ path: `${out}/${slug}-top.png` });
    const before = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth, h: document.documentElement.scrollHeight }));
    for (let y = 0; y < before.h; y += 600) { await page.mouse.wheel(0, 600); await page.waitForTimeout(90); }
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${out}/${slug}-full.png`, fullPage: true });
    // full-page captures go blank past ~16k px on mobile (texture limit), so the
    // home pages are also tiled viewport by viewport — those are the truth.
    if (name === "mobile" && (path === "/" || path === "/en/")) {
      const vh = await page.evaluate(() => window.innerHeight);
      for (let i = 0, y = 0; y < before.h && i < 18; i++, y += vh) {
        await page.evaluate((yy) => window.scrollTo(0, yy), y);
        await page.waitForTimeout(450);
        await page.screenshot({ path: `${out}/${slug}-tile-${String(i).padStart(2, "0")}.png` });
      }
    }
    const checks = await page.evaluate(() => {
      const hidden = [...document.querySelectorAll(".mask > span, [data-reveal]")].filter((e) => { const s = getComputedStyle(e); return s.opacity === "0" || /translate\(0px, [1-9]/.test(s.transform); }).length;
      return { hidden, lang: document.documentElement.lang, dir: document.documentElement.dir, title: document.title };
    });
    const overflow = before.sw > before.iw + 1;
    report.pages[slug] = { ...checks, overflow, errors, external };
    if (overflow) report.blocking.push(`${slug}: horizontal overflow ${before.sw}>${before.iw}`);
    if (checks.hidden) report.blocking.push(`${slug}: ${checks.hidden} elements still hidden after scroll`);
    for (const e of errors) if (!/favicon/.test(e)) report.blocking.push(`${slug}: ${e}`);
    await ctx.close();
  }
}
// reduced motion: the page must read complete with nothing moving
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/desktop-reduced-top.png` });
  const hidden = await page.evaluate(() => [...document.querySelectorAll(".hero-title .mask > span, .ledger, [data-slot]")].filter((e) => { const s = getComputedStyle(e); return s.opacity === "0" || (e.style.getPropertyValue("--slot-opacity") === "0"); }).length);
  if (hidden) report.blocking.push(`reduced-motion: ${hidden} hero elements hidden`);
  // keyboard: tab through the first links and make sure focus is visible somewhere
  await page.keyboard.press("Tab"); await page.keyboard.press("Tab"); await page.keyboard.press("Tab");
  await page.screenshot({ path: `${out}/desktop-focus.png` });
  await ctx.close();
}
await browser.close();
writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
const seen = Object.entries(report.pages).flatMap(([s, p]) => (p.external ?? []).map((e) => `${s}: ${e}`));
if (seen.length) console.log(`off-site, not blocking (${seen.length}):\n${seen.join("\n")}`);
console.log(JSON.stringify(report.blocking, null, 2));
process.exit(report.blocking.length ? 1 : 0);
