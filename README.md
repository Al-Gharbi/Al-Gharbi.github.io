# Abdulrahman Al-Gharbi · Portfolio

Static portfolio site (HTML, CSS, vanilla JS). No build step, no third-party requests.

```
index.html            single page
css/style.css         all styles (one file)
js/                   boot.js · canvas.js · roles.js · ui.js · gallery.js
fonts/                self-hosted Inter, JetBrains Mono, Space Grotesk, Cairo (woff2)
images/               photo, project screenshots (webp), og-card.png (1200x630)
cv/                   downloadable CV (PDF)
.well-known/          security.txt
404.html robots.txt sitemap.xml .nojekyll
```

Run locally: `python3 -m http.server 8000` then open http://localhost:8000

Security: strict Content-Security-Policy via `<meta>` (scripts, styles, fonts and images are all same-origin; no inline scripts).
Accessibility: skip link, keyboard-operable gallery/lightbox (focus trap, Esc, arrows), `prefers-reduced-motion` respected.

When the domain changes, update the URLs in `index.html` (canonical, og:*, JSON-LD), `robots.txt`, `sitemap.xml` and `.well-known/security.txt`.
