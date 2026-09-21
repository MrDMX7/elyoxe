# RECIPES — الويب: «أبغى هذا، وش أستعمل؟»

خريطة **نيّة → أداة → نمط شغّال** لمشاريع الويب. المقابل لها في المحرّك: `studio/Remotion_Studio/RECIPES.md`.

**الأساس هنا:** Next 15.3 · React 19.2 · fiber v9 · three 0.176 · GSAP · Lenis.

---

## 🇦🇪 صحّة RTL — مفروضة آلياً الآن

```bash
npm run lint:rtl
```
يرفض أي خاصية فيزيائية تكسر العربية. **أُضيف 2026-09-21، وأول تشغيل وجد 29 مشكلة قائمة** في CSS الموقع.

| ممنوع | الصحيح |
|---|---|
| `margin-left` · `padding-right` | `margin-inline-start` · `padding-inline-end` |
| `text-align: left` / `right` | `text-align: start` / `end` |
| `left` · `right` · `top` (تموضع) | `inset-inline-start` · `inset-inline-end` · `inset-block-start` |
| `max-width` | `max-inline-size` |

**الإعداد مركّز عمداً** (`.stylelintrc.json`): قاعدة واحدة فقط. جرّبت `stylelint-config-standard` فأغرق النتيجة بضجيج تجميلي (حالة أحرف، صيغة `@import`) — وأداة تُغرقك لن تُستعمل. و`use-logical-units` (`vw→vi`) مُعطّلة لأن `vi = vw` في الكتابة الأفقية، فهي مبالغة هنا.

**والقاعدتان الثابتتان:** الأرقام غربية `0123456789` دائماً · العربية في الجذر `/` والإنجليزية في `/en/` (RTL مُشتقّة لا معكوسة).

## 🎨 R3F على الويب

`@react-three/drei` (كان ناقصاً — الموقع كان على fiber خام) و`@react-three/postprocessing`:

| أبغى | النمط |
|---|---|
| زجاج · بيئة · تحكّم بالتمرير | `<MeshTransmissionMaterial/>` · `<Environment preset="city"/>` · `<ScrollControls/>` |
| نص/HTML داخل المشهد | `<Html/>` — **وهذا هو المسار الصحيح للعربية في 3D** |
| توهّج · عمق ميدان · vignette | `<EffectComposer><Bloom/><DepthOfField/><Vignette/></EffectComposer>` |
| تحميل مسبق وتفادي الوميض | `<Preload all/>` + `<Suspense/>` |

**الميزانية على Iris Xe:** ابدأ بـBloom وحده وقِس. كل تأثير إضافي يكلّف.

## 🎞️ Lottie على الويب — بلا أدوبي

`@lottiefiles/dotlottie-react` يشغّل أي Lottie:

```tsx
<DotLottieReact src="/anim.lottie" autoplay loop />
```

**ومصدر الـLottie صار كوداً لا واجهة.** Bodymovin (مصدّر AE) **غير منصَّب ولا ينبني**: مصدره React 15 وwebpack 1 من 2017 ويسقط على Node 24، والنسخة الجاهزة `.zxp` خلف تسجيل دخول أدوبي. البديل المعتمد **`lottie` لبايثون** (`pip install lottie`، 0.7.2):

```python
from lottie.parsers.svg import parse_svg_file
from lottie.exporters.core import export_lottie
anim = parse_svg_file("mark.svg"); anim.frame_rate = 30; anim.out_point = 60
export_lottie(anim, "mark.lottie.json")
```

**مُختبَر من طرف لطرف 2026-09-21:** شعار Elyoxe SVG → Lottie 2 كيلوبايت → شُغّل في `lottie-web` نفسه (المحرّك الذي يلفّه المكوّن أعلاه): `loaded=yes frames=60 svg=yes paths=2`، والحرفان ظهرا بلونيهما.

**الفرق عن Bodymovin مهم:** Bodymovin يصدّر ما رسمته بيدك في AE. هذا **يولّد من كود** — أي قابل للأتمتة كاملةً، وهذا ما نريده. لو احتجت تصدير تركيبة AE موجودة فعلاً، عندها فقط ثبّت Bodymovin يدوياً من aescripts.

