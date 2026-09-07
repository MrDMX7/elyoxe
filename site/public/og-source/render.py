#!/usr/bin/env python3
"""Elyoxe social + icon artwork generator. Writes SVG sources into public/og-source/
and renders the PNGs into public/."""
import os, subprocess, html

# Run from anywhere: SRC is the folder holding this file, PUB is public/ above it.
SRC = os.path.dirname(os.path.abspath(__file__))
if os.path.basename(SRC) != "og-source":          # running from the scratchpad
    SRC = "/root/workspace/web/elyoxe/site/public/og-source"
PUB = os.path.dirname(SRC)
os.makedirs(SRC, exist_ok=True)

# palette (app/globals.css)
INK      = "#141A17"
PAPER    = "#F4F2ED"
SAFFRON  = "#F0BC5A"   # saffron-lit, the on-ink accent
STONE    = "#A3A69F"   # stone-lit
RULE     = "#2E3934"   # rule-ink

AR = "IBM Plex Sans Arabic"
EN = "IBM Plex Sans"
# Google's static cuts name the Medium as its own family ("IBM Plex Mono Medium",
# style Regular), so font-weight:500 on plain "IBM Plex Mono" silently renders the
# Regular. The list satisfies both distributions: Google matches on the first name,
# IBM's own release has one "IBM Plex Mono" family where weight 500 picks the Medium.
MO = "IBM Plex Mono Medium, IBM Plex Mono"

LEDGER = "102 · 2,665 · 7,600 · 9"

# The hero idea, mirrored from content/copy.ts → hero.lines. Kept here rather than
# parsed, because every size and baseline below is fitted to these exact strings;
# check_copy() below shouts if the two ever drift apart.
LINES = {
    "ar": ['هدوءٌ في الواجهة، وهندسةٌ تحتها.', 'البساطة آخر ما يُنجَز.'],
    "en": ['Quiet on the surface, engineered underneath.', 'Simplicity is the last thing built.'],
}

def check_copy():
    import re
    f = os.path.normpath(f"{PUB}/../content/copy.ts")
    try:
        blk = open(f, encoding="utf-8").read()
    except OSError:
        return
    blk = blk[blk.index("hero: {"):]
    for lang in ("ar", "en"):
        m = re.search(lang + r': \["(.+?)", "(.+?)"\]', blk)
        if m and list(m.groups()) != LINES[lang]:
            print(f"!! copy.ts hero.lines[{lang}] no longer matches LINES — "
                  f"update the strings AND re-fit the size/baselines below.\n"
                  f"   copy.ts: {list(m.groups())}\n   here:    {LINES[lang]}")


# ── the mark ────────────────────────────────────────────────────────────────
# Paths copied verbatim from components/Mark.tsx. Ink bbox inside the 0 0 100 100
# viewBox, measured by rendering + trimming: x 8.0 → 96.3, y 26.0 → 77.8.
MARK_INK = dict(x=8.0, y=26.0, w=88.3, h=51.8)

def mark(x, y, h, ink=PAPER, arrow=SAFFRON, sw=3.6):
    """Place the mark so its *ink* box starts at (x, y) and is h tall."""
    s = h / MARK_INK["h"]
    tx = x - MARK_INK["x"] * s
    ty = y - MARK_INK["y"] * s
    return f'''<g transform="translate({tx:.3f} {ty:.3f}) scale({s:.5f})">
    <path fill="{ink}" d="M8 26 h30 v11 H19 v9 h16 v11 H19 v9 h19 v11 H8 z"/>
    <g transform="translate(12 0) skewX(-12)">
      <path fill="{ink}" d="M44 46 h11 L80 77 h-11 z" opacity=".92"/>
      <path fill="{ink}" d="M44 77 h11 L80 46 h-11 z"/>
      <path d="M50 76 L84 34" stroke="{arrow}" stroke-width="{sw}" stroke-linecap="round" fill="none"/>
      <path fill="{arrow}" d="M90 27 L88.6 37.5 L80 30.5 z"/>
    </g>
  </g>'''

def mark_w(h):
    return MARK_INK["w"] * h / MARK_INK["h"]

