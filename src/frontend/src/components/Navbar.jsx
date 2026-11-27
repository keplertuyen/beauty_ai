import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  Heart,
  Search,
  Menu,
  X,
  Droplets,
  ChevronDown,
  Settings,
  LogOut,
  LayoutDashboard,
  Package,
  Layers,
  MessageSquare,
  LifeBuoy,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getProducts } from '../services/api';
import { getProductImage, DEFAULT_PRODUCT_IMAGE } from '../utils/productImages';
import './Navbar.css';

const RECENT_STORAGE_KEY = 'beautyai_recent_searches';
const MAX_RECENT = 5;

// 7 distinct ingredient / concern keywords (zero overlap with Top 5 Brand/Product Searches)
const POPULAR_KEYWORDS = [
  'Niacinamide',
  'Retinol',
  'Vitamin C',
  'Hyaluronic Acid',
  'Ceramides',
  'Salicylic Acid',
  'Centella (Cica)',
];

// Top 5 distinct brand/product searches
const TOP_5_SEARCHES = [
  { rank: 1, term: 'Tatcha Dewy Skin Cream', category: 'Moisturizers' },
  { rank: 2, term: 'Rare Beauty Liquid Blush', category: 'Cheek' },
  { rank: 3, term: 'Laneige Lip Sleeping Mask', category: 'Lip Care' },
  { rank: 4, term: 'Glow Recipe Dew Drops', category: 'Treatments' },
  { rank: 5, term: 'La Roche-Posay Cicaplast', category: 'Barrier Care' },
];

const KNOWN_BRANDS = [
  'Rare Beauty by Selena Gomez',
  'Tatcha',
  'Laneige',
  'Glow Recipe',
  'The Ordinary',
  "Paula's Choice",
  'La Roche-Posay',
  'CeraVe',
  'Clinique',
  'Charlotte Tilbury',
  'NARS',
  'Drunk Elephant',
  'Summer Fridays',
  "Kiehl's Since 1851",
  'Shiseido',
  'Sol de Janeiro',
  'Fenty Beauty by Rihanna',
  'Dior',
  'Estée Lauder',
  'SkinCeuticals',
  'Supergoop!',
  'Tower 28 Beauty',
  'Youth To The People',
  'First Aid Beauty',
  ' Caudalie',
];

