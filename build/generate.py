#!/usr/bin/env python3
"""Build the Elyoxe site into dist/.

Both languages are generated from one set of records: adding a project means
one entry in data/case-studies.json with an en and an ar block, then a deploy.
No template edits.

Design decisions encoded here, all of them the client's:
  · type is LIGHT — Jost 200-400. Heavy weights were rejected explicitly.
  · burgundy is ink and accent, never a saturated field.
  · the Arabic side is a full mirror, RTL, with its own leading and its own
    right-to-left redraw of every diagram.
"""
import json
import os
import sys
from html import escape

def _find_infra(start):
    d = start
    while True:
        if os.path.isdir(os.path.join(d, "infra", "ssg")):
            return os.path.join(d, "infra")
        parent = os.path.dirname(d)
        if parent == d:
            raise RuntimeError("infra/ssg not found above " + start)
        d = parent

sys.path.insert(0, _find_infra(os.path.dirname(os.path.abspath(__file__))))
from ssg import (SiteConfig, render_page, google_fonts, LastmodLedger,
                 build_sitemap, write_sitemap)

# The brand (mark, palette, fonts) lives in web/_kit so every Elyoxe property
# draws the same logo. Found the same way as infra: walk up, never count.
def _find_kit(start):
    d = start
    while True:
        if os.path.isdir(os.path.join(d, "web", "_kit")):
            return os.path.join(d, "web", "_kit")
        parent = os.path.dirname(d)
        if parent == d:
            raise RuntimeError("web/_kit not found above " + start)
        d = parent

sys.path.insert(0, _find_kit(os.path.dirname(os.path.abspath(__file__))))
from brand import mark, GOOGLE_FONTS

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(PROJ, "data")
SRC = os.path.join(PROJ, "src")
SITE = SiteConfig(os.path.join(PROJ, "site.json"))
OUT = SITE.out_dir
BASE = SITE.base_url
# Path component of base_url ("/elyoxe" on a project page, "" on a root domain).
# The 404 can be served at any depth, so its link home must be site-absolute.
from urllib.parse import urlparse
ROOT_PATH = (urlparse(BASE).path or "").rstrip("/") + "/"

load = lambda n: json.load(open(os.path.join(DATA, n), encoding="utf-8"))
COPY, SERVICES, APPROACH, CASES = (load("copy.json"), load("services.json"),
                                   load("approach.json"), load("case-studies.json"))

FONTS = google_fonts(GOOGLE_FONTS)

# Written into site.json by automation/contact-form/deploy.sh
with open(os.path.join(PROJ, "site.json"), encoding="utf-8") as _fh:
    CONTACT_ENDPOINT = json.load(_fh).get("contact_endpoint", "")
if not CONTACT_ENDPOINT:
    raise SystemExit("site.json has no contact_endpoint — run automation/contact-form/deploy.sh")

E = escape

ICONS = {
    "browser": '<rect x="2" y="4" width="20" height="15" rx="2"/><path d="M2 9h20M6 6.5h.01M9 6.5h.01"/>',
    "node": '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5L19 19M19 5l-2.5 2.5M7.5 16.5L5 19"/>',
    "code": '<path d="M8 17l-5-5 5-5M16 7l5 5-5 5"/>',
    "cloud": '<path d="M18 10a4 4 0 0 0-7.7-1.4A3.5 3.5 0 1 0 7.5 18h10a3.5 3.5 0 0 0 .5-8z"/>',
}
def icon(name):
    return (f'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#8E2547" '
            f'stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">{ICONS[name]}</svg>')


