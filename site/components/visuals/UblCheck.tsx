"use client";
import { useRef, useState } from "react";
import type { Lang } from "@/content/i18n";
import { SAMPLE_VALID, SAMPLE_BROKEN } from "@/content/ubl-samples";
// @ts-expect-error — plain .mjs, copied verbatim from business/ubl (see its header)
import { checkXml } from "@/lib/ubl/validate.mjs";

/* The invoice checker, running on the visitor's own file.
 *
 * The scroll piece above this one depicts twenty-four checks passing. This is
 * the twenty-four checks. Same rule code as the CLI that gates a real invoice
 * before `bill` sends it — copied, not reimplemented, with `npm run check:ubl`
 * failing the day the two drift.
 *
 * Everything happens in the tab: FileReader for the drop, the bundled samples
 * for the buttons, no fetch anywhere in this file. That is the product's whole
 * claim about handling other people's invoices, so the page counts the network
 * requests the check makes and prints the number rather than asserting it.
 */

type Item = { key: string; sev: string; pass?: boolean; detail?: string; ar: string; en: string };
type Result = {
  ok: boolean;
  file: string;
  errors: Item[];
  warnings: Item[];
  checks: Item[];
  invoice: null | {
    number: string; date: string; currency: string; isCredit: boolean;
    supplier: { name: string; trn: string }; customer: { name: string; trn: string };
    lineCount: number; net: number; vat: number; gross: number; payable: number;
  };
  ms: number;
  requests: number;
};

const MAX_BYTES = 2 * 1024 * 1024;

const T = {
  title: { ar: "افحص فاتورتك", en: "Check your own invoice" },
  lead: {
    ar: "اسحب فاتورة XML هنا، أو جرّب واحدة من العيّنتين. الفحص كله في تبويبك — ما يُرفع الملف ولا يُقرأ عندنا.",
    en: "Drop a UBL XML here, or try one of the two samples. The whole check runs in your tab — the file is never uploaded and we never see it.",
  },
  drop: { ar: "اسحب الملف هنا أو اختره", en: "Drop the file here, or choose it" },
  valid: { ar: "عيّنة سليمة", en: "Valid sample" },
  broken: { ar: "عيّنة فيها أخطاء", en: "Broken sample" },
  again: { ar: "افحص ملفاً آخر", en: "Check another file" },
  passed: { ar: "صالحة", en: "Valid" },
  failed: { ar: "راسبة", en: "Failed" },
  /* Arabic counts 3-10 take the plural and 11+ return to the singular, so a
     bare "4 خطأ" reads wrong to the people this page is written for. */
  errors: { ar: "خطأ", en: "errors" },
  warnings: { ar: "تنبيه", en: "warnings" },
  checksRan: { ar: "فحصاً", en: "checks" },
  ms: { ar: "مللي ثانية", en: "ms" },
  requests: { ar: "طلب شبكة أثناء الفحص", en: "network requests during the check" },
  tooBig: { ar: "الملف أكبر من 2 ميجابايت — هذا ليس فاتورة.", en: "Larger than 2 MB — that is not an invoice." },
  notXml: { ar: "الملف ليس فاتورة UBL صالحة.", en: "Not a valid UBL invoice." },
  fields: { ar: "الفحوص", en: "Checks" },
  read: { ar: "ما قُرئ من الفاتورة", en: "Read from the invoice" },
  number: { ar: "رقم الفاتورة", en: "Invoice number" },
  date: { ar: "التاريخ", en: "Date" },
  seller: { ar: "البائع", en: "Seller" },
  buyer: { ar: "المشتري", en: "Buyer" },
  lines: { ar: "البنود", en: "Lines" },
  net: { ar: "الصافي", en: "Net" },
  vat: { ar: "الضريبة", en: "VAT" },
  payable: { ar: "المستحق", en: "Payable" },
  noTrn: { ar: "بلا رقم ضريبي", en: "no TRN" },
  warn: { ar: "تنبيه", en: "warning" },
  bad: { ar: "خطأ", en: "error" },
  aria: {
    ar: "فاحص فواتير UBL: اختر ملفاً أو عيّنة، وتمرّ عليه أربعة وعشرون فحصاً داخل المتصفّح، وتظهر نتيجة كل فحص مع ما قُرئ من الفاتورة.",
    en: "A UBL invoice checker: choose a file or a sample and twenty-four checks run in the browser, showing each result and what was read from the invoice.",
  },
} as const;

/* Count what the check itself puts on the wire. The answer is zero and the
   point is that it is measured: PerformanceObserver sees every fetch, XHR,
   image and beacon the tab makes in the window it is watching. */
function runCheck(xml: string, filename: string): Result {
  let requests = 0;
  let observer: PerformanceObserver | null = null;
  try {
    observer = new PerformanceObserver((list) => { requests += list.getEntries().length; });
    observer.observe({ type: "resource", buffered: false });
  } catch { observer = null; }

  const started = performance.now();
  const result = checkXml(xml, filename) as Omit<Result, "ms" | "requests">;
  const ms = performance.now() - started;

  if (observer) {
    requests += observer.takeRecords().length;
    observer.disconnect();
  }
  return { ...result, ms, requests };
}

const countWord = (n: number, lang: Lang, kind: "err" | "warn") => {
  if (lang === "en") return kind === "err" ? (n === 1 ? "error" : "errors") : (n === 1 ? "warning" : "warnings");
  if (n === 1) return kind === "err" ? "خطأ" : "تنبيه";
  if (n === 2) return kind === "err" ? "خطآن" : "تنبيهان";
  if (n <= 10) return kind === "err" ? "أخطاء" : "تنبيهات";
  return kind === "err" ? "خطأ" : "تنبيهاً";
};

