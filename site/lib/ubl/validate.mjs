/* validate.mjs — the UBL / PINT-AE checker, running in the visitor's browser.
 *
 * COPY, NOT A FORK. Byte-for-byte the rule code of
 * `~/workspace/business/ubl/validate.mjs`, minus its Node surface: the
 * `node:fs` import, `checkFile()` and the CLI at the bottom. Nothing else is
 * changed, and `npm run check:ubl` fails if this drifts from that file (it is
 * skipped when the workspace checkout is not beside this repo, e.g. on CI).
 *
 * Which means the checker on this page and the checker that gates a real
 * invoice in `bill` are the same checker — the claim the page makes.
 *
 * The parser underneath is `xmldom.mjs`, also copied verbatim. It is used here
 * instead of the browser's own DOMParser on purpose: the rules key on
 * `localName`, element-only `children` and document-order
 * `getElementsByTagName("*")`, and a second parser is a second behaviour.
 */
/* validate.mjs — the UBL / PINT-AE checker, as a standalone Node module.
 *
 *   node validate.mjs invoice.xml            → JSON {ok, errors[], warnings[], checks[]}
 *   node validate.mjs invoice.xml --quiet    → exit code only
 *   cat invoice.xml | node validate.mjs -    → read stdin
 *
 * exit 0 = ok (no "bad" finding) · 1 = failed · 2 = usage / unreadable file
 *
 * PROVENANCE — read before editing.
 * `parseInvoice`, `validate` and `fieldChecks` below are lifted, near-verbatim,
 * from the browser code in `web/invoiceready/site-mirror/incoming-invoices.html`
 * (validate() ~line 1003, fieldChecks() ~line 1457). That folder is source and
 * output at once and must not be touched; this module is the extraction decided
 * in `business/research/07-pipelines.md` §4. The bilingual strings come from the
 * same file's I18N table so the two never drift. If a rule changes there, change
 * it here in the same commit — and vice versa.
 *
 * Warnings never fail. A missing buyer TRN or a missing PINT CustomizationID is
 * a warning by design; treating warnings as failures would push `bill` to weaken
 * the gate, which is the one thing the gate exists to prevent.
 */

import { parseDocument } from "./xmldom.mjs";

/* ═══════════ messages — both dictionaries, verbatim from I18N ═══════════ */

