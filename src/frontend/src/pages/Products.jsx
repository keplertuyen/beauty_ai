import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronDown, RotateCcw, ShieldCheck, Star, Package, Filter, PackageSearch } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProducts, getCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import { useApp } from '../context/AppContext';
import './Products.css';

const PER_PAGE = 20;

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
  const { t, lang, formatPrice, user } = useApp();

  const CERT_OPTIONS = [
    { value: 'Vegan', label: 'Vegan' },
    { value: 'Cruelty-Free', label: 'Cruelty-Free' },
    { value: 'Clean at Sephora', label: 'Clean at Sephora' },
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
    { value: 'bha', label: 'BHA (Salicylic Acid)' },
    { value: 'aha', label: 'AHA (Glycolic/Lactic)' },
    { value: 'retinol', label: 'Retinol' },
    { value: 'hyaluronic acid', label: 'Hyaluronic Acid' },
    { value: 'vitamin c', label: 'Vitamin C' },
    { value: 'centella', label: 'Centella (Cica)' },
    { value: 'ceramide', label: 'Ceramide' },
    { value: 'peptide', label: 'Peptides' },
  ];

  const SORT_OPTIONS = [
    { value: 'rating',     label: `⭐ ${t('prod_sort_rating')}` },
    { value: 'loves',      label: `❤️ ${t('prod_sort_loves')}` },
    { value: 'reviews',    label: `💬 ${t('prod_sort_reviews')}` },
    { value: 'price_asc',  label: `💲 ${t('prod_sort_price_asc')}` },
    { value: 'price_desc', label: `💲 ${t('prod_sort_price_desc')}` },
  ];

  const RATING_OPTIONS = [
    { value: '',    label: t('prod_rating_all') },
    { value: '4',   label: '4.0+ ⭐' },
    { value: '4.5', label: '4.5+ ⭐' },
  ];

  /* Filters state — initialised from URL params */
  const [searchText,         setSearchText]         = useState(searchParams.get('query')    || '');
  const [selectedCats,       setSelectedCats]       = useState(() => {
    const c = searchParams.get('category');
    return c ? [c] : [];
  });
  const [selectedSkinType,   setSelectedSkinType]   = useState(searchParams.get('skinType') || '');
  const [safeForMe,          setSafeForMe]          = useState(false);
  const [priceRange,         setPriceRange]         = useState([0, 500]);
  const [minRating,          setMinRating]          = useState('');
  const [sortBy,             setSortBy]             = useState('rating');
  const [selectedCerts,      setSelectedCerts]      = useState([]);
  const [selectedFreeFrom,   setSelectedFreeFrom]   = useState([]);
  const [selectedActives,    setSelectedActives]    = useState([]);
  const [sidebarOpen,        setSidebarOpen]        = useState(false);  // mobile toggle

  /* Product data */
  const [products,    setProducts]    = useState([]);
  const [totalCount,  setTotalCount]  = useState(0);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  /* Categories */
  const [categories,  setCategories]  = useState([]);

  /* Debounce ref */
  const searchTimer = useRef(null);

  /* ── Load categories once ─────────────────────────────────── */
  useEffect(() => {
    getCategories()
      .then(res => setCategories(res.data?.categories || res.data || []))
      .catch(() => {});
  }, []);

  /* ── Sync URL query/category params on mount/update ──────── */
  useEffect(() => {
    const q = searchParams.get('query') || '';
    const c = searchParams.get('category');
    setSearchText(q);
    if (c) {
      setSelectedCats([c]);
    } else {
      setSelectedCats([]);
    }
  }, [searchParams]);

  /* ── Fetch products ───────────────────────────────────────── */
  const fetchProducts = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = {
        page:      pageNum,
        per_page:  PER_PAGE,
        sort_by:   sortBy,
      };
      if (searchText.trim())    params.query      = searchText.trim();
      if (selectedCats.length)  params.category   = selectedCats[0];
      if (selectedSkinType)     params.skinType   = selectedSkinType;
      if (safeForMe)            params.safe_for_me = true;
      
      const minP = priceRange[0] === '' ? 0 : Number(priceRange[0]);
      const maxP = priceRange[1] === '' ? 500 : Number(priceRange[1]);
      if (minP > 0)    params.min_price  = minP;
      if (maxP < 500)  params.max_price  = maxP;
      if (minRating)            params.min_rating = minRating;
      if (selectedCerts.length) params.highlights_filter = selectedCerts.join(',');
      if (selectedFreeFrom.length) params.free_from = selectedFreeFrom.join(',');
      if (selectedActives.length) params.active_ingredients = selectedActives.join(',');

      const res = await getProducts(params);
      const data = res.data;
      const items = data.products || data.items || data || [];
      const total = data.total ?? items.length;
      const pages = data.pages ?? Math.ceil(total / PER_PAGE);

      if (append) {
        setProducts(prev => [...prev, ...items]);
      } else {
        setProducts(items);
      }
      setTotalCount(total);
      setHasMore(pageNum < pages);
    } catch (err) {
      console.error('Products fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchText, selectedCats, selectedSkinType, safeForMe, priceRange, minRating, sortBy, selectedCerts, selectedFreeFrom, selectedActives]);

  /* ── Re-fetch when filters change (debounce search) ─────────  */
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchProducts(1, false);
    }, 500);
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
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  /* ── Apply filters (button) ───────────────────────────────── */
  const applyFilters = () => {
    setSidebarOpen(false);
    setPage(1);
    fetchProducts(1, false);
  };

  /* ── Reset filters ────────────────────────────────────────── */
  const resetFilters = () => {
    setSearchText('');
    setSelectedCats([]);
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
    setter(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };
  /* ── Handle price change ──────────────────────────────────── */
  const handlePriceChange = (index, val) => {
    setPriceRange(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  /* ── Handle price blur/normalize ──────────────────────────── */
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

  /* ── Handle enter key to blur/normalize ───────────────────── */
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
    (selectedSkinType ? 1 : 0) +
    (safeForMe ? 1 : 0) +
    selectedCerts.length +
    selectedFreeFrom.length +
    selectedActives.length +
    (minP > 0 || maxP < 500 ? 1 : 0) +
    (minRating ? 1 : 0);

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="products-page">
      {/* ── Page Header ── */}
      <div className="products-header">
        <div className="container">
          <div className="products-header-inner">
            <div>
              <h1 className="products-title display-font">
                <Package size={26} className="products-title-icon" />
                {t('prod_title')}
              </h1>
              <p className="products-subtitle">
                {t('prod_subtitle_format').replace('{count}', totalCount.toLocaleString())}
              </p>
            </div>

            {/* Mobile filter toggle */}
            <button
              className="btn btn-secondary mobile-filter-toggle"
              onClick={() => setSidebarOpen(prev => !prev)}
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
        <div className="products-layout">

          {/* ══ Filter Sidebar ══════════════════════════════════ */}
          <aside className={`filter-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
            {/* Sidebar header */}
            <div className="sidebar-header">
              <h2 className="sidebar-title">
                <SlidersHorizontal size={16} />
                {t('prod_filter_title')}
              </h2>
              <div className="sidebar-header-actions">
                {activeFilterCount > 0 && (
                  <button className="sidebar-reset-btn" onClick={resetFilters}>
                    <RotateCcw size={13} />
                    {t('prod_clear_filters')}
                  </button>
                )}
                <button
                  className="sidebar-close-btn"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ─ USP Core: Safe For My Skin (Allergy Exclusion Toggle) ─ */}
            <div
              className="filter-section"
              style={{
                background: safeForMe ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-secondary)',
                border: safeForMe ? '1.5px solid #10B981' : '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '16px',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                    <ShieldCheck size={16} color="#10B981" /> Safe For My Skin
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Auto-hides your allergens
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '42px', height: '24px', cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={safeForMe}
                    onChange={(e) => {
                      if (!user) {
                        toast.error('Please log in with your Digital Skin ID to enable allergy filtering');
                        return;
                      }
                      setSafeForMe(e.target.checked);
                    }}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: safeForMe ? '#10B981' : '#D1D5DB',
                    borderRadius: '24px', transition: '.25s'
                  }}>
                    <span style={{
                      position: 'absolute', content: '""', height: '18px', width: '18px',
                      left: safeForMe ? '21px' : '3px', bottom: '3px',
                      backgroundColor: 'white', borderRadius: '50%', transition: '.25s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </span>
                </label>
              </div>
              {safeForMe && (
                <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={13} /> Active: Products with allergens are hidden
                </div>
              )}
            </div>

            {/* ─ Skin Type Filter ─ */}
            <div className="filter-section">
              <div className="filter-title">Skin Type</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {SKIN_TYPE_OPTIONS.map(opt => {
                  const active = selectedSkinType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedSkinType(opt.value)}
                      style={{
                        padding: '5px 11px',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: active ? 600 : 500,
                        border: active ? '1.5px solid var(--primary)' : '1px solid var(--glass-border)',
                        background: active ? 'var(--primary)' : 'var(--bg-secondary)',
                        color: active ? '#FFFFFF' : 'var(--text-primary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─ Search ─ */}
            <div className="filter-section">
              <div className="filter-title">{t('prod_search')}</div>
              <div className="search-bar filter-search">
                <Search size={15} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder={t('prod_search_placeholder_short')}
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                />
                {searchText && (
                  <button
                    className="search-clear-btn"
                    onClick={() => setSearchText('')}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* ─ Sort ─ */}
            <div className="filter-section">
              <div className="filter-title">{t('prod_sort_by')}</div>
              <div className="select-wrapper">
                <select
                  className="form-select"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="select-icon" />
              </div>
            </div>

            {/* ─ Categories (Department & Subcategory Hierarchy) ─ */}
            <div className="filter-section">
              <div className="filter-title">{t('prod_category', 'Category')}</div>
              <div className="category-nav-list">
                <button
                  type="button"
                  className={`category-nav-btn ${selectedCats.length === 0 ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCats([]);
                    setSearchParams({});
                  }}
                >
                  <span className="category-nav-label">{t('cat_all', 'All Categories')}</span>
                  {selectedCats.length === 0 && <span className="category-active-dot" />}
                </button>

                {/* Primary Departments first */}
                {categories
                  .filter(c => c.parentId === null || c.parent_id === null)
                  .map(cat => {
                    const catName = cat.name || cat;
                    const isSelected = selectedCats.includes(catName);

                    return (
                      <button
                        key={catName}
                        type="button"
                        className={`category-nav-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCats([]);
                          } else {
                            setSelectedCats([catName]);
                          }
                        }}
                      >
                        <span className="category-nav-label">{catName}</span>
                        {isSelected && <span className="category-active-dot" />}
                      </button>
                    );
                  })}
              </div>

              {/* Subcategories (if a department or subcategory is selected, or expand popular) */}
              {(() => {
                const activeDeptName = selectedCats.find(c =>
                  categories.some(cat => (cat.parentId === null || cat.parent_id === null) && cat.name === c)
                ) || (selectedCats.length === 0 ? 'Skincare' : null);

                const activeDept = categories.find(c => c.name === activeDeptName);
                const subCats = activeDept
                  ? categories.filter(c => (c.parentId === activeDept.id || c.parent_id === activeDept.id))
                  : [];

                if (subCats.length === 0) return null;

                return (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-subtle, #E2E8F0)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {activeDeptName} Subcategories
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {subCats.map(sub => {
                        const isSubSelected = selectedCats.includes(sub.name);
                        return (
                          <button
                            key={sub.id || sub.name}
                            type="button"
                            onClick={() => {
                              if (isSubSelected) {
                                setSelectedCats(activeDeptName ? [activeDeptName] : []);
                              } else {
                                setSelectedCats([sub.name]);
                              }
                            }}
                            style={{
                              padding: '3px 9px',
                              borderRadius: '999px',
                              fontSize: '0.74rem',
                              fontWeight: isSubSelected ? 600 : 500,
                              border: isSubSelected ? '1.5px solid var(--primary)' : '1px solid var(--glass-border, #CBD5E1)',
                              background: isSubSelected ? 'var(--primary)' : 'var(--bg-secondary, #F8FAFC)',
                              color: isSubSelected ? '#FFFFFF' : 'var(--text-primary)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {sub.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ─ Price Range ─ */}
            <div className="filter-section">
              <div className="filter-title">{t('prod_price_usd')}</div>
              <div className="price-range-inputs-container">
                <div className="price-input-wrapper">
                  <span className="price-input-prefix">$</span>
                  <input
                    type="number"
                    className="form-input price-input"
                    value={priceRange[0]}
                    onChange={e => handlePriceChange(0, e.target.value)}
                    onBlur={handlePriceBlur}
                    onKeyDown={handlePriceKeyDown}
                    min={0}
                    max={500}
                    placeholder="Min"
                  />
                </div>
                <div className="price-range-sep" />
                <div className="price-input-wrapper">
                  <span className="price-input-prefix">$</span>
                  <input
                    type="number"
                    className="form-input price-input"
                    value={priceRange[1]}
                    onChange={e => handlePriceChange(1, e.target.value)}
                    onBlur={handlePriceBlur}
                    onKeyDown={handlePriceKeyDown}
                    min={0}
                    max={500}
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>

            {/* ─ Min Rating ─ */}
            <div className="filter-section">
              <div className="filter-title">{t('prod_min_rating_label')}</div>
              <div className="rating-options">
                {RATING_OPTIONS.map(opt => (
                  <label key={opt.value} className="filter-option rating-option">
                    <input
                      type="radio"
                      name="minRating"
                      value={opt.value}
                      checked={minRating === opt.value}
                      onChange={() => setMinRating(opt.value)}
                    />
                    <span className="filter-option-label">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ─ Smart Filter: Active Ingredients (FR-04.3) ─ */}
            <div className="filter-section">
              <div className="filter-title">{t('filter_active_ingredients', 'Active Ingredients')}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {ACTIVE_OPTIONS.map(opt => {
                  const active = selectedActives.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleItem(setSelectedActives, opt.value)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: active ? 600 : 500,
                        border: active ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                        background: active ? 'var(--primary)' : 'var(--bg-secondary)',
                        color: active ? '#FFFFFF' : 'var(--text-primary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─ Smart Filter: Certifications (FR-04.1) ─ */}
            <div className="filter-section">
              <div className="filter-title">{t('filter_certifications', 'Certifications')}</div>
              <div className="rating-options">
                {CERT_OPTIONS.map(opt => (
                  <label key={opt.value} className="filter-option rating-option">
                    <input
                      type="checkbox"
                      checked={selectedCerts.includes(opt.value)}
                      onChange={() => toggleItem(setSelectedCerts, opt.value)}
                    />
                    <span className="filter-option-label">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ─ Smart Filter: Free-From Exclusions (FR-04.2) ─ */}
            <div className="filter-section">
              <div className="filter-title">Free From (Safe Filter)</div>
              <div className="rating-options">
                {FREE_FROM_OPTIONS.map(opt => (
                  <label key={opt.value} className="filter-option rating-option">
                    <input
                      type="checkbox"
                      checked={selectedFreeFrom.includes(opt.value)}
                      onChange={() => toggleItem(setSelectedFreeFrom, opt.value)}
                    />
                    <span className="filter-option-label">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ─ Apply button ─ */}
            <button className="btn btn-primary apply-filters-btn" onClick={applyFilters}>
              {t('prod_apply_filters')}
            </button>
          </aside>

          {/* Sidebar overlay (mobile) */}
          {sidebarOpen && (
            <div
              className="sidebar-overlay"
              onClick={() => setSidebarOpen(false)}
            />
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
                    {t('prod_found_format').split('{count}').map((part, i) => (
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
                    <span className="filter-chip" style={{ background: '#10B981', color: '#FFFFFF', fontWeight: 600 }}>
                      <ShieldCheck size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Safe For My Skin
                      <button onClick={() => setSafeForMe(false)}><X size={11} color="#FFFFFF" /></button>
                    </span>
                  )}
                  {selectedSkinType && (
                    <span className="filter-chip">
                      Skin: {selectedSkinType}
                      <button onClick={() => setSelectedSkinType('')}><X size={11} /></button>
                    </span>
                  )}
                  {searchText && (
                    <span className="filter-chip">
                      <Search size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {searchText}
                      <button onClick={() => setSearchText('')}><X size={11} /></button>
                    </span>
                  )}
                  {selectedCats.map(cat => (
                    <span key={cat} className="filter-chip">
                      {t('cat_' + cat) === 'cat_' + cat ? cat : t('cat_' + cat)}
                      <button onClick={() => toggleCategory(cat)}><X size={11} /></button>
                    </span>
                  ))}
                  {(minP > 0 || maxP < 500) && (
                    <span className="filter-chip">
                      {formatPrice(minP)}–{formatPrice(maxP)}
                      <button onClick={() => setPriceRange([0, 500])}><X size={11} /></button>
                    </span>
                  )}
                  {minRating && (
                    <span className="filter-chip">
                      <Star size={11} fill="currentColor" style={{ marginRight: 4, verticalAlign: 'middle' }} /> {minRating}+
                      <button onClick={() => setMinRating('')}><X size={11} /></button>
                    </span>
                  )}
                  {selectedActives.map(act => (
                    <span key={act} className="filter-chip">
                      {ACTIVE_OPTIONS.find(o => o.value === act)?.label || act}
                      <button onClick={() => toggleItem(setSelectedActives, act)}><X size={11} /></button>
                    </span>
                  ))}
                  {selectedCerts.map(cert => (
                    <span key={cert} className="filter-chip">
                      {CERT_OPTIONS.find(o => o.value === cert)?.label || cert}
                      <button onClick={() => toggleItem(setSelectedCerts, cert)}><X size={11} /></button>
                    </span>
                  ))}
                  {selectedFreeFrom.map(ff => (
                    <span key={ff} className="filter-chip">
                      {FREE_FROM_OPTIONS.find(o => o.value === ff)?.label || ff}
                      <button onClick={() => toggleItem(setSelectedFreeFrom, ff)}><X size={11} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ─ Loading skeletons ─ */}
            {loading && (
              <div className="product-grid">
                {Array.from({ length: 12 }, (_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* ─ Empty state ─ */}
            {!loading && products.length === 0 && (
              <div className="empty-state products-empty">
                <div className="empty-state-icon"><PackageSearch size={48} strokeWidth={1.5} color="#94A3B8" /></div>
                <h3>{t('prod_no_products')}</h3>
                <p>{t('prod_empty_desc')}</p>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={resetFilters}>
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
                    <ProductCard key={product.id ?? product.product_id ?? idx} product={product} />
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
                        <>
                          {t('prod_load_more')}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Loading more skeletons */}
                {loadingMore && (
                  <div className="product-grid load-more-grid">
                    {Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)}
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