# ── chrome ──────────────────────────────────────────────────────────────────
def nav(lang, root, current="", home=""):
    """`root` reaches the SITE root; `home` reaches the current LANGUAGE's
    home page. Section anchors must use `home`: on /ar/ the site root is the
    English page, so "../#services" sent every Arabic visitor to the English
    site — nav, footer and all."""
    c = COPY[lang]
    other_root = ("../" * root.count("../")) if False else root
    lang_href = (root + "ar/") if lang == "en" else (root or "./")
    items = [(k, f'{home}#{k}') for k in ("services", "work", "approach", "contact")]
    links = "".join(
        '<a href="{}"{}>{}</a>'.format(h, ' aria-current="page"' if k == current else "", E(c["nav"][k]))
        for k, h in items)
    links += (f'<a class="lang" href="{lang_href}" hreflang="{c["lang_switch_code"]}">'
              f'{E(c["lang_switch"])}</a>')
    return (
        f'<header class="wrap head"><a class="brand" href="{root or "./"}">{mark(42, "h")}'
        f'<span class="brand-name">Elyoxe</span></a>'
        f'<nav class="nav">{links}</nav>'
        f'<button class="nav-toggle" aria-label="Menu">'
        f'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5E2138" '
        f'stroke-width="1.5" stroke-linecap="round"><path d="M3 7h18M3 12h18M3 17h18"/></svg>'
        f'</button></header>'
    )


def footer(lang, root, home=""):
    c = COPY[lang]
    svc = "".join(f'<a href="{home}#services">{E(s[lang]["title"])}</a>' for s in SERVICES)
    return (
        f'<footer class="foot"><div class="wrap">'
        f'<div class="foot-grid">'
        f'<div><div class="brand" style="margin-block-end:1.125rem">{mark(34, "f")}'
        f'<span class="brand-name" style="font-size:1.4375rem">Elyoxe</span></div>'
        f'<p style="font-size:.84rem;color:var(--muted);max-inline-size:34ch">{E(c["foot_blurb"])}</p></div>'
        f'<div><div class="label" style="margin-block-end:1rem">{E(c["foot_services"])}</div>'
        f'<div class="foot-links">{svc}</div></div>'
        f'<div><div class="label" style="margin-block-end:1rem">{E(c["foot_contact"])}</div>'
        f'<div class="foot-links"><a href="{home}#contact">{E(c["foot_contact_form"])}</a>'
        f'<a href="https://github.com/MrDMX7">github.com/MrDMX7</a></div></div>'
        f'</div>'
        f'<div class="foot-bottom"><span class="num">© 2026 Elyoxe</span>'
        f'<span>{E(c["foot_place"])}</span></div>'
        f'</div></footer>'
    )


# ── visuals ─────────────────────────────────────────────────────────────────
# The hero visual is a map of what is actually running, not an ornament.
# Each row is a live system, the group above it names the runtime it really
# runs on, and every number is pulled from its case study by figure() so the
# picture cannot drift from the work it cites. Only the two rows that open in
# a browser are links; Khutwa installs on a phone and the research box is
# private, and that asymmetry is itself information.
DIAGRAM = [
    {"runtime": "Amazon S3 · CloudFront · ACM", "rows": [
        {"name": "elyoxe.com", "href": None, "num": None,
         "unit": {"en": "this page", "ar": "هذه الصفحة"}},
        {"name": "ahlam.elyoxe.com", "href": "https://ahlam.elyoxe.com",
         "num": ("ahlam", 0), "unit": {"en": "symbols", "ar": "رمزاً"}},
        {"name": "invoiceready.ae", "href": "https://invoiceready.ae",
         "num": ("invoiceready", 0), "unit": {"en": "pages", "ar": "صفحة"}},
    ]},
    {"runtime": "Amazon EC2 · systemd", "rows": [
        {"name": {"en": "Quantitative method", "ar": "المنهج الكمّي"}, "href": None,
         "num": ("quantitative-method", 0), "unit": {"en": "falsified", "ar": "فرضية دُحضت"}},
    ]},
    {"runtime": "Android · Kotlin", "rows": [
        {"name": {"en": "Khutwa", "ar": "خطوة"}, "href": None,
         "num": ("khutwa", 1), "unit": {"en": "delta", "ar": "فرق"}},
    ]},
]


