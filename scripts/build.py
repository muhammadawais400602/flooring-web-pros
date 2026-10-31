#!/usr/bin/env python3
"""Build inner pages, blog and sitemap.

  src/pages/*.html + src/layout.html  -> <name>.html at repo root
  src/blog/*.html  (articles)         -> blog/<name>.html  (served at /blog/<name>)

Each source file starts with a JSON meta comment:
<!--meta {"title": "...", "description": "...", "path": "/services", "schema": {...optional JSON-LD...}} -->

Blog articles also need: "date" (YYYY-MM-DD), "category", "cover" (image path), "excerpt".
In src/pages, {{posts}} is replaced with the article cards and a <!--toc--> marker
with a table of contents built from the page's <h2 id="..."> headings.
Run: python3 scripts/build.py
"""
import json, re, pathlib, html, datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://www.flooringwebpros.com"
NAV = [("/services", "Services"), ("/who-we-serve", "Who We Serve"), ("/portfolio", "Portfolio"),
       ("/pricing", "Pricing"), ("/how-it-works", "How It Works"), ("/faq", "FAQ")]

FALLBACK = {"/services": "services", "/who-we-serve": "who", "/portfolio": "portfolio",
            "/pricing": "pricing", "/how-it-works": "how", "/faq": "faq"}
ORG = {"@type": "Organization", "name": "Flooring WebPros", "url": SITE + "/",
       "logo": SITE + "/images/brand/favicon-512.png"}

layout = (ROOT / "src/layout.html").read_text()


def read(path):
    raw = path.read_text()
    m = re.match(r"\s*<!--meta (.*?) -->\n", raw, re.S)
    if not m:
        raise SystemExit(f"{path.name}: missing meta comment")
    return json.loads(m.group(1)), raw[m.end():]


def nice_date(d):
    return datetime.date.fromisoformat(d).strftime("%B %-d, %Y")


def toc(body):
    items = re.findall(r'<h2 id="([^"]+)"[^>]*>(.*?)</h2>', body)
    lis = "".join(f'<li><a href="#{i}">{re.sub("<[^>]+>", "", t)}</a></li>' for i, t in items)
    return f'<nav class="toc" aria-label="On this page"><p class="toc-title">On this page</p><ol>{lis}</ol></nav>'


