#!/usr/bin/env python3
"""Build the Elyox site into dist/.

Adding a project to the portfolio is one record in data/case-studies.json
plus a deploy — no template edits. That was the requirement.

English is primary (the audience is companies evaluating a vendor). The
Arabic page at /ar/ is self-contained rather than a half-translated mirror:
it carries the full positioning, the work summaries and the services, and
links into the English case studies for depth. Only pages that genuinely
have an alternate URL carry hreflang.
"""
import json
import os
import sys
from html import escape

def _find_infra(start):
    """Walk up to the workspace root — the directory holding infra/ssg.

    Searched rather than counted: a hardcoded number of dirname() calls breaks
    silently the moment a project moves one level in the tree, and the failure
    looks like a missing module rather than a wrong path.
    """
    d = start
    while True:
        cand = os.path.join(d, "infra", "ssg")
        if os.path.isdir(cand):
            return os.path.join(d, "infra")
        parent = os.path.dirname(d)
        if parent == d:
            raise RuntimeError("infra/ssg not found in any parent of " + start)
        d = parent


sys.path.insert(0, _find_infra(os.path.dirname(os.path.abspath(__file__))))

from ssg import (SiteConfig, render_page, google_fonts, svg_favicon,
                 LastmodLedger, build_sitemap, write_sitemap)

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(PROJ, "data")
SRC = os.path.join(PROJ, "src")
SITE = SiteConfig(os.path.join(PROJ, "site.json"))
OUT = SITE.out_dir

load = lambda n: json.load(open(os.path.join(DATA, n), encoding="utf-8"))
COPY = load("copy.json")
CASES = load("case-studies.json")
SERVICES = load("services.json")

FONTS = google_fonts([
    "Space Grotesk:wght@400;500;600",
    "Inter:wght@400;500;600",
    "IBM Plex Mono:wght@400;500",
    "IBM Plex Sans Arabic:wght@400;500;600",
])

# Three vertical strokes — the mark, and the section motif in the CSS.
FAVICON = svg_favicon(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">'
    '<rect x="4"  y="3" width="3.4" height="18" fill="#7CB9E8"/>'
    '<rect x="10.3" y="3" width="3.4" height="18" fill="#2E6FA8"/>'
    '<rect x="16.6" y="3" width="3.4" height="18" fill="#7CB9E8" opacity="0.45"/>'
    "</svg>"
)
MARK = ('<span class="stripes" aria-hidden="true"><i></i><i></i><i></i></span>')


def nav(lang, root, current=""):
    """Header for one page. `root` is the prefix back to the site root
    ("" at the root, "../" one level down), and every href is built from it —
    the earlier version special-cased the Arabic page and produced ../../,
    which points above the site root, and ar/ from /work/, which does not exist.
    """
    t = COPY[lang]["nav"]
    if lang == "ar":
        # /ar/ is one self-contained page, so its nav is in-page anchors
        items = [("work", "#work"), ("services", "#services")]
        home_href, lang_href, lang_code = "./", root, "en"
    else:
        items = [("work", f"{root}#work"), ("services", f"{root}services.html"),
                 ("about", f"{root}about.html"), ("contact", f"{root}contact.html")]
        home_href, lang_href, lang_code = (root or "./"), f"{root}ar/", "ar"

    links = "".join(
        '<a href="{}"{}>{}</a>'.format(
            href, ' aria-current="page"' if key == current else "", escape(t[key]))
        for key, href in items
    )
    links += (f'<a class="lang" href="{lang_href}" hreflang="{lang_code}">'
              f'{escape(COPY[lang]["lang_switch"])}</a>')
    return (
        '<header class="site-head"><div class="wrap head-inner">'
        f'<a class="brand" href="{home_href}">{MARK}Elyox</a>'
        f'<nav class="site-nav">{links}</nav>'
        "</div></header>"
    )


def footer(lang):
    c = COPY[lang]
    return (
        '<footer class="site-foot"><div class="wrap foot-inner">'
        f'<span>Elyox — {escape(c["tagline"])}</span>'
        f'<span class="mono">{escape(c["footer_note"])} · 2026</span>'
        "</div></footer>"
    )


def page(*, lang, title, body, description, canonical, root="", current="",
         alternates=None, ldjson=""):
    alt = ""
    for hl, href in (alternates or {}).items():
        alt += f'<link rel="alternate" hreflang="{hl}" href="{href}">\n'
    return render_page(
        title=title, description=description, canonical=canonical,
        lang=lang, dir="rtl" if lang == "ar" else "ltr", root=root,
        css=["assets/tokens.css", "assets/site.css"],
        fonts=FONTS, favicon=FAVICON, head_extra=alt.rstrip(), ldjson=ldjson,
        nav=nav(lang, root, current), footer=footer(lang),
        og={"og:title": title, "og:description": description,
            "og:type": "website", "og:url": canonical},
        body=body,
    )


