import type { L } from "./i18n";

export type Visual = "validator" | "sensor" | "ledger" | "citation" | "agent";
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
        "value": "24",
        "accent": true,
        "label": {
          "ar": "فحصاً تمرّ عليها فاتورتك قبل ما ترسلها",
          "en": "checks your invoice passes before you send it"
        }
      },
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
        "value": "0",
        "accent": true,
        "label": {
          "ar": "خطوة تضيع لو انقفل التطبيق",
          "en": "steps lost when the app is killed"
        }
      },
      {
        "value": "7,600",
        "accent": false,
        "label": {
          "ar": "سطر Kotlin في 42 ملفاً",
          "en": "lines of Kotlin across 42 files"
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
        "value": "0",
        "accent": true,
        "label": {
          "ar": "نتيجة عُمل بها قبل ما تجتاز الفحص",
          "en": "results acted on before they passed the checks"
        }
      },
      {
        "value": "87",
        "accent": false,
        "label": {
          "ar": "عقداً محجوزاً لم يدخل التطوير، ولم يُصرف عليه نظر",
          "en": "held-out contracts never used in development, with no look spent on them"
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
      "value": "0",
      "unit": {
        "ar": "شُغّل بمال حقيقي",
        "en": "run on real money"
      },
      "href": null,
      "label": {
        "ar": "سجلّ داخلي",
        "en": "internal record"
      },
      "live": false
    },
    "kicker": {
      "ar": "التحقّق من أنظمة الذكاء الاصطناعي",
      "en": "Verifying AI systems"
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
      "ar": "كل نظام يصحّح امتحانه بنفسه ينجح فيه. هذا منهج يجعل النتيجة السلبية ممكنة — بُني على سوق الكريبتو، ويُطبَّق على أنظمة الذكاء الاصطناعي التي نبنيها.",
      "en": "Every system that grades its own exam passes it. This is a method that makes a negative result possible — built on crypto markets, applied to the AI systems we ship."
    },
    "summary": {
      "ar": "منصّة لحظية تعمل على خادم سحابي بلا انقطاع: تمسح سوق الكريبتو على فترات دقائق، وتحسب السمات ووسوم تعلّم الآلة، وتختبر الاستراتيجيات. تُسجَّل كل فرضية كتابةً قبل اختبارها، ومعها الشرط الذي يُبطلها؛ وأكثرها سقط. والمنهج نفسه هو المُنتَج، ونطبّقه على أنظمة الذكاء الاصطناعي التي نبنيها ونسلّمها — فالمشكلة واحدة: نظامٌ يبدو ناجحاً ليس نظاماً ناجحاً.",
      "en": "A real-time platform runs on a cloud server without interruption: it scans crypto markets on intervals of minutes, computes features and machine-learning labels, and tests strategies. Every hypothesis is registered in writing before it is tested, together with the condition that would falsify it; most of them have fallen. The method itself is the product, and we run it against the AI systems we build and hand over — the problem is the same one: a system that looks like it works is not a system that works."
    },
    "problem": {
      "ar": "عشر رميات عملة تطلع كلها على وجه واحد ليست نادرة بما يكفي لتعني شيئاً؛ ومع ما يكفي من البيانات والمحاولات ستجد دائماً قاعدة تبدو صحيحة على الماضي. العشوائية تصنع أنماطاً مقنعة، وهذا ليس خطأ حساب بل خاصيّة فيها. لذلك أغلب أنماط الفشل طرق لخداع النفس: ملاءمة الضجيج، أو الاختبار حتى ينجح شيء، أو القياس مقابل مرجع خاطئ. وسوق الكريبتو لا يغلق ويتحرّك في دقائق، فيتضاعف عدد المحاولات وتتضاعف معها فرص المصادفة. والمسألة ليست خاصّة بالأسواق: أي نظام — نموذج تعلّم آلة، أو بوابة جودة، أو نموذج لغوي — يُقاس بمرجع مأخوذ من نفسه سينجح في امتحانه دائماً. المسألة الهندسية هي بناء عملية تستطيع أن تعطي إجابة سلبية ويُوثق بها.",
      "en": "Ten coin flips landing the same way is not rare enough to mean anything, and with enough data and enough attempts you will always find a rule that looks true about the past. Randomness manufactures convincing patterns; that is a property of it, not a mistake. So most failure modes are ways of fooling yourself: fitting noise, testing until something passes, or measuring against the wrong benchmark. Crypto markets never close and move in minutes, which multiplies the number of attempts and the coincidences that come with them. And the problem is not particular to markets: any system — a machine-learning model, a quality gate, a language model — measured against a benchmark drawn from itself will always pass its own exam. The engineering problem is a process that can return a negative answer and be believed."
    },
    "approach": {
      "ar": [
        "تُسجَّل كل فرضية كتابةً قبل اختبارها — السكّان والأفق والسمة والاتجاه المتوقَّع، ومعها الشرط الذي يُبطلها — فلا يمكن إعادة تفسير النتيجة بعد ظهورها. وتُسجَّل أزواجاً متعارضة، لأن ذراعاً منفردة تبدو جيدة لا يمكن دحضها أصلاً. وحين تسقط فرضية يبقى نصّها حرفياً كما كُتب ويُنشر دحضها، بدل أن يُحرَّر النصّ.",
        "من السجل، بنصّه: فرضية توقّعت أن تكون احتمالية فرط الملاءمة فوق 0.5 على شبكتَي الخروج والوقف، بحجّة أن «المتغيّرات شبه المتطابقة تجعل الفائز داخل العيّنة رمية عملة» — دُحضت، وحصل العكس تماماً. وفرضية ثانية توقّعت أن يتجاوز تمييز نموذج التصنيف 0.55 — دُحضت كذلك: جاء 0.5357، داخل توزيع الصدفة نفسه.",
        "قبل الوثوق بأي نتيجة إيجابية، يُحدَّد شكل النتيجة الإيجابية الكاذبة: ضابط عدم تجريبي يُشغَّل على الخط نفسه ليُعرف ما الذي يُنتجه هذا المسار حين لا يكون هناك شيء يُكتشف. فحصٌ لا يُعرف ما الذي يُفشِله ليس فحصاً.",
        "يجري التحقّق خارج العيّنة بثلاث طرق مستقلة، إحداها عيّنة محجوزة من أدوات لم تدخل التطوير إطلاقاً.",
        "وما ينطبق على قاعدة تداول ينطبق على نموذج تعلّم آلة بالحرف. نماذج التصنيف داخل المنصّة تُقاس بتقاطع طبقي مُطهَّر مع حظر زمني يمنع تسرّب المستقبل إلى التدريب، ويسبقها ضابط تسميات مُبعثَرة يُشغَّل أولاً ليُعرف ما الذي يُنتجه المسار حين لا يكون هناك شيء يُكتشف. وهذا هو الفحص نفسه الذي نُخضع له أي نظام ذكاء اصطناعي نسلّمه: يُحدَّد شكل النتيجة الكاذبة قبل أن تُصدَّق نتيجة حقيقية.",
        "والمنهج يُمسك أخطاءه هو أولاً. رقمٌ وصفته ثلاث وثائق في المشروع بأنه «غير مفلتر» تبيّن أنه ذراع مفلترة مرّتين على عيّنة أصغر بكثير — أمسكته إعادة تشغيل مستقلة، وطابقها مساران برمجيان منفصلان حتى الخانة الأخيرة. ورقمٌ آخر — أن 1% من الصفقات تحمل 55% من الربح — صحيحٌ بالنسبة المئوية وخاطئ في وحدة السجل نفسها؛ فالذيل السمين كان أثراً لوحدة القياس، لا خاصيّةً في النتيجة.",
        "سياسة مكتوبة تحكم ما يُسمح بتشغيله حياً، وفي المنفّذ قاطع إيقاف وسقوف للمخاطرة، وسجلّ أمامي يقيّد كل إشارة من لحظة صدورها فما بعد — فما يُقاس لاحقاً لا يُنتقى من الماضي.",
        "الأدوات مبنيّة في الاستوديو: خوارزميات، وبرمجيات، وبوتات، ومنصّة مؤتمتة تعمل لحظياً على خادم سحابي بلا انقطاع. تمسح سوق الكريبتو على فترات دقائق، وتحسب السمات ووسوم تعلّم الآلة، وتختبر الاستراتيجيات، وترسل التنبيهات إلى بوت مراسلة."
      ],
      "en": [
        "Each hypothesis is registered in writing before it is tested — population, horizon, feature, predicted direction, and the condition that would falsify it — so a result cannot be reinterpreted once it appears. They are registered as opposed pairs, because a single arm that looks good cannot be falsified at all. When one falls, its statement stands verbatim and the falsification is published rather than the statement edited.",
        "From the record, in its own words: one hypothesis predicted the probability of backtest overfitting would exceed 0.5 on the exit and stop grids, on the grounds that \"near-identical variants make the in-sample winner a coin flip\" — falsified, and the opposite happened. A second predicted a classifier AUC above 0.55 — also falsified: it came in at 0.5357, inside the null distribution itself.",
        "Before any positive result is trusted, the shape of a false positive is established: an empirical null control is run through the same pipeline to see what it produces when there is nothing there to find. A check whose failure mode is unknown is not a check.",
        "Validation runs out of sample in three independent ways, one of them a holdout of instruments never used during development.",
        "What holds for a trading rule holds literally for a machine-learning model. Classifiers inside the platform are measured with purged cross-validation and a time embargo that stops the future leaking into training, preceded by a shuffled-label control run first to establish what the pipeline produces when there is nothing there to find. That is the same audit we put any AI system through before we hand it over: the shape of a false result is fixed before a real one is believed.",
        "The method catches its own errors first. A number that three documents in the project described as \"unfiltered\" turned out to be a doubly-filtered arm on a much smaller sample — caught by an independent replay that two separate code paths reproduced to the last digit. Another — that 1% of trades carry 55% of the profit — is true in percent and false in the ledger's own unit; the fat tail was an artefact of the measure, not a property of the result.",
        "A written policy governs what may run live, the executor carries a kill switch and risk caps, and a forward ledger records every signal from the moment it fires onward — so what gets measured later cannot be selected out of the past.",
        "The tooling is built in the studio: algorithms, software, bots, and an automated platform that runs in real time on a cloud server without interruption. It scans crypto markets on intervals of minutes, computes features and machine-learning labels, tests strategies, and sends alerts to a messaging bot."
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
          "ar": "رمزاً، وكل تفسير معاه صورة صفحته من الكتاب",
          "en": "symbols, every reading shown on a scan of its printed page"
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
  },
  {
    "slug": "wa-agent",
    "name": {
      "ar": "موظف الردّ",
      "en": "Reply desk"
    },
    "period": "2026 — present",
    "figures": [
      {
        "value": "0.07",
        "accent": true,
        "label": {
          "ar": "درهماً تكلفة محادثة كاملة مع زبونك",
          "en": "dirhams for a complete conversation with your customer"
        }
      },
      {
        "value": "5/5",
        "accent": false,
        "label": {
          "ar": "أسئلة خارج نطاق المنشأة رُفضت كما ينبغي",
          "en": "out-of-scope questions refused as they should be"
        }
      },
      {
        "value": "2.0",
        "accent": false,
        "label": {
          "ar": "ثانية وسيط زمن الردّ على ثمانية عشر ردّاً مقيساً",
          "en": "seconds median reply time over eighteen measured replies"
        }
      },
      {
        "value": "0",
        "accent": false,
        "label": {
          "ar": "رسالة من هذا الديمو تُحفَظ",
          "en": "messages from this demo are stored"
        }
      },
      {
        "value": "150",
        "accent": false,
        "label": {
          "ar": "رداً في اليوم سقفاً لإنفاق الصفحة",
          "en": "replies a day, the page's spending ceiling"
        }
      }
    ],
    "stack": [
      "Python",
      "AWS Lambda",
      "DynamoDB",
      "Claude Haiku 4.5",
      "Claude Sonnet 5"
    ],
    "link": null,
    "visual": "agent",
    "ledger": {
      "value": "0",
      "unit": {
        "ar": "رسالة محفوظة من الديمو",
        "en": "demo messages stored"
      },
      "href": null,
      "label": {
        "ar": "كلّمه على هذه الصفحة",
        "en": "Talk to it on this page"
      },
      "live": true
    },
    "kicker": {
      "ar": "وكيل خدمة عملاء",
      "en": "Customer-service agent"
    },
    "status": {
      "ar": "المحرّك حيّ",
      "en": "Engine live"
    },
    "role": {
      "ar": "هندسة، تصميم حوار، ضبط التكلفة",
      "en": "Engineering, conversation design, cost control"
    },
    "tagline": {
      "ar": "وكيل يردّ على زبائن منشأة واحدة بلهجة إماراتية، محصوراً في ملفها وحده — والصفحة تفتح له باباً تكلّمه منه.",
      "en": "An agent that answers one business's customers in Emirati Arabic, confined to that business's own file — and this page opens a door to talk to it."
    },
    "summary": {
      "ar": "محرّك ردّ يعمل على واتساب لحساب منشأة واحدة: يقرأ ملفها، ويردّ بلهجتها، ويرفض ما ليس فيه، ويحوّل إلى إنسان حين يلزم. الديمو على هذه الصفحة هو المحرّك نفسه، لا نسخة منه.",
      "en": "A reply engine that works over WhatsApp for a single business: it reads that business's file, answers in its dialect, refuses what the file does not contain, and hands over to a person when it should. The demo on this page is that engine, not a copy of it."
    },
    "problem": {
      "ar": "المنشأة الصغيرة هنا تُدار من واتساب، وأكثر ما يصلها سؤال مكرّر: كم السعر، ومتى تفتحون، وفي موعد بكرة؟ الردّ يتأخّر ساعات، وحين يأتي يأتي بفصحى مكتبية لا تشبه من سأل. وما يُباع جاهزاً يردّ بخليجي عامّ أو بفصحى، ويخترع سعراً ليس في القائمة حين لا يعرف — وهذا أسوأ من الصمت.",
      "en": "Small businesses here are run from WhatsApp, and most of what reaches them is the same handful of questions: how much, when do you open, is tomorrow free? The answer takes hours, and when it comes it arrives in a formal register that sounds nothing like the person who asked. Off-the-shelf bots answer in generic Gulf Arabic or in formal Arabic, and invent a price that is not on the list when they do not know — which is worse than silence."
    },
    "approach": {
      "ar": [
        "الوكيل محصور في ملف منشأة واحدة: خدماتها وأسعارها وأوقاتها وموقعها. وأي سؤال خارج ذلك يُرفض بأدب ويُعاد صاحبه إلى الموضوع. القيد ليس تجميلاً: سياسة ميتا تمنع الأرقام التي استخدامها الأساسي محادثة عامة، وفقدان الرقم أسوأ من سؤال بلا جواب. والملف وحده هو ما يتبدّل: الصفحة تنقل الوكيل بين صالون وعيادة، فيسعّر ويحجز في الأول، ويرفض أن يشخّص أو يسمّي دواءً في الثاني — بالنصّ نفسه والقواعد نفسها.",
        "نموذجان يفصل بينهما حاجز ثقة: هايكو يجيب، وإذا نزلت ثقته في إجابته تحت 0.7 أعاد سونيت الإجابة نفسها. والردّ يعود JSON يحمل النيّة والثقة وقرار التحويل إلى إنسان، فالتصعيد قرارٌ مقيس لا انطباع.",
        "كل رسالة تمرّ على حارسَين قبل أن تكلّف فلساً: منعٌ للتكرار على معرّف الرسالة، لأن ميتا تعيد إرسال ما لم تستلم له ردّاً سريعاً، وحدٌّ يومي يُستهلك بعملية ذرّية واحدة لا بقراءةٍ ثم كتابة. والصفحة التي تقرأها الآن تمرّ على الحارسَين نفسيهما."
      ],
      "en": [
        "The agent is confined to one business's file: its services, prices, hours and location. Anything outside that is refused politely and the customer is returned to the subject. The constraint is not decoration: Meta's policy bars numbers whose primary use is open-ended conversation, and losing the number is worse than an unanswered question. Only the file changes: the page moves the agent between a salon and a dental clinic, where it quotes and books for one and refuses to diagnose or name a medicine for the other — same prompt, same rules.",
        "Two models separated by a confidence gate: Haiku answers, and when its own confidence in that answer falls below 0.7, Sonnet answers again. The reply comes back as JSON carrying the intent, the confidence and the hand-to-a-human decision, so escalation is a measured call rather than an impression.",
        "Every message passes two guards before it costs a fils: a dedupe on the message id, because Meta re-sends anything it did not get a fast acknowledgement for, and a daily cap consumed in one atomic operation rather than a read followed by a write. The page you are reading passes the same two guards."
      ]
    },
    "caveat": {
      "ar": "القناة نفسها لم تردّ على زبون حقيقي بعد: واتساب ينتظر أسرار ميتا وتوكناً دائماً، والحيّ اليوم هو المحرّك وهذا الديمو. والديمو يشتري ردوده بالمال، فله سقف يومي؛ إذا نفد عادت الصفحة إلى أمثلة النبرة المكتوبة في ملف المنشأة، وهي نصّ مالكها لا نصّ النموذج. والأرقام تحت كلّ ردّ مقروءة من فاتورة الرموز التي يعيدها النموذج نفسه، لا من تقدير — وهي كلفة بلا تخزين مؤقت: أقصر بادئة يخزّنها هذا النموذج 4096 رمزاً، وبادئتنا 2365، فالتخزين لا ينعقد أصلاً وقد قِيس صفراً.",
      "en": "The channel itself has not yet answered a real customer: WhatsApp is waiting on Meta's secrets and a permanent token, and what is live today is the engine and this demo. The demo buys its replies, so it has a daily ceiling; when that is spent the page falls back to the tone examples written into the business file, which are the owner's text and not the model's. The numbers under each reply are read from the token bill the model itself returns, not estimated — and they are uncached costs: the shortest prefix this model will cache is 4,096 tokens and ours is 2,365, so caching never engages, measured at zero."
    }
  }
];

export const bySlug = (slug: string) => caseStudies.find((c) => c.slug === slug);
