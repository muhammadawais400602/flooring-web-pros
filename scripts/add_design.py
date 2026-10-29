#!/usr/bin/env python3
"""Turn a Stitch export (code.html + DESIGN.md) into a hosted portfolio design.

Usage: python3 scripts/add_design.py <export-dir> <slug> "<Brand name>"

- removes the Tailwind CDN + inline config, writes the config to source/work/<slug>/
- strips the header nav links and header CTA buttons (keeps logo + avatar)
- strips footer columns that list addresses/showrooms
- links the shared animation layer, adds noindex + title
Then compile CSS:  npx tailwindcss -c source/work/<slug>/tailwind.config.js -i source/work/in.css -o work/<slug>/style.css --minify
"""
import re, sys, pathlib, shutil

src, slug, brand = pathlib.Path(sys.argv[1]), sys.argv[2], sys.argv[3]
EXTRA = sys.argv[4] if len(sys.argv) > 4 else ''   # extra footer-column regex to drop
KEEP = sys.argv[5] if len(sys.argv) > 5 else ''    # footer-column regex to always keep
REPORT = []
root = pathlib.Path(__file__).resolve().parent.parent
s = (src / 'code.html').read_text()
srcdir = root / 'source/work' / slug; srcdir.mkdir(parents=True, exist_ok=True)
(srcdir / 'original.html').write_text(s)
if (src / 'DESIGN.md').exists(): shutil.copy(src / 'DESIGN.md', srcdir / 'DESIGN.md')

cfg = re.search(r'tailwind\.config\s*=\s*(\{.*?\});?\s*</script>', s, re.S).group(1)
(srcdir / 'tailwind.config.js').write_text(
    'module.exports=' + re.sub(r'(["\']?)theme\1\s*:\s*\{', lambda m: f'content:["./work/{slug}/index.html"],' + m.group(0), cfg, count=1) + ';\n')
s = re.sub(r'<script src="https://cdn\.tailwindcss\.com[^"]*"></script>', '', s)
s = re.sub(r'<script id="tailwind-config">.*?</script>', '', s, flags=re.S)

# Header: drop nav + CTA links/buttons. Keep the logo: the first <a> only if it
# comes before the nav position (a logo link), plus images (avatar).
def clean_header(m):
    h = m.group(0)
    nav = re.search(r'<nav\b.*?</nav>', h, re.S)
    cut = nav.start() if nav else len(h)
    h = re.sub(r'<nav\b.*?</nav>', '', h, flags=re.S)
    first = re.search(r'<a\b.*?</a>', h, re.S)
    keep = first.group(0) if first and first.start() < cut and '<span' in first.group(0) else None
    for a in re.findall(r'<a\b.*?</a>', h, re.S):
        if a != keep: REPORT.append('header link: ' + ' '.join(re.sub(r'<[^>]+>', ' ', a).split())[:50])
    h = re.sub(r'<a\b.*?</a>', lambda a: a.group(0) if a.group(0) == keep else '', h, flags=re.S)
    h = re.sub(r'<button\b.*?</button>', '', h, flags=re.S)
    return h
s = re.sub(r'<header\b.*?</header>', clean_header, s, count=1, flags=re.S)

def div_end(html, start):
    """Index just after the </div> that closes the <div> starting at `start`."""
    depth, i = 0, start
    for t in re.finditer(r'<div\b|</div>', html[start:]):
        depth += 1 if t.group(0) == '<div' else -1
        if depth == 0: return start + t.end()
    return len(html)

# Footer: work on the direct children of the footer's grid (its columns). Drop a column
# (never the first/brand one) when its heading text names showrooms/locations/addresses.
KEY = r'(showroom|atelier|salon|location|address|visit us|studios?\b|galler(y|ia)|offices?\b|sawmill|yards?\b' + ('|' + EXTRA if EXTRA else '') + ')'
NOT = r'(gazette|newsletter|dispatch|subscribe|inquir|register' + ('|' + KEEP if KEEP else '') + ')'
def children(html, start):
    """(start, end) of each direct child <div> of the div starting at `start`."""
    open_end = html.index('>', start) + 1
    out, i, end = [], open_end, div_end(html, start) - len('</div>')
    while True:
        m = re.compile(r'<div\b').search(html, i, end)
        if not m: break
        e = div_end(html, m.start()); out.append((m.start(), e)); i = e
    return out
def clean_footer(m):
    f = m.group(0)
    g = re.search(r'<div class="([^"]*\bgrid\b[^"]*grid-cols-[^"]*)"', f)
    if not g: return f
    cols = children(f, g.start())
    drop = []
    for k, (cs, ce) in enumerate(cols):
        if k == 0: continue
        txt = ' '.join(re.sub(r'<[^>]+>', ' ', f[cs:ce]).split())
        head = txt[:60]
        if re.search(KEY, head, re.I) and not re.search(NOT, head, re.I):
            drop.append((cs, ce)); REPORT.append('footer column: ' + head[:45])
    if not drop: return f
    f0 = f
    for cs, ce in reversed(drop): f = f[:cs] + f[ce:]
    cls = g.group(1)
    def span(cs, ce):
        m2 = re.match(r'<div class="[^"]*\blg:col-span-(\d+)', f0[cs:ce])
        return int(m2.group(1)) if m2 else 1
    new = cls
    for bp in ('lg', 'md'):
        m3 = re.search(rf'\b{bp}:grid-cols-(\d+)', cls)
        if not m3: continue
        if m3.group(1) == '12':      # 12-col layouts: drop spans so remaining columns share evenly
            f = re.sub(rf'\b{bp}:col-span-\d+\b', '', f)
            new = new.replace(m3.group(0), f'{bp}:grid-cols-{len(cols) - len(drop)}')
        elif bp == 'lg':
            n = int(m3.group(1)) - sum(span(cs, ce) for cs, ce in drop)
            new = new.replace(m3.group(0), f'lg:grid-cols-{max(1, n)}')
        break
    return f.replace(cls, new, 1)
s = re.sub(r'<footer\b.*?</footer>', clean_footer, s, count=1, flags=re.S)

title = f'<title>{brand} — design by Flooring WebPros</title>'
s = re.sub(r'<title>.*?</title>', '', s, flags=re.S)
s = s.replace('<meta charset="utf-8"/>', '<meta charset="utf-8"/>' + title, 1)
s = s.replace('</head>', '<link rel="stylesheet" href="style.css"/><link rel="stylesheet" href="/work/_shared/anim.css"/>'
              '<meta name="robots" content="noindex"/><script src="/work/_shared/anim.js" defer></script></head>', 1)
out = root / 'work' / slug; out.mkdir(parents=True, exist_ok=True)
(out / 'index.html').write_text(s)
print('wrote', out / 'index.html'); [print('  removed', r) for r in REPORT]
