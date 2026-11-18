#!/usr/bin/env python3
"""Freeze the pre-redesign site into src/classic/ for the old/new look switch.

Usage: build the old site first (origin/main before the redesign merge, with
the location patched to Austin), then:
    python3 design/classic/make_snapshot.py <old-site-_site-dir> <old-site-src-dir>

What it does:
- copies the 10 built pages to src/classic/<page>/index.html
- copies the old-only CSS/JS/logos (deleted by the redesign) under classic/assets/
- rewrites page links to stay inside /classic/, and old-only assets to their new place
- adds noindex + a canonical link to the new page, the shared switch CSS/JS, and the
  "New look" button
Images, audio and PDFs keep pointing at /assets/…, which the new site still serves.
"""
import os, re, shutil, sys

old_site, old_src = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
repo = os.path.dirname(os.path.dirname(here))
out = os.path.join(repo, "src", "classic")
SITE_URL = "https://home.dericilab.live"
PAGES = ["", "cv", "homelab", "content", "bike", "music", "artsy", "travel", "arch", "masters"]
OLD_ONLY = ["assets/css/caner.css", "assets/css/lightbox.css",
            "assets/js/jquery-1.11.0.min.js", "assets/js/lightbox.min.js", "assets/js/caner.js",
            "assets/img/content/yt_logo.png", "assets/img/content/twitch.png"]

def icon(name):
    svg = open(os.path.join(repo, "src/_includes/icons", name + ".svg")).read()
    svg = re.sub(r"<!--.*?-->", "", svg, flags=re.S)
    svg = re.sub(r"\s+", " ", svg).replace("> <", "><").strip()
    svg = re.sub(r'<svg\b[^>]*>', lambda m: re.sub(r'\s(class|width|height)="[^"]*"', "", m.group(0)), svg, count=1)
    return svg.replace("<svg", '<svg aria-hidden="true" focusable="false"', 1)

if os.path.exists(out):
    shutil.rmtree(out)
for rel in OLD_ONLY:
    dst = os.path.join(out, rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(os.path.join(old_src, rel), dst)

slugs = "|".join(p for p in PAGES if p)
button_icon = icon("sparkles")
for page in PAGES:
    html = open(os.path.join(old_site, page, "index.html"), encoding="utf-8").read()
    new_url = f"/{page}/" if page else "/"
    # page links stay inside the classic snapshot
    html = re.sub(r'href="/"', 'href="/classic/"', html)
    html = re.sub(rf'href="/({slugs})/?(#[^"]*)?"', lambda m: f'href="/classic/{m[1]}/{m[2] or ""}"', html)
    # old-only assets moved under /classic/
    for rel in OLD_ONLY:
        html = html.replace(f'"/{rel}"', f'"/classic/{rel}"')
    head = (f'  <meta name="robots" content="noindex">\n'
            f'  <link rel="canonical" href="{SITE_URL}{new_url}">\n'
            f'  <link rel="stylesheet" href="/classic/look-switch.css">\n'
            f'  <script src="/classic/look-switch.js"></script>\n')
    html = html.replace("</head>", head + "</head>", 1)
    button = (f'  <a class="look-switch" href="{new_url}" title="Back to the new design">'
              f'{button_icon}New look</a>\n')
    html = html.replace("</body>", button + "</body>", 1)
    dst = os.path.join(out, page, "index.html")
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, "w", encoding="utf-8").write(html)
print("wrote", out)
