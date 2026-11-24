#!/usr/bin/env python3
"""
Export a curated, chunk-friendly Markdown knowledge base (~98 skincare products +
active ingredient guide + conflict rules + routine FAQ) for Dify RAG Demo.

Usage:
    python3 scripts/export_dify_knowledge.py

Output:
    docs/_data/dify/beautyai_demo_knowledge.md
"""

from __future__ import annotations

import csv
import re
from collections import defaultdict
from pathlib import Path

CATEGORY_QUOTAS: list[tuple[str, int]] = [
    ("Cleansers", 20),
    ("Moisturizers", 20),
    ("Treatments", 20),
    ("Sunscreen", 15),
    ("Masks", 10),
    ("Eye Care", 8),
    ("Lip Balms & Treatments", 5),
]

ACTIVE_KEYWORDS = [
    "niacinamide",
    "salicylic acid",
    "glycolic acid",
    "lactic acid",
    "retinol",
    "ascorbic acid",
    "hyaluronic acid",
    "sodium hyaluronate",
    "ceramide",
    "centella asiatica",
    "panthenol",
    "squalane",
    "azelaic acid",
    "benzoyl peroxide",
    "peptides",
    "zinc oxide",
    "titanium dioxide",
    "vitamin c",
    "vitamin e",
    "tocopherol",
    "allantoin",
    "bisabolol",
]


def clean_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value).strip()


def extract_key_actives(ingredients: str) -> list[str]:
    lower = ingredients.lower()
    found: list[str] = []
    for kw in ACTIVE_KEYWORDS:
        if kw in lower:
            found.append(kw.title())
    return found[:8]


def infer_skin_types(highlights: str, ingredients: str, category: str) -> str:
    text = f"{highlights} {ingredients}".lower()
    types: list[str] = []
    if any(k in text for k in ["oily", "blemish", "acne", "oil control", "matte", "salicylic", "niacinamide"]):
        types.append("Oily")
    if any(k in text for k in ["dry", "hydrat", "moisture", "ceramide", "squalane", "hyaluronic", "rich"]):
        types.append("Dry")
    if any(k in text for k in ["combination", "balanc", "pores"]):
        types.append("Combination")
    if any(k in text for k in ["sensitive", "sooth", "calm", "fragrance-free", "gentle", "centella", "panthenol"]):
        types.append("Sensitive")
    if not types:
        types = ["Normal", "Combination"]
    return ", ".join(dict.fromkeys(types))


def truncate_ingredients(ingredients: str, max_len: int = 420) -> str:
    text = clean_text(ingredients)
    if len(text) <= max_len:
        return text
    return text[:max_len].rsplit(",", 1)[0] + ", ..."


def build_static_chunks() -> list[str]:
    return [
        """## BeautyAI Guide: Foundational Skincare Routine Order
- **Morning (AM) Routine:**
  1. Gentle Cleanser (removes overnight sebum without stripping the barrier)
  2. Hydrating Toner / Essence (optional)
  3. Antioxidant or Balancing Serum (e.g., Vitamin C or Niacinamide)
  4. Moisturizer suited to skin type
  5. Broad-Spectrum Sunscreen SPF 30+ (mandatory final AM step)
- **Evening (PM) Routine:**
  1. Cleanser (double cleanse if wearing heavy SPF or makeup)
  2. Targeted Treatment or Exfoliant (e.g., Retinol, BHA/Salicylic Acid, AHA/Glycolic Acid — alternate nights for strong actives)
  3. Barrier-Supporting Moisturizer (Ceramides, Hyaluronic Acid, Squalane, or Panthenol)
- **Best Practice:** Introduce one new active ingredient at a time, starting 2–3 nights per week, and always wear daily sunscreen.""",
        """## BeautyAI Guide: Active Ingredient Conflict Rules (Safety)
- **Retinol + Salicylic Acid (BHA) / Glycolic Acid (AHA) (Warning):** Using strong retinoids and exfoliating acids in the same routine increases risk of barrier irritation, redness, and peeling. Use on alternate evenings (skin cycling) or acids in the morning and retinol at night.
- **Retinol + Benzoyl Peroxide (Warning):** Can cause excessive dryness and may reduce retinol stability. Use Benzoyl Peroxide in the AM wash-off step and Retinol in the PM.
- **Pure Vitamin C (L-Ascorbic Acid) + Strong AHA/BHA (Caution):** Combining low-pH acids together can sting sensitive skin. Prefer Vitamin C in the AM and AHA/BHA in the PM.
- **Safe & Synergistic Pairings:**
  - Niacinamide + Hyaluronic Acid (hydration + oil control + barrier support)
  - Niacinamide + Retinol (niacinamide helps buffer retinoid irritation)
  - Vitamin C + Sunscreen (enhanced daytime antioxidant UV defense)
  - Ceramides + Panthenol + Centella Asiatica (calming and barrier repair)""",
        """## BeautyAI Guide: Skin Type & Key Ingredient Reference
- **Oily / Acne-Prone Skin:** Look for lightweight gel cleansers, oil-free moisturizers, Salicylic Acid (BHA), Niacinamide, Zinc, and non-comedogenic sunscreens.
- **Dry / Dehydrated Skin:** Look for cream cleansers, Hyaluronic Acid (Sodium Hyaluronate), Ceramides, Squalane, Glycerin, and rich barrier creams.
- **Sensitive / Reactive Skin:** Look for fragrance-free formulas with Centella Asiatica, Panthenol (Vitamin B5), Ceramides, Allantoin, and mineral sunscreens (Zinc Oxide / Titanium Dioxide). Avoid high concentrations of denatured alcohol and strong essential oils.
- **Combination Skin:** Balance lightweight hydration across the face with gentle pore care (Niacinamide or low-strength BHA) on the T-zone.
- **Anti-Aging / Fine Lines:** Daily broad-spectrum SPF 30+, evening Retinol or Peptides, and daytime Vitamin C antioxidants.""",
        """## BeautyAI Platform FAQ & Medical Safety Policy
- **Scope:** BeautyAI Assistant (Lumi) provides cosmetic skincare product recommendations, routine sequencing, and INCI ingredient explanations based on the BeautyAI catalog (prices in USD).
- **Medical Boundary:** Lumi is NOT a doctor or dermatologist and cannot diagnose or prescribe treatments for medical skin diseases (e.g., eczema, psoriasis, fungal infections, cystic acne infections, severe allergic reactions, or steroid/corticoid-damaged skin). For medical symptoms, users must consult a board-certified dermatologist or use the 1-on-1 Zalo Specialist Handoff button.
- **Allergy Safety:** If a user mentions an ingredient allergy (e.g., fragrance, alcohol denat, salicylic acid, retinol), never recommend products containing that allergen.""",
    ]


