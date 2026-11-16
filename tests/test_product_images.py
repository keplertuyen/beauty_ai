"""Acceptance tests for BUGFIX-PRODUCT-IMAGES.

Stdlib-only (unittest). TC-BUG-* are reproduction tests: they MUST fail
before the fix and pass after. See docs/_changes/BUGFIX-PRODUCT-IMAGES/test-plan.md.
"""
import csv
import importlib
import re
import sys
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
PRODUCTS_CSV = REPO / "docs" / "_data" / "processed" / "products_ready.csv"
CLEANED_CSV = REPO / "docs" / "_data" / "cleaned" / "products_cleaned.csv"
MANIFEST = REPO / "docs" / "_data" / "images" / "manifest.csv"
IMAGES_DIR = REPO / "src" / "frontend" / "public" / "images" / "products"
PRODUCT_IMAGES_JS = REPO / "src" / "frontend" / "src" / "utils" / "productImages.js"
MATCH_THRESHOLD = 0.85

csv.field_size_limit(sys.maxsize)


def _rows(path: Path):
    with path.open(encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _manifest():
    if not MANIFEST.exists():
        return {}
    return {r["product_id"]: r for r in _rows(MANIFEST)}


class TestImageProvenance(unittest.TestCase):
    """TC-BUG-001/002/003 + TC-REG-001 — data-level checks."""

    @classmethod
    def setUpClass(cls):
        cls.products = _rows(PRODUCTS_CSV)
        cls.product_ids = {r["product_id"] for r in cls.products}
        cls.manifest = _manifest()

    def test_tc_bug_001_local_images_are_verified_in_manifest(self):
        self.assertTrue(MANIFEST.exists(), f"missing manifest {MANIFEST}")
        bad = []
        for r in self.products:
            if not r["image_url"].startswith("/images/products/"):
                continue
            m = self.manifest.get(r["product_id"])
            if (m is None or m.get("status") != "verified"
                    or not m.get("source_url")
                    or float(m.get("match_score") or 0) < MATCH_THRESHOLD):
                bad.append(r["product_id"])
        self.assertEqual(bad, [], f"{len(bad)} unverified local images, e.g. {bad[:5]}")

    def test_tc_bug_002_no_orphan_image_files(self):
        files = [p.stem for p in IMAGES_DIR.glob("*.webp")] if IMAGES_DIR.exists() else []
        orphans = [p for p in files if p not in self.product_ids or p not in self.manifest]
        self.assertEqual(orphans, [], f"{len(orphans)} orphan files, e.g. {orphans[:5]}")

    def test_tc_bug_003_no_stock_or_guessed_urls(self):
        offenders = []
        for path in (PRODUCTS_CSV, CLEANED_CSV):
            if path.exists():
                for r in _rows(path):
                    u = r.get("image_url", "")
                    if "images.unsplash.com" in u or "sephora.com/productimages/sku/" in u:
                        offenders.append(f"{path.name}:{r['product_id']}")
        js = PRODUCT_IMAGES_JS.read_text(encoding="utf-8") if PRODUCT_IMAGES_JS.exists() else ""
        if re.search(r"images\.unsplash\.com|sephora\.com/productimages/sku/", js):
            offenders.append(PRODUCT_IMAGES_JS.name)
        self.assertEqual(offenders, [], f"{len(offenders)} offenders, e.g. {offenders[:5]}")

    def test_tc_reg_001_every_product_has_image_url(self):
        missing = [r["product_id"] for r in self.products if not r.get("image_url", "").strip()]
        self.assertEqual(missing, [])


class TestMatcher(unittest.TestCase):
    """TC-BUG-004 + TC-UNIT-001/002 — scripts/images/matcher.py."""

    @classmethod
    def setUpClass(cls):
        sys.path.insert(0, str(REPO / "scripts"))
        try:
            cls.matcher = importlib.import_module("images.matcher")
        except ImportError as e:  # pre-fix: module does not exist
            cls.matcher = None
            cls.err = e

    def _m(self):
        if self.matcher is None:
            self.fail(f"scripts/images/matcher.py missing: {self.err}")
        return self.matcher

    def test_tc_bug_004_rejects_known_wrong_images(self):
        m = self._m()
        self.assertFalse(m.is_match("Rare Beauty by Selena Gomez", "Soft Pinch Liquid Blush",
                                    "Rare Beauty by Selena Gomez", "Violet Faves Mini Cheek & Lip Trio"))
        self.assertFalse(m.is_match("NARS", "Blush", "NARS", "Radiant Creamy Concealer"))

    def test_tc_unit_001_accepts_name_variants(self):
        m = self._m()
        self.assertTrue(m.is_match("The Ordinary", "Niacinamide 10% + Zinc 1% Oil Control Serum",
                                   "THE ORDINARY", "Niacinamide 10% + Zinc 1% Oil Control Serum 30 mL"))
        self.assertTrue(m.is_match("LANEIGE", "Lip Sleeping Mask Intense Hydration with Vitamin C",
                                   "Laneige", "Lip Sleeping Mask Intense Hydration with Vitamin C™"))

    def test_tc_unit_002_brand_mismatch_rejects(self):
        m = self._m()
        self.assertFalse(m.is_match("NARS", "Blush", "MILK MAKEUP", "Blush"))


class _FakeSource:
    def __init__(self, name, result=None, exc=None, fail_times=0):
        self.name, self.result, self.exc, self.fail_times, self.calls = name, result, exc, fail_times, 0

    def find(self, product):
        self.calls += 1
        if self.exc:
            raise self.exc
        if self.calls <= self.fail_times:
            from images.base import SourceError
            raise SourceError("transient")
        return self.result


class TestPipeline(unittest.TestCase):
    """TC-UNIT-005/006 — retry, blocked handling, resume."""

    def setUp(self):
        import tempfile
        sys.path.insert(0, str(REPO / "scripts"))
        from images import base, manifest, pipeline
        self.base, self.mf, self.pl = base, manifest, pipeline
        self.tmp = Path(tempfile.mkdtemp()) / "manifest.csv"
        self.p = base.ProductRef("P1", "NARS", "Blush")
        self.good = base.Candidate("http://img/1.jpg", "http://page/1", "NARS", "Blush", "fake")
        self.dl = lambda url, pid: f"/images/products/{pid}.webp"

    def _run(self, tiers, products=None):
        return self.pl.run(products or [self.p], tiers, self.tmp, self.dl, retry_sleep=lambda s: None)

    def test_tc_unit_005_retry_then_success(self):
        src = _FakeSource("a", result=self.good, fail_times=2)
        stats = self._run([(1, src)])
        self.assertEqual(stats["verified"], 1)
        self.assertEqual(src.calls, 3)

    def test_tc_unit_005_retry_exhausted_marks_error_and_continues(self):
        src = _FakeSource("a", result=self.good, fail_times=99)
        p2 = self.base.ProductRef("P2", "NARS", "Blush")
        stats = self._run([(1, src)], [self.p, p2])
        self.assertEqual(stats["error"], 2)

    def test_blocked_source_disabled_falls_through_to_next_tier(self):
        blocked = _FakeSource("a", exc=self.base.SourceBlocked("403"))
        nxt = _FakeSource("b", result=self.good)
        p2 = self.base.ProductRef("P2", "NARS", "Blush")
        stats = self._run([(1, blocked), (2, nxt)], [self.p, p2])
        self.assertEqual(stats["verified"], 2)
        self.assertEqual(blocked.calls, 1)  # not called again after block

    def test_rejected_candidate_not_downloaded(self):
        wrong = self.base.Candidate("u", "s", "NARS", "Radiant Creamy Concealer", "fake")
        stats = self._run([(1, _FakeSource("a", result=wrong))])
        self.assertEqual(stats["not_found"], 1)
        rows = list(csv.DictReader(self.tmp.open(encoding="utf-8")))
        self.assertEqual([r["status"] for r in rows], ["rejected", "not_found"])

    def test_tc_unit_006_resume_skips_final_rows(self):
        self._run([(1, _FakeSource("a", result=self.good))])
        src = _FakeSource("a", result=self.good)
        stats = self._run([(1, src)])
        self.assertEqual(stats["skipped"], 1)
        self.assertEqual(src.calls, 0)


class TestAdapters(unittest.TestCase):
    """TC-UNIT-003/004 — pure parsers with fixtures (no network)."""

    @classmethod
    def setUpClass(cls):
        sys.path.insert(0, str(REPO / "scripts"))
        from images import base, source_obf, source_sephora
        cls.base, cls.obf, cls.seph = base, source_obf, source_sephora

    LD = ('<html><script type="application/ld+json">{"@type":"Product","name":"Blush",'
          '"brand":{"@type":"Brand","name":"NARS"},"image":["https://x/s1.jpg"]}</script></html>')

    def test_tc_unit_003_sephora_parses_jsonld(self):
        c = self.seph.parse(self.LD, "https://www.sephora.com/product/blush-P2855", "P2855")
        self.assertEqual((c.brand, c.name, c.image_url), ("NARS", "Blush", "https://x/s1.jpg"))

    def test_tc_unit_003_sephora_redirect_to_other_product_is_none(self):
        self.assertIsNone(self.seph.parse(self.LD, "https://www.sephora.com/shop/blush", "P2855"))

    def test_tc_unit_003_sephora_og_fallback(self):
        html = ('<meta property="og:title" content="Blush - NARS | Sephora">'
                '<meta property="og:image" content="https://x/og.jpg">')
        c = self.seph.parse(html, "https://www.sephora.com/product/P2855", "P2855")
        self.assertEqual((c.brand, c.name), ("NARS", "Blush"))

    def test_tc_unit_004_obf_picks_best_scoring_result(self):
        p = self.base.ProductRef("P1", "The Ordinary", "Niacinamide 10% + Zinc 1%")
        payload = {"products": [
            {"code": "1", "product_name": "Hyaluronic Acid 2% + B5", "brands": "The Ordinary",
             "image_front_url": "https://obf/1.jpg"},
            {"code": "2", "product_name": "Niacinamide 10% + Zinc 1%", "brands": "The Ordinary,Deciem",
             "image_front_url": "https://obf/2.jpg"},
            {"code": "3", "product_name": "Niacinamide 10% + Zinc 1%", "brands": "The Ordinary"},
        ]}
        c = self.obf.parse(payload, p)
        self.assertEqual(c.image_url, "https://obf/2.jpg")
        self.assertEqual(c.source_url, "https://world.openbeautyfacts.org/product/2")

    def test_tc_unit_004_obf_empty(self):
        p = self.base.ProductRef("P1", "NARS", "Blush")
        self.assertIsNone(self.obf.parse({"products": []}, p))

    def test_tc_unit_004_obf_brand_embedded_in_name(self):
        p = self.base.ProductRef("P1", "NARS", "Blush")
        c = self.obf.parse({"products": [{"code": "9", "product_name": "NARS Blush", "brands": "",
                                          "image_front_url": "https://obf/9.jpg"}]}, p)
        self.assertEqual((c.brand, c.name), ("NARS", "Blush"))

    LINKSTORE = ('<script id="linkStore" type="text/json">{"page":{"product":{"productId":"P2855",'
                 '"productDetails":{"productId":"P2855","displayName":"Talc-Free Powder Blush",'
                 '"brand":{"displayName":"NARS"}},"currentSku":{"skuId":"2756351","skuImages":'
                 '{"imageUrl":"https://www.sephora.com/productimages/sku/s2756351-main-zoom.jpg?pb=award"}}}}}'
                 '</script>')

    def test_tc_unit_003_sephora_linkstore_primary(self):
        c = self.seph.parse(self.LINKSTORE, "https://www.sephora.com/product/blush-P2855", "P2855")
        self.assertEqual(c.image_url, "https://www.sephora.com/productimages/sku/s2756351-main-zoom.jpg")
        self.assertTrue(c.id_anchored)

    def test_tc_unit_003_sephora_linkstore_pcode_redirect_Still_cross_checked(self):
        html = self.LINKSTORE.replace("P2855", "P520286")
        c = self.seph.parse(html, "https://www.sephora.com/product/blush-P520286", "P2855")
        self.assertIsNotNone(c)
        self.assertTrue(c.id_anchored)
        self.assertIsNone(self.seph.parse(html, "https://www.sephora.com/search?keyword=productnotcarried", "P2855"))

    def test_tc_unit_003_sephora_logo_is_not_an_image(self):
        html = self.LD.replace("https://x/s1.jpg", "/images/Sephora_logo.jpg")
        self.assertIsNone(self.seph.parse(html, "https://www.sephora.com/product/P2855", "P2855"))

    def test_renamed_product_accepted_only_when_id_anchored(self):
        from images.matcher import score
        self.assertGreaterEqual(score("NARS", "Blush", "NARS", "Talc-Free Powder Blush", id_anchored=True), 0.85)
        self.assertLess(score("NARS", "Blush", "NARS", "Talc-Free Powder Blush"), 0.85)
        self.assertEqual(score("NARS", "Blush", "NARS", "Radiant Creamy Concealer", id_anchored=True), 0.0)
        self.assertGreaterEqual(score("The Ordinary", "Niacinamide 10% + Zinc 1% Oil Control Serum", "The Ordinary",
                                      "Niacinamide 10% + Zinc 1%  Serum for Oily Skin", id_anchored=True), 0.85)
        self.assertEqual(score("Rare Beauty", "Soft Pinch Liquid Blush", "Rare Beauty",
                               "Violet Faves Mini Cheek & Lip Trio", id_anchored=True), 0.0)
        # Cross-check guards against brushes, refills, different concentrations, and form conflicts
        self.assertEqual(score("Rare Beauty", "Soft Pinch Liquid Blush", "Rare Beauty",
                               "Soft Pinch Liquid Blush Brush", id_anchored=True), 0.0)
        self.assertEqual(score("NARS", "Blush", "NARS", "Talc-Free Powder Blush Refill", id_anchored=True), 0.0)
        self.assertEqual(score("NARS", "Blush", "NARS", "Blush Bronzer", id_anchored=True), 0.0)
        self.assertEqual(score("The Ordinary", "Niacinamide 10% + Zinc 1% Oil Control Serum", "The Ordinary",
                               "Niacinamide 5% Oil Control Serum", id_anchored=True), 0.0)


if __name__ == "__main__":
    unittest.main()
