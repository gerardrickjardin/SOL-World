"""Inject a shared, additive mobile-safety stylesheet into the SOL REViBE pages.

Idempotent: re-running replaces the previously injected block.
Rules only apply at <=600px (phones) so desktop layouts are untouched.
"""
import pathlib, re

ROOT = pathlib.Path(__file__).parent
BASES = [ROOT / 'solrevibe', ROOT / 'public' / 'solrevibe']
PAGES = [
    'index.html', 'order.html', 'payment.html', 'payment-success.html', 'payment-error.html',
    'roi-calculator.html', 'start.html', 'hero-preview.html', 'calculator-demo.html',
    'order/index.html', 'landing/index.html', 'book-call/index.html', 'locations/index.html',
    'roi-calculator/index.html', 'hero-preview/index.html', 'calculator-demo/index.html',
]

CSS = """<style id="mobile-safety">
/* Mobile safety net (phones only) - additive, desktop unaffected */
@media (max-width: 600px) {
  html, body { max-width: 100%; overflow-x: hidden; -webkit-text-size-adjust: 100%; }
  img:not(.leaflet-tile):not(.leaflet-marker-icon), video, iframe { max-width: 100%; }
  img { height: auto; }
  /* 16px stops iOS Safari zooming the page when a field is focused */
  input:not([type=checkbox]):not([type=radio]):not([type=range]), select, textarea { font-size: 16px !important; min-height: 44px; }
  button, .btn, [role=button], input[type=submit] { min-height: 44px; }
  h1, h2, h3, .section-header h2, .vibe-content-section h3 { white-space: normal !important; overflow-wrap: break-word; }
  .container, .card, main { max-width: 100%; }
  table { max-width: 100%; }
  pre, code { white-space: pre-wrap; word-break: break-word; }
}
@media (max-width: 480px) {
  .container { padding: 1.5rem !important; }
  .card { padding-left: 1.25rem; padding-right: 1.25rem; }
  .topbar { padding: 10px 16px !important; }
  .topbar img { height: 44px !important; }
  main { padding-left: 1rem !important; padding-right: 1rem !important; }
}
</style>
"""

BLOCK = re.compile(r'<style id="mobile-safety">.*?</style>\n?', re.S)
n = 0
for base in BASES:
    for rel in PAGES:
        p = base / rel
        if not p.exists():
            continue
        html = p.read_text(encoding='utf-8')
        html = BLOCK.sub('', html)
        if '</head>' not in html:
            print('skip (no </head>):', p); continue
        html = html.replace('</head>', CSS + '</head>', 1)
        p.write_text(html, encoding='utf-8')
        n += 1
        print('patched', p.relative_to(ROOT))
print(n, 'files')
