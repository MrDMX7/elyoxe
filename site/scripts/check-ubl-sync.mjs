#!/usr/bin/env node
/* check-ubl-sync.mjs — the copy in lib/ubl must not drift from its source.
 *
 *   npm run check:ubl
 *
 * `lib/ubl/validate.mjs` is the rule code of ~/workspace/business/ubl/validate.mjs
 * with its Node surface removed, and `lib/ubl/xmldom.mjs` is a verbatim copy. The
 * rules are quoted on the site as "the same checker that gates a real invoice",
 * so this compares them and fails when that stops being true.
 *
 * When the workspace checkout is not beside this repo — CI builds this site alone
 * — there is nothing to compare against and the script exits 0 saying so. It is a
 * drift alarm for the machine that edits both, not a build gate.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.join(here, "..");
const source = path.join(site, "..", "..", "..", "business", "ubl");

if (!existsSync(source)) {
  console.log(`check:ubl — source not present at ${source}, nothing to compare`);
  process.exit(0);
}

const read = (p) => readFileSync(p, "utf8");
const problems = [];

/* xmldom is copied byte for byte */
if (read(path.join(source, "xmldom.mjs")) !== read(path.join(site, "lib/ubl/xmldom.mjs"))) {
  problems.push("lib/ubl/xmldom.mjs differs from business/ubl/xmldom.mjs");
}

/* validate keeps everything above checkFile(), which is where the Node-only
   surface starts; the header comment above that region is ours. */
const srcValidate = read(path.join(source, "validate.mjs"));
const copy = read(path.join(site, "lib/ubl/validate.mjs"));
const MARK = "export function checkFile(file)";
const rules = srcValidate
  .slice(0, srcValidate.indexOf(MARK))
  .replace('import { readFileSync } from "node:fs";\n', "")
  .replace("#!/usr/bin/env node\n", "")
  .trimStart();

if (!copy.endsWith(rules)) {
  problems.push("lib/ubl/validate.mjs no longer ends with the source's rule code verbatim");
}

if (problems.length) {
  for (const p of problems) console.error(`check:ubl FAIL — ${p}`);
  console.error("re-copy from business/ubl, or the page is quoting rules it does not run");
  process.exit(1);
}
console.log("check:ubl — lib/ubl matches business/ubl");