def main() -> None:
    root_dir = Path(__file__).resolve().parent.parent
    csv_path = root_dir / "docs" / "_data" / "processed" / "products_ready.csv"
    out_dir = root_dir / "docs" / "_data" / "dify"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "beautyai_demo_knowledge.md"

    if not csv_path.exists():
        raise FileNotFoundError(f"Source CSV not found: {csv_path}")

    by_category: dict[str, list[dict[str, str]]] = defaultdict(list)

    with csv_path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("primary_category") != "Skincare":
                continue
            if row.get("out_of_stock") not in ("0", "", None):
                continue
            ingredients = clean_text(row.get("ingredients"))
            if len(ingredients) < 25:
                continue
            try:
                price = float(row.get("price_usd") or 0)
            except ValueError:
                price = 0.0
            if price <= 0:
                continue

            sec = clean_text(row.get("secondary_category"))
            try:
                loves = int(float(row.get("loves_count") or 0))
            except ValueError:
                loves = 0
            try:
                rating = float(row.get("rating") or 0)
            except ValueError:
                rating = 0.0

            row["_loves"] = str(loves)
            row["_price"] = f"{price:.2f}"
            row["_rating"] = f"{rating:.2f}"
            by_category[sec].append(row)

    chunks: list[str] = []
    chunks.extend(build_static_chunks())

    selected_count = 0
    seen_ids: set[str] = set()

    for category, quota in CATEGORY_QUOTAS:
        candidates = sorted(
            by_category.get(category, []),
            key=lambda r: (int(r["_loves"]), float(r["_rating"])),
            reverse=True,
        )
        taken = 0
        for row in candidates:
            if taken >= quota:
                break
            pid = clean_text(row.get("product_id"))
            if not pid or pid in seen_ids:
                continue
            seen_ids.add(pid)
            taken += 1
            selected_count += 1

            name = clean_text(row.get("product_name"))
            brand = clean_text(row.get("brand_name"))
            tertiary = clean_text(row.get("tertiary_category")) or category
            size = clean_text(row.get("size")) or "Standard"
            price = row["_price"]
            rating = row["_rating"]
            reviews = clean_text(row.get("reviews")) or "0"
            highlights = clean_text(row.get("highlights")) or "Dermatologist-tested skincare formula"
            ingredients = clean_text(row.get("ingredients"))
            key_actives = extract_key_actives(ingredients)
            skin_types = infer_skin_types(highlights, ingredients, category)

            chunk = (
                f"## Product: {brand} — {name}\n"
                f"- **Product Code:** {pid}\n"
                f"- **Brand:** {brand}\n"
                f"- **Category:** Skincare > {category} > {tertiary}\n"
                f"- **Price (USD):** ${price}\n"
                f"- **Size:** {size}\n"
                f"- **Rating:** {rating}/5 ({reviews} reviews)\n"
                f"- **Recommended Skin Types:** {skin_types}\n"
                f"- **Highlights:** {highlights}\n"
                f"- **Key Actives Detected:** {', '.join(key_actives) if key_actives else 'Gentle cosmetic base'}\n"
                f"- **INCI Ingredients:** {truncate_ingredients(ingredients)}"
            )
            chunks.append(chunk)

    content = "\n\n---\n\n".join(chunks) + "\n"
    out_path.write_text(content, encoding="utf-8")

    print(f"Exported {selected_count} skincare products + {len(build_static_chunks())} guide chunks.")
    print(f"Output: {out_path} ({len(content):,} bytes)")


if __name__ == "__main__":
    main()
