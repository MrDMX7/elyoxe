import type { L } from "./i18n";

export type Visual = "validator" | "sensor" | "ledger" | "citation";
export type Figure = { value: string; accent: boolean; label: L };
export type Ledger = { value: string; unit: L; href: string | null; label: string | L; live: boolean };
export type CaseStudy = {
  slug: string; name: L; period: string; visual: Visual; ledger: Ledger;
  figures: Figure[]; stack: string[]; link: { label: string; href: string } | null;
  kicker: L; status: L; role: L; tagline: L; summary: L; problem: L; approach: L<string[]>; caveat: L;
};

/* One record per project. Adding a project is one record here: the work section,
   the ledger, the sitemap and both language trees are generated from it. */
export const caseStudies: CaseStudy[] = [
  {
    "slug": "invoiceready",
    "name": {
      "ar": "InvoiceReady",
      "en": "InvoiceReady"
    },
    "period": "2026 — present",
    "figures": [
      {
        "value": "102",
        "accent": false,
        "label": {
          "ar": "صفحة، عربية أولاً مع مرآة إنجليزية",
          "en": "pages, Arabic-first with an English mirror"
        }
      },
      {
        "value": "269",
        "accent": false,
        "label": {
          "ar": "كتلة بيانات منظَّمة",
          "en": "structured-data blocks"
        }
      },
      {
        "value": "24",
        "accent": false,
        "label": {
          "ar": "فحصاً لكل فاتورة",
          "en": "validation checks per invoice"
        }
      },
      {
        "value": "0",
        "accent": false,
        "label": {
          "ar": "ارتداد في مراسلة المزوّدين",
          "en": "bounced emails across the provider outreach"
        }
      }
    ],
    "stack": [
      "Python",
      "Schema.org",
      "IndexedDB"
    ],
    "visual": "validator",
    "ledger": {
      "value": "102",
      "unit": {
        "ar": "صفحة منشورة",
        "en": "pages live"
      },
      "href": "https://invoiceready.ae",
      "label": "invoiceready.ae",
      "live": true
    },
    "kicker": {
      "ar": "منصة امتثال",
      "en": "Compliance platform"
    },
    "status": {
      "ar": "منشور",
      "en": "Live"
    },
    "role": {
      "ar": "تصميم وهندسة وتشغيل",
      "en": "Design, engineering, operations"
    },
    "tagline": {
      "ar": "منصة ثنائية اللغة لإلزام الفوترة الإلكترونية في دولة الإمارات، صُمّمت وبُنيت وتُشغَّل بالكامل.",
      "en": "A bilingual platform for the United Arab Emirates e-invoicing mandate, designed, built and operated end to end."
    },
    "summary": {
      "ar": "منصة ثنائية اللغة لإلزام الفوترة الإلكترونية في الإمارات، تجمع دليلاً مبحوثاً للمزوّدين المعتمدين مع فاحص فواتير يعمل داخل المتصفح ويُبقي بيانات العميل عند العميل.",
      "en": "A bilingual platform for the UAE e-invoicing mandate, combining a researched directory of accredited providers with a browser-based invoice validator that keeps client data on the client."
    },
    "problem": {
      "ar": "تبدأ دولة الإمارات العربية المتحدة بتطبيق الفوترة الإلكترونية الإلزامية تدريجياً من 2026. على المنشآت تعيين مزوّد خدمة معتمد وإثبات أن فواتيرها تجتاز الصيغة المطلوبة. سوق المزوّدين غير شفاف، والمعلومات المنشورة متضاربة، ولم تكن هناك وسيلة مستقلة لفحص فاتورة قبل إرسالها.",
      "en": "The United Arab Emirates begins phasing in mandatory e-invoicing from 2026. Businesses must appoint an accredited service provider and demonstrate that their invoices validate against the required format. The provider market is opaque, published information is inconsistent, and no independent way existed to check an invoice before submitting it."
    },
    "approach": {
      "ar": [
        "بُحث عن كل المزوّدين المعتمدين من مصادر أولية فقط. أي حقل بلا مصدر عام يُنشر «غير معلن» بدل التقدير، والبناء يفشل كلياً عند أي حقل ناقص.",
        "فاحص الفواتير يعمل بالكامل داخل المتصفح. لا يُرفع أي مستند وتبقى بيانات العميل عند العميل، ما يزيل نقاش معالجة البيانات الذي يمنع فرق المالية من التجربة.",
        "الموقع يُولَّد كاملاً من مصدر واحد، فتبقى العربية والإنجليزية متطابقتين صفحةً بصفحة، وتحمل كل صفحة بياناتها المنظَّمة معها."
      ],
      "en": [
        "All accredited providers were researched from primary sources only. Any field without a public source is published as “not disclosed” rather than estimated, and the build fails outright on a missing field.",
        "The invoice validator runs entirely in the browser. No document is uploaded and client data stays with the client, which removes the data-handling conversation that would otherwise block a finance team from trying it.",
        "The whole site is generated from a single source, so the Arabic and the English stay identical page for page, and every page carries its structured data with it."
      ]
    },
    "caveat": {
      "ar": "المنصة مكتملة ومنشورة، ولم يأتِ منها عميل يدفع حتى الآن. تُعرض هنا دليلاً على الهندسة والتسليم، لا نتيجةً تجارية.",
      "en": "The platform is complete and live, and it has not yet brought in a paying client. It is here as evidence of engineering and delivery, not as a business result."
    },
    "link": {
      "label": "invoiceready.ae",
      "href": "https://invoiceready.ae"
    }
  },
  {
    "slug": "khutwa",
    "name": {
      "ar": "خُطوة",
      "en": "Khutwa"
    },
    "period": "2026",
    "figures": [
      {
        "value": "7,600",
        "accent": false,
        "label": {
          "ar": "سطر Kotlin في 42 ملفاً",
          "en": "lines of Kotlin across 42 files"
        }
      },
      {
        "value": "0",
        "accent": true,
        "label": {
          "ar": "فرق بين السجل المخزَّن والعدّاد الحي",
          "en": "delta between stored history and the live counter"
        }
      },
      {
        "value": "6",
        "accent": false,
        "label": {
          "ar": "شاشة بـJetpack Compose",
          "en": "Jetpack Compose screens"
        }
      },
      {
        "value": "0",
        "accent": false,
        "label": {
          "ar": "إعلانات أو تتبّع أو تحليلات",
          "en": "ads, analytics or telemetry"
        }
      }
    ],
    "stack": [
      "Kotlin",
      "Jetpack Compose",
      "Room",
      "SensorManager",
      "AlarmManager",
      "Foreground Services"
    ],
    "visual": "sensor",
    "ledger": {
      "value": "7,600",
      "unit": {
        "ar": "سطر Kotlin",
        "en": "lines of Kotlin"
      },
      "href": "https://github.com/MrDMX7/khutwa",
      "label": "github.com/MrDMX7/khutwa",
      "live": false
    },
    "kicker": {
      "ar": "تطبيقات الجوال",
      "en": "Mobile"
    },
    "status": {
      "ar": "مكتمل",
      "en": "Complete"
    },
    "role": {
      "ar": "هندسة",
      "en": "Engineering"
    },
    "tagline": {
      "ar": "تطبيق أندرويد أصلي لتتبّع النشاط، مبني حول دقّة الحسّاسات وخصوصية كاملة للبيانات.",
      "en": "A native Android activity tracker built around sensor accuracy and complete data privacy."
    },
    "summary": {
      "ar": "تطبيق أندرويد أصلي لتتبّع النشاط: العدّاد العتادي هو المرجع الوحيد للمجاميع، ومجموع السجل اليومي يساوي العدّاد الحي تماماً، ولا إعلانات ولا تحليلات ولا تتبّع.",
      "en": "A native Android activity tracker: the hardware counter is the only authority on totals, stored daily history sums to exactly the live counter, and there is no advertising, analytics or telemetry."
    },
    "problem": {
      "ar": "عدّادات الخطوات تتضارب فيما بينها ومع نفسها. تنحرف المجاميع عند إنهاء التطبيق، ويتوقّف السجل اليومي عن مطابقة الحسّاس الحي. أغلب التطبيقات تخفي الفارق بدل أن تحلّه.",
      "en": "Step counters disagree with each other and with themselves. Totals drift when the application is killed, and daily history stops reconciling with the live sensor. Most applications hide the discrepancy rather than resolve it."
    },
    "approach": {
      "ar": [
        "حسّاسان بمسؤوليتين منفصلتين: العدّاد العتادي هو المرجع الوحيد للمجاميع وينجو من إنهاء العملية، والكاشف يوفّر بيانات التوقيت التي تقود الإيقاع وتصنيف النشاط.",
        "ثابتة واحدة تُحفظ وتُفحص: مجموع السجل اليومي يجب أن يساوي العدّاد الحي تماماً. تُتحقَّق على الجهاز وتُعرض كأداة تشخيص يمكن لأي أحد إعادة تشغيلها.",
        "بلا إعلانات ولا تحليلات ولا تتبّع. ملف واحد فقط في المشروع يفتح اتصالاً شبكياً، ووظيفته جلب بلاطات الخرائط."
      ],
      "en": [
        "Two sensors with separated responsibilities: the hardware counter is the sole authority on totals and survives process death, while the detector supplies the timing data that drives cadence and activity classification.",
        "One invariant is held and checked: stored daily totals must sum to exactly the live counter. It is verified on device and exposed as a diagnostic anyone can re-run.",
        "No advertising, no analytics, no telemetry. Exactly one file in the codebase opens a network socket, and it fetches map tiles."
      ]
    },
    "caveat": {
      "ar": "النسخة الحالية موقَّعة للتطوير ونصوصها عربية فقط. توقيع الإصدار وقائمة المتجر ما زالا معلّقين — عمل تغليف لا هندسة جديدة.",
      "en": "Currently a debug-signed build with Arabic-only strings. Release signing and store listing remain outstanding — packaging work, not new engineering."
    },
    "link": {
      "label": "github.com/MrDMX7/khutwa",
      "href": "https://github.com/MrDMX7/khutwa"
    }
  },
  {
    "slug": "quantitative-method",
    "name": {
      "ar": "المنهج الكمّي",
      "en": "Quantitative method"
    },
    "period": "2026",
    "figures": [
      {
        "value": "9",
        "accent": true,
        "label": {
          "ar": "فرضية تداول سُجّلت كتابةً قبل اختبارها، ودُحضت كلها",
          "en": "trading hypotheses pre-registered in writing, every one falsified"
        }
      },
      {
        "value": "3",
        "accent": false,
        "label": {
          "ar": "فحوص مستقلة خارج العيّنة، إحداها عيّنة محجوزة",
          "en": "independent out-of-sample checks, one of them a holdout"
        }
      },
      {
        "value": "1",
        "accent": false,
        "label": {
          "ar": "سياسة مكتوبة تحكم ما يُشغَّل",
          "en": "written policy governing what may run"
        }
      }
    ],
    "stack": [
      "Python",
      "pandas",
      "NumPy",
      "SQLite",
      "systemd"
    ],
    "visual": "ledger",
    "ledger": {
      "value": "9",
      "unit": {
        "ar": "فرضيات دُحضت",
        "en": "hypotheses falsified"
      },
      "href": null,
      "label": {
        "ar": "سجلّ داخلي",
        "en": "internal record"
      },
      "live": false
    },
    "kicker": {
      "ar": "تعلّم آلة وأسواق",
      "en": "Machine learning and markets"
    },
    "status": {
      "ar": "مستمر",
      "en": "Ongoing"
    },
    "role": {
      "ar": "بحث وهندسة",
      "en": "Research and engineering"
    },
    "tagline": {
      "ar": "تعلّم آلة يُختبر على فرضيات تداول، بمنصّة لحظية تعمل على مدار الساعة في سوق الكريبتو.",
      "en": "Machine learning tested against trading hypotheses, on a real-time platform that runs around the clock on crypto markets."
    },
    "summary": {
      "ar": "منصّة لحظية تعمل على خادم سحابي بلا انقطاع: تمسح سوق الكريبتو على فترات دقائق، وتحسب السمات ووسوم تعلّم الآلة، وتختبر الاستراتيجيات. تُسجَّل كل فرضية كتابةً قبل اختبارها؛ سُجّلت تسع ودُحضت كلها. والمنهج نفسه هو المُنتَج.",
      "en": "A real-time platform runs on a cloud server without interruption: it scans crypto markets on intervals of minutes, computes features and machine-learning labels, and tests strategies. Every hypothesis is registered in writing before it is tested; nine were registered and all nine falsified. The method itself is the product."
    },
    "problem": {
      "ar": "من السهل جعل نموذج تعلّم آلة على بيانات السوق يبدو مقنعاً، ومن الصعب الوثوق به. أغلب أنماط الفشل طرق لخداع النفس: ملاءمة الضجيج، أو الاختبار حتى ينجح شيء، أو القياس مقابل مرجع خاطئ. وسوق الكريبتو لا يغلق ويتحرّك في دقائق، فيتضاعف عدد المحاولات وتتضاعف معها فرص المصادفة. المسألة الهندسية هي بناء عملية تستطيع أن تعطي إجابة سلبية ويُوثق بها.",
      "en": "A machine-learning model on market data is easy to make look convincing and hard to trust. Most failure modes are ways of fooling yourself: fitting noise, testing until something passes, or measuring against the wrong benchmark. Crypto markets never close and move in minutes, which multiplies the number of attempts and the coincidences that come with them. The engineering problem is a process that can return a negative answer and be believed."
    },
    "approach": {
      "ar": [
        "الأدوات مبنيّة في الاستوديو: خوارزميات، وبرمجيات، وبوتات، ومنصّة مؤتمتة تعمل لحظياً على خادم سحابي بلا انقطاع. تمسح سوق الكريبتو على فترات دقائق، وتحسب السمات ووسوم تعلّم الآلة، وتختبر الاستراتيجيات، وترسل التنبيهات إلى بوت مراسلة.",
        "تُسجَّل كل فرضية كتابةً قبل اختبارها، فلا يمكن إعادة تفسير النتيجة بعد ظهورها. سُجّلت تسع فرضيات متتالية ودُحضت جميعها، وبقيت مكتوبة كما سُجّلت.",
        "يجري التحقّق خارج العيّنة بثلاث طرق مستقلة، إحداها عيّنة محجوزة من أدوات لم تدخل التطوير إطلاقاً.",
        "ضابط عدم تجريبي يحدّد شكل النتيجة الإيجابية الكاذبة في هذا الخط قبل الوثوق بأي نتيجة إيجابية حقيقية.",
        "سياسة مكتوبة تحكم ما يُسمح بتشغيله حياً، وفي المنفّذ قاطع إيقاف وسقوف للمخاطرة، وسجلّ أمامي يقيّد كل إشارة من لحظة صدورها فما بعد — فما يُقاس لاحقاً لا يُنتقى من الماضي."
      ],
      "en": [
        "The tooling is built in the studio: algorithms, software, bots, and an automated platform that runs in real time on a cloud server without interruption. It scans crypto markets on intervals of minutes, computes features and machine-learning labels, tests strategies, and sends alerts to a messaging bot.",
        "Each hypothesis is registered in writing before it is tested, so a result cannot be reinterpreted once it appears. Nine consecutive hypotheses have been registered and every one falsified, and each stands on the record as written.",
        "Validation runs out of sample in three independent ways, one of them a holdout of instruments never used during development.",
        "An empirical null control establishes what a false positive looks like in this pipeline before any true positive is trusted.",
        "A written policy governs what may run live, the executor carries a kill switch and risk caps, and a forward ledger records every signal from the moment it fires onward — so what gets measured later cannot be selected out of the past."
      ]
    },
    "caveat": {
      "ar": "تُعرض كمنهجية فقط، والعمل الجاري اليوم على سوق الكريبتو. لا تُعرض أرقام أداء ولا ينبغي استنتاجها — عملية البحث تنتقل بين المجالات، أما السجل فلا.",
      "en": "Presented as methodology only; the work under way today is on crypto markets. No performance figures are shown and none should be inferred — a research process transfers between domains, a track record does not."
    },
    "link": null
  },
  {
    "slug": "ahlam",
    "name": {
      "ar": "أحلام",
      "en": "Ahlam"
    },
    "period": "2026",
    "figures": [
      {
        "value": "2,665",
        "accent": true,
        "label": {
          "ar": "رمزاً، كلٌّ بكتابه وصفحته المطبوعة",
          "en": "symbols, each carrying its book and printed page"
        }
      },
      {
        "value": "1,481",
        "accent": false,
        "label": {
          "ar": "صفحة مطبوعة مقروءة من ثلاثة كتب",
          "en": "printed pages read from three books"
        }
      },
      {
        "value": "3",
        "accent": false,
        "label": {
          "ar": "مصادر ملكٌ عام، منسوبة في كل مدخل",
          "en": "public-domain sources, credited per entry"
        }
      },
      {
        "value": "0",
        "accent": false,
        "label": {
          "ar": "تفسير مُولَّد — نقلٌ فقط",
          "en": "generated interpretations — retrieval only"
        }
      }
    ],
    "stack": [
      "Python",
      "Vanilla JS"
    ],
    "visual": "citation",
    "ledger": {
      "value": "2,665",
      "unit": {
        "ar": "رمزاً مُسنَداً",
        "en": "sourced symbols"
      },
      "href": "https://ahlam.elyoxe.com",
      "label": "ahlam.elyoxe.com",
      "live": true
    },
    "kicker": {
      "ar": "مرجع عربي",
      "en": "Arabic reference"
    },
    "status": {
      "ar": "منشور",
      "en": "Live"
    },
    "role": {
      "ar": "بحث، هندسة، تحرير",
      "en": "Research, engineering, editorial"
    },
    "tagline": {
      "ar": "معجم مُسنَد لتفسير الأحلام من كتب التراث، كل سطر فيه يُراجَع على صفحته المطبوعة.",
      "en": "A sourced dictionary of classical Arabic dream interpretation, where every line can be checked against the page it came from."
    },
    "summary": {
      "ar": "ثلاثة كتب في تعبير الرؤيا، ملكٌ عام، قُرئت وجُمعت في معجم واحد قابل للبحث، كل نصٍّ فيه بكتابه وجزئه وصفحته المطبوعة وموصولٌ بمصدره.",
      "en": "Three public-domain books on dream interpretation, parsed into one searchable dictionary in which every passage names its book, volume and printed page and links back to the scan."
    },
    "problem": {
      "ar": "ما يُنشر عن تفسير الأحلام بالعربية تغلب عليه مواقع تنسخ كلام المتقدمين بلا إسناد، وتخلط مصادر متباينة في صوتٍ واحد مجهول، وتُصدِّر اسم ابن سيرين على كتابٍ ينفي المحققون نسبته إليه. فمن أراد أن يعرف ما قاله عالمٌ بعينه لم يجد أين يتحقق.",
      "en": "Arabic dream interpretation online is dominated by content farms that reproduce classical material without attribution, merge incompatible sources into one anonymous voice, and headline the name of Ibn Sirin on a book whose attribution to him scholars reject. A reader who wants to know what a named scholar actually wrote has nowhere to check."
    },
    "approach": {
      "ar": [
        "المصادر هي الكتب نفسها لا المواقع التي تعيد صياغتها: النابلسي (ت ١١٤٣ هـ)، وابن شاهين (ت ٨٧٣ هـ)، والمطبوع باسم «منتخب الكلام». وثلاثتها ملكٌ عام بحكم القِدَم، والرقمنة منسوبة إلى أهلها، وكل مدخل موصولٌ بصفحته.",
        "الكتب الثلاثة مختلفة البناء فقُرئ كلٌّ منها ببنائه: أولها معجم أبجدي، والثاني مرتَّب على فصول موضوعية، والثالث لا عناوين لفصوله في نصه فيُقرأ باباً باباً. وتوحيد القراءة على نمطٍ واحد كان يُخرج الثالث فارغاً بلا خطأ ظاهر — ولهذا صار كل كتاب يُصرِّح ببنائه.",
        "لا شيء مُولَّد. الموقع ينقل ما كتبه علماء بأعيانهم، ويضع على كل نصٍّ من الكتاب المتنازَع في نسبته علامةً تدلّ على ذلك، ويترك المدخل بلا قسمٍ إذا لم يترجّح، بدل أن يُلحقه بقسمٍ لا تسنده البيّنة."
      ],
      "en": [
        "Sources are the primary books, not the sites that rewrite them: al-Nabulsi (d. 1143 AH), Ibn Shahin (d. 873 AH) and the text published as Muntakhab al-Kalam. All three are public domain by age; the digitisation is credited and every entry links back to the exact page.",
        "The three books are shaped differently and are parsed differently — one is an alphabetical dictionary, one is organised by thematic sections, and the third has no in-text headings at all and is read chapter by chapter. Forcing one parser across all three silently produced nothing for the third, which is why each declares its own structure.",
        "Nothing is generated. The site reports what named scholars wrote, flags the disputed attribution on every passage that carries it, and leaves an entry uncategorised rather than filing it under a category the evidence does not support."
      ]
    },
    "caveat": {
      "ar": "نُشر مرجعاً قابلاً للتصفّح، وصفحات الرموز المستقلة ما زالت قادمة. وهو عمل بحثي وهندسي لا منتج تجاري، ولا يدّعي تعبير رؤيا أحد.",
      "en": "Published as a browsable reference with per-symbol pages still to come. It is a research and engineering piece, not a commercial product, and it makes no claim to interpret anyone's dream."
    },
    "link": {
      "label": "ahlam.elyoxe.com",
      "href": "https://ahlam.elyoxe.com"
    }
  }
];

export const bySlug = (slug: string) => caseStudies.find((c) => c.slug === slug);
