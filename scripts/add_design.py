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
root = pathlib.Path(__file__).resolve().parent.parent
s = (src / 'code.html').read_text()
srcdir = root / 'source/work' / slug; srcdir.mkdir(parents=True, exist_ok=True)
(srcdir / 'original.html').write_text(s)
if (src / 'DESIGN.md').exists(): shutil.copy(src / 'DESIGN.md', srcdir / 'DESIGN.md')

cfg = re.search(r'tailwind\.config\s*=\s*(\{.*?\});?\s*</script>', s, re.S).group(1)
(srcdir / 'tailwind.config.js').write_text(
    'module.exports=' + cfg.replace('theme:{', f'content:["./work/{slug}/index.html"],theme:{{', 1) + ';\n')
s = re.sub(r'<script src="https://cdn\.tailwindcss\.com[^"]*"></script>', '', s)
s = re.sub(r'<script id="tailwind-config">.*?</script>', '', s, flags=re.S)

# Header: drop nav + any CTA links/buttons, keep the first (logo) link and images
def clean_header(m):
    h = m.group(0)
    h = re.sub(r'<nav\b.*?</nav>', '', h, flags=re.S)
    first = re.search(r'<a\b.*?</a>', h, re.S)
    keep = first.group(0) if first else ''
    h = re.sub(r'<a\b.*?</a>', lambda a: a.group(0) if a.group(0) == keep else '', h, flags=re.S)
    h = re.sub(r'<button\b.*?</button>', '', h, flags=re.S)
    return h
s = re.sub(r'<header\b.*?</header>', clean_header, s, count=1, flags=re.S)

# Footer: drop columns whose heading mentions showrooms / addresses
KEY = r'(showroom|atelier|salon|location|address|visit us|studios?\b)'
def clean_footer(m):
    f = m.group(0)
    grid = re.search(r'(<div class="[^"]*grid[^"]*lg:grid-cols-(\d+)[^"]*">)', f)
    removed = 0
    while True:
        # a column = a div whose first child is a heading/span with the keyword
        col = re.search(r'<div class="[^"]*flex flex-col[^"]*"><(h\d|span)[^>]*>[^<]*' + KEY + r'[^<]*</\1>.*?</div>(?=<div|</div>)', f, re.S | re.I)
        if not col: break
        f = f[:col.start()] + f[col.end():]; removed += 1
    if grid and removed:
        n = int(grid.group(2)); f = f.replace(f'lg:grid-cols-{n}', f'lg:grid-cols-{max(1, n - removed)}', 1)
    return f
s = re.sub(r'<footer\b.*?</footer>', clean_footer, s, count=1, flags=re.S)

title = f'<title>{brand} — design by Flooring WebPros</title>'
s = re.sub(r'<title>.*?</title>', '', s, flags=re.S)
s = s.replace('<meta charset="utf-8"/>', '<meta charset="utf-8"/>' + title, 1)
s = s.replace('</head>', '<link rel="stylesheet" href="style.css"/><link rel="stylesheet" href="/work/_shared/anim.css"/>'
              '<meta name="robots" content="noindex"/><script src="/work/_shared/anim.js" defer></script></head>', 1)
out = root / 'work' / slug; out.mkdir(parents=True, exist_ok=True)
(out / 'index.html').write_text(s)
print('wrote', out / 'index.html')