def figures(items):
    cells = "".join(
        f'<div class="figure"><b>{escape(f["figure"])}</b><span>{escape(f["label"])}</span></div>'
        for f in items
    )
    return f'<div class="figures">{cells}</div>'


def work_rows(lang, root=""):
    c = COPY[lang]
    rows = []
    for cs in CASES:
        href = f'{root}work/{cs["slug"]}.html'
        pills = f'<span class="pill{" live" if cs["status"] == "Live" else ""}">{escape(cs["status"])}</span>'
        pills += f'<span class="pill">{escape(cs["period"])}</span>'
        rows.append(
            f'<a class="work-item" href="{href}">'
            f'<div><h3>{escape(cs["title"])}</h3>'
            f'<p class="tagline">{escape(cs["tagline"])}</p>'
            f'<div class="meta">{pills}</div></div>'
            f'<span class="chev">→</span></a>'
        )
    return f'<div class="work-list">{"".join(rows)}</div>'


def services_grid():
    out = []
    for s in SERVICES:
        pts = "".join(f"<li>{escape(p)}</li>" for p in s["points"])
        out.append(
            f'<div class="service"><h3>{escape(s["title"])}</h3>'
            f'<p>{escape(s["summary"])}</p>'
            f'<ul class="bullets">{pts}</ul>'
            f'<p class="proof"><span class="label">Evidence</span> {escape(s["proof"])}</p></div>'
        )
    return f'<div class="services">{"".join(out)}</div>'


# -- pages -------------------------------------------------------------------

def home():
    c = COPY["en"]
    ld = json.dumps({
        "@context": "https://schema.org", "@type": "ProfessionalService",
        "name": "Elyox", "url": SITE.base_url,
        "description": c["hero_lead"], "areaServed": "AE",
        "knowsAbout": [s["title"] for s in SERVICES],
    }, ensure_ascii=False)
    body = (
        '<main><section class="hero"><div class="wrap">'
        f'<h1>{escape(c["tagline"])}</h1>'
        f'<p class="lead">{escape(c["hero_lead"])}</p>'
        f'<p class="note">{escape(c["hero_note"])}</p>'
        f'<p style="margin-block-start:2rem"><a class="btn" href="contact.html">{escape(c["cta"])}</a></p>'
        "</div></section>"
        '<section class="section" id="work"><div class="wrap">'
        f'<div class="section-head"><h2>{escape(c["work_title"])}</h2><p>{escape(c["work_lead"])}</p></div>'
        f"{work_rows('en')}</div></section>"
        '<section class="section" id="services"><div class="wrap">'
        f'<div class="section-head"><h2>{escape(c["services_title"])}</h2><p>{escape(c["services_lead"])}</p></div>'
        f"{services_grid()}</div></section>"
        "</main>"
    )
    return page(lang="en", title=f'Elyox — {c["tagline"]}', description=c["hero_lead"],
                canonical=f"{SITE.base_url}/", current="work", body=body,
                alternates={"ar": f"{SITE.base_url}/ar/", "en": f"{SITE.base_url}/",
                            "x-default": f"{SITE.base_url}/"},
                ldjson=f'<script type="application/ld+json">{ld}</script>')


