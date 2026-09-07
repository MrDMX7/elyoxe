import type { L } from "./i18n";

/* Every string in both languages, each written natively. The register is the
   one already on the site: plain, concrete, no adjectives doing the work. */
export const copy = {
  brand: "Elyoxe",
  nav: {
    services: { ar: "الخدمات", en: "Services" },
    work: { ar: "الأعمال", en: "Work" },
    approach: { ar: "المنهج", en: "Approach" },
    contact: { ar: "تواصل", en: "Contact" },
    switch: { ar: "English", en: "عربي" },
    menu: { ar: "القائمة", en: "Menu" },
    close: { ar: "إغلاق", en: "Close" },
    skip: { ar: "تجاوز إلى المحتوى", en: "Skip to content" },
  } satisfies Record<string, L>,

  meta: {
    title: { ar: "Elyoxe — استوديو هندسي في دبي", en: "Elyoxe — an engineering studio in Dubai" },
    description: {
      ar: "تطوير مواقع، وذكاء اصطناعي يعامل العربية لغةً أولى، وهندسة برمجيات، وبنية سحابية على AWS. كلّ رقم في الموقع يُفتح ويُراجَع.",
      en: "Web development, AI that treats Arabic as a first language, software engineering and cloud infrastructure on AWS. Every number on the site can be opened and checked.",
    },
  },

  hero: {
    lines: {
      ar: ["برمجيات تعمل في الإنتاج.", "وكلّ رقمٍ عنها يُفتح الآن."],
      en: ["Software running in production.", "Every number about it opens now."],
    } as L<[string, string]>,
    lead: {
      ar: "Elyoxe استوديو هندسي في دبي يصمّم الأنظمة ويبنيها ويشغّلها: مواقع ثنائية اللغة، وخطوط ذكاء اصطناعي تعامل العربية لغةً أولى، وتطبيقات أندرويد أصلية، وبنية سحابية على AWS. ما يظهر في هذه الصفحة منشورٌ ويُفتح، لا موصوف.",
      en: "Elyoxe is an engineering studio in Dubai that designs, builds and runs systems: bilingual websites, AI pipelines that treat Arabic as a first language, native Android applications, and cloud infrastructure on AWS. What this page shows is published and opens. It is not described.",
    },
    cta: { ar: "ناقش مشروعك", en: "Discuss a project" },
    cta2: { ar: "الأعمال", en: "See the work" },
    canvasLabel: { ar: "خريطة الأنظمة التي تشغّلها Elyoxe الآن", en: "A map of the systems Elyoxe runs right now" },
  },

  ledger: {
    title: { ar: "السجلّ الحيّ", en: "The live ledger" },
    note: {
      ar: "أربعة أرقام من أربعة مشاريع. النطاقان يُفتحان في المتصفح الآن، والرقمان الآخران من مستودع عام وسجلّ داخلي مذكورٌ بحدوده. كلّ رقم هنا هو نفسه في دراسة الحالة التي تخصّه.",
      en: "Four numbers from four projects. The two domains open in a browser right now; the other two come from a public repository and an internal record whose limits are stated. Every number here is the same one its case study reports.",
    },
    open: { ar: "افتح", en: "Open" },
    read: { ar: "اقرأ", en: "Read" },
    cost: { ar: "تكلفة تشغيل النطاقين شهرياً", en: "Monthly cost of running both domains" },
    checked: { ar: "يُفتح الآن", en: "opens now" },
    live: { ar: "حيّ", en: "live" },
  },

  services: {
    title: { ar: "الخدمات", en: "Services" },
    lead: {
      ar: "أربعة مجالات متوازية، لا مراحل. كلّ مجال يشير إلى عملٍ منشور يثبته.",
      en: "Four parallel fields, not stages. Each points to published work that proves it.",
    },
    proof: { ar: "الدليل", en: "Proof" },
  },

  work: {
    title: { ar: "الأعمال", en: "Work" },
    lead: {
      ar: "مشاريع منشورة، لكلٍّ منها لغته وأرقامه وحدوده المكتوبة.",
      en: "Published projects, each with its own language, its numbers, and its limits in writing.",
    },
    caseStudy: { ar: "دراسة الحالة", en: "Case study" },
    visit: { ar: "زيارة", en: "Visit" },
    back: { ar: "الأعمال", en: "Work" },
    role: { ar: "الدور", en: "Role" },
    period: { ar: "الفترة", en: "Period" },
    status: { ar: "الحالة", en: "Status" },
    problem: { ar: "المشكلة", en: "The problem" },
    approach: { ar: "المقاربة", en: "Approach" },
    measured: { ar: "بالقياس", en: "Measured" },
    built: { ar: "الأدوات", en: "Built with" },
    caveat: { ar: "بصراحة", en: "Stated plainly" },
    next: { ar: "المشروع التالي", en: "Next project" },
    hypothesis: { ar: "فرضية", en: "Hypothesis" },
    registered: { ar: "مسجَّلة مسبقاً", en: "Pre-registered" },
    falsified: { ar: "دُحضت", en: "Falsified" },
    ledgerFoot: {
      ar: "تسع فرضيات، تسع نتائج سلبية، ولا واحدة أُعيد تفسيرها بعد الاختبار. هذا ما يجعل الفحص موثوقاً.",
      en: "Nine hypotheses, nine negative results, and not one reinterpreted after the test. That is what makes the check trustworthy.",
    },
    checks: { ar: "فحصاً لكل فاتورة، داخل المتصفح", en: "checks per invoice, inside the browser" },
    stored: { ar: "مجموع السجلّ المخزَّن", en: "Stored history, summed" },
    liveCounter: { ar: "العدّاد الحي", en: "Live counter" },
    delta: { ar: "الفرق", en: "Delta" },
    citationFrom: { ar: "من", en: "From" },
    printedPage: { ar: "صفحة", en: "page" },
    volume: { ar: "الجزء", en: "vol." },
    scan: { ar: "افتح صفحة المصدر", en: "Open the source page" },
    entry: { ar: "افتح المدخل في أحلام", en: "Open the entry on Ahlam" },
  },

  approach: {
    title: { ar: "المنهج", en: "Approach" },
    lead: {
      ar: "أربعة بنود تُكتب قبل أن يبدأ أي عمل، وتسري على كل تعاقد.",
      en: "Four clauses written before any work starts, binding on every engagement.",
    },
    clause: { ar: "البند", en: "Clause" },
    engagement: { ar: "نموذج التعاقد", en: "Engagement model" },
    engagementBody: {
      ar: "نطاق ثابت وسعر ثابت للمشاريع المحدّدة، وطاقة شهرية محجوزة للأعمال المستمرة.",
      en: "Fixed scope and fixed price for defined projects. Retained monthly capacity for ongoing work.",
    },
  },

  contact: {
    title: { ar: ["ابدأ من المشكلة،", "لا من المواصفات."], en: ["Start with the problem,", "not the specification."] } as L<[string, string]>,
    lead: {
      ar: "وصفٌ قصير لما لا يعمل اليوم أنفع من كرّاسة مواصفات مكتملة. الاستشارة الأولى بلا مقابل، والردّ خلال يوم عمل.",
      en: "A short description of what is not working today is more useful than a finished brief. The first consultation carries no charge, and a reply follows within one working day.",
    },
    name: { ar: "الاسم", en: "Name" },
    email: { ar: "البريد الإلكتروني", en: "Email" },
    message: { ar: "ما الذي لا يعمل اليوم؟", en: "What is not working today?" },
    send: { ar: "إرسال", en: "Send" },
    sending: { ar: "جارٍ الإرسال…", en: "Sending…" },
    done: { ar: "وصلت الرسالة. الردّ خلال يوم عمل واحد.", en: "Received. A reply follows within one working day." },
    fail: { ar: "لم تُرسل الرسالة. حاول مرة أخرى، أو تواصل عبر GitHub.", en: "That did not go through. Try again, or get in touch through GitHub." },
    privacy: { ar: "لا يُحفظ شيء سوى الرسالة نفسها.", en: "Nothing is stored but the message itself." },
  },

  footer: {
    place: { ar: "دبي، الإمارات العربية المتحدة", en: "Dubai, United Arab Emirates" },
    self: {
      ar: "هذا الموقع نفسه ملفات ثابتة على S3 وCloudFront، يُبنى على GitHub Actions ويُخدَم بلا خادم.",
      en: "This site is itself static files on S3 and CloudFront, built on GitHub Actions and served without a server.",
    },
    github: "github.com/MrDMX7",
    rights: { ar: "Elyoxe", en: "Elyoxe" },
  },

  notFound: {
    title: { ar: "هذه الصفحة غير موجودة.", en: "That page does not exist." },
    lead: {
      ar: "الرابط هو الخطأ، لا أنت. كلّ ما ينشره هذا الموقع مذكور في الصفحة الرئيسية.",
      en: "The link is wrong, not you. Everything this site publishes is listed on the homepage.",
    },
    home: { ar: "الصفحة الرئيسية", en: "Homepage" },
  },
} as const;
