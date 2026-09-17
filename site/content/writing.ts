import type { L } from "./i18n";

/* Long-form pieces. A case study says what was built; a piece here says what
   we believe about building it, at a length the work section cannot carry
   without becoming an essay itself.
 *
 * `body` is an array of paragraphs. A paragraph that opens with "## " is a
 * heading — kept this plain deliberately: the writing is the deliverable and a
 * markdown pipeline would be a second thing to maintain for no gain. */

export type Piece = {
  slug: string;
  title: L;
  lead: L;
  kicker: L;
  date: string;
  body: L[];
  related?: string; // case-study slug
};

export const writing: Piece[] = [
  {
    slug: "the-rule-that-looks-true",
    date: "2026-09-17",
    kicker: { ar: "منهج", en: "Method" },
    title: {
      ar: "القاعدة التي تبدو صحيحة",
      en: "The rule that looks true",
    },
    lead: {
      ar: "عشر رميات عملة على وجه واحد ليست نادرة. وهذه الحقيقة الصغيرة هي السبب في أن معظم ما نقيسه عن أنظمتنا لا يعني ما نظنّه.",
      en: "Ten coin flips landing the same way is not rare. That small fact is why most of what we measure about our systems does not mean what we think it does.",
    },
    related: "quantitative-method",
    body: [
      {
        ar: "ارمِ عملة مئة مرة. ستحصل على سلسلة من ستّ رميات متطابقة على الأرجح، وسلسلة من سبع ليست مستبعَدة. لو رأيت هذه السلسلة في بيانات شركتك — ستة أشهر متتالية يرتفع فيها مؤشّر، ستّ حالات ينجح فيها نموذج — فستبحث لها عن سبب. وغالباً ستجد واحداً، لأن البحث عن سبب لشيء حدث فعلاً عملية تنجح دائماً.",
        en: "Flip a coin a hundred times. You will probably get a run of six identical flips, and a run of seven is not unlikely. If you saw that run in your company's data — six consecutive months of a metric rising, six cases where a model got it right — you would look for a cause. And you would usually find one, because looking for a cause of something that already happened is a process that always succeeds.",
      },
      {
        ar: "## ما يتقارب فعلاً",
        en: "## What actually converges",
      },
      {
        ar: "الفكرة الشائعة عن العملة هي أن الرميات «تتوازن» على المدى الطويل. هذا صحيح بمعنى واحد فقط، وخاطئ بكل المعاني الأخرى. الذي يتقارب هو النسبة المُشاهَدة: عدد مرّات الصورة مقسوماً على عدد الرميات، يقترب من 0.5. أما احتمال كل رمية فكان 0.5 من البداية ولم يتغيّر، ولا يتغيّر بعد عشر صور متتالية.",
        en: "The common idea about a coin is that the flips “even out” in the long run. That is true in exactly one sense and false in every other. What converges is the observed ratio: heads divided by flips, closing on 0.5. The probability of any single flip was 0.5 from the start, did not change, and does not change after ten heads in a row.",
      },
      {
        ar: "والأهم: الفرق المطلق بين عدد الصور وعدد الكتابات لا يتقلّص أبداً. بل يكبر. متوسّطه يقارب 0.8 في الجذر التربيعي لعدد الرميات — أي أن ألف رمية تعطي فرقاً حول 25، ومليون رمية تعطي فرقاً حول 800. كل مرة تضرب عدد الرميات في مئة، يكبر الفرق عشرة أضعاف بينما ينكمش خطأ النسبة عشرة أضعاف. لا شيء «يصحّح» سلسلة سابقة؛ الفجوة تتّسع، ويغرقها مقامٌ أكبر منها.",
        en: "More to the point: the absolute gap between heads and tails never shrinks. It grows. Its average is about 0.8 times the square root of the number of flips — a thousand flips gives a gap around 25, a million gives a gap around 800. Every hundredfold increase in flips grows the gap tenfold while shrinking the ratio's error tenfold. Nothing “corrects” an earlier run; the gap widens, and a bigger denominator drowns it.",
      },
      {
        ar: "وهذا الجذر التربيعي ليس صدفة. نظرية الحد المركزي تقول إن عدد الصور بعد عدد كبير من الرميات يتوزّع توزيعاً طبيعياً — منحنى الجرس — حول النصف، بانحرافٍ يتناسب مع جذر العدد. قانون الأعداد الكبيرة يعطيك المركز؛ ونظرية الحد المركزي تعطيك حجم الاهتزاز حوله. الأولى وحدها تُطمئن، والثانية هي التي تقول لك كم يجب أن تكون قليل الثقة.",
        en: "That square root is not a coincidence. The central limit theorem says the count of heads after many flips is normally distributed — the bell curve — around half, with a spread proportional to the square root of the count. The law of large numbers gives you the centre; the central limit theorem gives you the size of the wobble around it. The first on its own is reassuring. The second is the one that tells you how unconfident to be.",
      },
      {
        ar: "## أين تنهار القاعدة",
        en: "## Where the rule breaks",
      },
      {
        ar: "منحنى الجرس يظهر حين تجمع كثيراً من التأثيرات الصغيرة المستقلّة: أطوال الناس، أخطاء القياس، هامش الخطأ في استطلاع. وهو يغيب — ويغيب بشكل خطر — في أربع حالات. حين تكون الأحداث مترابطة لا مستقلّة: نماذج 2008 افترضت أن تعثّر الرهون مستقلّ، فانهارت كلها معاً. وحين يكون التباين غير منتهٍ، فتزيد العيّنات ولا يتحسّن شيء. وحين يهيمن عنصر واحد على البقيّة. وحين تتضاعف العوامل بدل أن تتجمّع، فيكون التوزيع لوغاريتمياً طبيعياً لا طبيعياً.",
        en: "The bell curve appears when many small independent effects are added: human heights, measurement errors, a survey's margin of error. It is absent — dangerously absent — in four cases. When events are correlated rather than independent: the 2008 models assumed mortgage defaults were independent, and they all failed together. When variance is infinite, so more samples improve nothing. When one term dominates the rest. And when factors multiply rather than add, which gives a log-normal distribution, not a normal one.",
      },
      {
        ar: "ولهذا فإن الثروة وأحجام المدن ومبيعات الكتب وأسعار الأصول لا تُقرأ بمتوسّطاتها. ولهذا أيضاً فإن رقماً مثل «1% من الحالات تحمل 55% من النتيجة» قد يكون صحيحاً في وحدة قياس وخاطئاً تماماً في أخرى — وقد واجهنا هذا حرفياً في سجلّنا: الرقم صحيح بالنسبة المئوية، وخاطئ في الوحدة التي يُمسك بها السجل حساباته. الذيل السمين كان أثراً لوحدة القياس، لا خاصيّةً في النتيجة.",
        en: "Which is why wealth, city sizes, book sales and asset prices are not read through their averages. And why a figure like “1% of cases carry 55% of the outcome” can be true in one unit and flatly false in another — something we hit in our own record: the figure is true in percent and false in the unit the ledger actually keeps its accounts in. The fat tail was an artefact of the measure, not a property of the result.",
      },
      {
        ar: "## والآن، أنظمة الذكاء الاصطناعي",
        en: "## Now, AI systems",
      },
      {
        ar: "كل ما سبق ينطبق حرفياً على تقييم الأنظمة التي نبنيها اليوم. نموذج يصنّف مستندات، أو بوابة جودة تحكم على مخرجات، أو نموذج لغوي يُقيَّم بمجموعة اختبارات — كلها تُقاس بعدد محدود من الحالات، وكلها عرضة لأن يبدو أداؤها ممتازاً بالصدفة وحدها. والفرق أن عدد المحاولات هنا أكبر بكثير: تُغيّر الموجّه، وتُغيّر العتبة، وتُعيد التشغيل. ومع ما يكفي من المحاولات، ستجد دائماً إعداداً يبدو ناجحاً.",
        en: "All of the above applies literally to evaluating the systems we build today. A model classifying documents, a quality gate judging outputs, a language model scored against a test set — each is measured on a finite number of cases, and each can look excellent by chance alone. The difference is that here the number of attempts is far larger: you change the prompt, change the threshold, run it again. With enough attempts you will always find a configuration that looks like it works.",
      },
      {
        ar: "وأخطر أشكال هذا الفشل ليس أن يخطئ الفحص، بل أن يكون الفحص أعمى ويقول «نجح» على كل شيء. والفحص الذي يُمرّر كل ما يُعرض عليه لا يُميَّز عن فحص يعمل، ما دمت تُريه أعمالاً جيدة فقط. الطريقة الوحيدة لكشفه أن تسأله سؤالاً تعرف إجابته سلفاً: أعطه مادة لا يوجد فيها ما يُكتشف. في دراستنا على سوق الكريبتو لا يُقرأ ناتج نموذج تصنيف قبل أن يُشغَّل النموذج نفسه على تسميات مُبعثَرة عشوائياً؛ فإن وجد «ميزة» في العشوائي، فالمسار معطوب ولا معنى لأي رقم خرج منه.",
        en: "The most dangerous form of this failure is not a check that gets it wrong; it is a blind check that says PASS to everything. A check that passes whatever you show it is indistinguishable from one that works, so long as you only ever show it good work. The only way to expose it is to ask it a question whose answer you already know: give it material with nothing in it to find. In our crypto study no classifier output is read until the model has first been run on randomly shuffled labels; if it finds an “edge” in the random, the pipeline is broken and no number that came out of it means anything.",
      },
      {
        ar: "## ثلاثة أشياء تجعل النتيجة قابلة للتصديق",
        en: "## Three things that make a result believable",
      },
      {
        ar: "الأول: اكتب ما تتوقّعه قبل أن تُشغّل، ومعه الشرط الذي يُبطله. بلا هذا، أي نتيجة تُفسَّر بعد ظهورها، ولا يوجد نتيجة لا يمكن تفسيرها. والفرضية تُسجَّل زوجاً متعارضاً كلما أمكن، لأن ذراعاً واحدة تبدو جيدة لا يمكن دحضها أصلاً.",
        en: "First: write down what you expect before you run, together with the condition that would refute it. Without that, any result gets interpreted after the fact, and there is no result that cannot be interpreted. Register the hypothesis as an opposed pair wherever you can, because a single arm that looks good cannot be falsified at all.",
      },
      {
        ar: "الثاني، وهو الأقل شيوعاً والأهم: شغّل النظام على ضجيج. اخلط التسميات، أو أعطه بيانات مبعثرة، وانظر ماذا يقول. مسارٌ يجد ميزة في الضجيج مسارٌ معطوب، ويجب أن يُكتشف قبل أن يكلّف مالاً لا بعده. الفحص الذي لا تعرف ما الذي يُفشِله ليس فحصاً — هو طقس.",
        en: "Second, the least common and most important: run the system on noise. Shuffle the labels, or feed it scrambled data, and see what it says. A pipeline that finds an edge in noise is broken, and that has to be discovered before it costs money rather than after. A check whose failure mode you do not know is not a check — it is a ritual.",
      },
      {
        ar: "الثالث: احجز عيّنة لا تلمسها. لا في التطوير، ولا في الضبط، ولا «نظرة سريعة». كل نظرة تُنفق منها، والعيّنة التي نُظر إليها مرّة صارت جزءاً من التطوير سواء اعترفت بذلك أو لا.",
        en: "Third: hold out a sample you do not touch. Not in development, not in tuning, not for “a quick look”. Every look spends it, and a sample that has been looked at once has become part of development whether or not you admit it.",
      },
      {
        ar: "لا شيء في هذه الثلاثة يجعل نظامك أفضل. كلها تجعل ادّعاءك عنه أصدق — وهذا في النهاية هو الفرق الوحيد بين نظام يعمل ونظام يبدو أنه يعمل.",
        en: "None of these three makes your system better. They make your claim about it truer — which is, in the end, the only difference between a system that works and a system that looks like it works.",
      },
    ],
  },
];

export const pieceBySlug = (slug: string) => writing.find((p) => p.slug === slug);