def hero_visual(rtl):
    """Markup, not SVG. An SVG scales as a single block, so at a 390px viewport
    these labels came out near 10px; and text-anchor resolves against the
    inherited `direction`, which the Arabic page sets to rtl and which silently
    reversed every mirrored coordinate. A list mirrors itself under dir="rtl",
    stays at its authored size, and lets the domains be real links."""
    lang = "ar" if rtl else "en"
    groups = []
    for g in DIAGRAM:
        rows = []
        for row in g["rows"]:
            n = row["name"]
            name = E(n if isinstance(n, str) else n[lang])
            if row["href"]:
                name = f'<a href="{row["href"]}">{name}</a>'
            num = f'<b class="num">{E(figure(*row["num"]))}</b>' if row["num"] else ""
            rows.append(
                f'<li><span class="sys-name">{name}</span>'
                f'<span class="sys-fig">{num}<span>{E(row["unit"][lang])}</span></span></li>')
        groups.append(
            f'<div class="sys-group"><div class="sys-runtime">{E(g["runtime"])}</div>'
            f'<ul class="sys-list">{"".join(rows)}</ul></div>')
    return f'<div class="sysmap">{"".join(groups)}</div>'


def media(kind, rtl, h=230):
    """Per-project card art. Mirrored for RTL so the eye enters from the right."""
    def mx(x, w=600):
        return w - x if rtl else x
    if kind == "browser":
        return (
            f'<svg viewBox="0 0 600 {h}" width="100%" height="100%" style="display:block" aria-hidden="true">'
            '<g stroke="#DFB9C6" stroke-width="1" fill="none">'
            '<path d="M0 60h600M0 115h600M0 170h600"/><path d="M120 0v230M240 0v230M360 0v230M480 0v230"/></g>'
            f'<rect x="{mx(210) if rtl else 60}" y="52" width="150" height="106" rx="6" fill="#FFF" stroke="#C98BA0"/>'
            f'<rect x="{mx(162) if rtl else 76}" y="70" width="86" height="6" rx="3" fill="#8E2547" opacity=".75"/>'
            f'<rect x="{mx(194) if rtl else 76}" y="86" width="118" height="4" rx="2" fill="#DFB9C6"/>'
            f'<rect x="{mx(132) if rtl else 76}" y="120" width="56" height="18" rx="9" fill="#8E2547" opacity=".85"/>'
            f'<rect x="{mx(400) if rtl else 250}" y="34" width="150" height="142" rx="6" fill="#FFF" stroke="#C98BA0"/>'
            '<g fill="#8E2547" opacity=".8">'
            + "".join(f'<rect x="{mx(280+i*22) if rtl else 266+i*22}" y="{y}" width="14" height="{hh}" rx="2"/>'
                      for i, (y, hh) in enumerate([(128,30),(110,48),(140,18),(96,62),(122,36)]))
            + '</g>'
            f'<rect x="{mx(558) if rtl else 440}" y="66" width="118" height="88" rx="6" fill="#8E2547"/>'
            f'<rect x="{mx(516) if rtl else 456}" y="84" width="60" height="6" rx="3" fill="#FFF" opacity=".9"/>'
            f'<rect x="{mx(542) if rtl else 456}" y="100" width="86" height="4" rx="2" fill="#FFF" opacity=".45"/>'
            '</svg>'
        )
    if kind == "line":
        pts = [(0,96),(44,84),(88,88),(132,62),(176,70),(220,40),(264,52),(308,26),(352,34),(400,14)]
        if rtl: pts = [(400-x, y) for x, y in pts]
        d = "M" + " L".join(f"{x} {y}" for x, y in pts)
        dots = [(132,62),(264,52),(352,34)]
        if rtl: dots = [(400-x, y) for x, y in dots]
        return (
            '<svg viewBox="0 0 400 120" width="100%" height="100%" style="display:block" aria-hidden="true">'
            f'<path d="{d}" fill="none" stroke="#8E2547" stroke-width="1.8" stroke-linecap="round"/>'
            f'<path d="{d} L{pts[-1][0]} 120 L{pts[0][0]} 120Z" fill="#8E2547" opacity=".07"/>'
            '<g fill="#FFF" stroke="#8E2547" stroke-width="1.4">'
            + "".join(f'<circle cx="{x}" cy="{y}" r="3.6"/>' for x, y in dots) + '</g></svg>'
        )
    blobs = [(96,72),(140,58),(188,80),(232,46),(276,68),(320,36)]
    if rtl: blobs = [(400-x, y) for x, y in blobs]
    axis = 'M360 20v80M360 100H40' if rtl else 'M40 20v80M40 100h320'
    trend = 'M360 88 L40 44' if rtl else 'M40 88 L360 44'
    return (
        '<svg viewBox="0 0 400 120" width="100%" height="100%" style="display:block" aria-hidden="true">'
        f'<g stroke="#DFB9C6" stroke-width="1" fill="none"><path d="{axis}"/></g>'
        '<g fill="#8E2547" opacity=".2">'
        + "".join(f'<circle cx="{x}" cy="{y}" r="9"/>' for x, y in blobs) + '</g>'
        f'<path d="{trend}" stroke="#8E2547" stroke-width="1.6" stroke-dasharray="5 4" fill="none"/></svg>'
    )


