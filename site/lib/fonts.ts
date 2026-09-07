import { IBM_Plex_Sans_Arabic, IBM_Plex_Mono } from "next/font/google";

/* One family for both languages: IBM Plex Sans Arabic carries the Plex Sans
   Latin glyphs, so the English mirror needs no second face. Two weights only —
   every weight is a preloaded file on the LCP path. Mono carries the numbers. */
export const plexArabic = IBM_Plex_Sans_Arabic({
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-plex-arabic",
  display: "swap",
});
export const plexMono = IBM_Plex_Mono({
  weight: ["500"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
});
export const fontClass = `${plexArabic.variable} ${plexMono.variable}`;
