import type { L } from "./i18n";

export type Service = { slug: string; title: L; body: L; proof: string };

/* Four parallel fields. They are not a sequence, so nothing here is numbered.
 *
 * Verification is not a fifth field. It used to be — «AI system audits» sat
 * here as its own row and pointed at the same case study as this one, so the
 * quantitative method was named twice in a single screen and a third time in
 * the work section below. It is a property of how we build AI, so it is the
 * second half of that row's paragraph and nothing else changed. */
export const services: Service[] = [
  {
    "slug": "web",
    "title": {
      "ar": "تطوير المواقع",
      "en": "Web development"
    },
    "body": {
      "ar": "مواقع تسويقية وأدوات داخلية وتطبيقات للعملاء، ثنائية اللغة من أول سطر لا بالترجمة لاحقاً.",
      "en": "Marketing sites, internal tools and customer-facing applications, bilingual from the first commit rather than translated afterwards."
    },
    "proof": "invoiceready"
  },
  {
    "slug": "ai",
    "title": {
      "ar": "الذكاء الاصطناعي",
      "en": "Artificial intelligence"
    },
    "body": {
      "ar": "معالجة المستندات وتصنيفها ومراجعتها في خطوط إنتاج، والعربية فيها لغة أولى لا طبقة ترجمة. وأي نظام يصحّح امتحانه بنفسه ينجح فيه — فنحدّد شكل النتيجة الكاذبة أولاً، ثم نقيس نظامك عليها، سواء بنيناه نحن أو اشتريته جاهزاً.",
      "en": "Document processing, classification and review pipelines, with Arabic as a first language rather than a translation layer. And a system that grades its own exam always passes — so we establish what a false result looks like first, then measure yours against it, whether we built it or you bought it."
    },
    "proof": "quantitative-method"
  },
  {
    "slug": "software",
    "title": {
      "ar": "هندسة البرمجيات",
      "en": "Software engineering"
    },
    "body": {
      "ar": "أندرويد أصلي وخدمات خلفية وتكاملات، تُقاس بالموثوقية لا بعدد الميزات.",
      "en": "Native Android, backend services and integrations, measured by reliability rather than feature count."
    },
    "proof": "khutwa"
  },
  {
    "slug": "cloud",
    "title": {
      "ar": "البنية السحابية",
      "en": "Cloud infrastructure"
    },
    "body": {
      "ar": "معمارية AWS وأتمتة النشر وهندسة التكلفة، لأنظمة لا تحتمل التوقّف.",
      "en": "AWS architecture, deployment automation and cost engineering for systems that have to stay running."
    },
    "proof": "ahlam"
  }
];
