import type { Lang } from "@/content/i18n";
import type { Visual } from "@/content/case-studies";
import Validator from "./Validator";
import Sensor from "./Sensor";
import Hypotheses from "./Hypotheses";
import Citation from "./Citation";

/* Each project has its own visual language; a new project declares which. */
export default function CaseVisual({ visual, lang }: { visual: Visual; lang: Lang }) {
  switch (visual) {
    case "validator": return <Validator lang={lang} />;
    case "sensor": return <Sensor lang={lang} />;
    case "ledger": return <Hypotheses lang={lang} />;
    case "citation": return <Citation lang={lang} />;
  }
}
