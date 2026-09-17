/* xmldom.mjs — a dependency-free, browser-shaped XML reader.
 *
 * Why this file exists: the UBL checks in `validate.mjs` are lifted verbatim from
 * the browser code in `web/invoiceready/site-mirror/incoming-invoices.html`, which
 * is a source-and-output folder that must not be touched. Those checks key on
 * `localName`, element-only `children`, `textContent`, `getAttribute` and
 * `getElementsByTagName("*")` in document order. Node has no DOMParser, so rather
 * than rewrite the checks (two implementations drift), we give them the four DOM
 * surfaces they actually use — and nothing else.
 *
 * The traps this parser is written against, all of them real in UAE UBL files:
 *   · every UBL tag is prefixed (`cbc:ID`, `cac:Party`) — `localName` MUST drop it
 *     or every check reads empty and the whole file reports FAIL
 *   · `children` must be elements only; `kids()` iterates it directly
 *   · company names carry entities (`&amp;`), and Arabic names carry no ASCII at all
 *   · `getElementsByTagName("*")` must be every descendant, in document order
 */

const ENTS = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

export function decodeEntities(s) {
  if (s.indexOf("&") < 0) return s;
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, body) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X"
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return body in ENTS ? ENTS[body] : m;
  });
}

class TextNode {
  constructor(value) { this.nodeType = 3; this.value = value; }
  get textContent() { return this.value; }
}

export class Element {
  constructor(tagName, attrs) {
    this.nodeType = 1;
    this.tagName = tagName;
    // the namespace prefix is dropped here, once, for the whole module
    const c = tagName.indexOf(":");
    this.localName = c < 0 ? tagName : tagName.slice(c + 1);
    this.prefix = c < 0 ? "" : tagName.slice(0, c);
    this.attrs = attrs || {};
    this.nodes = [];      // mixed content, in document order
    this.children = [];   // elements only — kids() walks this
    this.parentNode = null;
  }

  get textContent() {
    let out = "";
    for (const n of this.nodes) out += n.textContent;
    return out;
  }

  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null;
  }

  hasAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attrs, name);
  }

  /* every descendant, document order; "*" means all */
  getElementsByTagName(name) {
    const out = [];
    const want = name === "*" ? null : name;
    const walk = (el) => {
      for (const c of el.children) {
        if (want === null || c.tagName === want || c.localName === want) out.push(c);
        walk(c);
      }
    };
    walk(this);
    return out;
  }

  /* only the two selectors the extracted code ever uses */
  querySelector(sel) {
    return this.getElementsByTagName(sel)[0] || null;
  }
}

class Document {
  constructor(root) { this.documentElement = root; }
  getElementsByTagName(name) {
    if (!this.documentElement) return [];
    const self = name === "*" || this.documentElement.tagName === name ||
      this.documentElement.localName === name ? [this.documentElement] : [];
    return self.concat(this.documentElement.getElementsByTagName(name));
  }
  querySelector(sel) { return this.getElementsByTagName(sel)[0] || null; }
}

class XmlError extends Error {}

function parseAttrs(src) {
  const attrs = {};
  const re = /([^\s=/>]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(src))) {
    attrs[m[1]] = decodeEntities(m[3] !== undefined ? m[3] : m[4]);
  }
  return attrs;
}

/**
 * Parse an XML string. Returns a Document-like object.
 * Throws XmlError on malformed input — callers turn that into a `parse` finding,
 * never a crash (the browser returns a <parsererror> document instead).
 */
export function parseXml(text) {
  if (typeof text !== "string") throw new XmlError("input is not text");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  let root = null;
  const stack = [];
  let i = 0;
  const n = text.length;

  const push = (node) => {
    const parent = stack[stack.length - 1];
    if (parent) { parent.nodes.push(node); if (node.nodeType === 1) parent.children.push(node); }
  };

  while (i < n) {
    const lt = text.indexOf("<", i);
    if (lt < 0) break;

    if (lt > i) {
      const raw = text.slice(i, lt);
      if (stack.length && raw.trim() !== "") push(new TextNode(decodeEntities(raw)));
      else if (!stack.length && raw.trim() !== "" && root) throw new XmlError("text after root element");
    }

    if (text.startsWith("<!--", lt)) {
      const end = text.indexOf("-->", lt + 4);
      if (end < 0) throw new XmlError("unterminated comment");
      i = end + 3; continue;
    }
    if (text.startsWith("<![CDATA[", lt)) {
      const end = text.indexOf("]]>", lt + 9);
      if (end < 0) throw new XmlError("unterminated CDATA");
      if (stack.length) push(new TextNode(text.slice(lt + 9, end)));
      i = end + 3; continue;
    }
    if (text.startsWith("<?", lt)) {
      const end = text.indexOf("?>", lt + 2);
      if (end < 0) throw new XmlError("unterminated processing instruction");
      i = end + 2; continue;
    }
    if (text.startsWith("<!", lt)) {
      // DOCTYPE, possibly with an internal subset in [ ... ]
      let j = lt + 2, depth = 0;
      for (; j < n; j++) {
        const c = text[j];
        if (c === "[") depth++;
        else if (c === "]") depth--;
        else if (c === ">" && depth <= 0) break;
      }
      if (j >= n) throw new XmlError("unterminated declaration");
      i = j + 1; continue;
    }

    const gt = (() => {
      // find the '>' that closes this tag, skipping quoted attribute values
      let j = lt + 1, q = "";
      for (; j < n; j++) {
        const c = text[j];
        if (q) { if (c === q) q = ""; }
        else if (c === '"' || c === "'") q = c;
        else if (c === ">") return j;
      }
      return -1;
    })();
    if (gt < 0) throw new XmlError("unterminated tag");

    const body = text.slice(lt + 1, gt);

    if (body[0] === "/") {
      const name = body.slice(1).trim();
      const open = stack.pop();
      if (!open) throw new XmlError(`unexpected closing tag </${name}>`);
      if (open.tagName !== name) throw new XmlError(`mismatched tag: <${open.tagName}> closed by </${name}>`);
      i = gt + 1; continue;
    }

    const selfClosing = body.endsWith("/");
    const inner = selfClosing ? body.slice(0, -1) : body;
    const sp = inner.search(/[\s/]/);
    const tagName = (sp < 0 ? inner : inner.slice(0, sp)).trim();
    if (!tagName) throw new XmlError("empty tag name");
    const el = new Element(tagName, sp < 0 ? {} : parseAttrs(inner.slice(sp)));

    if (!stack.length) {
      if (root) throw new XmlError("more than one root element");
      root = el;
    } else {
      el.parentNode = stack[stack.length - 1];
      push(el);
    }
    if (!selfClosing) stack.push(el);
    else if (!stack.length && root === el) { /* a self-closing root is complete */ }

    i = gt + 1;
  }

  if (stack.length) throw new XmlError(`unclosed element <${stack[stack.length - 1].tagName}>`);
  if (!root) throw new XmlError("no root element");
  return new Document(root);
}

/**
 * One entry point for both runtimes: the browser keeps its native parser (so the
 * module can go back into invoiceready unchanged), Node uses the shim above.
 */
export function parseDocument(xmlText) {
  const DP = globalThis.DOMParser;
  if (typeof DP === "function") {
    const doc = new DP().parseFromString(xmlText, "application/xml");
    if (!doc || doc.getElementsByTagName("parsererror").length) return null;
    return doc;
  }
  try { return parseXml(xmlText); } catch { return null; }
}
