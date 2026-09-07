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
      "ar": "كل تعاقد يبدأ بنطاق مكتوب وقائمة تسليمات محدّدة. وما يُضاف بعد ذلك يُسعَّر ويُتّفق عليه قبل أن يُبنى.",
      "en": "Every engagement opens with a written scope and a fixed list of deliverables. Anything added later is priced and agreed before it is built."
    }
  },
  {
    "title": {
      "ar": "كل تسليم يحمل اختباراته",
      "en": "Every delivery ships with its tests"
    },
    "body": {
      "ar": "يصل النظام ومعه الفحوص التي تثبت أنه يعمل، ويشغّلها فريقك بنفسه دون الحاجة إلى Elyoxe.",
      "en": "The system arrives with the checks that prove it works, and your team can run them without Elyoxe."
    }
  },
  {
    "title": {
      "ar": "النشر والتشغيل الأول جزء من التسليم",
      "en": "Deployment and early operation are part of delivery"
    },
    "body": {
      "ar": "النشر والمراقبة وأول فترة تشغيل داخل العقد نفسه، لا في عقد ثانٍ يأتي لاحقاً.",
      "en": "Deployment, monitoring and the first operating period sit inside the same contract, not a second one that arrives later."
    }
  },
  {
    "title": {
      "ar": "التكلفة والحدود مكتوبة",
      "en": "Cost and limits, in writing"
    },
    "body": {
      "ar": "كل تسليم يقول كتابةً ما يفعله النظام، وكم يكلّف تشغيله، وأين تقف حدوده المعروفة.",
      "en": "Every delivery says in writing what the system does, what it costs to run, and where its known limits sit."
    }
  }
];