def case_page(cs):
    c = COPY["en"]
    approach = "".join(f"<li>{escape(a)}</li>" for a in cs["approach"])
    stack = "".join(f'<span class="pill">{escape(s)}</span>' for s in cs["stack"])
    detail = "".join(
        f'<div class="grid-2"><h3>{escape(d["h"])}</h3><div><p>{escape(d["p"])}</p></div></div>'
        for d in cs["detail"]
    )
    links = "".join(
        f'<a class="btn btn-ghost" href="{l["href"]}" style="margin-inline-end:.5rem">{escape(l["label"])} →</a>'
        for l in cs["links"]
    )
    ld = json.dumps({
        "@context": "https://schema.org", "@type": "CreativeWork",
        "name": cs["title"], "abstract": cs["tagline"],
        "author": {"@type": "Organization", "name": "Elyox"},
        "url": f'{SITE.base_url}/work/{cs["slug"]}.html',
    }, ensure_ascii=False)
    body = (
        '<main><section class="hero"><div class="wrap">'
        f'<p class="label">{escape(c["all_work"])}</p>'
        f'<h1>{escape(cs["title"])}</h1>'
        f'<p class="lead">{escape(cs["tagline"])}</p>'
        f'<div class="meta" style="display:flex;gap:.75rem;flex-wrap:wrap;margin-block-start:1.5rem">'
        f'<span class="pill{" live" if cs["status"] == "Live" else ""}">{escape(cs["status"])}</span>'
        f'<span class="pill">{escape(cs["role"])}</span>'
        f'<span class="pill">{escape(cs["period"])}</span></div>'
        f'<p style="margin-block-start:1.5rem">{links}</p>'
        "</div></section>"
        '<section class="section"><div class="wrap">'
        f'<div class="grid-2"><h3>{escape(c["problem_label"])}</h3><div><p>{escape(cs["problem"])}</p></div></div>'
        f'<div class="grid-2"><h3>{escape(c["approach_label"])}</h3><div><ul class="bullets">{approach}</ul></div></div>'
        "</div></section>"
        '<section class="section"><div class="wrap">'
        f'<div class="section-head"><h2>{escape(c["evidence_label"])}</h2></div>'
        f'{figures(cs["evidence"])}'
        f'<div class="grid-2" style="margin-block-start:2.25rem"><h3>{escape(c["stack_label"])}</h3>'
        f'<div class="tags">{stack}</div></div>'
        "</div></section>"
        f'<section class="section"><div class="wrap">{detail}'
        f'<div class="caveat" style="margin-block-start:2.25rem">'
        f'<strong>{escape(c["caveat_label"])}</strong>{escape(cs["caveat"])}</div>'
        f'<p style="margin-block-start:2.25rem"><a class="btn btn-ghost" href="../#work">← {escape(c["back"])}</a></p>'
        "</div></section></main>"
    )
    return page(lang="en", title=f'{cs["title"]} — Elyox', description=cs["tagline"],
                canonical=f'{SITE.base_url}/work/{cs["slug"]}.html', root="../",
                body=body, ldjson=f'<script type="application/ld+json">{ld}</script>')


def services_page():
    c = COPY["en"]
    body = (
        '<main><section class="hero"><div class="wrap">'
        f'<h1>{escape(c["services_title"])}</h1>'
        f'<p class="lead">{escape(c["services_lead"])}</p></div></section>'
        f'<section class="section"><div class="wrap">{services_grid()}'
        f'<p style="margin-block-start:2.5rem"><a class="btn" href="contact.html">{escape(c["cta"])}</a></p>'
        "</div></section></main>"
    )
    return page(lang="en", title="Services — Elyox", description=c["services_lead"],
                canonical=f"{SITE.base_url}/services.html", current="services", body=body)


def about_page():
    c = COPY["en"]
    paras = [
        "I build and run digital products on my own — architecture, implementation, deployment and the operational tail afterwards. The work on this site was designed, written and shipped by me, and the infrastructure behind it is one I still operate.",
        "Most of it is built from a phone. That is not a gimmick: it forces choices that turn out to be good ones anyway — no heavy toolchain, no build server, static output where static is enough, and deployment reduced to a single verified command.",
        "The through-line across everything here is that a claim should be checkable. A step counter that says its history reconciles proves it with a diagnostics button. A provider directory that cannot source a field publishes “not disclosed” instead of guessing. A research process that has never produced a negative result has not been tested.",
    ]
    body = (
        '<main><section class="hero"><div class="wrap">'
        f'<h1>{escape(c["about_title"])}</h1></div></section>'
        '<section class="section"><div class="wrap center-narrow">'
        + "".join(f"<p>{escape(p)}</p>" for p in paras)
        + f'<p style="margin-block-start:2rem"><a class="btn" href="contact.html">{escape(c["cta"])}</a></p>'
        "</div></section></main>"
    )
    return page(lang="en", title="About — Elyox", description=paras[0],
                canonical=f"{SITE.base_url}/about.html", current="about", body=body)


def contact_page():
    c = COPY["en"]
    body = (
        '<main><section class="hero"><div class="wrap">'
        f'<h1>{escape(c["contact_title"])}</h1>'
        f'<p class="lead">{escape(c["contact_lead"])}</p>'
        '<p style="margin-block-start:2rem">'
        '<a class="btn" href="mailto:hello@elyox.dev">hello@elyox.dev</a> '
        '<a class="btn btn-ghost" href="https://github.com/MrDMX7">GitHub →</a>'
        "</p></div></section></main>"
    )
    return page(lang="en", title="Contact — Elyox", description=c["contact_lead"],
                canonical=f"{SITE.base_url}/contact.html", current="contact", body=body)


