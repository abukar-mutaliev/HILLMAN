## 06‑HiLLMAN‑95 — Furniture Assembly (London)

Static, SEO‑ready single‑page website.

### How to use
- Replace `https://example.com` in `index.html`, `robots.txt`, and `sitemap.xml` with your real domain when you have it.
- Put images from the client into `assets/portfolio/` using these names:
  - `bed-with-slide.jpg`
  - `day-bed-drawers.jpg`
  - `media-cabinet-wall.jpg`
  - `bunk-bed-white.jpg`
  - `pax-wardrobe-1.jpg`
  - `wardrobe-oak-drawers.jpg`
  - `pax-wardrobe-2.jpg`
  - `ottoman-bed.jpg`
  - Optional social preview: `assets/og-preview.jpg`

### Quick local preview
Use any static server, e.g. with Node.js (run from this folder):

```bash
Set-Location "C:\\Users\\AORUS PC\\Desktop\\HILLMAN"
npx serve -l 5173 .
```

### Deploy
- GitHub Pages: push this folder to a repo and enable Pages (root). Update canonical + sitemap with the Pages URL.
- Netlify/Vercel: drag‑and‑drop the folder or connect the repo. No build step needed.

### SEO
This site includes:
- Title + meta description in `index.html`
- Open Graph/Twitter preview
- JSON‑LD for `LocalBusiness` and `FAQPage`
- `robots.txt` and `sitemap.xml`