## 🌀 الحركة — أيّهما متى

| الحالة | الأداة |
|---|---|
| خط زمني، ScrollTrigger، تقسيم نص | **GSAP** — مجاني بالكامل 2025، و`SplitText` يدعم الأحرف العربية المتصلة |
| حركات تخطيط، `AnimatePresence`، انتقال مشترك بين الصفحات | **`motion`** |
| تمرير ناعم | **Lenis** — اربطه بـ`ScrollTrigger.update` |
| مسارات SVG | `opentype.js` → مسارات، ثم `strokeDashoffset` |

**لا تقسّم العربية بـ`split("")`** — يفصل الأحرف المتصلة. استعمل `SplitText` أو تقسيم graphemes.

## ⚡ الأداء

| أداة | متى |
|---|---|
| **`@next/bundle-analyzer`** | `ANALYZE=true npm run build` — يكشف أن `three` كامل دخل الصفحة الرئيسية |
| **`react-scan`** | يُظهر بصرياً أي مكوّن يعيد الرندر بلا داعٍ (سبب سقوط الإطارات مع R3F+GSAP) |
| **`fontaine`** | يولّد مقاييس خط احتياطي فيقتل قفزة التخطيط عند تحميل الخط |
| `lighthouse` (عام) | القياس النهائي |

## ♿ الوصولية

`@axe-core/playwright` داخل `scripts/shots.mjs` الموجود:

```js
import AxeBuilder from "@axe-core/playwright";
const r = await new AxeBuilder({ page }).analyze();
if (r.violations.length) { /* أضفها إلى report.blocking */ }
```
Awwwards يقيّم الوصولية، وعملاء الحكومة يشترطونها.

## 🔮 الشيدرات

**`lygia`** — مئات دوال GLSL جاهزة (ضوضاء، ضباب، تدرّج لوني، SDF) تُستورد بـ`#include`. تكتب أثر الحبر أو الضباب بعشرة أسطر بدل مئة.

---

## الفخاخ

1. **`postbuild.mjs` كان يفشل على ويندوز فقط** — `p.includes("${out}/en/")` لا يطابق `out\en\...`، فكل صفحة إنجليزية تُقاس بقاعدة عربية والبناء يخرج `1`. **مُصلَح 2026-09-21** بـ`p.split(sep)`. الدرس: لا تقارن مسارات بفواصل مكتوبة يدوياً.

2. **React 19.3 خارج مدى fiber v9.7** (`>=19 <19.3`). الموقع كان على تركيبة غير مدعومة رسمياً. **مثبَّت على `~19.2`** 2026-09-21. لا تفكّه بـ`--legacy-peer-deps`.

3. **`npm` يحجب سكربتات التثبيت** — `skia-canvas` بلا ملفه المبني و`esbuild` بلا ثنائيته. `npm approve-scripts <pkg> && npm rebuild <pkg>` ثم **اختبرهما فعلياً** لا بالاستيراد وحده.

4. **العربية في 3D تنكسر** — استعمل `<Html/>` من drei أو طبقة DOM فوق الكانفس.

5. **`critique` في CI كانت تفشل منذ 2026-09-17 بذنب الأصل لا الموقع.** الوظيفة تخدم الـexport من `localhost:8080`، وواجهة ديمو موظف الردّ تسمح بـ`https://elyoxe.com` وحدها، فالمتصفّح يحجب الطلب والصفحة تُبلّغ بأمانة و`shots.mjs` يعدّها عطلاً حاجباً. **النتيجة: أربعة أيام بلا لقطات ولا Lighthouse.** الحلّ في `scripts/shots.mjs`: تُصنَّف الأعطال **بالأصل** — ما يأتي من خارج أصل الموقع يُسجَّل ويُطبع ولا يحجب، وما يخدمه الموقع نفسه يبقى حاجباً. **لا تفتح CORS للـlocalhost على واجهة إنتاج** لتريح اختباراً.

---

## فحص صحّة

```bash
npm run typecheck && npm run lint:rtl && npm run build
```
البناء يخرج **0** ويطبع `postbuild: N pages, M in sitemap`. أي غير ذلك = شي انكسر.
