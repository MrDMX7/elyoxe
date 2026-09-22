import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/* Every class selector in the stylesheets must belong to an element some
 * component actually renders.
 *
 * This exists because of a silent bug that shipped for four days. The
 * hypothesis ledger used to render `<span class="hyl-id">H-01</span>` in the
 * first of two grid tracks; the rewrite that dropped the numbering removed the
 * span and left `.hyl-entry { grid-template-columns: 3.1rem minmax(0, 1fr) }`
 * behind. The route name then inherited the 3.1rem track meant for the id:
 * 49.6px wide, four lines tall, with 642px of the row empty beside it. Nothing
 * threw, nothing failed to build, and every existing check passed — a stale
 * rule for a deleted element is invisible to everything except an eye on the
 * page.
 *
 * So the invariant is the one that would have caught it: a class in CSS with
 * no element in the markup is a bug, not dead weight. Class names are matched
 * as whole tokens, which is why `apr-doc-head` in a component does not keep a
 * separate `.doc-head` rule alive. */

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Class names that are real but never written as a literal token in source. */
const DYNAMIC = new Set<string>([]);

function walk(dir: string, ext: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".next" || e.name === "out") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, out);
    else if (e.name.endsWith(ext)) out.push(p);
  }
  return out;
}

/** Selector class names, minus the ones inside `:is()`-style pseudo args we do not use. */
function classesIn(css: string): string[] {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...stripped.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]);
}

/** Whole-token vocabulary of a source file: `"a b"`, `` `x ${y} is-z` ``, "cls". */
function tokensIn(src: string): string[] {
  return [...src.matchAll(/[A-Za-z_][\w-]*/g)].map((m) => m[0]);
}

describe("stylesheets", () => {
  const cssFiles = [...walk(join(root, "app"), ".css")];
  const sources = [
    ...walk(join(root, "components"), ".tsx"),
    ...walk(join(root, "app"), ".tsx"),
    ...walk(join(root, "content"), ".ts"),
  ];

  const vocabulary = new Set<string>();
  for (const f of sources) for (const t of tokensIn(readFileSync(f, "utf8"))) vocabulary.add(t);

  it("declare no class that no component renders", () => {
    const orphans: string[] = [];
    for (const file of cssFiles) {
      const rel = relative(root, file).split(sep).join("/");
      for (const cls of new Set(classesIn(readFileSync(file, "utf8")))) {
        if (vocabulary.has(cls) || DYNAMIC.has(cls)) continue;
        orphans.push(`${rel} → .${cls}`);
      }
    }
    expect(orphans.sort()).toEqual([]);
  });
});
