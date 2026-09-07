"use client";
import { useRef, useState, type CSSProperties } from "react";
import { useScrub } from "@/lib/useReveal";
import type { Lang } from "@/content/i18n";
import { copy } from "@/content/copy";

/* InvoiceReady — a UBL invoice being validated inside the browser.
 *
 * Scroll drives one number, p (0..1). A scan head crosses the document; as it
 * clears each region, the checks that read that region pass, in the order a
 * real validator runs them: structure → identifiers → tax arithmetic → totals.
 * The request log beside it stays at zero the whole way, because the document
 * is never uploaded — which is the product.
 *
 * p is written straight onto the root node as a CSS custom property, so the
 * scan, the clip and all 24 fills are pure CSS and cost no React work. Only the
 * integer readouts are state, and they change 24 times across the whole scroll.
 */

/* Strings that are not in copy.ts. Hard-coded here per the brief. */
const T = {
  file: "invoice.xml",
  profile: "UBL 2.1",
  standard: "EN 16931",
  report: { ar: "التحقّق", en: "Validation" },
  valid: { ar: "صالحة", en: "valid" },
  network: { ar: "الشبكة", en: "Network" },
  requests: { ar: "طلبات شبكة", en: "network requests" },
  never: {
    ar: "المستند لم يغادر هذا التبويب.",
    en: "The document never left this tab.",
  },
  aria: {
    ar: "فاحص فواتير UBL يعمل داخل المتصفّح: أربعة وعشرون فحصاً تمرّ على الفاتورة بالترتيب — البنية، ثم المعرّفات، ثم حساب الضريبة، ثم الإجماليات. المستند لا يُرفع، وعدّاد طلبات الشبكة يبقى على صفر.",
    en: "A UBL invoice validated inside the browser: twenty-four checks pass over the invoice in order — structure, then identifiers, then tax arithmetic, then totals. The document is never uploaded, and the network request counter stays at zero.",
  },
} as const;

/* The document: an excerpt of a UBL 2.1 invoice, left-to-right in both
   languages. The arithmetic is real — 25,000.00 at 5% is 1,250.00, which makes
   26,250.00 — and both TRNs keep their published 15-digit shape, masked.
   No line exceeds 41 columns, so the pane clips almost nothing. */
type Line = { d: number; k: string; v?: string };
const DOC: Line[] = [
  { d: 0, k: '<?xml version="1.0"?>' },
  { d: 0, k: "<Invoice>" },
  { d: 1, k: "<cbc:CustomizationID>" },
  { d: 3, k: "urn:peppol:pint:billing-1@ae" },
  { d: 1, k: "<cbc:ID>", v: "INV-2026-0142" },
  { d: 1, k: "<cbc:IssueDate>", v: "2026-09-07" },
  { d: 1, k: "<cbc:InvoiceTypeCode>", v: "380" },
  { d: 1, k: "<cbc:DocumentCurrencyCode>", v: "AED" },
  { d: 1, k: "<cac:AccountingSupplierParty>" },
  { d: 2, k: "<cbc:CompanyID>", v: "100••••••••0003" },
  { d: 1, k: "<cac:AccountingCustomerParty>" },
  { d: 2, k: "<cbc:CompanyID>", v: "100••••••••0871" },
  { d: 1, k: "<cac:TaxTotal>" },
  { d: 2, k: "<cbc:TaxAmount>", v: "1250.00" },
  { d: 2, k: "<cac:TaxSubtotal>" },
  { d: 3, k: "<cbc:TaxableAmount>", v: "25000.00" },
  { d: 3, k: "<cbc:Percent>", v: "5.00" },
  { d: 3, k: "<cbc:ID>", v: "S" },
  { d: 1, k: "<cac:LegalMonetaryTotal>" },
  { d: 2, k: "<cbc:LineExtensionAmount>", v: "25000.00" },
  { d: 2, k: "<cbc:TaxExclusiveAmount>", v: "25000.00" },
  { d: 2, k: "<cbc:TaxInclusiveAmount>", v: "26250.00" },
  { d: 2, k: "<cbc:PayableAmount>", v: "26250.00" },
  { d: 0, k: "</Invoice>" },
];

/* Four groups of six, named for what they read, carrying the EN 16931 rule
   identifiers a UBL validator actually reports. `to` is the p at which a
   group's last check passes; each is timed so the scan head has just cleared
   that region of the document — lines 8, 12, 18 and 23 of 24. */