HEAD = """<!-- Elyoxe — {what}
Fonts are NOT embedded: librsvg resolves families through fontconfig only, and ignores
an @font-face whose src is a file:// or data: URL. Fetch the IBM Plex cuts, then render:

  D=/tmp/plex; mkdir -p $D
  curl -sL -A "Mozilla/5.0" "https://fonts.googleapis.com/css?family=IBM+Plex+Sans:400,500,600,700|IBM+Plex+Mono:400,500"  > $D/f.css
  curl -sL -A "Mozilla/5.0" "https://fonts.googleapis.com/css?family=IBM+Plex+Sans+Arabic:400,500,600,700&subset=arabic"  >> $D/f.css
  i=0; for u in $(grep -o "https://[^)]*" $D/f.css); do curl -sL -A "Mozilla/5.0" "$u" -o $D/plex-$i.ttf; i=$((i+1)); done
  printf '<?xml version="1.0"?><fontconfig><dir>%s</dir><cachedir>%s/cache</cachedir></fontconfig>' $D $D > $D/fonts.conf
  FONTCONFIG_FILE=$D/fonts.conf rsvg-convert -w {w} -h {h} {file} -o out.png

  Two traps in that curl. &subset=arabic is required — without it Google serves the
  Latin-only cut of Plex Sans Arabic and every Arabic glyph comes out a tofu box; check with
  FONTCONFIG_FILE=$D/fonts.conf fc-list ":charset=0646"  (it must list the Arabic files).
  And the UA matters: an IE-era UA gets EOT, a modern browser UA gets woff2, and fontconfig
  reads neither. Plain "Mozilla/5.0" gets .ttf.

Text is live, not outlined, so the copy stays editable — but every size and baseline below
was fitted to the measured ink box of these exact strings in these exact cuts. If a string
changes, re-measure it (render the line alone, then magick line.png -trim -format "%wx%h%X%Y").
Arabic lines need text-anchor="start" TOGETHER WITH direction="rtl": that pair both
right-aligns the line and puts the sentence-final period on its left. Every other
combination gets one of the two wrong, silently.

The whole set — both cards, both icons — regenerates with: python3 og-source/render.py
-->
"""

def write(path, body, what, w, h):
    svg = HEAD.format(what=what, w=w, h=h, file=os.path.basename(path)) + body
    open(path, "w").write(svg)

def preflight():
    """Fail loudly rather than let librsvg silently substitute a face.

    There is no missing-font error to catch: if IBM Plex is off the fontconfig path
    librsvg renders in DejaVu, ~16% wider, and the headline walks off the canvas —
    which happened once during this build. So check both the family AND the weight:
    a family can resolve while the Bold cut is missing, which produces the same class
    of bug at a smaller amplitude. Fix by running the fetch recipe in the SVG headers
    and pointing FONTCONFIG_FILE at the directory holding the .ttf files.
    """
    import shutil
    if not shutil.which("fc-match"):
        print("!! fc-match not found — the fonts cannot be verified; check the output by eye.")
        return
    # query, families that are an acceptable answer, minimum fontconfig weight
    want = [("IBM Plex Sans Arabic:bold",              {"IBM Plex Sans Arabic"},              200),
            ("IBM Plex Sans:bold",                     {"IBM Plex Sans"},                     200),
            ("IBM Plex Mono Medium,IBM Plex Mono:medium",
                                                       {"IBM Plex Mono", "IBM Plex Mono Medium"}, 100)]
    bad = []
    for q, ok, minw in want:
        out = subprocess.run(["fc-match", q, "family", "weight"],
                             capture_output=True, text=True).stdout.strip()
        fam = out.split(":")[0]
        try:
            weight = int(out.rsplit("=", 1)[1])
        except (IndexError, ValueError):
            weight = -1
        if fam not in ok:
            bad.append(f"{q}  →  {out or '(nothing)'}   (wrong family)")
        elif weight < minw:
            bad.append(f"{q}  →  {out}   (family is there, that weight is not)")
    if "IBM Plex Sans Arabic" not in subprocess.run(
            ["fc-list", ":charset=0646", "family"], capture_output=True, text=True).stdout:
        bad.append("IBM Plex Sans Arabic carries no Arabic glyphs — that is the Latin-only "
                   "cut; refetch the css with &subset=arabic")
    if bad:
        raise SystemExit("fontconfig cannot resolve the Plex cuts (FONTCONFIG_FILE=%s):\n  %s"
                         % (os.environ.get("FONTCONFIG_FILE", "<unset>"), "\n  ".join(bad)))


def render(src, out, w, h):
    subprocess.run(["rsvg-convert", "-w", str(w), "-h", str(h), src, "-o", out], check=True)
    subprocess.run(["magick", out, "-strip", "-define", "png:compression-level=9", out], check=True)

# ── OG cards ────────────────────────────────────────────────────────────────
W, H = 1200, 630
M = 80                      # page margin
RULE_TOP = 168
RULE_BOT = 508
LED_BASE = 562
WM_SIZE = 40                # wordmark
MARK_H = 38
GAP = 18

