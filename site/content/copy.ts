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
      ar: ["هدوءٌ في الواجهة، وهندسةٌ تحتها.", "البساطة آخر ما يُنجَز."],
      en: ["Quiet on the surface, engineered underneath.", "Simplicity is the last thing built."],
    } as L<[string, string]>,
    lead: {
      ar: "Elyoxe استوديو هندسي في دبي يصمّم الأنظمة ويبنيها ويشغّلها: مواقع ثنائية اللغة، وخطوط ذكاء اصطناعي تعامل العربية لغةً أولى، وتطبيقات أندرويد أصلية، وبنية سحابية على AWS. ولا شيء هنا موصوفٌ من بعيد؛ كلّ رقمٍ في الصفحة له رابطٌ تفتحه أو صفحةٌ تقرأها.",
      en: "Elyoxe is an engineering studio in Dubai that designs systems, builds them and runs them: bilingual websites, AI pipelines that treat Arabic as a first language, native Android applications, and cloud infrastructure on AWS. Nothing here is described from a distance — every number on the page has a link you can open or a page you can read.",
    },
    cta: { ar: "ناقش مشروعك", en: "Discuss a project" },
    cta2: { ar: "شاهد الأعمال", en: "See the work" },
    canvasLabel: { ar: "سطحٌ يُحلّ أمامك: خطوط كنتورية تتّضح مع الحركة", en: "A surface resolving in front of you: contour lines sharpening with motion" },
  },

  ledger: {
    title: { ar: "السجلّ الحيّ", en: "The live ledger" },
    note: {
      ar: "أربعة أرقام من أربعة مشاريع. نطاقان يُفتحان في المتصفح الآن، ومستودع مفتوح للعامة، وسجلّ داخلي حدوده مكتوبة في دراسته. الرقم هنا هو الرقم هناك.",
      en: "Four numbers from four projects. Two domains open in a browser right now, one repository is public, and one is an internal record whose limits are written into its case study. The number here is the number there.",
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
    proof: { ar: "من أعمالنا", en: "From our work" },
  },

  work: {
    title: { ar: "الأعمال", en: "Work" },
    lead: {
      ar: "مشاريع حقيقية، لكلٍّ منها أرقامه وحدوده المكتوبة ورسمٌ تفاعلي بُني له وحده.",
      en: "Real projects, each with its own numbers, its own limits in writing, and an interactive diagram built for it alone.",
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
      ar: "تسع فرضيات سُجّلت قبل اختبارها، وتسع نتائج سلبية، ولا واحدة أُعيد تفسيرها بعد ظهور النتيجة. بهذا وحده يُوثق بالفحص.",
      en: "Nine hypotheses pre-registered, nine negative results, and not one reinterpreted afterwards. That is the only thing that makes a check worth trusting.",
    },
    checks: { ar: "فحصاً لكل فاتورة", en: "checks per invoice" },
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
      ar: "وصفٌ قصير لما لا يعمل اليوم أنفع من كرّاسة مواصفات كاملة. المحادثة الأولى بلا مقابل، والردّ خلال يوم عمل واحد.",
      en: "A short description of what is not working today is worth more than a finished specification. The first conversation costs nothing, and a reply follows within one working day.",
    },
    name: { ar: "الاسم", en: "Name" },
    email: { ar: "البريد الإلكتروني", en: "Email" },
    message: { ar: "ما الذي لا يعمل اليوم؟", en: "What is not working today?" },
    send: { ar: "إرسال", en: "Send" },
    sending: { ar: "جارٍ الإرسال…", en: "Sending…" },
    done: { ar: "وصلت الرسالة. الردّ خلال يوم عمل واحد.", en: "Received. A reply follows within one working day." },
    fail: { ar: "لم تُرسل الرسالة. حاول مرة أخرى، أو تواصل عبر GitHub.", en: "That did not go through. Try again, or get in touch through GitHub." },
    privacy: { ar: "لا يُحفظ شيء سوى الرسالة نفسها.", en: "Nothing is stored but the message itself." },
    pitch: { ar: "أرسل المشكلة كما هي، ولو بسطرين.", en: "Send the problem as it is, even in two lines." },
    pitchBody: {
      ar: "أول محادثة غالباً تفتح باباً لم يكن مطروحاً: طريق أقصر إلى النتيجة نفسها، أو نتيجة أوسع مما طُلب. ولا يتبيّن أيّهما قبل أن تُوصَف المشكلة على حقيقتها.",
      en: "A first conversation usually opens a door that was not on the table: a shorter route to the same result, or a result wider than the one asked for. You only find out which once the problem is described as it actually is.",
    },
  },

  footer: {
    place: { ar: "الإمارات العربية المتحدة", en: "United Arab Emirates" },
    self: {
      ar: "استوديو هندسي في الإمارات، يعمل بالعربية والإنجليزية معاً، ولا يعرض عملاً إلا وله رابط يُفتح أو رقم يُراجَع.",
      en: "An engineering studio in the United Arab Emirates, working in Arabic and English alike, showing no work without a link to open or a number to check.",
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
