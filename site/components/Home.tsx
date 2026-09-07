import type { Lang } from "@/content/i18n";
import Nav from "./Nav";
import Hero from "./Hero";
import Services from "./Services";
import Work from "./Work";
import Approach from "./Approach";
import Contact from "./Contact";
import Footer from "./Footer";

export default function Home({ lang }: { lang: Lang }) {
  return (
    <>
      <Nav lang={lang} />
      <main id="main">
        <Hero lang={lang} />
        <Services lang={lang} />
        <Work lang={lang} />
        <Approach lang={lang} />
        <Contact lang={lang} />
      </main>
      <Footer lang={lang} />
    </>
  );
}
