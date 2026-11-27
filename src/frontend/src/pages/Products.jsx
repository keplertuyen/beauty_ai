import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldCheck,
  Star,
  Package,
  PackageSearch,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getProducts, getCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import { useApp } from '../context/AppContext';
import './Products.css';

const PER_PAGE = 20;

const DEFAULT_CATEGORY_TREE = {
  Skincare: [
    'Cleansers',
    'Moisturizers',
    'Treatments',
    'Sunscreen',
    'Eye Care',
    'Masks',
    'Lip Balms & Treatments',
    'Wellness',
    'Self Tanners',
    'High Tech Tools',
    'Shop by Concern',
    'Mini Size',
    'Value & Gift Sets',
  ],
  Makeup: [
    'Face',
    'Eye',
    'Lip',
    'Cheek',
    'Makeup Palettes',
    'Brushes & Applicators',
    'Nail',
    'Accessories',
    'Mini Size',
    'Value & Gift Sets',
  ],
  Hair: [
    'Shampoo & Conditioner',
    'Hair Styling & Treatments',
    'Tools',
    'Shop by Concern',
    'Mini Size',
    'Value & Gift Sets',
  ],
  'Bath & Body': [
    'Bath & Shower',
    'Body Moisturizers',
    'Body Care',
    'Sunscreen',
    'Self Tanners',
    'Beauty Supplements',
    'Candles & Home Scents',
    'Mini Size',
    'Value & Gift Sets',
  ],
  Fragrance: ['Women', 'Men', 'Candles & Home Scents', 'Mini Size', 'Value & Gift Sets'],
  'Tools & Brushes': ['Brushes & Applicators', 'Beauty Tools', 'Hair Tools', 'Beauty Accessories'],
  Men: ['Skincare', 'Shaving', 'Hair', 'Other Needs', 'Value & Gift Sets'],
  'Mini Size': ['Skincare', 'Makeup', 'Hair', 'Bath & Body', 'Fragrance', 'Value & Gift Sets'],
  Gifts: ['Value & Gift Sets'],
};

const DEFAULT_CATEGORIES = (() => {
  const list = [];
  let idCounter = 1;
  Object.entries(DEFAULT_CATEGORY_TREE).forEach(([deptName, subs]) => {
    const parentId = idCounter++;
    list.push({ id: parentId, name: deptName, parentId: null });
    subs.forEach((subName) => {
      list.push({ id: idCounter++, name: subName, parentId });
    });
  });
  return list;
})();

