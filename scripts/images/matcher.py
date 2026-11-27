"""Brand + name verification for image candidates (stdlib only).

Rules (BUGFIX-PRODUCT-IMAGES, threshold 0.85 approved 2026-11-06):
  1. Brand must match (normalized equality or one contains the other,
     e.g. "Rare Beauty by Selena Gomez" ~ "Rare Beauty"). Mismatch -> reject.
  2. Bundle / tool / refill guard: candidate containing set/kit/trio/mini/
     refill/brush/sponge/... words that the dataset name lacks is rejected.
     (Note: "refillable" describes a full-size jar/compact and is allowed,
     whereas "refill" / "pod" is a refill insert and is blocked.)
  3. Standard match: Dice coefficient of normalized token sets >= THRESHOLD (0.85).
  4. ID-anchored rename cross-check (only when source page confirmed a
     /product/ page AND standard Dice < 0.85):
       a. All active numbers/concentrations in dataset name (e.g. 10%, 1%, SPF 30)
          must appear in candidate name (wear-time claims like 24H/24HR excluded).
       b. Primary product form (serum, blush, cleanser, lipstick, ...) must not
          conflict between dataset and candidate.
       c. Either 100% of dataset tokens are in candidate, OR
          (token recall >= 0.65 AND Dice >= 0.60).
"""
from __future__ import annotations

import re
import unicodedata

THRESHOLD = 0.85
RENAME_MIN_DICE = 0.60
RENAME_MIN_RECALL = 0.65

BUNDLE_WORDS = {
    # sets & sizes
    "set", "kit", "trio", "duo", "quad", "mini", "minis", "bundle",
    "gift", "value", "collection", "vault", "travel", "discovery", "sampler",
    # refills, tools & accessories that could share a product line name
    "refill", "pod", "brush", "sponge", "puff", "applicator",
    "case", "compact", "holder", "bag", "pouch", "sharpener", "curler",
}

# Distinct product forms — a rename cannot turn one into another
PRIMARY_FORMS = {
    "blush", "bronzer", "highlighter", "luminizer", "concealer", "foundation",
    "primer", "lipstick", "gloss", "stain", "mascara", "eyeliner",
    "liner", "eyeshadow", "palette", "serum", "cleanser", "toner", "mask",
    "peel", "scrub", "exfoliator", "sunscreen", "shampoo", "conditioner",
    "perfume", "parfum", "cologne", "fragrance", "deodorant", "candle",
}

_STOP = {
    "the", "and", "with", "for", "of", "a", "an", "by", "in", "to", "on",
    "refillable",
}
_SIZE = re.compile(r"\b\d+(?:[.,]\d+)?\s*(?:ml|l|oz|fl|g|kg|mg|ct|pcs|pc)\b")
_WEAR_TIME = re.compile(r"\b(?:10|12|16|24|36|48|72)\s*(?:h|hr|hrs|hour|hours)\b")


def _ascii(s: str) -> str:
    return unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()


def normalize(s: str) -> str:
    s = _ascii(s).lower()
    s = re.sub(r"[™®©]", "", s)
    s = _SIZE.sub(" ", s)
    s = _WEAR_TIME.sub(" ", s)
    s = s.replace("&", " and ").replace("%", " pct ")
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    # Canonicalize common cosmetic synonyms/compounds
    s = re.sub(r"\beye\s+shadow\b", "eyeshadow", s)
    s = re.sub(r"\bweightlesshairoil\b", "weightless hair oil", s)
    s = re.sub(r"\bcreme\b", "cream", s)
    s = re.sub(r"\btoning\b", "toner", s)
    s = re.sub(r"\bexfoliant\b", "exfoliator", s)
    s = re.sub(r"\bha\b", "hyaluronic acid", s)
    return re.sub(r"\s+", " ", s).strip()


def tokens(s: str) -> set[str]:
    return {t for t in normalize(s).split() if t not in _STOP}


def _numbers(tks: set[str]) -> set[str]:
    return {t for t in tks if any(ch.isdigit() for ch in t)}