# ── page assembly ───────────────────────────────────────────────────────────
def page(*, lang, title, description, canonical, body, root="", current="", alternates=None, ldjson="", home=""):
    alt = "".join(f'<link rel="alternate" hreflang="{k}" href="{v}">'
                  for k, v in (alternates or {}).items())
    return render_page(
        title=title, description=description, canonical=canonical,
        lang=lang, dir="rtl" if lang == "ar" else "ltr", root=root,
        css=["assets/tokens.css", "assets/site.css"],
        js=["assets/nav.js", "assets/motion.js", "assets/contact.js"],
        fonts=FONTS, head_extra=alt, ldjson=ldjson,
        favicon='<link rel="icon" href="assets/mark.svg" type="image/svg+xml">'.replace(
            'href="assets/', f'href="{root}assets/'),
        nav=nav(lang, root, current, home), footer=footer(lang, root, home),
        og={"og:title": title, "og:description": description, "og:type": "website",
            "og:url": canonical, "og:locale": "ar_AE" if lang == "ar" else "en_AE"},
        body=body,
    )


def services_grid(lang, root=""):
    """Services as rows, each ending in the work that proves it.

    This was four identical cards with a generic icon tile — the default
    container, and the shape that makes a page read as filler. A row carries
    the same words plus the one thing a card had no room for: a number from a
    live system, and a link to go check it. A service with nothing shipped
    behind it would render without that link rather than with a decorative one.
    """
    arrow = "←" if lang == "ar" else "→"
    out = []
    for i, s in enumerate(SERVICES, 1):
        pr = s.get("proof")
        link = ""
        if pr:
            cs = next((c for c in CASES if c["slug"] == pr["slug"]), None)
            if cs:
                fig = cs["figures"][pr["figure"]]
                link = (f'<a class="svc-proof" href="{root}work/{cs["slug"]}.html">'
                        f'<b class="num">{E(fig["value"])}</b>'
                        f'<span>{E(fig[lang])}</span>'
                        f'<span class="svc-arrow" aria-hidden="true">{arrow}</span></a>')
        out.append(
            f'<article class="service-row" data-reveal data-reveal-group="svc">'
            f'<div class="n num">{i:02d}</div>'
            f'<div class="svc-text"><h3>{E(s[lang]["title"])}</h3>'
            f'<p>{E(s[lang]["summary"])}</p></div>'
            f'{link}</article>')
    return f'<div class="services">{"".join(out)}</div>'


