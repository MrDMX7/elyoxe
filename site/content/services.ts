import type { L } from "./i18n";

export type Service = { slug: string; title: L; body: L; proof: { slug: string; figure: number } };

/* Four parallel fields. They are not a sequence, so nothing here is numbered. */
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
    "proof": {
      "slug": "invoiceready",
      "figure": 0
    }
  },
  {
    "slug": "ai",
    "title": {
      "ar": "الذكاء الاصطناعي",
      "en": "Artificial intelligence"
    },
    "body": {
      "ar": "معالجة المستندات وتصنيفها ومراجعتها في خطوط إنتاج، والعربية فيها لغة أولى لا طبقة ترجمة.",
      "en": "Document processing, classification and review pipelines, with Arabic as a first language rather than a translation layer."
    },
    "proof": {
      "slug": "quantitative-method",
      "figure": 0
    }
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
    "proof": {
      "slug": "khutwa",
      "figure": 1
    }
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
    "proof": {
      "slug": "ahlam",
      "figure": 4
    }
  }
];
