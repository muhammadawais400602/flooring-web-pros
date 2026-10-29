#!/usr/bin/env python3
"""Write work/<slug>/style-preview.css for every hosted design: same as style.css but
viewport-height units (vh/svh/dvh/lvh) resolved against a 900px-tall desktop screen.
Used only by the scaled portfolio card preview (?static), where the iframe is the full
page height and real vh units would make 'full-screen' sections enormous.
Run after compiling a design's style.css:  python3 scripts/preview_css.py"""
import re, pathlib
VH = 900
root = pathlib.Path(__file__).resolve().parent.parent / 'work'
for css in sorted(root.glob('*/style.css')):
    s = css.read_text()
    out = re.sub(r'(-?\d*\.?\d+)(?:s|d|l)?vh\b', lambda m: f'{float(m.group(1)) * VH / 100:g}px', s)
    (css.parent / 'style-preview.css').write_text(out)
    print(css.parent.name, 'vh->px:', len(re.findall(r'\d(?:s|d|l)?vh\b', s)))