def og(lang):
    rtl = lang == "ar"
    p = []
    p.append(f'<rect width="{W}" height="{H}" fill="{INK}"/>')

    # brand lockup — always internally LTR (.brand sets direction: ltr)
    if rtl:
        wm_right = W - M
        wm_x = wm_right - 120            # measured right-ink offset of "Elyoxe" @40/700
        mark_x = wm_x + 3 - GAP - mark_w(MARK_H)
    else:
        mark_x = M
        wm_x = M + mark_w(MARK_H) + GAP - 3
    wm_base = 102                        # ink centre of the wordmark == ink centre of the mark
    p.append(mark(mark_x, wm_base - 11 - MARK_H / 2, MARK_H))
    p.append(f'<text x="{wm_x:.1f}" y="{wm_base}" font-family="{EN}" font-weight="700" '
             f'font-size="{WM_SIZE}" letter-spacing="-0.4" fill="{PAPER}">Elyoxe</text>')

    # rules
    p.append(f'<path d="M{M} {RULE_TOP}.5 H{W-M}" stroke="{RULE}" stroke-width="1"/>')
    p.append(f'<path d="M{M} {RULE_BOT}.5 H{W-M}" stroke="{RULE}" stroke-width="1"/>')

    # the line
    if rtl:
        # 76/700: ink of line 1 spans baseline-67 → +35, line 2 -81 → +24 (the ٌ of
        # برمجياتٌ and the ّ of وتحقّق are what push the tops up). A 132 leading clears
        # the ج descender of الإنتاج under them. The 223-tall block is centred in the
        # 168 → 508 field between the two rules; the longer line measures 849 of 1040.
        size, b1, b2 = 76, 293, 425
        lines = LINES["ar"]
        for t, b in zip(lines, (b1, b2)):
            p.append(f'<text x="{W-M}" y="{b}" text-anchor="start" direction="rtl" '
                     f'font-family="{AR}" font-weight="700" font-size="{size}" '
                     f'fill="{PAPER}">{html.escape(t)}</text>')
    else:
        # 52/700 at -0.025em: the longer line measures 1018 of the 1040 column — it
        # sets nearly to the rule ends, which is the point. Ink spans baseline-39 → +11;
        # the 108-tall block is centred between the rules.
        size, b1, b2 = 52, 323, 381
        lines = LINES["en"]
        for t, b in zip(lines, (b1, b2)):
            p.append(f'<text x="{M-2}" y="{b}" font-family="{EN}" font-weight="700" '
                     f'font-size="{size}" letter-spacing="{-0.025 * size:.2f}" fill="{PAPER}">{html.escape(t)}</text>')

    # the ledger — mono, LTR in both cards, hugging the margin of the reading side
    if rtl:
        p.append(f'<text x="{W-M}" y="{LED_BASE}" text-anchor="end" direction="ltr" '
                 f'font-family="{MO}" font-weight="500" font-size="26" letter-spacing="1" '
                 f'fill="{SAFFRON}">{html.escape(LEDGER)}</text>')
    else:
        p.append(f'<text x="{M-1}" y="{LED_BASE}" direction="ltr" font-family="{MO}" '
                 f'font-weight="500" font-size="26" letter-spacing="1" '
                 f'fill="{SAFFRON}">{html.escape(LEDGER)}</text>')

    body = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">\n  ' \
           + "\n  ".join(p) + "\n</svg>\n"
    f = f"{SRC}/og-{lang}.svg"
    write(f, body, f"Open Graph card, {'Arabic' if rtl else 'English'} — 1200x630", W, H)
    render(f, f"{PUB}/og-{lang}.png", W, H)

preflight()      # the fonts must resolve before anything is written
check_copy()     # and the cards must still say what content/copy.ts says

for l in ("ar", "en"):
    og(l)

# ── apple touch icon — ink tile, mark only, geometry untouched ──────────────
h = 66.0
w = mark_w(h)
body = f'''<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" fill="{INK}"/>
  {mark((180 - w) / 2, (180 - h) / 2, h)}
</svg>
'''
write(f"{SRC}/apple-touch-icon.svg", body, "apple touch icon — 180x180", 180, 180)
render(f"{SRC}/apple-touch-icon.svg", f"{PUB}/apple-touch-icon.png", 180, 180)

# ── favicon ─────────────────────────────────────────────────────────────────
# The mark's ink box is 1.70:1, so in the old favicon it filled barely half the
# square's height and the arrow was 0.58px wide at 16px — it turned to mud.
# Here the ink is fitted to a 76-unit column (12 units of air each side) and the
# arrow alone is thickened 3.6 → 6 so it survives one physical pixel. Nothing is
# moved or redrawn; the paths are the ones in components/Mark.tsx.
fh = 44.6
fw = mark_w(fh)
body = f'''<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="{INK}"/>
  {mark((100 - fw) / 2, (100 - fh) / 2, fh, sw=6)}
</svg>
'''
write(f"{SRC}/favicon.svg", body, "favicon — square, legible at 16px", 100, 100)
# the shipped copy carries one line of provenance, not the whole re-render recipe
open(f"{PUB}/favicon.svg", "w").write(
    "<!-- Elyoxe mark, ink tile. Source + recipe: /og-source/favicon.svg -->\n" + body)

# the generator itself, so the director can re-run the whole set
import shutil
me = os.path.abspath(__file__)
if me != f"{SRC}/render.py":
    shutil.copyfile(me, f"{SRC}/render.py")
print("done")