export const MESSAGES = {
  ar: {
    parse: "الملف ليس فاتورة UBL صالحة",
    f_noTRN: "الرقم الضريبي للمورّد غير موجود",
    f_badTRN: "الرقم الضريبي للمورّد ليس 15 رقماً",
    f_noBuyerTRN: "الرقم الضريبي للمشتري غير موجود",
    f_noDate: "تاريخ الإصدار غير موجود",
    f_noCurr: "عملة الفاتورة غير محددة",
    f_noLines: "الفاتورة بلا بنود",
    f_mathLines: "مجموع البنود لا يطابق الصافي المعلن",
    f_mathTax: "الصافي + الضريبة لا يساوي الإجمالي",
    f_noPint: "لا تشير إلى صيغة PINT AE",
    f_noPay: "المبلغ المستحق غير محدد",
    fc_root: "نوع المستند Invoice أو CreditNote",
    fc_cust: "معرّف التخصيص CustomizationID (PINT AE)",
    fc_prof: "معرّف الملف التعريفي ProfileID",
    fc_id: "رقم الفاتورة",
    fc_date: "تاريخ الإصدار",
    fc_type: "رمز نوع الفاتورة",
    fc_curr: "عملة الفاتورة",
    fc_sup: "بيانات البائع",
    fc_supName: "اسم البائع القانوني",
    fc_supTRN: "الرقم الضريبي للبائع",
    fc_supTRN15: "صيغة الرقم الضريبي: 15 رقماً",
    fc_supAddr: "عنوان البائع مع رمز الدولة",
    fc_cus: "بيانات المشتري",
    fc_cusName: "اسم المشتري",
    fc_tax: "إجمالي الضريبة TaxTotal",
    fc_taxSub: "تفصيل الضريبة TaxSubtotal",
    fc_lmt: "المجاميع القانونية",
    fc_payable: "المبلغ المستحق",
    fc_lines: "عدد بنود الفاتورة",
    fc_lineId: "كل بند له معرّف وكمية ومبلغ",
    fc_lineItem: "اسم الصنف بكل بند",
    fc_linePrice: "سعر الوحدة بكل بند",
    fc_mathLines: "مجموع البنود = المجموع المعلن",
    fc_mathTax: "الصافي + الضريبة = الإجمالي"
  },
  en: {
    parse: "Not a valid UBL invoice",
    f_noTRN: "Supplier tax registration number is missing",
    f_badTRN: "Supplier tax registration number is not 15 digits",
    f_noBuyerTRN: "Buyer tax registration number is missing",
    f_noDate: "Issue date is missing",
    f_noCurr: "Invoice currency is not specified",
    f_noLines: "Invoice has no line items",
    f_mathLines: "Sum of line items does not match the declared net",
    f_mathTax: "Net + tax does not equal the total",
    f_noPint: "Does not reference the PINT AE format",
    f_noPay: "Payable amount is not specified",
    fc_root: "Document type is Invoice or CreditNote",
    fc_cust: "CustomizationID (PINT AE)",
    fc_prof: "ProfileID present",
    fc_id: "Invoice number",
    fc_date: "Issue date",
    fc_type: "Invoice type code",
    fc_curr: "Document currency",
    fc_sup: "Seller party",
    fc_supName: "Seller legal name",
    fc_supTRN: "Seller TRN",
    fc_supTRN15: "TRN format: 15 digits",
    fc_supAddr: "Seller address with country code",
    fc_cus: "Buyer party",
    fc_cusName: "Buyer name",
    fc_tax: "TaxTotal present",
    fc_taxSub: "TaxSubtotal breakdown",
    fc_lmt: "LegalMonetaryTotal",
    fc_payable: "Payable amount",
    fc_lines: "Invoice line count",
    fc_lineId: "Each line has ID, quantity, amount",
    fc_lineItem: "Item name on each line",
    fc_linePrice: "Unit price on each line",
    fc_mathLines: "Sum of lines = declared total",
    fc_mathTax: "Net + tax = gross"
  }
};

const label = (key) => ({ ar: MESSAGES.ar[key] || key, en: MESSAGES.en[key] || key });

/* ═══════════ UBL / PINT AE parser (extracted) ═══════════ */

function kids(el, name) {
  const r = [];
  if (!el) return r;
  for (const c of el.children) if (c.localName === name) r.push(c);
  return r;
}
function path(el, names) {
  let cur = el;
  for (const n of names) { cur = kids(cur, n)[0]; if (!cur) return null; }
  return cur;
}
function txt(el) { return el ? el.textContent.trim() : ""; }
function pathTxt(el, names) { return txt(path(el, names)); }
function all(root, name) {
  return [...root.getElementsByTagName("*")].filter((e) => e.localName === name);
}
function num(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }

