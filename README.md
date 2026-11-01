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
- Lead form posts to `/api/lead` (Hostinger SMTP; see `api/lead.js` for the Vercel env vars).
- Policies (`src/pages/terms.html` etc.): add legal business name, state of formation and a mailing address once decided.
- Homepage trust bar "Rated by flooring pros": revisit once real reviews exist.

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

## Performance (keep PageSpeed 95+ on mobile)
- **`styles.css` is inlined into every page** by `python3 scripts/build.py` (including `index.html`, between the `build:inline-css` markers). After editing `styles.css`, always run the build.
- **Fonts are self-hosted** in `/fonts`. The Material Symbols file is subset to the icons the site uses. If you add a new icon, re-download the subset with the new name added to `icon_names=` (Google Fonts CSS2 API, `display=block`) and replace `fonts/material-symbols-subset.woff2`.
- **Below-the-fold media on the homepage** use `data-src` / `data-srcset` / `data-lazy-bg` (loaded by `main.js` about a screen before they're visible). Use the same attributes for new images there.
- **Hero frames** download after first scroll/touch or 3s after load; frame 1 is shown by CSS until then.
- Portfolio screenshots have `-480.webp` versions for `srcset`.