/* IBM Plex Mono has no Arabic: a company name set in it comes back with its
   letters pulled apart. Digits and identifiers get mono, Arabic text does not. */
const ARABIC = /[\u0600-\u06FF]/;
const numeric = (v: string) => (ARABIC.test(v) ? "" : " mono");

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function UblCheck({ lang }: { lang: Lang }) {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function check(xml: string, filename: string) {
    setError(null);
    const r = runCheck(xml, filename);
    setResult(r);
  }

  function take(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_BYTES) { setResult(null); setError(T.tooBig[lang]); return; }
    const reader = new FileReader();
    reader.onload = () => check(String(reader.result || ""), file.name);
    reader.onerror = () => setError(T.notXml[lang]);
    reader.readAsText(file);          // local read — no request leaves the tab
  }

  const inv = result?.invoice;

  return (
    <div className="ubl" role="group" aria-label={T.aria[lang]}>
      <div className="ubl-head">
        <h3 className="ubl-title h3">{T.title[lang]}</h3>
        <p className="ubl-lead">{T.lead[lang]}</p>
      </div>

      <div
        className={`ubl-drop${over ? " is-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files[0]); }}
      >
        <button type="button" className="ubl-pick" onClick={() => input.current?.click()}>
          {T.drop[lang]}
        </button>
        <input
          ref={input} type="file" accept=".xml,text/xml,application/xml" hidden
          onChange={(e) => take(e.target.files?.[0])}
        />
        <span className="ubl-or" aria-hidden="true">·</span>
        <button type="button" className="ubl-sample" onClick={() => check(SAMPLE_VALID, "sample-valid.xml")}>
          {T.valid[lang]}
        </button>
        <button type="button" className="ubl-sample" onClick={() => check(SAMPLE_BROKEN, "sample-broken.xml")}>
          {T.broken[lang]}
        </button>
      </div>

      {error && <p className="ubl-error">{error}</p>}

      {result && (
        <div className="ubl-result">
          <div className="ubl-verdict">
            <p className={`ubl-mark${result.ok ? " is-ok" : ""}`}>
              <span className="ubl-dot" aria-hidden="true" />
              {result.ok ? T.passed[lang] : T.failed[lang]}
            </p>
            <p className="ubl-counts">
              <span className="mono">{result.file}</span>
              {!result.ok && <span><span className="mono">{result.errors.length}</span> {countWord(result.errors.length, lang, "err")}</span>}
              {result.warnings.length > 0 && (
                <span className="is-warn"><span className="mono">{result.warnings.length}</span> {countWord(result.warnings.length, lang, "warn")}</span>
              )}
            </p>
          </div>

          <p className="ubl-meta">
            <span><span className="mono">{result.checks.length}</span> {T.checksRan[lang]}</span>
            <span><span className="mono">{result.ms < 1 ? "<1" : Math.round(result.ms)}</span> {T.ms[lang]}</span>
            <span><span className="mono">{result.requests}</span> {T.requests[lang]}</span>
          </p>

          {inv && (
            <dl className="ubl-read">
              <div><dt>{T.number[lang]}</dt><dd className="mono">{inv.number || "—"}</dd></div>
              <div><dt>{T.date[lang]}</dt><dd className="mono">{inv.date || "—"}</dd></div>
              <div><dt>{T.seller[lang]}</dt><dd>{inv.supplier.name || "—"} <span className={numeric(inv.supplier.trn || T.noTrn[lang]).trim() || undefined}>{inv.supplier.trn || T.noTrn[lang]}</span></dd></div>
              <div><dt>{T.buyer[lang]}</dt><dd>{inv.customer.name || "—"} <span className={numeric(inv.customer.trn || T.noTrn[lang]).trim() || undefined}>{inv.customer.trn || T.noTrn[lang]}</span></dd></div>
              <div><dt>{T.lines[lang]}</dt><dd className="mono">{inv.lineCount}</dd></div>
              <div><dt>{T.net[lang]}</dt><dd className="mono">{fmt(inv.net)} {inv.currency}</dd></div>
              <div><dt>{T.vat[lang]}</dt><dd className="mono">{fmt(inv.vat)} {inv.currency}</dd></div>
              <div><dt>{T.payable[lang]}</dt><dd className="mono">{fmt(inv.payable)} {inv.currency}</dd></div>
            </dl>
          )}

          <ul className="ubl-checks">
            {result.checks.map((c) => (
              <li key={c.key} className={c.pass ? "is-pass" : c.sev === "bad" ? "is-bad" : "is-warn"}>
                <span className="ubl-glyph mono" aria-hidden="true">{c.pass ? "✓" : c.sev === "bad" ? "✗" : "!"}</span>
                <span className="ubl-name">{c[lang]}</span>
                {c.detail && <span className={`ubl-detail${numeric(c.detail)}`}>{c.detail}</span>}
                {!c.pass && <span className="ubl-sev">{c.sev === "bad" ? T.bad[lang] : T.warn[lang]}</span>}
              </li>
            ))}
          </ul>

          <button type="button" className="ubl-again" onClick={() => { setResult(null); setError(null); }}>
            {T.again[lang]}
          </button>
        </div>
      )}
    </div>
  );
}
