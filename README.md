# Flooring WebPros

Marketing site for Flooring WebPros: websites and lead generation built only for flooring businesses.

Static site (HTML/CSS/JS). No build step.

## Files
- `index.html`, `styles.css`, `main.js`: the homepage
- `frames/`: 132 WebP frames (1280w), scrubbed on scroll in the hero
- `frames-m/`: portrait 600w frames for phones and tall screens
- `favicon.svg`: site icon
- `vercel.json`: cache headers for frames, basic security headers
- `source/`: hero source video and homepage copy doc (not deployed, see `.vercelignore`)

## Preview locally
```bash
python3 -m http.server 8080   # http://localhost:8080
```

## Deploy
Live at https://www.flooringwebpros.com. Vercel deploys on every push to `main`; pull requests get preview links. Project settings: Framework Preset **Other**, Root Directory `./`, no build command, no output directory.

## Before launch
- Contact: WhatsApp +1 (860) 255-1879 (`wa.me/18602551879` links in `index.html` and `src/layout.html`), email info@flooringwebpros.com.
- Lead form: set `data-endpoint` on `<form class="lead-form">` (Formspree, CRM webhook, etc.). Empty = success message only, nothing sent.
- Verify stats (150+, 8+ years, 40+ countries), prices and competitor ranges.
- Portfolio cards are labeled "Demo Design"; swap for real builds. Swap "Our Promise" for real testimonials later.
- Footer links About, Blog, Privacy Policy, Terms point to `#` (pages not built yet).

## Regenerate frames
```bash
ffmpeg -i source/oak-walkthrough.mp4 -vf "select='not(mod(n\,2))',scale=1280:-2" -vsync vfr -c:v libwebp -quality 62 frames/f%03d.webp
ffmpeg -i source/oak-walkthrough.mp4 -vf "select='not(mod(n\,2))',crop=ih*0.75:ih,scale=600:-2" -vsync vfr -c:v libwebp -quality 60 frames-m/f%03d.webp
```
Keep 132 frames or update `FRAMES` in `main.js`.

## Inner pages, blog and policies
Inner pages are generated: edit `src/pages/*.html` (and `src/layout.html` for the shared header/footer), then run `python3 scripts/build.py`.

**Add a blog post:** create `src/blog/<slug>.html` starting with a meta line like the existing posts (`title`, `h1`, `description`, `excerpt`, `date`, `category`, `cover`), write the article with `<h2 id="...">` headings (they become the table of contents), then run the build. The post appears at `/blog/<slug>`, on the blog index and in `sitemap.xml` automatically.

Policy pages: `src/pages/privacy-policy.html`, `terms.html`, `refund-policy.html`. Have them reviewed by a lawyer before relying on them.
