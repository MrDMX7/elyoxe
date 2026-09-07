import { IBM_Plex_Sans_Arabic, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

/* One superfamily. The Arabic face leads; Latin and Mono are its siblings, so a
   number set in mono is the same shape on the Arabic root and the English mirror. */
export const plexArabic = IBM_Plex_Sans_Arabic({
  weight: ["400", "500", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-plex-arabic",
  display: "swap",
});
export const plexSans = IBM_Plex_Sans({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-plex-sans",
  display: "swap",
});
export const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
});
export const fontClass = `${plexArabic.variable} ${plexSans.variable} ${plexMono.variable}`;