/* ─── Skeleton Card ──────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-img" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-brand" />
        <div className="skeleton skeleton-name" />
        <div className="skeleton skeleton-name skeleton-name-short" />
        <div className="skeleton skeleton-price" />
      </div>
      <div className="skeleton-actions">
        <div className="skeleton skeleton-btn" />
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, formatPrice, user } = useApp();

  const CERT_OPTIONS = [
    { value: 'Vegan', label: 'Vegan' },
    { value: 'Cruelty-Free', label: 'Cruelty-Free' },
    { value: 'Clean at Sephora', label: 'Clean Formula' },
  ];

  const FREE_FROM_OPTIONS = [
    { value: 'fragrance_free', label: 'Fragrance-Free' },
    { value: 'paraben_free', label: 'Paraben-Free' },
    { value: 'alcohol_free', label: 'Alcohol-Free' },
    { value: 'sulfate_free', label: 'Sulfate-Free' },
  ];

  const SKIN_TYPE_OPTIONS = [
    { value: '', label: 'All Types' },
    { value: 'Oily', label: 'Oily' },
    { value: 'Dry', label: 'Dry' },
    { value: 'Combination', label: 'Combination' },
    { value: 'Normal', label: 'Normal' },
    { value: 'Sensitive', label: 'Sensitive' },
  ];

  const ACTIVE_OPTIONS = [
    { value: 'niacinamide', label: 'Niacinamide' },
    { value: 'bha', label: 'BHA (Salicylic)' },
    { value: 'aha', label: 'AHA (Glycolic/Lactic)' },
    { value: 'retinol', label: 'Retinol' },
    { value: 'hyaluronic acid', label: 'Hyaluronic Acid' },
    { value: 'vitamin c', label: 'Vitamin C' },
    { value: 'centella', label: 'Centella (Cica)' },
    { value: 'ceramide', label: 'Ceramides' },
    { value: 'peptide', label: 'Peptides' },
  ];

  const SORT_OPTIONS = [
    { value: 'rating', label: t('prod_sort_rating', 'Top Rated') },
    { value: 'loves', label: t('prod_sort_loves', 'Most Loved') },
    { value: 'reviews', label: t('prod_sort_reviews', 'Most Reviewed') },
    { value: 'price_asc', label: t('prod_sort_price_asc', 'Price: Low to High') },
    { value: 'price_desc', label: t('prod_sort_price_desc', 'Price: High to Low') },
  ];

  const RATING_OPTIONS = [
    { value: '', label: 'All' },
    { value: '4', label: '4.0+ ★' },
    { value: '4.5', label: '4.5+ ★' },
  ];

  const normalizeSortParam = (rawSort) => {
    if (!rawSort) return 'rating';
    const s = rawSort.toLowerCase();
    if (s === 'trending') return 'loves';
    if (['rating', 'loves', 'reviews', 'price_asc', 'price_desc'].includes(s)) return s;
    return 'rating';
  };

  /* Filters state — initialised from URL params */
  const [searchText, setSearchText] = useState(searchParams.get('query') || '');
  const [selectedCats, setSelectedCats] = useState(() => {
    const c = searchParams.get('category');
    return c ? [c] : [];
  });
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [selectedSkinType, setSelectedSkinType] = useState(searchParams.get('skinType') || '');
  const [safeForMe, setSafeForMe] = useState(searchParams.get('safeForMe') === 'true');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState(() => normalizeSortParam(searchParams.get('sort')));
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [selectedFreeFrom, setSelectedFreeFrom] = useState([]);
  const [selectedActives, setSelectedActives] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* Collapsible Accordion sections in Sidebar (keeps sidebar compact) */
  const [openSections, setOpenSections] = useState({
    actives: false,
    cleanClaims: false,
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /* Product data */
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [catalogTotalCount, setCatalogTotalCount] = useState(8494);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  /* Categories */
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  /* Debounce ref */
  const searchTimer = useRef(null);

  /* ── Load categories once ─────────────────────────────────── */
  useEffect(() => {
    getCategories()
      .then((res) => {
        const raw = res?.data?.categories ?? (Array.isArray(res?.data) ? res?.data : []);
        if (Array.isArray(raw) && raw.length > 0) {
          setCategories(raw);
        }
      })
      .catch(() => {});
  }, []);

  /* ── Sync URL query/category/brand/sort/safeForMe params on mount/update ── */
  useEffect(() => {
    const q = searchParams.get('query') || '';
    const c = searchParams.get('category');
    const b = searchParams.get('brand') || '';
    const s = searchParams.get('sort');
    const safeParam = searchParams.get('safeForMe') === 'true';
    setSearchText(q);
    setSelectedBrand(b);
    if (s) {
      setSortBy(normalizeSortParam(s));
    }
    if (c) {
      setSelectedCats([c]);
    } else {
      setSelectedCats([]);
    }
    if (safeParam && user) {
      setSafeForMe(true);
    }
  }, [searchParams, user]);

  /* ── Fetch products ───────────────────────────────────────── */
  const fetchProducts = useCallback(
    async (pageNum = 1, append = false) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = {
          page: pageNum,
          per_page: PER_PAGE,
          sort_by: sortBy,
        };
        if (searchText.trim()) params.query = searchText.trim();
        if (selectedCats.length) params.category = selectedCats[0];
        if (selectedBrand.trim()) params.brand = selectedBrand.trim();
        if (selectedSkinType) params.skinType = selectedSkinType;
        if (safeForMe) params.safe_for_me = true;

        const minP = priceRange[0] === '' ? 0 : Number(priceRange[0]);
        const maxP = priceRange[1] === '' ? 500 : Number(priceRange[1]);
        if (minP > 0) params.min_price = minP;
        if (maxP < 500) params.max_price = maxP;
        if (minRating) params.min_rating = minRating;
        if (selectedCerts.length) params.highlights_filter = selectedCerts.join(',');
        if (selectedFreeFrom.length) params.free_from = selectedFreeFrom.join(',');
        if (selectedActives.length) params.active_ingredients = selectedActives.join(',');

        const res = await getProducts(params);
        const data = res?.data;
        const rawList = data?.products ?? data?.items ?? (Array.isArray(data) ? data : []);
        const items = Array.isArray(rawList) ? rawList : [];
        const total = typeof data?.total === 'number' ? data.total : items.length;
        const pages = typeof data?.pages === 'number' ? data.pages : Math.ceil(total / PER_PAGE);

        if (append) {
          setProducts((prev) => [...(Array.isArray(prev) ? prev : []), ...items]);
        } else {
          setProducts(items);
        }
        setTotalCount(total);
        if (Object.keys(params).length <= 3 && total > 0) {
          setCatalogTotalCount(total);
        }
        setHasMore(pageNum < pages);
      } catch (err) {
        console.error('Products fetch error:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [
      searchText,
      selectedCats,
      selectedBrand,
      selectedSkinType,
      safeForMe,
      priceRange,
      minRating,
      sortBy,
      selectedCerts,
      selectedFreeFrom,
      selectedActives,
    ]
  );

  /* ── Re-fetch when filters change (debounce search) ───────── */
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchProducts(1, false);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [fetchProducts]);

  /* ── Load more ────────────────────────────────────────────── */
  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchProducts(next, true);
  };

  /* ── Toggle category ──────────────────────────────────────── */
  const toggleCategory = (cat) => {
    setSelectedCats((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [cat]));
  };

  /* ── Apply filters (mobile drawer close) ──────────────────── */
  const applyFilters = () => {
    setSidebarOpen(false);
    setPage(1);
    fetchProducts(1, false);
  };

  /* ── Reset filters ────────────────────────────────────────── */
  const resetFilters = () => {
    setSearchText('');
    setSelectedCats([]);
    setSelectedBrand('');
    setSelectedSkinType('');
    setSafeForMe(false);
    setPriceRange([0, 500]);
    setMinRating('');
    setSortBy('rating');
    setSelectedCerts([]);
    setSelectedFreeFrom([]);
    setSelectedActives([]);
    setSearchParams({});
  };

  const toggleItem = (setter, val) => {
    setter((prev) => (prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]));
  };

  const handlePriceChange = (index, val) => {
    const cleaned = val === '' ? '' : String(val).replace(/^0+(?=\d)/, '');
    setPriceRange((prev) => {
      const next = [...prev];
      next[index] = cleaned;
      return next;
    });
  };

  const handlePriceBlur = () => {
    let min = priceRange[0] === '' ? 0 : Number(priceRange[0]);
    let max = priceRange[1] === '' ? 500 : Number(priceRange[1]);

    if (isNaN(min) || min < 0) min = 0;
    if (isNaN(max) || max < 0) max = 500;

    if (min > max) {
      const temp = min;
      min = max;
      max = temp;
    }

    setPriceRange([min, max]);
  };

  const handlePriceKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  const minP = priceRange[0] === '' ? 0 : Number(priceRange[0]);
  const maxP = priceRange[1] === '' ? 500 : Number(priceRange[1]);

  const activeFilterCount =
    (searchText ? 1 : 0) +
    selectedCats.length +
    (selectedBrand ? 1 : 0) +
    (selectedSkinType ? 1 : 0) +
    (safeForMe ? 1 : 0) +
    selectedCerts.length +
    selectedFreeFrom.length +
    selectedActives.length +
    (minP > 0 || maxP < 500 ? 1 : 0) +
    (minRating ? 1 : 0);

  /* Derive top-level departments & active subcategories */
  const catList = Array.isArray(categories) ? categories : [];
  const topDepartments = catList.filter(
    (c) => c && (c.parentId === null || c.parent_id === null)
  );

  // Determine which department's subcategories to show in the sidebar
  const currentSelectedCatObj = catList.find((c) => selectedCats.includes(c.name || c));
  const activeDeptObj = currentSelectedCatObj
    ? currentSelectedCatObj.parentId || currentSelectedCatObj.parent_id
      ? catList.find(
          (d) => d.id === (currentSelectedCatObj.parentId ?? currentSelectedCatObj.parent_id)
        )
      : currentSelectedCatObj
    : catList.find((c) => c.name === 'Skincare') || topDepartments[0];

  const subCategories = activeDeptObj
    ? catList.filter(
        (c) => (c.parentId ?? c.parent_id) === activeDeptObj.id
      )
    : [];

  const cleanClaimsCount = selectedFreeFrom.length + selectedCerts.length;

  return (
    <div className="products-page">
      {/* ── Compact Page Header ── */}
      <div className="products-header">
        <div className="container">
          <div className="products-header-inner">
            <div>
              <h1 className="products-title display-font">
                <Package size={24} className="products-title-icon" />
                {t('prod_title')}
              </h1>
              <p className="products-subtitle">
                {t('prod_subtitle_format').replace('{count}', catalogTotalCount.toLocaleString())}
              </p>
            </div>

            {/* Mobile filter toggle */}
            <button
              className="btn btn-secondary mobile-filter-toggle"
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              <SlidersHorizontal size={16} />
              {t('prod_filter_title')}
              {activeFilterCount > 0 && (
                <span className="filter-count-badge">{activeFilterCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="container">
        {/* ══ TOP HORIZONTAL DISCOVERY BAR (Main Departments + Sort) ══ */}
        <div className="products-top-discovery-bar">
          {/* Horizontal Department Pills */}
          <div className="discovery-dept-pills" role="tablist" aria-label="Product departments">
            <button
              type="button"
              className={`dept-pill ${selectedCats.length === 0 ? 'active' : ''}`}
              onClick={() => {
                setSelectedCats([]);
                setSearchParams({});
              }}
            >
              {t('cat_all', 'All Categories')}
            </button>

            {topDepartments.map((dept) => {
              const deptName = dept.name || dept;
              const isDeptActive =
                selectedCats.includes(deptName) ||
                (currentSelectedCatObj &&
                  (currentSelectedCatObj.parentId ?? currentSelectedCatObj.parent_id) === dept.id);
              return (
                <button
                  key={deptName}
                  type="button"
                  className={`dept-pill ${isDeptActive ? 'active' : ''}`}
                  onClick={() => {
                    if (selectedCats.includes(deptName)) {
                      setSelectedCats([]);
                    } else {
                      setSelectedCats([deptName]);
                    }
                  }}
                >
                  {deptName}
                </button>
              );
            })}
          </div>

          {/* Clean Sort Dropdown */}
          <div className="discovery-sort-box">
            <span className="discovery-sort-label">{t('prod_sort_by', 'Sort')}:</span>
            <div className="select-wrapper discovery-select-wrap">
              <select
                className="form-select discovery-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort products"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="select-icon" />
            </div>
          </div>
        </div>

        <div className="products-layout">
          {/* ══ COMPACT SELF-SCROLLING FILTER SIDEBAR ══════════════════════ */}
          <aside className={`filter-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
            {/* Sidebar header */}
            <div className="sidebar-header">
              <h2 className="sidebar-title">
                <SlidersHorizontal size={15} />
                <span>{t('prod_filter_title', 'Filters')}</span>
                {activeFilterCount > 0 && (
                  <span className="sidebar-active-badge">{activeFilterCount}</span>
                )}
              </h2>
              <div className="sidebar-header-actions">
                <button
                  className="sidebar-close-btn"
                  onClick={() => setSidebarOpen(false)}
                  type="button"
                  aria-label="Close filters"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* 1. Safe For My Skin (Allergy Exclusion Toggle) */}
            <div className={`safe-skin-toggle-card ${safeForMe ? 'active' : ''}`}>
              <div className="safe-skin-toggle-row">
                <div className="safe-skin-toggle-info">
                  <div className="safe-skin-toggle-title">
                    <ShieldCheck size={15} className="safe-skin-icon" />
                    <span>Safe For My Skin</span>
                  </div>
                  <div className="safe-skin-toggle-sub">Auto-hides your personal allergens</div>
                </div>
                <label className="safe-switch">
                  <input
                    type="checkbox"
                    checked={safeForMe}
                    onChange={(e) => {
                      if (!user) {
                        toast.error('Please sign in with your Digital Skin ID to filter by personal allergies');
                        return;
                      }
                      setSafeForMe(e.target.checked);
                    }}
                  />
                  <span className="safe-switch-slider" />
                </label>
              </div>
              {safeForMe && (
                <div className="safe-skin-active-note">
                  Allergen-containing formulas are hidden
                </div>
              )}
            </div>

            {/* 2. Skin Type (Uniform 2-Column Balanced Grid) */}
            <div className="filter-section">
              <div className="filter-title">Skin Type</div>
              <div className="skin-type-grid">
                {SKIN_TYPE_OPTIONS.map((opt) => {
                  const active = selectedSkinType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`skin-type-btn ${active ? 'active' : ''}`}
                      onClick={() =>
                        setSelectedSkinType((prev) =>
                          prev === opt.value ? '' : opt.value
                        )
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Subcategory Quick Chips (Context-aware to current department) */}
            {subCategories.length > 0 && (
              <div className="filter-section">
                <div className="filter-title-row">
                  <span className="filter-title" style={{ marginBottom: 0 }}>
                    {activeDeptObj?.name || 'Skincare'} Type
                  </span>
                  {selectedCats.length > 0 && (
                    <button
                      type="button"
                      className="filter-inline-clear"
                      onClick={() => setSelectedCats([])}
                    >
                      All
                    </button>
                  )}
                </div>
                <div className="filter-pill-grid" style={{ marginTop: '8px' }}>
                  {subCategories.map((sub) => {
                    const isSubSelected = selectedCats.includes(sub.name);
                    return (
                      <button
                        key={sub.id || sub.name}
                        type="button"
                        className={`sidebar-pill ${isSubSelected ? 'active' : ''}`}
                        onClick={() => {
                          if (isSubSelected) {
                            setSelectedCats(activeDeptObj ? [activeDeptObj.name] : []);
                          } else {
                            setSelectedCats([sub.name]);
                          }
                        }}
                      >
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Price Range (Clean Min - Max Inputs Only) */}
            <div className="filter-section">
              <div className="filter-title-row" style={{ marginBottom: '8px' }}>
                <span className="filter-title" style={{ marginBottom: 0 }}>
                  {t('prod_price_usd', 'Price Range')}
                </span>
                {(minP > 0 || maxP < 500) && (
                  <button
                    type="button"
                    className="filter-inline-clear"
                    onClick={() => setPriceRange([0, 500])}
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="price-range-inputs-container">
                <div className="price-input-wrapper">
                  <span className="price-input-prefix">$</span>
                  <input
                    type="number"
                    className="form-input price-input"
                    value={priceRange[0]}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handlePriceChange(0, e.target.value)}
                    onBlur={handlePriceBlur}
                    onKeyDown={handlePriceKeyDown}
                    min={0}
                    max={500}
                    placeholder="0"
                  />
                </div>
                <div className="price-range-sep" />
                <div className="price-input-wrapper">
                  <span className="price-input-prefix">$</span>
                  <input
                    type="number"
                    className="form-input price-input"
                    value={priceRange[1]}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handlePriceChange(1, e.target.value)}
                    onBlur={handlePriceBlur}
                    onKeyDown={handlePriceKeyDown}
                    min={0}
                    max={500}
                    placeholder="500"
                  />
                </div>
              </div>
            </div>

            {/* 5. Minimum Rating (Single Horizontal Row instead of 3 vertical rows) */}
            <div className="filter-section">
              <div className="filter-title">{t('prod_min_rating_label', 'Minimum Rating')}</div>
              <div className="rating-pill-row">
                {RATING_OPTIONS.map((opt) => {
                  const active = minRating === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`rating-segment-btn ${active ? 'active' : ''}`}
                      onClick={() => setMinRating(opt.value)}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. ACCORDION: Active Ingredients */}
            <div className="filter-section filter-accordion">
              <button
                type="button"
                className="accordion-trigger"
                onClick={() => toggleSection('actives')}
                aria-expanded={openSections.actives || selectedActives.length > 0}
              >
                <span className="filter-title" style={{ marginBottom: 0 }}>
                  {t('filter_active_ingredients', 'Active Ingredients')}
                  {selectedActives.length > 0 && (
                    <span className="accordion-count">{selectedActives.length}</span>
                  )}
                </span>
                {openSections.actives || selectedActives.length > 0 ? (
                  <ChevronUp size={15} />
                ) : (
                  <ChevronDown size={15} />
                )}
              </button>

              {(openSections.actives || selectedActives.length > 0) && (
                <div className="filter-pill-grid" style={{ marginTop: '10px' }}>
                  {ACTIVE_OPTIONS.map((opt) => {
                    const active = selectedActives.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        className={`sidebar-pill ${active ? 'active' : ''}`}
                        onClick={() => toggleItem(setSelectedActives, opt.value)}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 7. ACCORDION: Free From & Certifications */}
            <div className="filter-section filter-accordion">
              <button
                type="button"
                className="accordion-trigger"
                onClick={() => toggleSection('cleanClaims')}
                aria-expanded={openSections.cleanClaims || cleanClaimsCount > 0}
              >
                <span className="filter-title" style={{ marginBottom: 0 }}>
                  Free From &amp; Clean Claims
                  {cleanClaimsCount > 0 && (
                    <span className="accordion-count">{cleanClaimsCount}</span>
                  )}
                </span>
                {openSections.cleanClaims || cleanClaimsCount > 0 ? (
                  <ChevronUp size={15} />
                ) : (
                  <ChevronDown size={15} />
                )}
              </button>

              {(openSections.cleanClaims || cleanClaimsCount > 0) && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <div className="accordion-sub-label">Free From</div>
                    <div className="filter-pill-grid">
                      {FREE_FROM_OPTIONS.map((opt) => {
                        const active = selectedFreeFrom.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            className={`sidebar-pill ${active ? 'active' : ''}`}
                            onClick={() => toggleItem(setSelectedFreeFrom, opt.value)}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="accordion-sub-label">Certifications</div>
                    <div className="filter-pill-grid">
                      {CERT_OPTIONS.map((opt) => {
                        const active = selectedCerts.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            className={`sidebar-pill ${active ? 'active' : ''}`}
                            onClick={() => toggleItem(setSelectedCerts, opt.value)}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile-only close/apply button */}
            <button className="btn btn-primary apply-filters-btn mobile-only-apply" onClick={applyFilters}>
              {t('prod_apply_filters', 'Show Results')}
            </button>
          </aside>

          {/* Sidebar overlay (mobile) */}
          {sidebarOpen && (
            <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
          )}

          {/* ══ Products Area ════════════════════════════════════ */}
          <section className="products-area">
            {/* Result count & active chips */}
            <div className="products-toolbar">
              <div className="results-count">
                {loading ? (
                  <span className="skeleton skeleton-count" />
                ) : (
                  <span>
                    {t('prod_found_format')
                      .split('{count}')
                      .map((part, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <strong>{totalCount.toLocaleString()}</strong>}
                          {part}
                        </React.Fragment>
                      ))}
                  </span>
                )}
              </div>

              {/* Active filter chips */}
              {activeFilterCount > 0 && (
                <div className="active-filters">
                  {safeForMe && (
                    <span className="filter-chip chip-safe">
                      <ShieldCheck size={12} />
                      <span>Safe For My Skin</span>
                      <button type="button" onClick={() => setSafeForMe(false)}>
                        <X size={11} />
                      </button>
                    </span>
                  )}
                  {selectedSkinType && (
                    <span className="filter-chip">
                      <span>Skin: {selectedSkinType}</span>
                      <button type="button" onClick={() => setSelectedSkinType('')}>
                        <X size={11} />
                      </button>
                    </span>
                  )}
                  {searchText && (
                    <span className="filter-chip">
                      <Search size={11} />
                      <span>{searchText}</span>
                      <button type="button" onClick={() => setSearchText('')}>
                        <X size={11} />
                      </button>
                    </span>
                  )}
                  {selectedBrand && (
                    <span className="filter-chip">
                      <span>Brand: {selectedBrand}</span>
                      <button type="button" onClick={() => setSelectedBrand('')}>
                        <X size={11} />
                      </button>
                    </span>
                  )}
                  {selectedCats.map((cat) => (
                    <span key={cat} className="filter-chip">
                      <span>{t('cat_' + cat) === 'cat_' + cat ? cat : t('cat_' + cat)}</span>
                      <button type="button" onClick={() => toggleCategory(cat)}>
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                  {(minP > 0 || maxP < 500) && (
                    <span className="filter-chip">
                      <span>
                        {formatPrice(minP)}–{formatPrice(maxP)}
                      </span>
                      <button type="button" onClick={() => setPriceRange([0, 500])}>
                        <X size={11} />
                      </button>
                    </span>
                  )}
                  {minRating && (
                    <span className="filter-chip">
                      <Star size={11} fill="currentColor" />
                      <span>{minRating}+</span>
                      <button type="button" onClick={() => setMinRating('')}>
                        <X size={11} />
                      </button>
                    </span>
                  )}
                  {selectedActives.map((act) => (
                    <span key={act} className="filter-chip">
                      <span>{ACTIVE_OPTIONS.find((o) => o.value === act)?.label || act}</span>
                      <button type="button" onClick={() => toggleItem(setSelectedActives, act)}>
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                  {selectedCerts.map((cert) => (
                    <span key={cert} className="filter-chip">
                      <span>{CERT_OPTIONS.find((o) => o.value === cert)?.label || cert}</span>
                      <button type="button" onClick={() => toggleItem(setSelectedCerts, cert)}>
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                  {selectedFreeFrom.map((ff) => (
                    <span key={ff} className="filter-chip">
                      <span>{FREE_FROM_OPTIONS.find((o) => o.value === ff)?.label || ff}</span>
                      <button type="button" onClick={() => toggleItem(setSelectedFreeFrom, ff)}>
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    className="sidebar-reset-btn"
                    onClick={resetFilters}
                  >
                    <RotateCcw size={12} />
                    <span>{t('prod_clear_filters', 'Clear Filters')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* ─ Loading skeletons ─ */}
            {loading && (
              <div className="product-grid">
                {Array.from({ length: 12 }, (_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* ─ Empty state ─ */}
            {!loading && products.length === 0 && (
              <div className="empty-state products-empty">
                <div className="empty-state-icon">
                  <PackageSearch size={48} strokeWidth={1.5} color="#94A3B8" />
                </div>
                <h3>{t('prod_no_products')}</h3>
                <p>{t('prod_empty_desc')}</p>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 16 }}
                  onClick={resetFilters}
                >
                  <RotateCcw size={15} />
                  {t('prod_clear_filters')}
                </button>
              </div>
            )}

            {/* ─ Product grid ─ */}
            {!loading && products.length > 0 && (
              <>
                <div className="product-grid">
                  {products.map((product, idx) => (
                    <ProductCard
                      key={product.id ?? product.product_id ?? idx}
                      product={product}
                    />
                  ))}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="load-more-container">
                    <button
                      className="btn btn-secondary load-more-btn"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <span className="btn-spinner" />
                          {t('prod_loading')}
                        </>
                      ) : (
                        <>{t('prod_load_more')}</>
                      )}
                    </button>
                  </div>
                )}

                {/* Loading more skeletons */}
                {loadingMore && (
                  <div className="product-grid load-more-grid">
                    {Array.from({ length: 4 }, (_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