def work_grid(lang, root):
    rtl = lang == "ar"
    arrow = "←" if rtl else "→"
    big, small = CASES[0], CASES[1:]
    def block(cs, i, sm):
        d = cs[lang]
        if cs.get("screenshot"):
            art = (f'<img src="{root}{cs["screenshot"]}" alt="{E(cs["title"])}" loading="lazy" '
                   f'style="display:block;inline-size:100%;block-size:100%;object-fit:cover;object-position:top">')
        else:
            art = media(cs["media"], rtl, 230 if not sm else 120)
        return (
            f'<a class="card card-lg{" work-sm" if sm else ""}" data-reveal data-reveal-group="work" href="{root}work/{cs["slug"]}.html" '
            f'style="display:flex;flex-direction:column">'
            f'<div class="work-media" style="block-size:{"7.5rem" if sm else "14.375rem"}">{art}</div>'
            f'<div class="work-body"><div class="work-meta"><span class="n num">{i:02d}</span>'
            f'<span class="dash"></span><span class="label">{E(d["kicker"])}</span></div>'
            f'<h3>{E(cs["title"] if lang == "en" else cs["title"])}</h3>'
            f'<p>{E(d["summary"])}</p></div></a>')
    side = "".join(block(cs, i + 2, True) for i, cs in enumerate(small))
    return f'<div class="work">{block(big, 1, False)}<div class="work-side">{side}</div></div>'


def approach_block(lang):
    c = COPY[lang]
    items = "".join(
        f'<div class="approach-item" data-reveal data-reveal-group="appr"><span class="n num">{i:02d}</span><div>'
        f'<h3>{E(a[lang]["title"])}</h3><p>{E(a[lang]["body"])}</p></div></div>'
        for i, a in enumerate(APPROACH, 1))
    return (
        f'<div class="approach"><div><h2>{E(c["approach_title"])}</h2>'
        f'<p style="margin-block-start:1.25rem;color:var(--ink-2);max-inline-size:34ch">{E(c["approach_lead"])}</p>'
        f'<div class="note-box"><div class="label" style="margin-block-end:.75rem">{E(c["engagement_label"])}</div>'
        f'<p>{E(c["engagement"])}</p></div></div>'
        f'<div class="approach-list">{items}</div></div>')


def contact_block(lang):
    """Form → Lambda Function URL → SES → owner's inbox. No address on the page:
    the domain is not registered yet, so a mailto would bounce."""
    c = COPY[lang]
    return (
        f'<div class="contact"><div><h2>{E(c["contact_title_a"])}<br>{E(c["contact_title_b"])}</h2>'
        f'<p>{E(c["contact_lead"])}</p></div>'
        f'<form class="form" method="post" action="{CONTACT_ENDPOINT}" novalidate '
        f'data-endpoint="{CONTACT_ENDPOINT}" data-lang="{lang}" '
        f'data-sending="{E(c["form_sending"])}" data-done="{E(c["form_done"])}" data-fail="{E(c["form_fail"])}">'
        f'<label>{E(c["form_name"])}<input name="name" type="text" required maxlength="120" autocomplete="name"></label>'
        f'<label>{E(c["form_email"])}<input name="email" type="email" required maxlength="200" autocomplete="email"></label>'
        f'<label>{E(c["form_message"])}<textarea name="message" required maxlength="4000"></textarea></label>'
        f'<label class="hp" aria-hidden="true">Website<input name="website" type="text" tabindex="-1" autocomplete="off"></label>'
        f'<div class="form-foot"><button class="btn" type="submit">{E(c["form_send"])}</button>'
        f'<p class="form-note">{E(c["form_privacy"])}</p></div>'
        f'<p class="form-status" role="status" aria-live="polite"></p>'
        f'</form></div>')


def figure(slug, index=0):
    """A headline number straight off a case study, so the hero cannot drift
    from the work it cites. The card previously claimed '99.9% availability' —
    a number nothing on this site measures, on a page whose whole argument is
    that claims should be checkable."""
    cs = next(c for c in CASES if c["slug"] == slug)
    return cs["figures"][index]["value"]


