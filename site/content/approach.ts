import type { L } from "./i18n";

export type Clause = { title: L; body: L };

/* Set as a document, because that is what it is: written before work starts. */
export const approach: Clause[] = [
  {
    "title": {
      "ar": "النطاق يُثبَّت قبل الكود",
      "en": "Scope is fixed before code"
    },
    "body": {
      "ar": "كل تعاقد يبدأ بنطاق مكتوب وقائمة تسليمات محدّدة. التغيير يُسعَّر، ولا يُستوعب بصمت.",
      "en": "Every engagement opens with a written scope and a fixed list of deliverables. A change is priced, never absorbed in silence."
    }
  },
  {
    "title": {
      "ar": "كل تسليم يحمل اختباراته",
      "en": "Every delivery ships with its tests"
    },
    "body": {
      "ar": "يُسلَّم النظام ومعه الفحوص التي تثبت أنه يعمل، قابلةً للتشغيل من فريقك لا من Elyoxe وحدها.",
      "en": "The system arrives with the checks that prove it works, runnable by your team and not only by Elyoxe."
    }
  },
  {
    "title": {
      "ar": "النشر والتشغيل الأول جزء من التسليم",
      "en": "Deployment and the first stretch of running are part of delivery"
    },
    "body": {
      "ar": "النشر والمراقبة وأول فترة تشغيل داخل العقد نفسه، لا عقد منفصل.",
      "en": "Deployment, monitoring and the first operating period sit inside the same contract, not a separate one."
    }
  },
  {
    "title": {
      "ar": "التكلفة والحدود مكتوبة",
      "en": "Cost and limits, in writing"
    },
    "body": {
      "ar": "كل تسليم يذكر كتابةً ما يفعله النظام، وكم يكلّف تشغيله، وأين حدوده المعروفة.",
      "en": "Every delivery states what the system does, what it costs to run, and where its known limits are."
    }
  }
];