export function parseInvoice(xmlText, filename) {
  const doc = parseDocument(xmlText);
  if (!doc) return null;
  const root = doc.documentElement;
  if (!root || !/^(Invoice|CreditNote)$/.test(root.localName)) return null;

  const isCredit = root.localName === "CreditNote";
  const sup = kids(root, "AccountingSupplierParty")[0];
  const cus = kids(root, "AccountingCustomerParty")[0];
  const lmt = kids(root, "LegalMonetaryTotal")[0] || kids(root, "RequestedMonetaryTotal")[0];
  const taxTotal = kids(root, "TaxTotal")[0];

  const party = (p) => {
    if (!p) return { name: "", trn: "", city: "", country: "" };
    const pt = kids(p, "Party")[0];
    return {
      name: pathTxt(pt, ["PartyLegalEntity", "RegistrationName"]) || pathTxt(pt, ["PartyName", "Name"]),
      trn: pathTxt(pt, ["PartyTaxScheme", "CompanyID"]) || pathTxt(pt, ["PartyIdentification", "ID"]),
      city: pathTxt(pt, ["PostalAddress", "CityName"]),
      country: pathTxt(pt, ["PostalAddress", "Country", "IdentificationCode"])
    };
  };

  const lineEls = kids(root, "InvoiceLine").concat(kids(root, "CreditNoteLine"));
  const lines = lineEls.map((l) => ({
    id: pathTxt(l, ["ID"]),
    name: pathTxt(l, ["Item", "Name"]),
    qty: txt(kids(l, "InvoicedQuantity")[0] || kids(l, "CreditedQuantity")[0]),
    unit: (kids(l, "InvoicedQuantity")[0] || kids(l, "CreditedQuantity")[0] || { getAttribute: () => "" })
      .getAttribute("unitCode") || "",
    price: num(pathTxt(l, ["Price", "PriceAmount"])),
    amount: num(pathTxt(l, ["LineExtensionAmount"])),
    taxPct: num(pathTxt(l, ["Item", "ClassifiedTaxCategory", "Percent"]))
  }));

  const subs = taxTotal ? kids(taxTotal, "TaxSubtotal").map((s) => ({
    taxable: num(pathTxt(s, ["TaxableAmount"])),
    tax: num(pathTxt(s, ["TaxAmount"])),
    pct: num(pathTxt(s, ["TaxCategory", "Percent"])),
    cat: pathTxt(s, ["TaxCategory", "ID"])
  })) : [];

  const supplier = party(sup), customer = party(cus);
  const inv = {
    file: filename,
    isCredit,
    customization: txt(all(root, "CustomizationID")[0]),
    number: pathTxt(root, ["ID"]),
    date: txt(all(root, "IssueDate")[0]),
    due: txt(all(root, "DueDate")[0]),
    currency: txt(all(root, "DocumentCurrencyCode")[0]),
    po: pathTxt(root, ["OrderReference", "ID"]),
    supplier, customer, lines, subs,
    lineExt: num(pathTxt(lmt, ["LineExtensionAmount"])),
    net: num(pathTxt(lmt, ["TaxExclusiveAmount"])),
    gross: num(pathTxt(lmt, ["TaxInclusiveAmount"])),
    payable: num(pathTxt(lmt, ["PayableAmount"])),
    vat: taxTotal ? num(pathTxt(taxTotal, ["TaxAmount"])) : 0,
    hasPayable: !!(lmt && kids(lmt, "PayableAmount").length)
  };
  inv.id = (supplier.trn || supplier.name || "?") + "|" + (inv.number || filename);
  inv.flags = validate(inv);
  inv.status = inv.flags.some((f) => f.sev === "bad") ? "bad"
    : inv.flags.length ? "warn" : "ok";
  return inv;
}

/* the ten summary flags — verbatim */
export function validate(inv) {
  const f = [];
  const add = (key, sev) => f.push({ key, sev });
  if (!inv.supplier.trn) add("f_noTRN", "bad");
  else if (!/^\d{15}$/.test(inv.supplier.trn)) add("f_badTRN", "warn");
  if (!inv.customer.trn) add("f_noBuyerTRN", "warn");
  if (!inv.date) add("f_noDate", "bad");
  if (!inv.currency) add("f_noCurr", "warn");
  if (!inv.lines.length) add("f_noLines", "bad");
  if (!inv.hasPayable) add("f_noPay", "bad");
  if (!/pint/i.test(inv.customization || "")) add("f_noPint", "warn");
  if (inv.lines.length && inv.lineExt) {
    const sum = inv.lines.reduce((s, l) => s + l.amount, 0);
    if (Math.abs(sum - inv.lineExt) > 0.02) add("f_mathLines", "bad");
  }
  if (inv.net && inv.gross) {
    if (Math.abs(inv.net + inv.vat - inv.gross) > 0.02) add("f_mathTax", "bad");
  }
  return f;
}