def home(lang):
    c, rtl, root = COPY[lang], lang == "ar", ("../" if lang == "ar" else "")
    ld = json.dumps({
        "@context": "https://schema.org", "@type": "ProfessionalService", "name": "Elyoxe",
        "url": BASE, "description": c["lead"], "areaServed": "AE",
        "address": {"@type": "PostalAddress", "addressLocality": "Dubai", "addressCountry": "AE"},
        "knowsAbout": [s["en"]["title"] for s in SERVICES],
    }, ensure_ascii=False)
    body = (
        '<main>'
        f'<section class="wrap hero"><div>'
        f'<div class="label" data-reveal data-reveal-group="hero" '
        f'style="margin-block-end:1.875rem">{E(c["tagline"])}</div>'
        f'<h1>'
        f'<span data-reveal="line" data-reveal-group="heroline"><span>{E(c["hero_a"])}</span></span>'
        f'<span data-reveal="line" data-reveal-group="heroline">'
        f'<span class="accent">{E(c["hero_accent"])}</span></span>'
        f'<span data-reveal="line" data-reveal-group="heroline"><span>{E(c["hero_b"])}</span></span>'
        f'</h1>'
        f'<p class="lead" data-reveal data-reveal-group="herob">{E(c["lead"])}</p>'
        f'<div class="hero-actions" data-reveal data-reveal-group="herob">'
        f'<a class="btn" href="#contact">{E(c["cta_primary"])}</a>'
        f'<a class="btn-text" href="#work">{E(c["cta_secondary"])}</a></div></div>'
        f'<div class="hero-visual" data-reveal data-reveal-group="herob">'
        f'<div class="label" style="margin-block-end:.9375rem">{E(c["stat_label"])}</div>'
        f'<div class="hero-frame">{hero_visual(rtl)}</div>'
        f'<p class="stat-note">{E(c["stat_note"])}</p>'
        f'</div></section>'

        f'<section class="wrap section" id="services">'
        f'<div class="section-head">'
        f'<h2><span data-reveal="line"><span>{E(c["services_title"])}</span></span></h2>'
        f'<span class="rule" data-reveal="rule"></span></div>'
        f'{services_grid(lang, root)}</section>'

        f'<section class="wrap section" id="work">'
        f'<div class="section-head">'
        f'<h2><span data-reveal="line"><span>{E(c["work_title"])}</span></span></h2>'
        f'<span class="rule" data-reveal="rule"></span>'
        f'<span class="count">{E(c["work_count"])}</span></div>'
        f'{work_grid(lang, root)}</section>'

        f'<section class="wrap section" id="approach">{approach_block(lang)}</section>'
        f'<section class="wrap section" id="contact">{contact_block(lang)}</section>'
        '</main>')
    return page(lang=lang, title=f'Elyoxe — {c["tagline"]}', description=c["lead"],
                canonical=f"{BASE}/" if lang == "en" else f"{BASE}/ar/",
                root=root, home="", current="services", body=body,
                alternates={"en": f"{BASE}/", "ar": f"{BASE}/ar/", "x-default": f"{BASE}/"},
                ldjson=f'<script type="application/ld+json">{ld}</script>')