function highlightMatch(text, query) {
  if (!text) return '';
  const cleanQ = (query || '').trim();
  if (!cleanQ) return text;
  const escaped = cleanQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, idx) =>
    part.toLowerCase() === cleanQ.toLowerCase() ? (
      <mark key={idx} className="search-highlight">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function Navbar() {
  const { user, isAdmin, cartCount, wishlist, logout, setCartOpen, formatPrice, t } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Recent searches (persisted in localStorage)
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) || '[]');
      return Array.isArray(saved) ? saved.slice(0, MAX_RECENT) : [];
    } catch {
      return [];
    }
  });

  // Live Autocomplete state
  const [autoProducts, setAutoProducts] = useState([]);
  const [autoLoading, setAutoLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchWrapperRef = useRef(null);
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);

  const navLinks = [
    { path: '/products', label: t('nav_products'), icon: <Package size={15} /> },
    {
      label: t('nav_explore'),
      children: [
        {
          path: '/routines',
          icon: <Sparkles size={15} />,
          label: 'Routine Generator',
          desc: 'Personalized conflict-free routine',
        },
        {
          path: '/ingredient-analyzer',
          icon: <Layers size={15} />,
          label: t('nav_ingredient'),
          desc: t('nav_ingredient_desc'),
        },
      ],
    },
    {
      label: t('nav_support'),
      children: [
        {
          path: '/expert-consult',
          icon: <MessageSquare size={15} />,
          label: t('nav_consult'),
          desc: t('nav_consult_desc'),
        },
        {
          path: '/support',
          icon: <LifeBuoy size={15} />,
          label: t('nav_support_center'),
          desc: t('nav_support_center_desc'),
        },
      ],
    },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Sync navbar search query with URL ?query= when on /products
  useEffect(() => {
    const q = searchParams.get('query') || '';
    setSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // Close search popover on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save term to Recent Searches
  const saveRecentSearch = (term) => {
    const clean = (term || '').trim();
    if (!clean) return;
    setRecentSearches((prev) => {
      const next = [
        clean,
        ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase()),
      ].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage quota errors
      }
      return next;
    });
  };

  const removeRecentSearch = (e, term) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const next = prev.filter((item) => item !== term);
      try {
        localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const trimmedQuery = searchQuery.trim();
  const isTyping = trimmedQuery.length > 0;

  // Match brands & keywords locally
  const matchedBrands = useMemo(() => {
    if (!isTyping) return [];
    const lower = trimmedQuery.toLowerCase();
    return KNOWN_BRANDS.map((b) => b.trim())
      .filter((b) => b.toLowerCase().includes(lower))
      .slice(0, 3);
  }, [isTyping, trimmedQuery]);

  // Debounced live product autocomplete (280ms)
  useEffect(() => {
    clearTimeout(debounceRef.current);
    setActiveIndex(-1);

    if (!isTyping) {
      setAutoProducts([]);
      setAutoLoading(false);
      return;
    }

    setAutoLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await getProducts({
          query: trimmedQuery,
          per_page: 5,
          page: 1,
          sort_by: 'rating',
        });
        const data = res?.data;
        const rawList = data?.products ?? data?.items ?? (Array.isArray(data) ? data : []);
        setAutoProducts(Array.isArray(rawList) ? rawList.slice(0, 5) : []);
      } catch {
        setAutoProducts([]);
      } finally {
        setAutoLoading(false);
      }
    }, 280);

    return () => clearTimeout(debounceRef.current);
  }, [isTyping, trimmedQuery]);

  const executeSearch = (term) => {
    const clean = (term ?? searchQuery).trim();
    setSearchOpen(false);
    setActiveIndex(-1);
    if (clean) {
      saveRecentSearch(clean);
      setSearchQuery(clean);
      navigate(`/products?query=${encodeURIComponent(clean)}`);
    } else {
      setSearchQuery('');
      navigate('/products');
    }
  };

  const handleSelectProduct = (product) => {
    const pid = product.id ?? product.product_id;
    const pName = product.name ?? product.product_name ?? '';
    if (pName) saveRecentSearch(pName);
    setSearchOpen(false);
    setActiveIndex(-1);
    navigate(`/products/${pid}`);
  };

  // Flattened navigable items for ArrowUp / ArrowDown / Enter keyboard support
  const navigableItems = useMemo(() => {
    if (!isTyping) {
      const list = [];
      recentSearches.forEach((term) => list.push({ type: 'term', value: term }));
      POPULAR_KEYWORDS.forEach((kw) => list.push({ type: 'term', value: kw }));
      TOP_5_SEARCHES.forEach((s) => list.push({ type: 'term', value: s.term }));
      return list;
    }
    const list = [];
    matchedBrands.forEach((brand) => list.push({ type: 'term', value: brand }));
    autoProducts.forEach((prod) => list.push({ type: 'product', value: prod }));
    return list;
  }, [isTyping, recentSearches, matchedBrands, autoProducts]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setSearchOpen(false);
      setActiveIndex(-1);
      searchInputRef.current?.blur();
      return;
    }

    if (!searchOpen) {
      if (e.key === 'ArrowDown') {
        setSearchOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (navigableItems.length > 0) {
        setActiveIndex((prev) => (prev + 1) % navigableItems.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (navigableItems.length > 0) {
        setActiveIndex((prev) => (prev <= 0 ? navigableItems.length - 1 : prev - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < navigableItems.length) {
        const target = navigableItems[activeIndex];
        if (target.type === 'product') {
          handleSelectProduct(target.value);
        } else {
          executeSearch(target.value);
        }
      } else {
        executeSearch(searchQuery);
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveIndex(-1);
    if (location.pathname === '/products' && searchParams.get('query')) {
      navigate('/products');
    }
    searchInputRef.current?.focus();
  };

  const openAuth = () => {
    window.dispatchEvent(new CustomEvent('open-auth-modal'));
  };

  return (
    <>
      {/* Dimmed Backdrop Overlay when Search Dropdown is Open */}
      {searchOpen && (
        <div
          className="nav-search-backdrop"
          onClick={() => {
            setSearchOpen(false);
            setActiveIndex(-1);
          }}
          aria-hidden="true"
        />
      )}

      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <div className="logo-icon">
              <Droplets size={18} />
            </div>
            <span className="logo-text">
              Beauty<span className="logo-accent">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="navbar-links">
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.label} className="nav-dropdown-wrapper">
                  <button className="nav-link nav-link-dropdown" type="button">
                    {link.label}
                    <ChevronDown size={14} />
                  </button>
                  <div className="nav-dropdown">
                    {link.children.map((child) => (
                      <Link key={child.path} to={child.path} className="nav-dropdown-item">
                        <span className="dropdown-label">
                          {child.icon}
                          {child.label}
                        </span>
                        <span className="dropdown-desc">{child.desc}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                >
                  {link.icon && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        marginRight: '5px',
                        verticalAlign: 'middle',
                      }}
                    >
                      {link.icon}
                    </span>
                  )}
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* Inline Search Box + Aligned Popover / Live Autocomplete */}
          <div className="nav-search-container" ref={searchWrapperRef}>
            <form
              onSubmit={handleSearchSubmit}
              className={`nav-inline-search ${searchOpen ? 'focused' : ''}`}
            >
              <Search size={15} className="nav-inline-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t('nav_search_placeholder', 'Search products, brands, actives...')}
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!searchOpen) setSearchOpen(true);
                }}
                onKeyDown={handleKeyDown}
                aria-label="Search products"
                aria-expanded={searchOpen}
                autoComplete="off"
              />
              {autoLoading && isTyping && (
                <Loader2 size={14} className="nav-search-spinner" />
              )}
              {searchQuery && (
                <button
                  type="button"
                  className="nav-inline-clear"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </form>

            {/* Floating Popover Dropdown (Aligned 1:1 with Search Bar right & left edges) */}
            {searchOpen && (
              <div className="nav-search-popover animate-scaleIn" role="listbox">
                {!isTyping ? (
                  <>
                    {/* 1. RECENT SEARCHES (Shown at top if user has history) */}
                    {recentSearches.length > 0 && (
                      <div className="search-popover-section">
                        <div className="search-popover-header-row">
                          <div className="search-popover-title">
                            <Clock size={13} />
                            <span>Recent Searches</span>
                          </div>
                          <button
                            type="button"
                            className="search-clear-recent-btn"
                            onClick={clearAllRecent}
                          >
                            Clear
                          </button>
                        </div>
                        <div className="search-popover-tags">
                          {recentSearches.map((term, idx) => {
                            const isHighlighted = activeIndex === idx;
                            return (
                              <div
                                key={term}
                                className={`search-recent-pill ${isHighlighted ? 'is-active' : ''}`}
                                onClick={() => executeSearch(term)}
                                role="option"
                                aria-selected={isHighlighted}
                              >
                                <span>{term}</span>
                                <button
                                  type="button"
                                  className="search-recent-remove"
                                  onClick={(e) => removeRecentSearch(e, term)}
                                  aria-label={`Remove ${term}`}
                                >
                                  <X size={11} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 2. POPULAR INGREDIENTS & CONCERNS (7 distinct chips) */}
                    <div
                      className={`search-popover-section ${
                        recentSearches.length > 0 ? 'search-popover-divider' : ''
                      }`}
                    >
                      <div className="search-popover-title">
                        <Sparkles size={13} />
                        <span>Popular Actives &amp; Skincare</span>
                      </div>
                      <div className="search-popover-tags">
                        {POPULAR_KEYWORDS.map((kw, kIdx) => {
                          const flatIdx = recentSearches.length + kIdx;
                          const isHighlighted = activeIndex === flatIdx;
                          return (
                            <button
                              key={kw}
                              type="button"
                              className={`search-tag-pill ${isHighlighted ? 'is-active' : ''}`}
                              onClick={() => executeSearch(kw)}
                            >
                              {kw}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. TOP 5 MOST SEARCHED PRODUCTS & BRANDS (Clean numbered list, no extra dots) */}
                    <div className="search-popover-section search-popover-divider">
                      <div className="search-popover-title">
                        <TrendingUp size={13} />
                        <span>Top 5 Searches</span>
                      </div>
                      <div className="search-top5-list">
                        {TOP_5_SEARCHES.map((item, sIdx) => {
                          const flatIdx =
                            recentSearches.length + POPULAR_KEYWORDS.length + sIdx;
                          const isHighlighted = activeIndex === flatIdx;
                          return (
                            <button
                              key={item.rank}
                              type="button"
                              className={`search-top5-row rank-${item.rank} ${
                                isHighlighted ? 'is-active' : ''
                              }`}
                              onClick={() => executeSearch(item.term)}
                            >
                              <span className="search-rank-badge">{item.rank}</span>
                              <span className="search-top5-term">{item.term}</span>
                              <span className="search-top5-cat">{item.category}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  /* ── LIVE AUTOCOMPLETE VIEW WHEN TYPING ── */
                  <div className="search-autocomplete-view">
                    {/* Matching Brands */}
                    {matchedBrands.length > 0 && (
                      <div className="search-popover-section">
                        <div className="search-popover-title">
                          <span>Matching Brands</span>
                        </div>
                        <div className="search-brand-matches">
                          {matchedBrands.map((brand, bIdx) => {
                            const isHighlighted = activeIndex === bIdx;
                            return (
                              <button
                                key={brand}
                                type="button"
                                className={`search-brand-row ${isHighlighted ? 'is-active' : ''}`}
                                onClick={() => executeSearch(brand)}
                              >
                                <Search size={13} className="search-brand-icon" />
                                <span className="search-brand-name">
                                  {highlightMatch(brand, trimmedQuery)}
                                </span>
                                <span className="search-brand-tag">Brand</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Matching Products with Thumbnail, Highlighted Text & Price */}
                    {autoProducts.length > 0 && (
                      <div
                        className={`search-popover-section ${
                          matchedBrands.length > 0 ? 'search-popover-divider' : ''
                        }`}
                      >
                        <div className="search-popover-title">
                          <span>Suggested Products</span>
                        </div>
                        <div className="search-product-matches">
                          {autoProducts.map((prod, pIdx) => {
                            const flatIdx = matchedBrands.length + pIdx;
                            const isHighlighted = activeIndex === flatIdx;
                            const pName = prod.name ?? prod.product_name ?? 'Product';
                            const pBrand = prod.brandName ?? prod.brand_name ?? '';
                            const pPrice =
                              parseFloat(prod.priceUsd ?? prod.price_usd ?? prod.price) || 0;
                            const thumbUrl = getProductImage(prod, 120);

                            return (
                              <button
                                key={prod.id ?? prod.product_id ?? pIdx}
                                type="button"
                                className={`search-product-row ${isHighlighted ? 'is-active' : ''}`}
                                onClick={() => handleSelectProduct(prod)}
                              >
                                <div className="search-product-thumb">
                                  <img
                                    src={thumbUrl}
                                    alt={pName}
                                    onError={(e) => {
                                      e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                                    }}
                                  />
                                </div>
                                <div className="search-product-info">
                                  <div className="search-product-brand">
                                    {highlightMatch(pBrand, trimmedQuery)}
                                  </div>
                                  <div className="search-product-name">
                                    {highlightMatch(pName, trimmedQuery)}
                                  </div>
                                </div>
                                <div className="search-product-price">
                                  {formatPrice(pPrice)}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* View All Results Button */}
                    {(matchedBrands.length > 0 || autoProducts.length > 0) && (
                      <button
                        type="button"
                        className="search-view-all-btn"
                        onClick={() => executeSearch(trimmedQuery)}
                      >
                        <span>
                          View all results for &ldquo;<strong>{trimmedQuery}</strong>&rdquo;
                        </span>
                        <ArrowRight size={14} />
                      </button>
                    )}

                    {/* Empty State with Alternative Suggestions */}
                    {!autoLoading &&
                      matchedBrands.length === 0 &&
                      autoProducts.length === 0 && (
                        <div className="search-empty-state">
                          <div className="search-empty-title">
                            No results found for &ldquo;<strong>{trimmedQuery}</strong>&rdquo;
                          </div>
                          <div className="search-empty-sub">
                            Try searching for a popular active or category instead:
                          </div>
                          <div
                            className="search-popover-tags"
                            style={{ justifyContent: 'center', marginTop: '8px' }}
                          >
                            {['Niacinamide', 'Moisturizer', 'Tatcha', 'Lip Mask'].map((alt) => (
                              <button
                                key={alt}
                                type="button"
                                className="search-tag-pill"
                                onClick={() => executeSearch(alt)}
                              >
                                {alt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="navbar-actions">
            {/* Wishlist */}
            <Link to="/wishlist" className="nav-icon-btn" aria-label={t('nav_wishlist')}>
              <Heart size={18} />
              {wishlist.length > 0 && <span className="nav-badge">{wishlist.length}</span>}
            </Link>

            {/* Cart */}
            <button
              className="nav-icon-btn"
              onClick={() => setCartOpen(true)}
              aria-label={t('nav_cart')}
              type="button"
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
            </button>

            {/* User */}
            {user ? (
              <div className="user-menu-wrapper">
                <button
                  className="user-avatar-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  type="button"
                >
                  <span>{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                </button>
                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <div className="user-name">{user.name}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                    <div className="user-dropdown-body">
                      <Link to="/profile" className="user-menu-item">
                        <Settings size={15} /> {t('nav_settings')}
                      </Link>
                      <Link to="/wishlist" className="user-menu-item">
                        <Heart size={15} /> {t('nav_wishlist')}
                      </Link>
                      <Link to="/profile?tab=orders" className="user-menu-item">
                        <ShoppingBag size={15} /> {t('nav_my_orders')}
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" className="user-menu-item">
                          <LayoutDashboard size={15} /> {t('nav_admin')}
                        </Link>
                      )}
                      <div className="dropdown-divider" />
                      <button className="user-menu-item danger" onClick={logout} type="button">
                        <LogOut size={15} /> {t('nav_logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={openAuth} type="button">
                {t('nav_login')}
              </button>
            )}

            {/* Mobile Menu */}
            <button
              className="nav-icon-btn mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
              type="button"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="mobile-nav">
            <form
              onSubmit={(e) => {
                handleSearchSubmit(e);
                setMobileOpen(false);
              }}
              className="nav-inline-search mobile-nav-search"
            >
              <Search size={15} className="nav-inline-search-icon" />
              <input
                type="text"
                placeholder={t('nav_search_placeholder', 'Search products, brands, actives...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search products"
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="nav-inline-clear"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </form>
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.label}>
                  <div className="mobile-nav-section">{link.label}</div>
                  {link.children.map((child) => (
                    <Link key={child.path} to={child.path} className="mobile-nav-link">
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link key={link.path} to={link.path} className="mobile-nav-link">
                  {link.label}
                </Link>
              )
            )}
            {!user && (
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '12px' }}
                onClick={openAuth}
                type="button"
              >
                {t('nav_login')} / {t('nav_register')}
              </button>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
