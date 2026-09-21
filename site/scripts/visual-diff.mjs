// What changed on screen, against the last build that passed.
//
//   node scripts/visual-diff.mjs prev shots [--max 2]
//
// shots.mjs proves a page has no blocking fault - no overflow, nothing left hidden, no
// console error. It cannot say the page still LOOKS the same. On 2026-09-21 twenty-four
// CSS properties changed on the live site and every gate passed; had one of them moved a
// heading forty pixels, nothing in the pipeline would have noticed.
//
// So this compares the above-the-fold captures against the previous successful run's,
// which CI downloads as an artifact. Not a blessed baseline committed to the repo: a
// baseline would have to be captured on the same runner with the same browser to be
// comparable at all, and comparing to the previous build answers the question actually
// being asked - did MY change move something.
//
// Full-page and tile captures are deliberately left out. They are 20MB of the 23, they
// reflow with any content edit, and a number that moves every time is a number nobody
// reads.
import { readdirSync, existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const [prevDir, curDir] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const maxPct = Number(process.argv.find((a) => a.startsWith("--max="))?.split("=")[1] ?? 2);
if (!prevDir || !curDir) {
  console.error("usage: visual-diff.mjs <previous-dir> <current-dir> [--max=2]");
  process.exit(2);
}

// Only the stable views: above the fold, reduced motion, and the focus ring.
const stable = (f) => f.endsWith(".png") && /(-top|-reduced-top|-focus)\.png$/.test(f);
const outDir = join(curDir, "diff");

if (!existsSync(prevDir)) {
  console.log(`no previous run to compare against (${prevDir} absent) - first build of this kind`);
  process.exit(0);
}
mkdirSync(outDir, { recursive: true });

const files = readdirSync(curDir).filter(stable).sort();
const report = { when: new Date().toISOString(), maxPct, pages: {}, missing: [], over: [] };

for (const f of files) {
  const before = join(prevDir, f);
  if (!existsSync(before)) { report.missing.push(f); continue; }
  const a = PNG.sync.read(readFileSync(before));
  const b = PNG.sync.read(readFileSync(join(curDir, f)));
  if (a.width !== b.width || a.height !== b.height) {
    // A size change is itself the finding, and pixelmatch cannot run on it.
    report.pages[f] = { changed: 100, note: `size ${a.width}x${a.height} -> ${b.width}x${b.height}` };
    report.over.push(f);
    continue;
  }
  const diff = new PNG({ width: a.width, height: a.height });
  // 0.12 is tolerant of antialiasing without hiding a real move of anything.
  const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.12 });
  const pct = (100 * n) / (a.width * a.height);
  report.pages[f] = { changed: Number(pct.toFixed(3)), pixels: n };
  if (pct > 0) writeFileSync(join(outDir, f.replace(".png", ".diff.png")), PNG.sync.write(diff));
  if (pct > maxPct) report.over.push(f);
}

writeFileSync(join(curDir, "visual-diff.json"), JSON.stringify(report, null, 2));

const rows = Object.entries(report.pages).sort((x, y) => y[1].changed - x[1].changed);
console.log(`\nvisual diff against the previous successful build (threshold ${maxPct}%)`);
for (const [f, r] of rows) {
  const mark = r.changed > maxPct ? "CHANGED" : r.changed > 0 ? "  minor" : "   same";
  console.log(`  ${mark}  ${r.changed.toFixed(3).padStart(7)}%  ${f}${r.note ? "  " + r.note : ""}`);
}
if (report.missing.length) console.log(`\nnew pages, nothing to compare: ${report.missing.join(", ")}`);
if (report.over.length) {
  console.log(`\n${report.over.length} page(s) moved more than ${maxPct}%. The diff images are in`
    + ` the critique artifact under diff/ - red is what moved.`);
  console.log("This is a report, not a verdict: a redesign is supposed to change pixels.");
}
// Never fails the build. A visual change is usually intended, and a gate that cries on
// every intended change gets disabled within a week.
process.exit(0);