def brand_match(a: str, b: str) -> bool:
    na, nb = normalize(a), normalize(b)
    if not na or not nb:
        return False
    if na == nb or na in nb or nb in na:
        return True
    # Handle brand suffix variations like "Marc Jacobs Fragrances" vs "Marc Jacobs Beauty"
    ta = tokens(a) - {"fragrances", "fragrance", "beauty", "cosmetics", "skincare", "parfums", "paris"}
    tb = tokens(b) - {"fragrances", "fragrance", "beauty", "cosmetics", "skincare", "parfums", "paris"}
    return bool(ta and tb and (ta == tb or ta <= tb or tb <= ta))


def name_score(expected: str, candidate: str) -> float:
    a, b = tokens(expected), tokens(candidate)
    if not a or not b:
        return 0.0
    return 2 * len(a & b) / (len(a) + len(b))


def has_unexpected_bundle(expected: str, candidate: str) -> bool:
    return bool((tokens(candidate) & BUNDLE_WORDS) - tokens(expected))


def has_form_conflict(exp_tokens: set[str], cand_tokens: set[str], id_anchored: bool = False) -> bool:
    """Reject if candidate drops the expected primary form, or introduces a
    conflicting primary product form. When id_anchored=True and 100% of expected
    tokens are preserved (or expected had no explicit form word, e.g. 'Flowerbomb'
    -> 'Flowerbomb Eau de Parfum'), descriptive form suffix is allowed."""
    exp_forms = exp_tokens & PRIMARY_FORMS
    cand_forms = cand_tokens & PRIMARY_FORMS
    if exp_forms and not (exp_forms & cand_forms):
        return True
    extra_forms = cand_forms - exp_forms
    if not extra_forms:
        return False
    if id_anchored and not exp_forms and (exp_tokens <= cand_tokens or len(exp_tokens & cand_tokens) / max(len(exp_tokens), 1) >= 0.70):
        return False
    return True


def has_number_conflict(exp_tokens: set[str], cand_tokens: set[str]) -> bool:
    """If expected name specifies numbers/concentrations (e.g. 10%, 1%, SPF 50,
    No. 5), candidate must preserve the exact same numeric tokens."""
    en = _numbers(exp_tokens)
    return bool(en and en != _numbers(cand_tokens))


def is_verified_rename(exp_name: str, cand_name: str) -> bool:
    """Cross-check for ID-anchored pages whose display name evolved since 2023."""
    a, b = tokens(exp_name), tokens(cand_name)
    if not a or not b:
        return False
    if has_number_conflict(a, b) or has_form_conflict(a, b, id_anchored=True):
        return False
    if a <= b:
        return True
    recall = len(a & b) / len(a)
    dice = 2 * len(a & b) / (len(a) + len(b))
    return recall >= RENAME_MIN_RECALL and dice >= RENAME_MIN_DICE


def score(exp_brand: str, exp_name: str, cand_brand: str, cand_name: str,
          id_anchored: bool = False) -> float:
    """0.0 if hard rules fail, else name score (or >= THRESHOLD when id_anchored
    rename passes all cross-checks)."""
    if not brand_match(exp_brand, cand_brand):
        return 0.0
    if has_unexpected_bundle(exp_name, cand_name):
        return 0.0
    a, b = tokens(exp_name), tokens(cand_name)
    if has_form_conflict(a, b, id_anchored=id_anchored) or has_number_conflict(a, b):
        return 0.0
    ns = name_score(exp_name, cand_name)
    if ns >= THRESHOLD:
        return ns
    if id_anchored and is_verified_rename(exp_name, cand_name):
        return max(ns, THRESHOLD)
    return ns


def is_match(exp_brand: str, exp_name: str, cand_brand: str, cand_name: str,
             threshold: float = THRESHOLD, id_anchored: bool = False) -> bool:
    return score(exp_brand, exp_name, cand_brand, cand_name, id_anchored=id_anchored) >= threshold