/* field-by-field schema check — verbatim */
export function fieldChecks(xmlText) {
  const doc = parseDocument(xmlText);
  if (!doc) return null;
  const root = doc.documentElement;
  if (!root) return null;
  const all = (n) => [...root.getElementsByTagName("*")].filter((e) => e.localName === n);
  const first = (n) => all(n)[0];
  const txt = (el) => (el ? el.textContent.trim() : "");
  const under = (el, path) => {
    let cur = [el];
    for (const p of path) {
      const next = [];
      for (const c of cur) for (const ch of c.children) if (ch.localName === p) next.push(ch);
      cur = next; if (!cur.length) return null;
    }
    return cur[0];
  };
  const sup = first("AccountingSupplierParty"), cus = first("AccountingCustomerParty");
  const lines = all("InvoiceLine").concat(all("CreditNoteLine"));
  const lmt = first("LegalMonetaryTotal"), taxT = all("TaxTotal");
  const supTRN = sup ? txt(under(sup, ["Party", "PartyTaxScheme", "CompanyID"])) : "";
  const num = (el) => parseFloat(txt(el)) || 0;
  const K = "fc_";
  const C = (key, sev, pass, detail) => ({ key: K + key, sev, pass, detail: detail || "" });

  const out = [
    C("root", "bad", root.localName === "Invoice" || root.localName === "CreditNote", root.localName),
    C("cust", "warn", !!first("CustomizationID"), txt(first("CustomizationID"))),
    C("prof", "warn", !!first("ProfileID"), txt(first("ProfileID"))),
    C("id", "bad", !!txt(under(root, ["ID"])), txt(under(root, ["ID"]))),
    C("date", "bad", !!first("IssueDate"), txt(first("IssueDate"))),
    C("type", "bad", !!(first("InvoiceTypeCode") || first("CreditNoteTypeCode"))),
    C("curr", "bad", !!first("DocumentCurrencyCode"), txt(first("DocumentCurrencyCode"))),
    C("sup", "bad", !!sup),
    C("supName", "bad", !!(sup && (txt(under(sup, ["Party", "PartyLegalEntity", "RegistrationName"])) || txt(under(sup, ["Party", "PartyName", "Name"])))),
      sup ? (txt(under(sup, ["Party", "PartyLegalEntity", "RegistrationName"])) || txt(under(sup, ["Party", "PartyName", "Name"]))) : ""),
    C("supTRN", "bad", !!supTRN, supTRN),
    C("supTRN15", "warn", !supTRN || /^\d{15}$/.test(supTRN), supTRN),
    C("supAddr", "warn", !!(sup && txt(under(sup, ["Party", "PostalAddress", "Country", "IdentificationCode"]))),
      sup ? txt(under(sup, ["Party", "PostalAddress", "Country", "IdentificationCode"])) : ""),
    C("cus", "bad", !!cus),
    C("cusName", "bad", !!(cus && (txt(under(cus, ["Party", "PartyLegalEntity", "RegistrationName"])) || txt(under(cus, ["Party", "PartyName", "Name"])))),
      cus ? (txt(under(cus, ["Party", "PartyLegalEntity", "RegistrationName"])) || txt(under(cus, ["Party", "PartyName", "Name"]))) : ""),
    C("tax", "bad", !!taxT.length),
    C("taxSub", "warn", !!(taxT.length && [...taxT[0].getElementsByTagName("*")].some((e) => e.localName === "TaxSubtotal"))),
    C("lmt", "bad", !!lmt),
    C("payable", "bad", !!(lmt && [...lmt.getElementsByTagName("*")].some((e) => e.localName === "PayableAmount")),
      lmt ? txt([...lmt.getElementsByTagName("*")].find((e) => e.localName === "PayableAmount")) : ""),
    C("lines", "bad", lines.length > 0, String(lines.length))
  ];

  if (lines.length) {
    const l0 = lines[0];
    out.push(
      C("lineId", "warn", !!(txt(under(l0, ["ID"])) &&
        [...l0.getElementsByTagName("*")].some((e) => e.localName === "InvoicedQuantity" || e.localName === "CreditedQuantity") &&
        [...l0.getElementsByTagName("*")].some((e) => e.localName === "LineExtensionAmount"))),
      C("lineItem", "warn", !!under(l0, ["Item", "Name"]), txt(under(l0, ["Item", "Name"]))),
      C("linePrice", "warn", !!under(l0, ["Price", "PriceAmount"]), txt(under(l0, ["Price", "PriceAmount"])))
    );
    if (lmt) {
      const lmtLine = [...lmt.getElementsByTagName("*")].find((e) => e.localName === "LineExtensionAmount");
      if (lmtLine) {
        const sum = lines.reduce((s, l) => {
          const a = [...l.getElementsByTagName("*")].find((e) => e.localName === "LineExtensionAmount");
          return s + (a ? parseFloat(a.textContent) || 0 : 0);
        }, 0);
        const dec = num(lmtLine);
        out.push(C("mathLines", "bad", Math.abs(sum - dec) < 0.02, sum.toFixed(2) + " / " + dec.toFixed(2)));
      }
      const ex = [...lmt.getElementsByTagName("*")].find((e) => e.localName === "TaxExclusiveAmount");
      const inc = [...lmt.getElementsByTagName("*")].find((e) => e.localName === "TaxInclusiveAmount");
      if (ex && inc && taxT.length) {
        const t = [...taxT[0].children].find((e) => e.localName === "TaxAmount");
        const a = num(ex), b = t ? num(t) : 0, c = num(inc);
        out.push(C("mathTax", "bad", Math.abs(a + b - c) < 0.02, a.toFixed(2) + " + " + b.toFixed(2) + " / " + c.toFixed(2)));
      }
    }
  }
  return out;
}

