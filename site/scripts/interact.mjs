// The things that break without failing anything.
//
//   node scripts/interact.mjs http://localhost:8080
//
// typecheck passes, the build passes, shots.mjs passes, and the preloader never lifts -
// the site is a black rectangle and every gate is green. That class of failure is what
// this is for: the contracts a static export cannot check and a screenshot does not see.
//
// It asserts behaviour, not pixels. visual-diff.mjs covers the pixels.
//
// One rule it must never break: the contact form posts to SES and would send the owner
// real mail. The route is intercepted and answered locally; nothing leaves the machine.
import { chromium, devices } from "playwright";
import { PNG } from "pngjs";

const base = (process.argv[2] || "http://localhost:8080").replace(/\/$/, "");
const channel = process.env.PW_CHANNEL || undefined;   // msedge locally, bundled in CI
const fails = [];
const ok = (name) => console.log(`  ok    ${name}`);
const bad = (name, why) => { fails.push(`${name}: ${why}`); console.log(`  FAIL  ${name} - ${why}`); };

async function check(name, fn) {
  try {
    const why = await fn();
    if (why) bad(name, why); else ok(name);
  } catch (e) {
    bad(name, String(e).split("\n")[0].slice(0, 120));
  }
}

const browser = await chromium.launch({ channel });

// ---------------------------------------------------------------- desktop, Arabic root
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle", timeout: 60000 });
  console.log("\ndesktop /");

  await check("the page is visible, not a covered rectangle", async () => {
    // Four attempts, and every wrong one passed a broken page. Worth the list:
    //   1. "is .pl hidden" - passed whenever .pl was absent, which is the healthy case
    //      too: the preloader removes itself from the DOM rather than hiding.
    //   2. waitForFunction on the centre being uncovered - resolves on the FIRST true,
    //      so an overlay that arrives a moment later is never seen.
    //   3. elementFromPoint after settling - the preloader carries pointer-events:none,
    //      so the browser reports the element UNDER it while the visitor sees ink.
    // Only the pixels are the ground truth. The palette is paper #F4F2ED on every page
    // and the preloader is ink #141A17, so a dark middle means something is over it.
    await page.waitForTimeout(2500);        // the preloader lifts at about 0.9s
    const shot = await page.screenshot({ clip: { x: 620, y: 350, width: 200, height: 200 } });
    const img = PNG.sync.read(shot);
    let sum = 0;
    for (let i = 0; i < img.data.length; i += 4) {
      sum += 0.2126 * img.data[i] + 0.7152 * img.data[i + 1] + 0.0722 * img.data[i + 2];
    }
    const mean = sum / (img.data.length / 4);
    return mean > 90 ? null
      : `the middle of the page reads ${mean.toFixed(0)}/255 - ink, not paper: something covers it`;
  });

  await check("hero canvas is mounted and sized", async () => {
    const box = await page.evaluate(() => {
      const c = document.querySelector("canvas");
      if (!c) return null;
      const r = c.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
    if (!box) return "no canvas - the R3F hero did not mount";
    return box.w > 100 && box.h > 100 ? null : `canvas is ${box.w}x${box.h}`;
  });

  await check("skip link reaches a real target", async () => {
    const href = await page.getAttribute(".skip", "href");
    if (!href?.startsWith("#")) return `href is ${href}`;
    const exists = await page.evaluate((id) => !!document.querySelector(id), href);
    return exists ? null : `points at ${href}, which is not on the page`;
  });

  await check("language switch crosses to the mirror", async () => {
    const href = await page.getAttribute('a[href*="/en"]', "href");
    if (!href) return "no link into /en/ anywhere on the Arabic home page";
    const r = await page.request.get(new URL(href, base).toString());
    return r.ok() ? null : `${href} answers ${r.status()}`;
  });

  await check("form refuses an empty submit", async () => {
    let escaped = false;
    await page.route("**execute-api**", (route) => {
      escaped = true;                       // never let a real message out
      route.fulfill({ status: 200, body: "{}" });
    });
    const form = page.locator("form.ctc-form");
    if (!(await form.count())) return "no contact form on the page";
    await form.locator('button[type="submit"]').click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(600);
    return escaped ? "an empty form was sent to the endpoint" : null;
  });

  await check("form accepts a filled one and posts it", async () => {
    let sent = null;
    // The handler from the previous check is still registered and would answer first,
    // so this would report "no request" for a form that works. Routes accumulate.
    await page.unroute("**/execute-api.*.amazonaws.com/**");
    await page.route("**execute-api**", (route) => {
      sent = route.request().postData();
      route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    });
    await page.fill("#f-name", "اختبار");
    await page.fill("#f-email", "test@example.com");
    const msg = page.locator("form.ctc-form textarea").first();
    if (await msg.count()) await msg.fill("رسالة اختبار من interact.mjs");
    await page.locator('form.ctc-form button[type="submit"]').click();
    await page.waitForTimeout(1500);
    if (!sent) return "submit produced no request";
    return sent.includes("test@example.com") ? null : "the request carried no email field";
  });

  await ctx.close();
}

// ------------------------------------------------------------------------ mobile drawer
{
  const ctx = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await ctx.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle", timeout: 60000 });
  console.log("\nmobile /");

  await check("menu opens, closes on Escape", async () => {
    const toggle = page.locator("button.nav-toggle").first();
    if (!(await toggle.count())) return "no nav toggle";
    await toggle.click();
    await page.waitForTimeout(400);
    if ((await toggle.getAttribute("aria-expanded")) !== "true") return "aria-expanded stayed false";
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    const after = await page.locator("button.nav-toggle").first().getAttribute("aria-expanded");
    return after === "false" ? null : "Escape did not close it";
  });

  await check("a drawer link closes the drawer", async () => {
    const toggle = page.locator("button.nav-toggle").first();
    await toggle.click();
    await page.waitForTimeout(400);
    const link = page.locator("#drawer a").first();
    if (!(await link.count())) return "the drawer has no links";
    await link.click();
    await page.waitForTimeout(500);
    const open = await page.locator("button.nav-toggle").first().getAttribute("aria-expanded");
    return open === "false" ? null : "the drawer stayed open after a link was used";
  });

  await ctx.close();
}

await browser.close();
console.log(fails.length ? `\n${fails.length} interaction(s) broken:\n  ${fails.join("\n  ")}`
                         : "\nall interactions hold");
process.exit(fails.length ? 1 : 0);
