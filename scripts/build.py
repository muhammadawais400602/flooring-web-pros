#!/usr/bin/env python3
"""Build inner pages: src/pages/*.html + src/layout.html -> <name>.html at repo root.

Each page file starts with a JSON meta comment:
<!--meta {"title": "...", "description": "...", "path": "/services", "schema": {...optional JSON-LD...}} -->
Run: python3 scripts/build.py
"""
import json, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://flooring-web-pros.vercel.app"
NAV = [("/services", "Services"), ("/who-we-serve", "Who We Serve"), ("/portfolio", "Portfolio"),
       ("/pricing", "Pricing"), ("/how-it-works", "How It Works"), ("/faq", "FAQ")]

FALLBACK = {"/services": "services", "/who-we-serve": "who", "/portfolio": "portfolio",
            "/pricing": "pricing", "/how-it-works": "how", "/faq": "faq"}

layout = (ROOT / "src/layout.html").read_text()
for page in sorted((ROOT / "src/pages").glob("*.html")):
    raw = page.read_text()
    m = re.match(r"\s*<!--meta (.*?) -->\n", raw, re.S)
    if not m:
        raise SystemExit(f"{page.name}: missing meta comment")
    meta, body = json.loads(m.group(1)), raw[m.end():]
    nav = "\n".join(
        f'        <a href="{href}"{" aria-current=\"page\"" if href == meta["path"] else ""}>{label}</a>'
        for href, label in NAV)
    schema = ""
    if meta.get("schema"):
        schema = '  <script type="application/ld+json">\n' + json.dumps(meta["schema"], indent=2, ensure_ascii=False) + "\n  </script>"
    out = layout
    for key, val in {"title": meta["title"], "description": meta["description"], "path": meta["path"],
                     "site": SITE, "nav": nav, "schema": schema, "body": body.rstrip()}.items():
        out = out.replace("{{" + key + "}}", val)
    # Links to pages not built yet fall back to their homepage section
    for path, anchor in FALLBACK.items():
        if not (ROOT / "src/pages" / f"{path[1:]}.html").exists():
            out = re.sub(rf'href="{re.escape(path)}(#[^"]*)?"', f'href="/#{anchor}"', out)
    (ROOT / page.name).write_text(out)
    print("built", page.name)

# sitemap
paths = ["/"] + [json.loads(re.match(r"\s*<!--meta (.*?) -->", p.read_text(), re.S).group(1))["path"]
                 for p in sorted((ROOT / "src/pages").glob("*.html"))]
(ROOT / "sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "".join(f"  <url><loc>{SITE}{p}</loc></url>\n" for p in paths) + "</urlset>\n")
print("built sitemap.xml")