def case_page(cs, lang):
    c, d = COPY[lang], cs[lang]
    root = "../../" if lang == "ar" else "../"
    # One level under the language home in both languages:
    # /work/x.html -> /  and  /ar/work/x.html -> /ar/
    home = "../"
    rtl = lang == "ar"
    figs = "".join(
        f'<div class="figure" data-reveal data-reveal-group="fig"><b class="num{" accent" if f["accent"] else ""}">{E(f["value"])}</b>'
        f'<span>{E(f[lang])}</span></div>' for f in cs["figures"])
    appr = "".join(f'<li><span class="dot"></span><p>{E(a)}</p></li>' for a in d["approach"])
    tags = "".join(f'<span class="tag">{E(t)}</span>' for t in cs["stack"])
    link = (f'<dd><a href="{d["link"]["href"]}">{E(d["link"]["label"])} →</a></dd>'
            if d["link"] else "<dd>—</dd>")
    idx = [x["slug"] for x in CASES].index(cs["slug"])
    nxt = CASES[(idx + 1) % len(CASES)]
    ld = json.dumps({"@context": "https://schema.org", "@type": "CreativeWork",
                     "name": cs["title"], "abstract": d["tagline"],
                     "author": {"@type": "Organization", "name": "Elyoxe"},
                     "url": f'{BASE}/{"ar/" if rtl else ""}work/{cs["slug"]}.html'}, ensure_ascii=False)
    body = (
        '<main>'
        f'<section class="wrap case-head">'
        f'<a href="{home}#work" style="font-family:var(--display);font-size:.8125rem;color:var(--faint)">'
        f'{"←" if not rtl else "→"} {E(c["case_back"])}</a>'
        f'<div class="label" style="margin:2rem 0 1.25rem">{E(d["kicker"])}</div>'
        f'<h1><span data-reveal="line"><span>{E(cs["title"])}</span></span></h1>'
        f'<p data-reveal data-reveal-group="casehead" style="font-size:1.1875rem;color:var(--ink-2);max-inline-size:54ch;margin-block-start:1.5rem">{E(d["tagline"])}</p>'
        f'<dl class="case-meta" data-reveal data-reveal-group="casehead">'
        f'<div><dt class="label">{E(c["case_role"])}</dt><dd>{E(d["role"])}</dd></div>'
        f'<div><dt class="label">{E(c["case_period"])}</dt><dd>{E(cs["period"])}</dd></div>'
        f'<div><dt class="label">{E(c["case_status"])}</dt><dd style="color:var(--wine)">{E(d["status"])}</dd></div>'
        f'<div><dt class="label">{E(c["case_visit"])}</dt>{link}</div>'
        f'</dl></section>'

        # The browser frame renders only when there is a real screenshot.
        # It used to fall back to a dark slate captioned "screenshot slot" —
        # a visible placeholder on a published page, and the one dark block on
        # a site whose identity forbids them. An absent shot is now an absent
        # section, which is the honest version of the same fact.
        + (f'<section class="wrap" style="padding-block-start:4rem"><div class="browser">'
           f'<div class="browser-bar"><i></i><i></i><i></i>'
           f'<span>{E(d["link"]["label"]) if d["link"] else "elyoxe.com"}</span></div>'
           f'<img src="{root}{cs["screenshot"]}" alt="{E(cs["title"])}" loading="lazy" '
           f'style="display:block;inline-size:100%;aspect-ratio:16/9;object-fit:cover;object-position:top">'
           f'</div></section>' if cs.get("screenshot") else '')
        + f'<section class="wrap" style="padding-block-start:6.875rem">'
        f'<div class="case-row" data-reveal data-reveal-group="caserow"><h2>{E(c["case_problem"])}</h2><p>{E(d["problem"])}</p></div>'
        f'<div class="case-row" data-reveal data-reveal-group="caserow"><h2>{E(c["case_approach"])}</h2><ul class="bullets">{appr}</ul></div>'
        f'</section>'

        f'<section class="wrap" style="padding-block-start:4.75rem">'
        f'<div class="label" style="margin-block-end:1.625rem">{E(c["case_measured"])}</div>'
        f'<div class="figures">{figs}</div></section>'

        f'<section class="wrap" style="padding-block-start:4.75rem">'
        f'<div style="display:grid;grid-template-columns:1.35fr 1fr;gap:2.375rem;align-items:start" class="case-tail">'
        f'<div><div class="label" style="margin-block-end:1.25rem">{E(c["case_built"])}</div>'
        f'<div class="tags">{tags}</div></div>'
        f'<div class="caveat"><span class="label">{E(c["case_caveat"])}</span><p>{E(d["caveat"])}</p></div>'
        f'</div></section>'

        f'<section class="wrap" style="padding-block-start:6rem">'
        f'<div style="border-block-start:1px solid var(--rule);padding-block-start:2.375rem;'
        f'display:flex;align-items:center;justify-content:space-between;gap:1.5rem;flex-wrap:wrap">'
        f'<div><div class="label" style="margin-block-end:.5625rem">{E(c["case_next"])}</div>'
        f'<a href="{nxt["slug"]}.html" style="font-family:var(--display);font-weight:300;font-size:2.125rem;'
        f'color:var(--ink)">{E(nxt["title"])} {"←" if rtl else "→"}</a></div>'
        f'<a class="btn" href="{home}#contact">{E(c["cta_primary"])}</a>'
        f'</div></section>'
        '</main>')
    return page(lang=lang, title=f'{cs["title"]} — Elyoxe', description=d["tagline"],
                canonical=f'{BASE}/{"ar/" if rtl else ""}work/{cs["slug"]}.html',
                root=root, home="../", current="work", body=body,
                alternates={"en": f'{BASE}/work/{cs["slug"]}.html',
                            "ar": f'{BASE}/ar/work/{cs["slug"]}.html',
                            "x-default": f'{BASE}/work/{cs["slug"]}.html'},
                ldjson=f'<script type="application/ld+json">{ld}</script>')


