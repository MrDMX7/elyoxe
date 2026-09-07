"use client";
import { useState } from "react";
import { useScrub } from "@/lib/useReveal";
import type { Lang } from "@/content/i18n";
import { copy } from "@/content/copy";

/* InvoiceReady: a UBL invoice being checked in the browser. Scroll runs the 24
   checks; the document is never uploaded, which is the point of the product. */
const DOC = [
  ["<Invoice xmlns:cbc=", "…"], ["  <cbc:ID>", "INV-2026-0142"], ["  <cbc:IssueDate>", "2026-09-07"],
  ["  <cbc:InvoiceTypeCode>", "380"], ["  <cbc:DocumentCurrencyCode>", "AED"],
  ["  <cac:AccountingSupplierParty>", ""], ["    <cbc:CompanyID>", "100••••••••003"],
  ["  <cac:AccountingCustomerParty>", ""], ["    <cbc:CompanyID>", "100••••••••871"],
  ["  <cac:TaxTotal>", ""], ["    <cbc:TaxAmount currencyID=\"AED\">", "1,250.00"],
  ["  <cac:LegalMonetaryTotal>", ""], ["    <cbc:PayableAmount currencyID=\"AED\">", "26,250.00"],
];
export default function Validator({ lang }: { lang: Lang }) {
  const [p, setP] = useState(0);
  const ref = useScrub<HTMLDivElement>(setP);
  const on = Math.round(p * 24);
  const hl = Math.round(p * DOC.length);
  return (
    <div className="validator" ref={ref} role="img" aria-label={`24 ${copy.work.checks[lang]}`}>
      <pre className="doc" aria-hidden="true">
        {DOC.map(([k, v], i) => (
          <div key={i}>{i < hl ? <b>{k}</b> : k}{v && (i < hl ? <i>{v}</i> : v)}</div>
        ))}
      </pre>
      <div className="checks">
        <span className="eyebrow">{lang === "ar" ? "الفحوص داخل المتصفح" : "Checks, in the browser"}</span>
        <div className="grid" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => <span key={i} className={`check${i < on ? " is-on" : ""}`} />)}
        </div>
        <p className="count">{on}<span className="muted">/24</span> <small>{copy.work.checks[lang]}</small></p>
      </div>
    </div>
  );
}