const GROUPS = [
  { name: { ar: "البنية", en: "Structure" }, from: 0.09, to: 0.327, ids: ["BR-01", "BR-02", "BR-03", "BR-04", "BR-05", "BR-06"] },
  { name: { ar: "المعرّفات", en: "Identifiers" }, from: 0.35, to: 0.46, ids: ["BR-07", "BR-08", "BR-09", "BR-CL-10", "BR-CL-14", "BR-CO-26"] },
  { name: { ar: "حساب الضريبة", en: "Tax arithmetic" }, from: 0.482, to: 0.66, ids: ["BR-S-01", "BR-S-05", "BR-S-06", "BR-S-08", "BR-S-09", "BR-CO-17"] },
  { name: { ar: "الإجماليات", en: "Totals" }, from: 0.682, to: 0.827, ids: ["BR-CO-10", "BR-CO-13", "BR-CO-14", "BR-CO-15", "BR-CO-16", "BR-DEC-14"] },
] as const;

const PER = 6;
/* The p at which each check completes; its bar fills over the ~0.018 before it. */
const AT: number[] = GROUPS.flatMap((g) => g.ids.map((_, i) => g.from + (g.to - g.from) * (i / (PER - 1))));
const TOTAL = AT.length;

function passedAt(p: number) {
  let n = 0;
  while (n < TOTAL && AT[n] <= p) n++;
  return n;
}

/* Both text layers render this exact array. They differ by opacity and by the
   clip above them, never by metrics, so they cannot drift a pixel apart. */
const lines = DOC.map((l, i) => (
  <span className="vld-line" key={i}>
    <span className="vld-ln">{String(i + 1).padStart(2, " ")}</span>
    <span className="vld-k">{` ${"  ".repeat(l.d)}${l.k}`}</span>
    {l.v ? <span className="vld-v">{` ${l.v}`}</span> : null}
  </span>
));

export default function Validator({ lang }: { lang: Lang }) {
  const [passed, setPassed] = useState(0);
  const seen = useRef(0);
  const ref = useScrub<HTMLDivElement>(
    (p) => {
      ref.current?.style.setProperty("--vld-p", p.toFixed(4));
      const n = passedAt(p);
      if (n !== seen.current) {
        seen.current = n;
        setPassed(n);
      }
    },
    { start: "top 92%", end: "bottom 45%" },
  );

  return (
    <div className="vld" ref={ref} role="img" aria-label={T.aria[lang]}>
      <div className="vld-pane" aria-hidden="true">
        <div className="vld-panehead">
          <span className="vld-file">{T.file}</span>
          <span className="vld-std">{T.profile}</span>
        </div>
        <div className="vld-lines">
          <span className="vld-layer vld-base">{lines}</span>
          <span className="vld-layer vld-lit">{lines}</span>
          <span className="vld-scan" />
          <span className="vld-fade" />
        </div>
      </div>

      <div className="vld-pane" aria-hidden="true">
        <div className="vld-panehead">
          <span className="vld-name">{T.report[lang]}</span>
          <span className="vld-std">{T.standard}</span>
        </div>

        <div className="vld-groups">
          {GROUPS.map((g, gi) => {
            const n = Math.min(PER, Math.max(0, passed - gi * PER));
            return (
              <div className="vld-g" key={g.name.en} style={{ "--gend": g.to } as CSSProperties}>
                <div className="vld-grow">
                  <span className="vld-gname">{g.name[lang]}</span>
                  <span className="vld-gid">{n ? g.ids[n - 1] : "—"}</span>
                  <span className="vld-gn" dir="ltr">{n}/{PER}</span>
                </div>
                <div className="vld-strip">
                  {g.ids.map((rule, i) => (
                    <span className="vld-cell" key={rule} style={{ "--at": AT[gi * PER + i] } as CSSProperties} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="vld-tally">
          <span className="vld-frac" dir="ltr">{passed}<span className="vld-den">/{TOTAL}</span></span>
          <span className="vld-cap">{copy.work.checks[lang]}</span>
          <span className="vld-lock" />
          <span className="vld-valid">
            <span>{T.valid[lang]}</span>
            <span className="vld-std">{T.profile}</span>
          </span>
        </div>

        <div className="vld-net">
          <b>{T.network[lang]}</b>
          <span><span className="vld-zero" dir="ltr">0</span>{T.requests[lang]}</span>
        </div>
        <p className="vld-never">{T.never[lang]}</p>
      </div>
    </div>
  );
}
