/* Structured data. Unlike og:image, this is the part search engines actually read.
 *
 * One rule governs everything here: emit only what the page already states. No ratings,
 * no review counts, no invented dates. Google penalises structured data that disagrees
 * with the page, and a claim nobody can see on screen is exactly that kind of claim.
 *
 * Rendered by <JsonLd/> in components/JsonLd.tsx, one script tag per page. */
import { SITE, abs, type Lang } from "@/content/i18n";
import type { CaseStudy } from "@/content/case-studies";
import type { Piece } from "@/content/writing";

const NAME = "Elyoxe";

/* Every one of these was fetched before being claimed: sameAs asserts identity, and a
   dead entry in it is a false claim. Instagram answered "Elyoxe (@elyo.xe)", YouTube
   answered "Elyoxe" with canonicalBaseUrl /@elyoxe, X answered 200. LinkedIn answers 999
   to everything that is not a browser, and the profile is known live. TikTok is left out
   because the handle is not confirmed. */
const PROFILES = [
  "https://www.youtube.com/@elyoxe",
  "https://www.instagram.com/elyo.xe",
  "https://www.linkedin.com/in/elyoxe",
  "https://x.com/Elyoxe",
];

export const organization = (lang: Lang) => ({
  "@type": "Organization",
  "@id": `${SITE}/#organization`,
  name: NAME,
  url: abs(lang),
  logo: { "@type": "ImageObject", url: `${SITE}/favicon.svg` },
  sameAs: PROFILES,
  email: "hello@elyoxe.com",
  address: { "@type": "PostalAddress", addressLocality: "Dubai", addressCountry: "AE" },
});

export const webSite = (lang: Lang) => ({
  "@type": "WebSite",
  "@id": `${SITE}/#website`,
  url: abs(lang),
  name: NAME,
  inLanguage: lang === "ar" ? "ar-AE" : "en-AE",
  publisher: { "@id": `${SITE}/#organization` },
});

/** The trail under a result in search. Home is always the root. */
export const breadcrumbs = (lang: Lang, trail: { name: string; path: string }[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: [{ name: NAME, path: "" }, ...trail].map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.name,
    item: abs(lang, c.path),
  })),
});

export const article = (lang: Lang, p: Piece) => ({
  "@type": "BlogPosting",
  "@id": abs(lang, `writing/${p.slug}`) + "#article",
  headline: p.title[lang],
  description: p.lead[lang],
  // `date` is the one date the record carries; claiming a separate modified date would
  // be inventing one.
  datePublished: p.date,
  inLanguage: lang === "ar" ? "ar-AE" : "en-AE",
  author: { "@id": `${SITE}/#organization` },
  publisher: { "@id": `${SITE}/#organization` },
  mainEntityOfPage: abs(lang, `writing/${p.slug}`),
  image: `${SITE}/og/${lang}-writing-${p.slug}.png`,
});

/* A case study is a page about a thing built, not the thing itself - CreativeWork says
   that honestly. SoftwareApplication would promise an install target that four of the
   five do not have. */
export const caseStudy = (lang: Lang, c: CaseStudy) => ({
  "@type": "CreativeWork",
  "@id": abs(lang, `work/${c.slug}`) + "#work",
  name: c.name[lang],
  description: c.summary[lang],
  inLanguage: lang === "ar" ? "ar-AE" : "en-AE",
  creator: { "@id": `${SITE}/#organization` },
  ...(c.link?.href ? { url: c.link.href } : {}),
  image: `${SITE}/og/${lang}-work-${c.slug}.png`,
});

/** Wrap a set of nodes into the single graph a page emits. */
export const graph = (...nodes: object[]) => ({
  "@context": "https://schema.org",
  "@graph": nodes,
});
