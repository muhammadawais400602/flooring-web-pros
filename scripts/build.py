#!/usr/bin/env python3
"""Build inner pages, blog and sitemap.

  src/pages/*.html + src/layout.html  -> <name>.html at repo root
  src/blog/*.html  (articles)         -> blog/<name>.html  (served at /blog/<name>)

Each source file starts with a JSON meta comment:
<!--meta {"title": "...", "description": "...", "path": "/services", "schema": {...optional JSON-LD...}} -->

Blog articles also need: "date" (YYYY-MM-DD), "category", "cover" (image path), "excerpt".
In src/pages, {{posts}} is replaced with the article cards and a <!--toc--> marker
with a table of contents built from the page's <h2 id="..."> headings.
styles.css is inlined into every page (and the homepage) at build time.
Run: python3 scripts/build.py
"""
import json, re, pathlib, html, datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://www.flooringwebpros.com"
NAV = [("/services", "Services"), ("/who-we-serve", "Who We Serve"), ("/portfolio", "Portfolio"),
       ("/pricing", "Pricing"), ("/how-it-works", "How It Works"), ("/about", "About"), ("/faq", "FAQ")]

FALLBACK = {"/services": "services", "/who-we-serve": "who", "/portfolio": "portfolio",
            "/pricing": "pricing", "/how-it-works": "how", "/faq": "faq"}
# ---------- Structured data (schema.org JSON-LD) ----------
# One Organization + WebSite entity, referenced by @id from every page, so search engines and
# AI assistants resolve "Flooring WebPros" as a single business. Facts only: no ratings,
# address or hours we don't have.
ORG_ID, WEBSITE_ID = SITE + "/#organization", SITE + "/#website"
ORG = {"@id": ORG_ID}
WHATSAPP = "https://wa.me/18602551879"
# Official social profiles (shown in the footer and in Organization.sameAs)
SOCIAL = ["https://www.instagram.com/flooringwebpro/"]
ORG_NODE = {
    "@type": "Organization", "@id": ORG_ID, "name": "Flooring WebPros",
    "alternateName": ["FlooringWebPros", "Flooring Web Pros"], "url": SITE + "/",
    "logo": {"@type": "ImageObject", "url": SITE + "/images/brand/favicon-512.png", "width": 512, "height": 512},
    "image": SITE + "/frames/f132.webp",
    "description": "Flooring WebPros builds fast, mobile-first websites and runs local SEO, Google Business Profile "
                   "and AI search optimization only for flooring businesses in the United States.",
    "slogan": "Websites built only for flooring businesses.",
    "email": "info@flooringwebpros.com",
    "sameAs": SOCIAL,
    "areaServed": {"@type": "Country", "name": "United States"},
    "contactPoint": {"@type": "ContactPoint", "contactType": "customer service", "telephone": "+1-860-255-1879",
                     "email": "info@flooringwebpros.com", "url": WHATSAPP, "availableLanguage": "English",
                     "areaServed": "US"},
    "knowsAbout": ["Flooring website design", "Local SEO for flooring contractors", "Google Business Profile optimization",
                   "AI search optimization", "Hardwood flooring marketing", "Carpet installer marketing",
                   "LVP and laminate flooring marketing", "Tile and stone marketing", "Epoxy flooring marketing",
                   "Floor refinishing marketing", "Flooring showroom marketing", "Commercial flooring marketing"],
}
WEBSITE_NODE = {"@type": "WebSite", "@id": WEBSITE_ID, "url": SITE + "/", "name": "Flooring WebPros",
                "description": "Websites, local SEO and AI search visibility built only for flooring businesses.",
                "publisher": ORG, "inLanguage": "en-US"}

PLANS = [
    ("launch", "Launch", 60, "Establish your online presence: professional website design and development, website hosting and "
                             "maintenance, a 90+ Google PageSpeed score on desktop and mobile, and an online estimate request form."),
    ("build", "Build", 80, "Everything in Launch, plus Google Business Profile setup and management, local SEO optimization, "
                           "AI search visibility optimization and an AI-enabled chat feature on your website."),
    ("scale", "Scale", 120, "Everything in Build, plus Facebook and Instagram setup and maintenance, 4-6 social media posts "
                            "per month and 4 Google Business Profile posts per month."),
]
SERVICES = [
    ("websites", "Custom Flooring Websites", "Website design", "Mobile-first, fast websites designed around a flooring business's services, area and best work."),
    ("local-seo", "Local SEO", "Search engine optimization", "Ranking flooring businesses for service and city searches like hardwood floor installation in their area."),
    ("google-business", "Google Business Profile Optimization", "Local search optimization", "Setup, cleanup and management of a flooring business's Google Business Profile to show up in the Map Pack."),
    ("lead-capture", "Estimate & Lead Capture", "Conversion optimization", "Estimate request forms and WhatsApp contact buttons that turn visitors into estimate requests."),
    ("galleries", "Project Galleries & Before/After", "Web development", "Filterable project galleries and drag-to-compare before/after sliders."),
    ("reviews", "Review Generation", "Reputation management", "Automated text and email review requests for happy flooring customers (add-on)."),
    ("google-ads", "Google Ads & Landing Pages", "Pay-per-click advertising", "Paid search landing pages built to convert for flooring businesses (add-on)."),
    ("care", "Hosting, Security & Care", "Website maintenance", "Hosting, SSL, backups, security updates and edits handled for you."),
]
CRUMBS = {"/blog": "Blog", "/privacy-policy": "Privacy Policy", "/terms": "Terms of Service",
          "/refund-policy": "Refund & Cancellation Policy"}


