"use client";
import { useEffect } from "react";
import type { Lang } from "@/content/i18n";

/* Where a landing came from, as a category only: the referrer itself is never sent, and
   no cookie or id is kept. Same list as elyoxe.com/tools (saas/tools/src/assets/base.js);
   counted by saas/cards under STAT#site-src. */
const UTM: Record<string, string> = {
  ig: "instagram", instagram: "instagram", tiktok: "tiktok", x: "x", twitter: "x",
  fb: "facebook", facebook: "facebook", wa: "whatsapp", whatsapp: "whatsapp", snapchat: "snapchat",
};
const HOSTS: [RegExp, string][] = [
  [/(^|\.)elyoxe\.com$/, "site"], [/gemini\.google\.com$/, "chatgpt"], [/(^|\.)google\./, "google"],
  [/(^|\.)bing\.com$/, "bing"], [/duckduckgo|yahoo|yandex|ecosia|brave\.com|baidu/, "search"],
  [/^(x\.com|t\.co|twitter\.com)$/, "x"], [/instagram\.com$/, "instagram"],
  [/(facebook\.com|fb\.com|messenger\.com)$/, "facebook"], [/tiktok\.com$/, "tiktok"],
  [/whatsapp\.(com|net)$/, "whatsapp"], [/(t\.me|telegram\.org)$/, "telegram"],
  [/(linkedin\.com|lnkd\.in)$/, "linkedin"], [/(youtube\.com|youtu\.be)$/, "youtube"],
  [/snapchat\.com$/, "snapchat"], [/reddit\.com$/, "reddit"],
  [/(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|copilot\.microsoft\.com)$/, "chatgpt"],
];

function source(): string {
  const utm = new URLSearchParams(location.search).get("utm_source")?.toLowerCase() ?? "";
  if (UTM[utm]) return UTM[utm];
  if (!document.referrer) return "direct";
  const host = new URL(document.referrer).hostname.replace(/^(www|m|l|lm|mobile)\./, "");
  return HOSTS.find(([re]) => re.test(host))?.[1] ?? "other";
}

export default function SourceBeacon({ lang }: { lang: Lang }) {
  useEffect(() => {
    if (navigator.webdriver || /bot|crawl|spider|slurp|headless|lighthouse|preview/i.test(navigator.userAgent)) return;
    try {
      const body = JSON.stringify({ t: "site-home", e: "view", l: lang, r: source() });
      navigator.sendBeacon("https://cards.elyoxe.com/api/ev", new Blob([body], { type: "text/plain" }));
    } catch { /* a counter never breaks the page */ }
  }, [lang]);
  return null;
}
