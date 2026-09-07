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

/** Absolute URL for metadata. */
export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://elyoxe.com";
export const abs = (lang: Lang, path = "") => `${SITE}${href(lang, path)}`;