def offer(slug, name, price, desc):
    return {"@type": "Offer", "@id": f"{SITE}/pricing#{slug}", "name": name, "description": desc,
            "price": price, "priceCurrency": "USD", "availability": "https://schema.org/InStock",
            "priceSpecification": {"@type": "UnitPriceSpecification", "price": price, "priceCurrency": "USD",
                                   "unitCode": "MON", "unitText": "month"},
            "seller": ORG}


def page_graph(meta):
    """Site-wide nodes + this page's WebPage (+ breadcrumb) + page-specific nodes from meta["schema"]."""
    url = SITE + ("/" if meta["path"] == "/" else meta["path"])
    extra = meta.get("schema") or {}
    nodes = list(extra.get("@graph", [extra] if extra else []))
    nodes = [{k: v for k, v in n.items() if k != "@context"} for n in nodes]
    page = {"@type": meta.get("pagetype", "WebPage"), "@id": url + "#webpage", "url": url,
            "name": meta.get("h1") or meta["title"].split(" | ")[0], "description": meta["description"],
            "isPartOf": {"@id": WEBSITE_ID}, "about": ORG, "inLanguage": "en-US"}
    for n in list(nodes):
        if n.get("@type") == "FAQPage":   # the FAQ page *is* the FAQPage
            page.update({"@type": "FAQPage", "mainEntity": n["mainEntity"]}); nodes.remove(n)
    has_crumbs = any(n.get("@type") == "BreadcrumbList" for n in nodes)
    graph = [ORG_NODE, WEBSITE_NODE, page]
    if meta["path"] != "/" and not has_crumbs:
        label = dict(NAV).get(meta["path"]) or CRUMBS.get(meta["path"]) or meta["title"].split(" | ")[0]
        graph.append({"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": label, "item": url}]})
    return {"@context": "https://schema.org", "@graph": graph + nodes}


def ld_json(data):
    # escape "</" so text inside JSON can never close the <script> element
    return '  <script type="application/ld+json">\n' + json.dumps(data, indent=2, ensure_ascii=False).replace("</", "<\\/") + "\n  </script>"

CSS_START = "<!-- build:inline-css styles.css"
CSS_END = "<!-- /build:inline-css -->"


def minify_css(css):
    """Conservative minifier: drop comments and collapse whitespace, leaving quoted strings untouched."""
    out, i, n = [], 0, len(css)
    while i < n:
        c = css[i]
        if c in "\"'":
            j = i + 1
            while j < n and css[j] != c:
                j += 2 if css[j] == "\\" else 1
            out.append(css[i:j + 1]); i = j + 1
        elif css.startswith("/*", i):
            j = css.find("*/", i + 2); i = n if j == -1 else j + 2
        elif c.isspace():
            while i < n and css[i].isspace(): i += 1
            out.append(" ")
        else:
            out.append(c); i += 1
    css = "".join(out)
    # tighten around braces and semicolons only (never around ':' or operators, which can change meaning)
    css = re.sub(r"\s*([{};])\s*", r"\1", css)
    return css.replace(";}", "}").strip()


def inline_css(html_text):
    """Fill the build:inline-css block with styles.css (minified) so pages render without waiting for a stylesheet request."""
    css = minify_css((ROOT / "styles.css").read_text())
    a = html_text.index(CSS_START)
    a = html_text.index("-->", a) + 3
    b = html_text.index(CSS_END, a)
    return html_text[:a] + "\n  <style>\n" + css + "\n  </style>\n  " + html_text[b:]


layout = inline_css((ROOT / "src/layout.html").read_text())


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
    schema = "" if meta.get("noindex") else ld_json(page_graph(meta))
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
    if meta.get("noindex"):
        out = out.replace("</head>", '  <meta name="robots" content="noindex" />\n</head>', 1)
    out_path.write_text(out)
    print("built", out_path.relative_to(ROOT))