def arabic_page():
    c = COPY["ar"]
    rows = []
    for cs in CASES:
        rows.append(
            f'<a class="work-item" href="../work/{cs["slug"]}.html">'
            f'<div><h3>{escape(cs["title"])}</h3>'
            f'<p class="tagline">{escape(cs["tagline"])}</p>'
            f'<div class="meta"><span class="pill">{escape(cs["period"])}</span></div></div>'
            f'<span class="chev">←</span></a>'
        )
    svc = "".join(
        f'<div class="service"><h3>{escape(s["title"])}</h3><p>{escape(s["summary"])}</p></div>'
        for s in SERVICES
    )
    body = (
        '<main><section class="hero"><div class="wrap">'
        f'<h1>{escape(c["tagline"])}</h1>'
        f'<p class="lead">{escape(c["hero_lead"])}</p>'
        f'<p class="note">{escape(c["hero_note"])}</p>'
        '<p style="margin-block-start:2rem">'
        f'<a class="btn" href="mailto:hello@elyox.dev">{escape(c["cta"])}</a></p>'
        "</div></section>"
        '<section class="section" id="work"><div class="wrap">'
        f'<div class="section-head"><h2>{escape(c["work_title"])}</h2><p>{escape(c["work_lead"])}</p></div>'
        f'<div class="work-list">{"".join(rows)}</div>'
        '<p class="note" style="margin-block-start:1.25rem;color:var(--muted);font-size:var(--fs-small)">'
        "صفحات التفاصيل بالإنجليزية.</p>"
        "</div></section>"
        '<section class="section" id="services"><div class="wrap">'
        f'<div class="section-head"><h2>{escape(c["services_title"])}</h2></div>'
        f'<div class="services">{svc}</div>'
        "</div></section></main>"
    )
    return page(lang="ar", title=f'Elyox — {c["tagline"]}', description=c["hero_lead"],
                canonical=f"{SITE.base_url}/ar/", root="../", body=body,
                alternates={"ar": f"{SITE.base_url}/ar/", "en": f"{SITE.base_url}/",
                            "x-default": f"{SITE.base_url}/"})


def not_found():
    c = COPY["en"]
    body = ('<main><section class="hero"><div class="wrap">'
            '<p class="label">404</p>'
            f'<h1>{escape(c["not_found"])}</h1>'
            f'<p style="margin-block-start:2rem"><a class="btn" href="/">{escape(c["not_found_cta"])}</a></p>'
            "</div></section></main>")
    return page(lang="en", title="Not found — Elyox", description=c["not_found"],
                canonical=f"{SITE.base_url}/404.html", body=body)


def write(rel, html):
    path = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(html)


def main():
    os.makedirs(OUT, exist_ok=True)

    # assets are copied, never generated
    import shutil
    dst = os.path.join(OUT, "assets")
    shutil.rmtree(dst, ignore_errors=True)
    shutil.copytree(os.path.join(SRC, "assets"), dst)

    write("index.html", home())
    write("services.html", services_page())
    write("about.html", about_page())
    write("contact.html", contact_page())
    write("404.html", not_found())
    write("ar/index.html", arabic_page())
    for cs in CASES:
        write(f'work/{cs["slug"]}.html', case_page(cs))
    print(f"Generated {4 + len(CASES)} English pages + 1 Arabic page + 404.")

    with open(os.path.join(OUT, "robots.txt"), "w", encoding="utf-8") as fh:
        fh.write(f"User-agent: *\nAllow: /\n\nSitemap: {SITE.base_url}/sitemap.xml\n")

    ledger = LastmodLedger(os.path.join(DATA, "lastmod.json"), OUT)

    def alternates(rel):
        if rel in ("index.html", os.path.join("ar", "index.html")):
            return {"en": f"{SITE.base_url}/", "ar": f"{SITE.base_url}/ar/",
                    "x-default": f"{SITE.base_url}/"}
        return None

    xml = build_sitemap(
        SITE, ledger,
        rules=[(r"^index\.html$", "weekly", "1.0"),
               (r"^work/", "monthly", "0.9"),
               (r"^ar/", "monthly", "0.8"),
               (r"^(services|about|contact)\.html$", "monthly", "0.7")],
        default=("monthly", "0.5"),
        alternates=alternates,
        exclude=[r"^404\.html$"],
    )
    _, n = write_sitemap(SITE, xml)
    print(f"sitemap.xml: {n} URLs")


if __name__ == "__main__":
    main()
