export type Lang = "ar" | "en";
export type L<T = string> = Record<Lang, T>;

export const LANGS: Lang[] = ["ar", "en"];
export const dirOf = (lang: Lang) => (lang === "ar" ? "rtl" : "ltr");

/** Site-relative href for a language. Arabic is the root, English mirrors under /en/. */
export const href = (lang: Lang, path = "") => {
  const p = path.replace(/^\/+/, "");
  const base = lang === "ar" ? "/" : "/en/";
  return p ? `${base}${p}${p.endsWith("/") ? "" : "/"}` : base;
};

export const other = (lang: Lang): Lang => (lang === "ar" ? "en" : "ar");

/** The studio page: the sections (services, work, approach, contact) every "#work"-style link points at.
 *  Since 2026-10-09 the Arabic root is the products portal and the studio page lives at /about/;
 *  the English mirror keeps it at /en/ until its own portal is built. */
export const studio = (lang: Lang) => (lang === "ar" ? href("ar", "about") : href("en"));

/** Absolute URL for metadata. */
export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://elyoxe.com";
export const abs = (lang: Lang, path = "") => `${SITE}${href(lang, path)}`;