def quick_answer(p):
    """'Quick answer' box: a short, direct answer at the top of a post (the part AI search tends to quote)."""
    if not p.get("summary"):
        return ""
    return (f'          <div class="quick-answer"><p class="qa-label">Quick answer</p>'
            f'<p>{html.escape(p["summary"])}</p></div>\n')


def faq_html(p):
    """FAQ section at the end of a post; the same Q&As go into FAQPage structured data."""
    if not p.get("faq"):
        return ""
    items = "".join(f'<h3>{html.escape(q)}</h3><p>{a}</p>' for q, a in p["faq"])
    return f'          <h2 id="faq">Frequently asked questions</h2>\n          <div class="post-faq">{items}</div>'


# ---------- Blog articles ----------
posts = []
for f in sorted((ROOT / "src/blog").glob("*.html")):
    meta, body = read(f)
    words = len(re.sub(r"<[^>]+>", " ", body + meta.get("summary", "") + " ".join(q + a for q, a in meta.get("faq", []))).split())
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
        <p class="post-meta">By Flooring WebPros Team · <time datetime="{p["date"]}">{nice_date(p["date"])}</time>{f' · Updated <time datetime="{p["updated"]}">{nice_date(p["updated"])}</time>' if p.get("updated") and p["updated"] != p["date"] else ""} · {p["minutes"]} min read</p>
      </div>
    </section>

    <section class="section post-section">
      <div class="wrap post-layout">
        <article class="prose">
{quick_answer(p)}{p["body"].rstrip()}
{faq_html(p)}
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
            <p>Websites, local SEO and Google Business Profile management from 60/month.</p>
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
    faq_node = ([{"@type": "FAQPage", "@id": SITE + p["path"] + "#faq", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"<[^>]+>", "", a)}}
        for q, a in p["faq"]]}] if p.get("faq") else [])
    p["schema"] = {"@context": "https://schema.org", "@graph": faq_node + [
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
    if "<!--quick-->" in body:
        body = body.replace("<!--quick-->", quick_answer(meta))
    if "<!--faq-->" in body:
        body = body.replace("<!--faq-->", faq_html(meta))
    if "<!--toc-->" in body:
        body = body.replace("<!--toc-->", toc(body))
    if meta.get("faq") and meta["path"] != "/faq":
        faq_node = {"@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"<[^>]+>", "", a)}}
            for q, a in meta["faq"]]}
        extra = meta.get("schema") or {}
        meta["schema"] = {"@graph": list(extra.get("@graph", [extra] if extra else [])) + [faq_node]}
    if meta.get("service"):   # money pages: a Service node for the page's offer
        sv = meta["service"]
        node = {"@type": "Service", "@id": SITE + meta["path"] + "#service", "name": sv["name"], "serviceType": sv["type"],
                "description": meta["description"], "url": SITE + meta["path"], "provider": ORG,
                "areaServed": {"@type": "Country", "name": "United States"},
                "offers": [{"@id": f"{SITE}/pricing#{pl[0]}"} for pl in PLANS]}
        extra = meta.get("schema") or {}
        meta["schema"] = {"@graph": [node] + list(extra.get("@graph", [extra] if extra else []))}
    if meta["path"] == "/pricing":
        meta["schema"] = {"@type": "OfferCatalog", "@id": SITE + "/pricing#plans", "name": "Flooring WebPros plans",
                          "url": SITE + "/pricing", "itemListElement": [offer(*pl) for pl in PLANS]}
    if meta["path"] == "/services":
        meta["schema"] = {"@type": "ItemList", "@id": SITE + "/services#list", "name": "Flooring WebPros services",
                          "itemListElement": [{"@type": "ListItem", "position": i + 1, "item": {
                              "@type": "Service", "@id": f"{SITE}/services#{a}", "name": nm, "serviceType": st,
                              "description": d, "url": f"{SITE}/services#{a}", "provider": ORG,
                              "areaServed": {"@type": "Country", "name": "United States"}}}
                              for i, (a, nm, st, d) in enumerate(SERVICES)]}
    if meta["path"] == "/portfolio":
        work = re.findall(r'data-cat="([^"]+)">\s*<button[^>]*data-live="/work/([^/]+)/".*?<h3>(.*?)</h3>\s*<p>(.*?)</p>', body, re.S)
        meta["schema"] = {"@type": "ItemList", "@id": SITE + "/portfolio#designs", "name": "Flooring WebPros portfolio",
                          "numberOfItems": len(work), "itemListElement": [{"@type": "ListItem", "position": i + 1, "item": {
                              "@type": "CreativeWork", "name": html.unescape(nm), "url": f"{SITE}/work/{slug}/",
                              "genre": html.unescape(cat), "description": html.unescape(d),
                              "image": f"{SITE}/images/work/{slug}.webp", "creator": ORG}}
                              for i, (cat, slug, nm, d) in enumerate(work)]}
    if meta["path"] == "/about":
        meta["pagetype"] = "AboutPage"
    if meta["path"] == "/blog":
        meta["schema"] = {"@context": "https://schema.org", "@type": "Blog", "name": "Flooring WebPros Blog",
                          "url": SITE + "/blog", "publisher": ORG,
                          "blogPost": [{"@type": "BlogPosting", "headline": p["h1"], "url": SITE + p["path"], "datePublished": p["date"]} for p in posts]}
    render(meta, body, ROOT / page.name)
    if not meta.get("noindex"):
        page_paths.append(meta["path"])

# ---------- Homepage (hand-written): refresh its inlined CSS ----------
home = ROOT / "index.html"
home_html = inline_css(home.read_text())
home_meta = {"path": "/", "title": "Flooring WebPros", "h1": "Websites built only for flooring businesses",
             "description": "Websites, local SEO and AI search visibility built only for flooring businesses.",
             "schema": {"@type": "ProfessionalService", "@id": SITE + "/#business", "name": "Flooring WebPros",
                        "url": SITE + "/", "image": SITE + "/frames/f132.webp", "logo": SITE + "/images/brand/favicon-512.png",
                        "description": ORG_NODE["description"], "email": "info@flooringwebpros.com",
                        "telephone": "+1-860-255-1879", "priceRange": "60-120 USD per month",
                        "areaServed": {"@type": "Country", "name": "United States"}, "parentOrganization": ORG,
                        "makesOffer": [{"@id": f"{SITE}/pricing#{pl[0]}"} for pl in PLANS]}}
home_html = re.sub(r'  <script type="application/ld\+json">.*?</script>', lambda _: ld_json(page_graph(home_meta)), home_html, count=1, flags=re.S)
home.write_text(home_html)
print("refreshed index.html (inlined CSS + structured data)")

# ---------- llms.txt: a plain-language map of the site for AI assistants ----------
plan_lines = "\n".join(f"- {nm}: {price} USD/month. {desc}" for _, nm, price, desc in PLANS)
page_lines = "\n".join(f"- [{label}]({SITE}{path})" for path, label in NAV)
GUIDE_PAGES = [m for m in (read(f)[0] for f in sorted((ROOT / "src/pages").glob("*.html"))) if m.get("service") or m.get("guide")]
guide_lines = "\n".join(f"- [{m['h1']}]({SITE}{m['path']}): {m['description']}" for m in GUIDE_PAGES)
post_lines = "\n".join(f"- [{p['h1']}]({SITE}{p['path']}): {p['excerpt']}" for p in posts)
(ROOT / "llms.txt").write_text(f"""# Flooring WebPros

> Flooring WebPros builds fast, mobile-first websites and runs local SEO, Google Business Profile and AI search
> optimization only for flooring businesses in the United States: hardwood, carpet, tile and stone, LVP and laminate,
> epoxy, refinishing, showrooms and commercial flooring. Monthly plans from 60 USD, no build fee, no long-term
> contract, and a free homepage mockup before you pay.

## Plans
{plan_lines}

## Pages
- [Home]({SITE}/)
{page_lines}
- [Blog]({SITE}/blog)

## Flooring website guides
{guide_lines}

## Blog
{post_lines}

## Policies
- [Terms of Service]({SITE}/terms)
- [Refund & Cancellation Policy]({SITE}/refund-policy)
- [Privacy Policy]({SITE}/privacy-policy)

## Contact
- WhatsApp: +1 (860) 255-1879 ({WHATSAPP})
- Email: info@flooringwebpros.com
""")
print("built llms.txt")

# ---------- Sitemap ----------
import subprocess


def last_changed(*files):
    """Date (YYYY-MM-DD) the newest of these source files was last committed; today if uncommitted/unknown."""
    dates = []
    for f in files:
        try:
            out = subprocess.run(["git", "log", "-1", "--format=%cs", "--", str(f)], cwd=ROOT,
                                 capture_output=True, text=True, timeout=10).stdout.strip()
        except Exception:
            out = ""
        dates.append(out or datetime.date.today().isoformat())
    return max(dates)


shared = [ROOT / "src/layout.html", ROOT / "styles.css"]
entries = [(SITE + "/", last_changed(ROOT / "index.html"))]
entries += [(SITE + path, last_changed(ROOT / "src/pages" / f"{path.strip('/')}.html", *shared)) for path in page_paths]
entries += [(SITE + p["path"], max(p.get("updated", p["date"]), last_changed(ROOT / "src/blog" / f"{p['slug']}.html"))) for p in posts]
(ROOT / "sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "".join(f"  <url><loc>{loc}</loc><lastmod>{mod}</lastmod></url>\n" for loc, mod in entries) + "</urlset>\n")
print("built sitemap.xml")
