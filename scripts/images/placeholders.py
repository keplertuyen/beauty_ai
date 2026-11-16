"""Neutral category SVG placeholders (BUGFIX-PRODUCT-IMAGES T6).

Generates clearly-labeled, minimalist vector placeholders in
src/frontend/public/images/placeholders/ so missing product photos are never
confused with real studio photography.
"""
from __future__ import annotations

from pathlib import Path

PUBLIC_PREFIX = "/images/placeholders"

# (slug, label, bg_top, bg_bottom, accent, icon_svg_inner)
SPECS: list[tuple[str, str, str, str, str, str]] = [
    ("skincare", "SKINCARE", "#F6F4F0", "#EAE5DC", "#6E6558",
     '<rect x="255" y="190" width="90" height="40" rx="8"/>'
     '<path d="M275 190v-30h50v30"/>'
     '<rect x="230" y="230" width="140" height="210" rx="24"/>'
     '<line x1="260" y1="305" x2="340" y2="305"/>'
     '<line x1="270" y1="335" x2="330" y2="335"/>'),
    ("serum", "SERUM & TREATMENT", "#F4F5F2", "#E4E8DF", "#5A6654",
     '<path d="M285 160h30v35h-30z"/>'
     '<path d="M292 135h16v25h-16z"/>'
     '<rect x="265" y="195" width="70" height="25" rx="5"/>'
     '<path d="M250 250c0-18 15-30 50-30s50 12 50 30v165a25 25 0 0 1-25 25h-50a25 25 0 0 1-25-25z"/>'
     '<line x1="275" y1="320" x2="325" y2="320"/>'),
    ("cleanser", "CLEANSER", "#F2F6F7", "#E1ECEE", "#4F6B70",
     '<path d="M245 180h110l-15 235a20 20 0 0 1-20 18h-40a20 20 0 0 1-20-18z"/>'
     '<rect x="268" y="433" width="64" height="24" rx="6"/>'
     '<line x1="268" y1="275" x2="332" y2="275"/>'),
    ("sunscreen", "SUN CARE", "#FBF7EE", "#F2E6CC", "#8A6D3B",
     '<circle cx="300" cy="295" r="46"/>'
     '<line x1="300" y1="215" x2="300" y2="233"/>'
     '<line x1="300" y1="357" x2="300" y2="375"/>'
     '<line x1="220" y1="295" x2="238" y2="295"/>'
     '<line x1="362" y1="295" x2="380" y2="295"/>'),
    ("makeup", "MAKEUP", "#F9F2F2", "#EFE0E0", "#7D5256",
     '<rect x="265" y="290" width="70" height="150" rx="10"/>'
     '<rect x="273" y="245" width="54" height="45" rx="4"/>'
     '<path d="M278 245v-55c0-15 44-35 44-5v60z"/>'),
    ("fragrance", "FRAGRANCE", "#F7F3F8", "#E9E0EC", "#6B5872",
     '<rect x="280" y="165" width="40" height="32" rx="4"/>'
     '<rect x="265" y="197" width="70" height="22" rx="4"/>'
     '<rect x="225" y="230" width="150" height="195" rx="22"/>'
     '<rect x="260" y="285" width="80" height="80" rx="6"/>'),
    ("hair", "HAIR CARE", "#F5F3EF", "#E7E2D8", "#695E4A",
     '<path d="M280 155h40v35h-40z"/>'
     '<path d="M300 140v15M280 140h50"/>'
     '<rect x="245" y="190" width="110" height="245" rx="42"/>'
     '<line x1="270" y1="300" x2="330" y2="300"/>'),
    ("bath-body", "BATH & BODY", "#F3F6F4", "#E2EAE5", "#556B5E",
     '<rect x="235" y="235" width="130" height="185" rx="28"/>'
     '<rect x="225" y="205" width="150" height="34" rx="12"/>'
     '<line x1="265" y1="320" x2="335" y2="320"/>'),
    ("tools", "TOOLS & BRUSHES", "#F4F4F5", "#E5E5E8", "#5C5C66",
     '<ellipse cx="300" cy="210" rx="42" ry="52"/>'
     '<rect x="284" y="258" width="32" height="36" rx="4"/>'
     '<path d="M286 294h28l-6 145a8 8 0 0 1-16 0z"/>'),
    ("default", "BEAUTY PRODUCT", "#F6F4F0", "#EAE5DC", "#6E6558",
     '<rect x="235" y="215" width="130" height="215" rx="24"/>'
     '<rect x="260" y="175" width="80" height="40" rx="8"/>'
     '<line x1="265" y1="310" x2="335" y2="310"/>'),
]

SVG_TEMPLATE = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600" role="img" aria-label="{label} placeholder">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{bg_top}"/>
      <stop offset="100%" stop-color="{bg_bottom}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg)"/>
  <g fill="none" stroke="{accent}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.65">
    {icon}
  </g>
  <text x="300" y="505" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="16" font-weight="600" letter-spacing="3" fill="{accent}" opacity="0.85">{label}</text>
  <text x="300" y="532" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="12" letter-spacing="1.5" fill="{accent}" opacity="0.55">IMAGE NOT YET VERIFIED</text>
</svg>
"""


def write_all(out_dir: Path) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    written = []
    for slug, label, bg_top, bg_bottom, accent, icon in SPECS:
        p = out_dir / f"{slug}.svg"
        p.write_text(SVG_TEMPLATE.format(
            label=label, bg_top=bg_top, bg_bottom=bg_bottom, accent=accent, icon=icon
        ), encoding="utf-8")
        written.append(p)
    return written


def resolve_placeholder(*categories_or_names: str) -> str:
    """Map category/name hints to a deterministic neutral placeholder path."""
    joined = " ".join(c for c in categories_or_names if c).lower()
    if any(k in joined for k in ("serum", "essence", "ampoule", "retinol", "niacinamide")):
        slug = "serum"
    elif any(k in joined for k in ("cleanse", "wash", "exfoli", "scrub", "toner")):
        slug = "cleanser"
    elif any(k in joined for k in ("sunscreen", "spf", "sun ")):
        slug = "sunscreen"
    elif any(k in joined for k in ("fragrance", "perfume", "parfum", "cologne", "candle")):
        slug = "fragrance"
    elif any(k in joined for k in ("hair", "shampoo", "conditioner", "scalp")):
        slug = "hair"
    elif any(k in joined for k in ("makeup", "lipstick", "blush", "mascara", "foundation", "concealer", "brow", "eyeshadow", "gloss")):
        slug = "makeup"
    elif any(k in joined for k in ("bath", "body", "deodorant", "hand ", "lotion")):
        slug = "bath-body"
    elif any(k in joined for k in ("tool", "brush", "sponge", "curler", "device")):
        slug = "tools"
    elif any(k in joined for k in ("skincare", "moistur", "cream", "mask", "eye", "oil", "balm")):
        slug = "skincare"
    else:
        slug = "default"
    return f"{PUBLIC_PREFIX}/{slug}.svg"
