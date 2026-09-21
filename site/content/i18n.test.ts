// The bilingual URL contract. Every hreflang pair, every canonical and the whole sitemap are
// built from these four functions, and a wrong trailing slash on a static export is a 404 —
// there is no server to forgive it. Arabic is the root, English mirrors under /en/.
import { describe, it, expect } from "vitest";
import { href, abs, dirOf, other, SITE } from "./i18n";

describe("href", () => {
  it("puts Arabic at the root and English under /en/", () => {
    expect(href("ar")).toBe("/");
    expect(href("en")).toBe("/en/");
  });
  it("always ends in a slash — a static export has no redirect to add one", () => {
    expect(href("ar", "work")).toBe("/work/");
    expect(href("en", "work")).toBe("/en/work/");
    expect(href("ar", "work/quantitative-method")).toBe("/work/quantitative-method/");
  });
  it("is idempotent about slashes the caller supplies", () => {
    expect(href("ar", "/work")).toBe("/work/");
    expect(href("ar", "work/")).toBe("/work/");
    expect(href("en", "/work/")).toBe("/en/work/");
  });
});

describe("abs", () => {
  it("prefixes the site origin without doubling the slash", () => {
    expect(abs("ar")).toBe(`${SITE}/`);
    expect(abs("en", "work")).toBe(`${SITE}/en/work/`);
  });
  it("never yields a double slash anywhere in the path", () => {
    for (const p of ["", "/", "work", "/work/", "a/b"]) {
      for (const l of ["ar", "en"] as const) {
        expect(abs(l, p).replace(/^https?:\/\//, "")).not.toMatch(/\/\//);
      }
    }
  });
});

describe("dirOf and other", () => {
  it("binds Arabic to rtl and English to ltr", () => {
    expect(dirOf("ar")).toBe("rtl");
    expect(dirOf("en")).toBe("ltr");
  });
  it("mirrors each language to the other", () => {
    expect(other("ar")).toBe("en");
    expect(other("en")).toBe("ar");
  });
});
