import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Package, FlaskConical, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { getFeatured, getTrending } from '../services/api';
import { useApp } from '../context/AppContext';
import './Home.css';

/* ── Category definitions ── */
const CATEGORIES = [
  { name: 'Moisturizers',          emoji: '🧴', slug: 'Moisturizers' },
  { name: 'Serums & Essences',     emoji: '💧', slug: 'Serums & Essences' },
  { name: 'Face Wash',             emoji: '🫧', slug: 'Face Wash & Cleansers' },
  { name: 'Face Masks',            emoji: '🎭', slug: 'Face Masks' },
  { name: 'Eye Creams',            emoji: '👁️', slug: 'Eye Creams' },
  { name: 'Lip Treatments',        emoji: '💋', slug: 'Lip Balm & Treatments' },
  { name: 'Sunscreen',             emoji: '☀️', slug: 'Face Sunscreen' },
  { name: 'Anti-Aging',            emoji: '⏳', slug: 'Anti-Aging' },
];

/* ── Floating cosmetic decorations ── */
const FLOATERS = ['💄', '🌸', '🌿', '🧴', '🥑', '💧', '🧼', '🧪'];

export default function Home() {
  const navigate = useNavigate();
  const { t } = useApp();
  const [featured, setFeatured]       = useState([]);
  const [trending, setTrending]       = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);

  /* ── Stats ── */
  const STATS = [
    { value: '8,494+', label: t('home_stat_products') },
    { value: '304+',   label: t('home_stat_brands') },
    { value: '1M+',    label: t('home_stat_reviews') },
    { value: '9',      label: t('home_stat_categories') },
  ];

  /* ── Feature highlights ── */
  const FEATURES = [
    {
      icon: <ShieldCheck size={28} />,
      emoji: '🤖',
      title: t('home_ai_recs_title'),
      desc: t('home_ai_recs_desc'),
    },
    {
      icon: <FlaskConical size={28} />,
      emoji: '🔬',
      title: t('home_ing_analyzer_title'),
      desc: t('home_ing_analyzer_desc'),
    },
    {
      icon: <MessageCircle size={28} />,
      emoji: '💬',
      title: t('home_expert_title'),
      desc: t('home_expert_desc'),
    },
  ];

  /* Fetch data */
  useEffect(() => {
    getFeatured(8)
      .then(res => setFeatured(res.data?.featured || res.data?.products || (Array.isArray(res.data) ? res.data : [])))
      .catch(() => setFeatured([]))
      .finally(() => setFeaturedLoading(false));

    getTrending(8)
      .then(res => setTrending(res.data?.trending || res.data?.products || (Array.isArray(res.data) ? res.data : [])))
      .catch(() => setTrending([]))
      .finally(() => setTrendingLoading(false));
  }, []);

  return (
    <div className="home">

      {/* ══ HERO ══════════════════════════════════════ */}
      <section className="home-hero">
        {/* Animated background orbs */}
        <div className="home-hero-orb home-hero-orb--1" />
        <div className="home-hero-orb home-hero-orb--2" />
        <div className="home-hero-orb home-hero-orb--3" />

        {/* Floating emoji decorations */}
        {FLOATERS.map((emoji, i) => (
          <span
            key={i}
            className="home-floater"
            style={{
              '--delay': `${i * 0.7}s`,
              '--duration': `${6 + i * 0.8}s`,
              '--x': `${8 + i * 11}%`,
              '--size': `${1.2 + (i % 3) * 0.5}rem`,
            }}
          >
            {emoji}
          </span>
        ))}

        <div className="container home-hero-content">
          <div className="home-hero-badge animate-fadeIn">
            <ShieldCheck size={14} />
            <span>{t('home_hero_badge')}</span>
          </div>

          <h1 className="home-hero-title display-font animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            {t('home_hero_title')}
          </h1>

          <p className="home-hero-subtitle animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            {t('home_hero_subtitle')}
          </p>

          <div className="home-hero-actions animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <Link to="/products" className="btn btn-primary btn-lg">
              <Package size={18} />
              {t('home_explore_btn')}
            </Link>
            <Link to="/skin-quiz" className="btn btn-secondary btn-lg">
              {t('home_quiz_btn')}
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Mini stats inside hero */}
          <div className="home-hero-stats animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            {STATS.map((s, i) => (
              <div key={i} className="home-hero-stat">
                <span className="home-hero-stat-value">{s.value}</span>
                <span className="home-hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="home-hero-fade" />
      </section>

      {/* ══ FEATURES BANNER ════════════════════════════ */}
      <section className="home-features section">
        <div className="container">
          <div className="home-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="home-feature-card glass-card">
                <div className="home-feature-icon">
                  <span>{f.emoji}</span>
                </div>
                <h3 className="home-feature-title">{f.title}</h3>
                <p className="home-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURED PRODUCTS ══════════════════════════ */}
      <section className="section">
        <div className="container">
          <div className="home-section-header">
            <div>
              <h2 className="section-title">{t('home_featured_title')}</h2>
              <p className="section-subtitle">{t('home_featured_subtitle')}</p>
            </div>
            <Link to="/products" className="btn btn-secondary">
              {t('home_view_all')} <ArrowRight size={16} />
            </Link>
          </div>
          <ProductRow products={featured} loading={featuredLoading} />
        </div>
      </section>

      {/* ══ CATEGORY CARDS ═════════════════════════════ */}
      <section className="section home-categories-section">
        <div className="container">
          <h2 className="section-title">{t('home_categories_title')}</h2>
          <p className="section-subtitle">{t('home_categories_subtitle')}</p>
          <div className="home-categories-grid">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={i}
                to={`/products?category=${encodeURIComponent(cat.slug)}`}
                className="home-category-card"
                style={{ '--cat-delay': `${i * 0.05}s` }}
              >
                <span className="home-category-emoji">{cat.emoji}</span>
                <span className="home-category-name">{t('cat_' + cat.slug) || cat.name}</span>
                <ArrowRight size={14} className="home-category-arrow" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TRENDING ═══════════════════════════════════ */}
      <section className="section">
        <div className="container">
          <div className="home-section-header">
            <div>
              <h2 className="section-title">{t('home_trending_title')}</h2>
              <p className="section-subtitle">{t('home_trending_subtitle')}</p>
            </div>
            <Link to="/products?sort=trending" className="btn btn-secondary">
              {t('home_view_all')} <ArrowRight size={16} />
            </Link>
          </div>
          <ProductRow products={trending} loading={trendingLoading} />
        </div>
      </section>

      {/* ══ STATS ══════════════════════════════════════ */}
      <section className="home-stats-section section">
        <div className="container">
          <div className="home-stats-grid">
            {STATS.map((s, i) => (
              <div key={i} className="home-stat-card glass-card">
                <div className="home-stat-value">{s.value}</div>
                <div className="home-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ═════════════════════════════════ */}
      <section className="home-cta-section">
        <div className="home-cta-orb home-cta-orb--1" />
        <div className="home-cta-orb home-cta-orb--2" />
        <div className="container home-cta-content">
          <div className="home-cta-badge">{t('home_cta_badge')}</div>
          <h2 className="home-cta-title display-font">
            {t('home_cta_title')}
          </h2>
          <p className="home-cta-subtitle">
            {t('home_cta_subtitle')}
          </p>
          <Link to="/skin-quiz" className="btn btn-primary btn-lg home-cta-btn">
            {t('home_cta_btn')}
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function ProductRow({ products, loading }) {
  const { t } = useApp();
  const rowRef = useRef(null);

  const scroll = (direction) => {
    if (rowRef.current) {
      const scrollAmount = 300;
      rowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="home-product-row-wrapper">
        <div className="home-product-row">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="home-skeleton-card skeleton">
              <div className="home-skeleton-img" />
              <div style={{ padding: '16px' }}>
                <div style={{ height: '16px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', marginBottom: '8px' }} />
                <div style={{ height: '16px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="home-product-row-wrapper" style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>{t('home_no_products')}</p>
      </div>
    );
  }

  return (
    <div className="home-product-row-wrapper">
      <button className="home-scroll-btn home-scroll-btn--left" onClick={() => scroll('left')} aria-label="Scroll left">
        <ChevronLeft size={20} />
      </button>
      <div className="home-product-row" ref={rowRef}>
        {products.map((product) => (
          <div key={product.id} className="home-product-row-item">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
      <button className="home-scroll-btn home-scroll-btn--right" onClick={() => scroll('right')} aria-label="Scroll right">
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
