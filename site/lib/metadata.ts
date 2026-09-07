import type { Metadata } from "next";
import { abs, href, type Lang } from "@/content/i18n";
import { copy } from "@/content/copy";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const PREVIEW = !!process.env.NEXT_PUBLIC_PREVIEW;

export function pageMetadata(lang: Lang, opts: { path?: string; title?: string; description?: string } = {}): Metadata {
  const path = opts.path ?? "";
  const title = opts.title ?? copy.meta.title[lang];
  const description = opts.description ?? copy.meta.description[lang];
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://elyoxe.com"),
    title,
    description,
    robots: PREVIEW ? { index: false, follow: false } : { index: true, follow: true },
    alternates: {
      canonical: abs(lang, path),
      languages: { ar: abs("ar", path), en: abs("en", path), "x-default": abs("ar", path) },
    },
    icons: { icon: [{ url: `${BASE}/favicon.svg`, type: "image/svg+xml" }], apple: `${BASE}/apple-touch-icon.png` },
    openGraph: {
      title, description, type: "website", siteName: "Elyoxe",
      locale: lang === "ar" ? "ar_AE" : "en_AE",
      url: abs(lang, path),
      images: [{ url: `${BASE}/og-${lang}.png`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export { href };