def render(meta, body, out_path):
    nav = "\n".join(
        f'        <a href="{href}"{" aria-current=\"page\"" if href == meta["path"] or meta["path"].startswith(href + "/") else ""}>{label}</a>'
        for href, label in NAV)
    schema = ""
    if meta.get("schema"):
        schema = '  <script type="application/ld+json">\n' + json.dumps(meta["schema"], indent=2, ensure_ascii=False) + "\n  </script>"
    out = layout
    for key, val in {"title": meta["title"], "description": meta["description"], "path": meta["path"],
                     "ogtype": meta.get("ogtype", "website"), "ogimage": meta.get("cover", "/frames/f132.webp"),
                     "site": SITE, "nav": nav, "scripts": "".join(f'\n  <script src="{u}" defer></script>' for u in meta.get("scripts", [])),
                     "schema": schema, "body": body.rstrip()}.items():
        out = out.replace("{{" + key + "}}", val)
    # Links to pages not built yet fall back to their homepage section
    for path, anchor in FALLBACK.items():
        if not (ROOT / "src/pages" / f"{path[1:]}.html").exists():
            out = re.sub(rf'href="{re.escape(path)}(#[^"]*)?"', f'href="/#{anchor}"', out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(out)
    print("built", out_path.relative_to(ROOT))


# ---------- Blog articles ----------
posts = []
for f in sorted((ROOT / "src/blog").glob("*.html")):
    meta, body = read(f)
    words = len(re.sub(r"<[^>]+>", " ", body).split())
    meta.update(slug=f.stem, path=f"/blog/{f.stem}", body=body, minutes=max(1, round(words / 220)))
    posts.append(meta)
posts.sort(key=lambda p: p["date"], reverse=True)


def card(p, featured=False):
    e = html.escape
    return (f'<article class="post-card{" post-card-feat" if featured else ""} reveal" data-cat="{e(p["category"])}">'
            f'<a class="post-card-link" href="{p["path"]}">'
            f'<span class="post-card-img"><img src="{p["cover"]}" alt="" width="1200" height="750" loading="lazy" decoding="async" /></span>'
            f'<span class="post-card-body"><span class="post-cat">{e(p["category"])}</span>'
            f'<span class="post-card-title">{e(p["title_short"] if "title_short" in p else p["h1"])}</span>'
            f'<span class="post-card-excerpt">{e(p["excerpt"])}</span>'
            f'<span class="post-meta">{nice_date(p["date"])} · {p["minutes"]} min read</span></span></a></article>')


for p in posts:
    e = html.escape
    related = [q for q in posts if q is not p][:3]
    body = f'''    <section class="page-hero post-hero" style="--hero:url('{p["cover"]}')">
      <div class="wrap">
        <p class="crumbs"><a href="/">Home</a> / <a href="/blog">Blog</a> / {e(p["category"])}</p>
        <p class="post-cat">{e(p["category"])}</p>
        <h1>{e(p["h1"])}</h1>
        <p class="lede">{e(p["excerpt"])}</p>
        <p class="post-meta">By Flooring WebPros · <time datetime="{p["date"]}">{nice_date(p["date"])}</time> · {p["minutes"]} min read</p>
      </div>
    </section>

    <section class="section post-section">
      <div class="wrap post-layout">
        <article class="prose">
{p["body"].rstrip()}
          <div class="post-cta">
            <h2 class="post-cta-title">Want this done for you?</h2>
            <p>We build websites and run local SEO for flooring businesses only. Send us a message and we'll tell you honestly what would help your business most.</p>
            <div class="btn-row"><a class="btn btn-accent" href="https://wa.me/18602551879?text=Hi%20Flooring%20WebPros%2C%20I%20just%20read%20your%20blog%20and%20have%20a%20question." target="_blank" rel="noopener">WhatsApp Us</a><a class="btn btn-outline" href="/pricing">See Plans &amp; Pricing</a></div>
          </div>
        </article>
        <aside class="post-aside">
          {toc(p["body"])}
          <div class="aside-card">
            <p class="aside-title">Built for flooring pros</p>
            <p>Websites, local SEO and Google Business Profile management from $59.99/month.</p>
            <a class="btn btn-accent btn-sm" href="/pricing">See Plans</a>
          </div>
        </aside>
      </div>
    </section>

    <section class="section section-cream">
      <div class="wrap">
        <div class="section-head reveal"><p class="eyebrow">Keep reading</p><h2>More for Flooring Pros</h2></div>
        <div class="post-grid">
          {"".join(card(q) for q in related)}
        </div>
      </div>
    </section>'''
    p["schema"] = {"@context": "https://schema.org", "@graph": [
        {"@type": "BlogPosting", "headline": p["h1"], "description": p["description"],
         "image": SITE + p["cover"], "datePublished": p["date"], "dateModified": p.get("updated", p["date"]),
         "author": ORG, "publisher": ORG, "mainEntityOfPage": SITE + p["path"], "articleSection": p["category"]},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog"},
            {"@type": "ListItem", "position": 3, "name": p["h1"], "item": SITE + p["path"]}]}]}
    p["ogtype"] = "article"
    render(p, body, ROOT / "blog" / f"{p['slug']}.html")

# ---------- Pages ----------
cats = sorted({p["category"] for p in posts})
post_html = (f'<div class="blog-filters reveal" role="group" aria-label="Filter articles by topic">'
             f'<button type="button" class="blog-filter" data-cat="all" aria-pressed="true">All</button>'
             + "".join(f'<button type="button" class="blog-filter" data-cat="{html.escape(c)}" aria-pressed="false">{html.escape(c)}</button>' for c in cats)
             + '</div>\n        <div class="post-grid">' + "".join(card(p, i == 0) for i, p in enumerate(posts)) + "</div>")

page_paths = []
for page in sorted((ROOT / "src/pages").glob("*.html")):
    meta, body = read(page)
    body = body.replace("{{posts}}", post_html)
    if "<!--toc-->" in body:
        body = body.replace("<!--toc-->", toc(body))
    if meta["path"] == "/blog":
        meta["schema"] = {"@context": "https://schema.org", "@type": "Blog", "name": "Flooring WebPros Blog",
                          "url": SITE + "/blog", "publisher": ORG,
                          "blogPost": [{"@type": "BlogPosting", "headline": p["h1"], "url": SITE + p["path"], "datePublished": p["date"]} for p in posts]}
    render(meta, body, ROOT / page.name)
    page_paths.append(meta["path"])

# ---------- Sitemap ----------
paths = ["/"] + page_paths + [p["path"] for p in posts]
(ROOT / "sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "".join(f"  <url><loc>{SITE}{p}</loc></url>\n" for p in paths) + "</urlset>\n")
print("built sitemap.xml")