/* ═══════════ the module's own contract ═══════════ */

/**
 * checkXml(xmlText, filename) → {ok, errors[], warnings[], checks[], invoice}
 * `ok` is true when nothing with sev "bad" was found. Warnings never block.
 */
export function checkXml(xmlText, filename = "invoice.xml") {
  const inv = parseInvoice(xmlText, filename);
  if (!inv) {
    return {
      ok: false,
      file: filename,
      errors: [{ key: "parse", sev: "bad", ...label("parse") }],
      warnings: [],
      checks: [],
      invoice: null
    };
  }
  const checks = fieldChecks(xmlText) || [];

  const errors = [], warnings = [];
  for (const f of inv.flags) {
    (f.sev === "bad" ? errors : warnings).push({ key: f.key, sev: f.sev, source: "flags", ...label(f.key) });
  }
  for (const c of checks) {
    if (c.pass) continue;
    const item = { key: c.key, sev: c.sev, source: "fields", detail: c.detail, ...label(c.key) };
    (c.sev === "bad" ? errors : warnings).push(item);
  }

  return {
    ok: errors.length === 0,
    file: filename,
    errors,
    warnings,
    checks: checks.map((c) => ({ key: c.key, sev: c.sev, pass: c.pass, detail: c.detail, ...label(c.key) })),
    invoice: {
      number: inv.number, date: inv.date, due: inv.due, currency: inv.currency,
      isCredit: inv.isCredit, customization: inv.customization,
      supplier: inv.supplier, customer: inv.customer,
      lineCount: inv.lines.length,
      net: inv.net, vat: inv.vat, gross: inv.gross, payable: inv.payable,
      status: inv.status
    }
  };
}

