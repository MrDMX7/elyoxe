#!/usr/bin/env python3
"""Build the Elyox site into dist/.

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

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(PROJ, "data")
SRC = os.path.join(PROJ, "src")
SITE = SiteConfig(os.path.join(PROJ, "site.json"))
OUT = SITE.out_dir
BASE = SITE.base_url

load = lambda n: json.load(open(os.path.join(DATA, n), encoding="utf-8"))
COPY, SERVICES, APPROACH, CASES = (load("copy.json"), load("services.json"),
                                   load("approach.json"), load("case-studies.json"))

FONTS = google_fonts([
    "Jost:wght@200;300;400;500",
    "Manrope:wght@300;400;500",
    "Tajawal:wght@200;300;400;500",
])

E = escape

# ── brand mark ──────────────────────────────────────────────────────────────
def mark(size, uid):
    """The EX monogram. Fine circuitry is dropped below 40px — invisible there,
    and it only muddies the silhouette."""
    fine = "" if size < 40 else (
        f'<g fill="none" stroke="url(#d{uid})" stroke-width="2.4" stroke-linecap="round">'
        f'<path d="M30 24 q10 -13 24 -9"/><path d="M36 17 v-7"/>'
        f'<path d="M46 82 q-14 8 -18 -4"/></g>'
        f'<g fill="#FFF" stroke="url(#d{uid})" stroke-width="2.2">'
        f'<circle cx="36" cy="9" r="3"/><circle cx="54" cy="15" r="3"/>'
        f'<circle cx="28" cy="78" r="3"/></g>'
    )
    return (
        f'<svg viewBox="0 0 100 100" width="{size}" height="{size}" style="display:block" '
        f'role="img" aria-label="Elyox"><defs>'
        f'<linearGradient id="d{uid}" x1="0" y1="1" x2="1" y2="0">'
        f'<stop offset="0%" stop-color="#4A1226"/><stop offset="100%" stop-color="#8E2547"/></linearGradient>'
        f'<linearGradient id="a{uid}" x1="0" y1="1" x2="1" y2="0">'
        f'<stop offset="0%" stop-color="#6B1B33"/><stop offset="55%" stop-color="#9C3352"/>'
        f'<stop offset="100%" stop-color="#C05C79"/></linearGradient></defs>'
        f'<path fill="url(#d{uid})" d="M8 26 h30 v11 H19 v9 h16 v11 H19 v9 h19 v11 H8 z"/>'
        f'{fine}'
        f'<path fill="url(#d{uid})" d="M40 26 h13 l28 51 H68 z"/>'
        f'<path fill="url(#d{uid})" d="M68 26 h13 L53 77 H40 z" opacity=".92"/>'
        f'<path fill="url(#a{uid})" d="M52 74 L86 18 l-13 -1 l17 -9 l3 19 l-7 -6 L60 79 z"/>'
        f'<circle cx="60" cy="60" r="2.6" fill="url(#d{uid})"/></svg>'
    )

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
def nav(lang, root, current=""):
    c = COPY[lang]
    other_root = ("../" * root.count("../")) if False else root
    lang_href = (root + "ar/") if lang == "en" else (root or "./")
    items = [(k, f'{root}#{k}' if k in ("services", "work", "approach", "contact") else root)
             for k in ("services", "work", "approach", "contact")]
    links = "".join(
        '<a href="{}"{}>{}</a>'.format(h, ' aria-current="page"' if k == current else "", E(c["nav"][k]))
        for k, h in items)
    links += (f'<a class="lang" href="{lang_href}" hreflang="{c["lang_switch_code"]}">'
              f'{E(c["lang_switch"])}</a>')
    return (
        f'<header class="wrap head"><a class="brand" href="{root or "./"}">{mark(42, "h")}'
        f'<span class="brand-name">Elyox</span></a>'
        f'<nav class="nav">{links}</nav>'
        f'<button class="nav-toggle" aria-label="Menu">'
        f'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5E2138" '
        f'stroke-width="1.5" stroke-linecap="round"><path d="M3 7h18M3 12h18M3 17h18"/></svg>'
        f'</button></header>'
    )


def footer(lang, root):
    c = COPY[lang]
    svc = "".join(f'<a href="{root}#services">{E(s[lang]["title"])}</a>' for s in SERVICES)
    return (
        f'<footer class="foot"><div class="wrap">'
        f'<div class="foot-grid">'
        f'<div><div class="brand" style="margin-block-end:1.125rem">{mark(34, "f")}'
        f'<span class="brand-name" style="font-size:1.4375rem">Elyox</span></div>'
        f'<p style="font-size:.84rem;color:var(--muted);max-inline-size:34ch">{E(c["foot_blurb"])}</p></div>'
        f'<div><div class="label" style="margin-block-end:1rem">{E(c["foot_services"])}</div>'
        f'<div class="foot-links">{svc}</div></div>'
        f'<div><div class="label" style="margin-block-end:1rem">{E(c["foot_contact"])}</div>'
        f'<div class="foot-links"><a href="mailto:hello@elyox.dev">hello@elyox.dev</a>'
        f'<a href="https://github.com/MrDMX7">github.com/MrDMX7</a></div></div>'
        f'</div>'
        f'<div class="foot-bottom"><span class="num">© 2026 Elyox</span>'
        f'<span>{E(c["foot_place"])}</span></div>'
        f'</div></footer>'
    )


# ── visuals ─────────────────────────────────────────────────────────────────
def hero_visual(rtl):
    """Node network echoing the circuitry in the mark. Redrawn mirrored for RTL
    rather than CSS-flipped, so the arrowheads and text direction stay correct."""
    if not rtl:
        wires = ["M70 380 L70 300 L150 220 L260 220", "M150 220 L150 130 L250 130",
                 "M260 220 L340 140 L440 140", "M260 220 L340 300 L430 300",
                 "M430 300 L430 380 L340 380", "M250 130 L250 70 L410 70",
                 "M70 300 L150 300 L150 380 L250 380"]
        nodes = [(70,380),(150,220),(250,130),(440,140),(430,300),(340,380),(410,70),(250,380)]
        hub = (260, 220)
    else:
        wires = ["M490 380 L490 300 L410 220 L300 220", "M410 220 L410 130 L310 130",
                 "M300 220 L220 140 L120 140", "M300 220 L220 300 L130 300",
                 "M130 300 L130 380 L220 380", "M310 130 L310 70 L150 70",
                 "M490 300 L410 300 L410 380 L310 380"]
        nodes = [(490,380),(410,220),(310,130),(120,140),(130,300),(220,380),(150,70),(310,380)]
        hub = (300, 220)
    w = "".join(f'<path d="{p}"/>' for p in wires)
    n = "".join(f'<circle cx="{x}" cy="{y}" r="5"/>' for x, y in nodes)
    hx, hy = hub
    return (
        '<svg viewBox="0 0 560 480" width="100%" height="100%" style="display:block" aria-hidden="true"><defs>'
        f'<linearGradient id="hw" x1="{1 if rtl else 0}" y1="0" x2="{0 if rtl else 1}" y2="1">'
        '<stop offset="0%" stop-color="#8E2547" stop-opacity=".85"/>'
        '<stop offset="100%" stop-color="#C98BA0" stop-opacity=".5"/></linearGradient>'
        '<linearGradient id="hf" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0%" stop-color="#FBF3F5"/><stop offset="100%" stop-color="#FFFFFF"/></linearGradient>'
        '</defs><rect width="560" height="480" fill="url(#hf)"/>'
        f'<g stroke="url(#hw)" fill="none" stroke-width="1.25" stroke-linecap="round">{w}</g>'
        f'<g fill="#FFF" stroke="#8E2547" stroke-width="1.6">{n}</g>'
        f'<circle cx="{hx}" cy="{hy}" r="12" fill="#8E2547"/>'
        f'<circle cx="{hx}" cy="{hy}" r="21" fill="none" stroke="#8E2547" stroke-opacity=".3" stroke-width="1.25"/>'
        f'<circle cx="{hx}" cy="{hy}" r="31" fill="none" stroke="#8E2547" stroke-opacity=".15" stroke-width="1.25"/>'
        '</svg>'
    )


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
def page(*, lang, title, description, canonical, body, root="", current="", alternates=None, ldjson=""):
    alt = "".join(f'<link rel="alternate" hreflang="{k}" href="{v}">'
                  for k, v in (alternates or {}).items())
    return render_page(
        title=title, description=description, canonical=canonical,
        lang=lang, dir="rtl" if lang == "ar" else "ltr", root=root,
        css=["assets/tokens.css", "assets/site.css"],
        fonts=FONTS, head_extra=alt, ldjson=ldjson,
        favicon='<link rel="icon" href="assets/mark.svg" type="image/svg+xml">'.replace(
            'href="assets/', f'href="{root}assets/'),
        nav=nav(lang, root, current), footer=footer(lang, root),
        og={"og:title": title, "og:description": description, "og:type": "website",
            "og:url": canonical, "og:locale": "ar_AE" if lang == "ar" else "en_AE"},
        body=body,
    )


def services_grid(lang):
    out = []
    for i, s in enumerate(SERVICES, 1):
        out.append(
            f'<article class="card service"><div class="n num">{i:02d}</div>{icon(s["icon"])}'
            f'<h3>{E(s[lang]["title"])}</h3><p>{E(s[lang]["summary"])}</p></article>')
    return f'<div class="services">{"".join(out)}</div>'


def work_grid(lang, root):
    rtl = lang == "ar"
    arrow = "←" if rtl else "→"
    big, small = CASES[0], CASES[1:]
    def block(cs, i, sm):
        d = cs[lang]
        art = media(cs["media"], rtl, 230 if not sm else 120)
        return (
            f'<a class="card card-lg{" work-sm" if sm else ""}" href="{root}work/{cs["slug"]}.html" '
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
        f'<div class="approach-item"><span class="n num">{i:02d}</span><div>'
        f'<h3>{E(a[lang]["title"])}</h3><p>{E(a[lang]["body"])}</p></div></div>'
        for i, a in enumerate(APPROACH, 1))
    return (
        f'<div class="approach"><div><h2>{E(c["approach_title"])}</h2>'
        f'<p style="margin-block-start:1.25rem;color:var(--ink-2);max-inline-size:34ch">{E(c["approach_lead"])}</p>'
        f'<div class="note-box"><div class="label" style="margin-block-end:.75rem">{E(c["engagement_label"])}</div>'
        f'<p>{E(c["engagement"])}</p></div></div>'
        f'<div class="approach-list">{items}</div></div>')


def contact_block(lang):
    c = COPY[lang]
    return (
        f'<div class="contact"><div><h2>{E(c["contact_title_a"])}<br>{E(c["contact_title_b"])}</h2>'
        f'<p>{E(c["contact_lead"])}</p></div>'
        f'<div class="contact-actions">'
        f'<a class="btn" href="mailto:hello@elyox.dev">hello@elyox.dev</a>'
        f'<a class="btn btn-ghost" href="mailto:hello@elyox.dev?subject=Call">{E(c["contact_call"])}</a>'
        f'</div></div>')


def home(lang):
    c, rtl, root = COPY[lang], lang == "ar", ("../" if lang == "ar" else "")
    ld = json.dumps({
        "@context": "https://schema.org", "@type": "ProfessionalService", "name": "Elyox",
        "url": BASE, "description": c["lead"], "areaServed": "AE",
        "address": {"@type": "PostalAddress", "addressLocality": "Dubai", "addressCountry": "AE"},
        "knowsAbout": [s["en"]["title"] for s in SERVICES],
    }, ensure_ascii=False)
    body = (
        '<main>'
        f'<section class="wrap hero"><div>'
        f'<div class="label" style="margin-block-end:1.875rem">{E(c["tagline"])}</div>'
        f'<h1>{E(c["hero_a"])}<br><span class="accent">{E(c["hero_accent"])}</span><br>{E(c["hero_b"])}</h1>'
        f'<p class="lead">{E(c["lead"])}</p>'
        f'<div class="hero-actions"><a class="btn" href="#contact">{E(c["cta_primary"])}</a>'
        f'<a class="btn-text" href="#work">{E(c["cta_secondary"])}</a></div></div>'
        f'<div class="hero-visual"><div class="hero-frame">{hero_visual(rtl)}</div>'
        f'<div class="hero-card"><div class="label" style="margin-block-end:.9375rem">{E(c["stat_label"])}</div>'
        f'<div class="stat-row"><div class="stat"><b class="num">102</b><span>{E(c["stat_1_label"])}</span></div>'
        f'<div class="stat-div"></div>'
        f'<div class="stat"><b class="num accent">99.9%</b><span>{E(c["stat_2_label"])}</span></div>'
        f'</div></div></div></section>'

        f'<section class="wrap section" id="services">'
        f'<div class="section-head"><h2>{E(c["services_title"])}</h2><span class="rule"></span></div>'
        f'{services_grid(lang)}</section>'

        f'<section class="wrap section" id="work">'
        f'<div class="section-head"><h2>{E(c["work_title"])}</h2><span class="rule"></span>'
        f'<span class="count">{E(c["work_count"])}</span></div>'
        f'{work_grid(lang, root)}</section>'

        f'<section class="wrap section" id="approach">{approach_block(lang)}</section>'
        f'<section class="wrap section" id="contact">{contact_block(lang)}</section>'
        '</main>')
    return page(lang=lang, title=f'Elyox — {c["tagline"]}', description=c["lead"],
                canonical=f"{BASE}/" if lang == "en" else f"{BASE}/ar/",
                root=root, current="services", body=body,
                alternates={"en": f"{BASE}/", "ar": f"{BASE}/ar/", "x-default": f"{BASE}/"},
                ldjson=f'<script type="application/ld+json">{ld}</script>')


def case_page(cs, lang):
    c, d = COPY[lang], cs[lang]
    root = "../../" if lang == "ar" else "../"
    rtl = lang == "ar"
    figs = "".join(
        f'<div class="figure"><b class="num{" accent" if f["accent"] else ""}">{E(f["value"])}</b>'
        f'<span>{E(f[lang])}</span></div>' for f in cs["figures"])
    appr = "".join(f'<li><span class="dot"></span><p>{E(a)}</p></li>' for a in d["approach"])
    tags = "".join(f'<span class="tag">{E(t)}</span>' for t in cs["stack"])
    link = (f'<dd><a href="{d["link"]["href"]}">{E(d["link"]["label"])} →</a></dd>'
            if d["link"] else "<dd>—</dd>")
    idx = [x["slug"] for x in CASES].index(cs["slug"])
    nxt = CASES[(idx + 1) % len(CASES)]
    ld = json.dumps({"@context": "https://schema.org", "@type": "CreativeWork",
                     "name": cs["title"], "abstract": d["tagline"],
                     "author": {"@type": "Organization", "name": "Elyox"},
                     "url": f'{BASE}/{"ar/" if rtl else ""}work/{cs["slug"]}.html'}, ensure_ascii=False)
    body = (
        '<main>'
        f'<section class="wrap case-head">'
        f'<a href="{root}#work" style="font-family:var(--display);font-size:.8125rem;color:var(--faint)">'
        f'{"←" if not rtl else "→"} {E(c["case_back"])}</a>'
        f'<div class="label" style="margin:2rem 0 1.25rem">{E(d["kicker"])}</div>'
        f'<h1>{E(cs["title"])}</h1>'
        f'<p style="font-size:1.1875rem;color:var(--ink-2);max-inline-size:54ch;margin-block-start:1.5rem">{E(d["tagline"])}</p>'
        f'<dl class="case-meta">'
        f'<div><dt class="label">{E(c["case_role"])}</dt><dd>{E(d["role"])}</dd></div>'
        f'<div><dt class="label">{E(c["case_period"])}</dt><dd>{E(cs["period"])}</dd></div>'
        f'<div><dt class="label">{E(c["case_status"])}</dt><dd style="color:var(--wine)">{E(d["status"])}</dd></div>'
        f'<div><dt class="label">{E(c["case_visit"])}</dt>{link}</div>'
        f'</dl></section>'

        f'<section class="wrap" style="padding-block-start:4rem"><div class="browser">'
        f'<div class="browser-bar"><i></i><i></i><i></i>'
        f'<span>{E(d["link"]["label"]) if d["link"] else "elyox.dev"}</span></div>'
        f'<div style="block-size:26.25rem;background:#221A1C;display:flex;align-items:center;justify-content:center">'
        f'<div style="text-align:center;padding:1.5rem">'
        f'<div class="label" style="color:#7A6068;margin-block-end:.625rem">{E(c["screenshot_slot"])}</div>'
        f'<div style="font-size:.84rem;color:#8E7880;max-inline-size:34ch">{E(c["screenshot_note"])}</div>'
        f'</div></div></div></section>'

        f'<section class="wrap" style="padding-block-start:6.875rem">'
        f'<div class="case-row"><h2>{E(c["case_problem"])}</h2><p>{E(d["problem"])}</p></div>'
        f'<div class="case-row"><h2>{E(c["case_approach"])}</h2><ul class="bullets">{appr}</ul></div>'
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
        f'<a class="btn" href="{root}#contact">{E(c["cta_primary"])}</a>'
        f'</div></section>'
        '</main>')
    return page(lang=lang, title=f'{cs["title"]} — Elyox', description=d["tagline"],
                canonical=f'{BASE}/{"ar/" if rtl else ""}work/{cs["slug"]}.html',
                root=root, current="work", body=body,
                alternates={"en": f'{BASE}/work/{cs["slug"]}.html',
                            "ar": f'{BASE}/ar/work/{cs["slug"]}.html',
                            "x-default": f'{BASE}/work/{cs["slug"]}.html'},
                ldjson=f'<script type="application/ld+json">{ld}</script>')


def not_found():
    c = COPY["en"]
    body = ('<main><section class="wrap" style="padding-block:8rem">'
            '<div class="label">404</div>'
            f'<h1 style="margin-block-start:1rem">{E(c["not_found"])}</h1>'
            f'<p style="margin-block-start:2rem"><a class="btn" href="/">{E(c["not_found_cta"])}</a></p>'
            '</section></main>')
    return page(lang="en", title="Not found — Elyox", description=c["not_found"],
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