def not_found():
    c = COPY["en"]
    body = ('<main><section class="wrap" style="padding-block:8rem">'
            '<div class="label">404</div>'
            f'<h1 style="margin-block-start:1rem">{E(c["not_found"])}</h1>'
            f'<p style="margin-block-start:2rem"><a class="btn" href="{ROOT_PATH}">{E(c["not_found_cta"])}</a></p>'
            '</section></main>')
    return page(lang="en", title="Not found — Elyoxe", description=c["not_found"],
                canonical=f"{BASE}/404.html", body=body)


def write(rel, html):
    p = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as fh:
        fh.write(html)


def main():
    import shutil
    os.makedirs(OUT, exist_ok=True)
    dst = os.path.join(OUT, "assets")
    shutil.rmtree(dst, ignore_errors=True)
    shutil.copytree(os.path.join(SRC, "assets"), dst)
    open(os.path.join(OUT, ".nojekyll"), "w").close()
    with open(os.path.join(dst, "mark.svg"), "w", encoding="utf-8") as fh:
        fh.write('<?xml version="1.0" encoding="UTF-8"?>\n' + mark(100, "i"))

    n = 0
    for lang in ("en", "ar"):
        pre = "ar/" if lang == "ar" else ""
        write(f"{pre}index.html", home(lang)); n += 1
        for cs in CASES:
            write(f'{pre}work/{cs["slug"]}.html', case_page(cs, lang)); n += 1
    write("404.html", not_found()); n += 1
    print(f"Generated {n} pages ({len(CASES)} projects × 2 languages + 2 homepages + 404).")

    with open(os.path.join(OUT, "robots.txt"), "w", encoding="utf-8") as fh:
        fh.write(f"User-agent: *\nAllow: /\n\nSitemap: {BASE}/sitemap.xml\n")

    ledger = LastmodLedger(os.path.join(DATA, "lastmod.json"), OUT)

    def alternates(rel):
        r = rel.replace(os.sep, "/")
        if r in ("index.html", "ar/index.html"):
            return {"en": f"{BASE}/", "ar": f"{BASE}/ar/", "x-default": f"{BASE}/"}
        if r.startswith("work/") or r.startswith("ar/work/"):
            slug = r.rsplit("/", 1)[-1]
            return {"en": f"{BASE}/work/{slug}", "ar": f"{BASE}/ar/work/{slug}",
                    "x-default": f"{BASE}/work/{slug}"}
        return None

    xml = build_sitemap(SITE, ledger,
        rules=[(r"^index\.html$", "weekly", "1.0"), (r"^ar/index\.html$", "weekly", "0.9"),
               (r"^work/", "monthly", "0.8"), (r"^ar/work/", "monthly", "0.7")],
        default=("monthly", "0.5"), alternates=alternates, exclude=[r"^404\.html$"])
    _, count = write_sitemap(SITE, xml)
    print(f"sitemap.xml: {count} URLs")


if __name__ == "__main__":
    main()
