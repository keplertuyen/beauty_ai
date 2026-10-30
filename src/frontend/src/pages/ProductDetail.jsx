import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Heart, Share2, ShoppingBag, Star, ChevronRight,
  Truck, Package, FlaskConical, Info, MessageSquare,
  ThumbsUp, ThumbsDown, Send, ChevronDown, ChevronUp,
  CheckCircle, Copy, Check, QrCode, ShieldCheck, ShieldAlert, CheckCircle2,
  RefreshCw, Plus, Minus, X, ExternalLink, Sun, Moon, Clock, AlertCircle, Sparkles, Lock, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import {
  getProduct,
  getSimilarProducts,
  getReviews,
  addReview,
  getProductQrCode
} from '../services/api';
import ProductCard from '../components/ProductCard';
import SkinIdQuickModal from '../components/SkinIdQuickModal';
import { getProductImage, DEFAULT_PRODUCT_IMAGE } from '../utils/productImages';
import { translateHighlight } from '../utils/highlightTranslator';
import './ProductDetail.css';

/* ── helpers ─────────────────────────────────── */
function getRoutineInfo(categoryName, department) {
  // Guardrail: Non-skincare products NEVER get a skincare AM/PM routine step badge
  if (department && department !== 'Skincare') {
    return null;
  }
  const cat = (categoryName || '').toLowerCase();
  if (cat.includes('cleanser') || cat.includes('wash')) {
    return { step: 'Step 1: Cleanse', time: 'AM & PM', tip: 'Use as the foundational first step to remove impurities without stripping skin barrier.' };
  }
  if (cat.includes('toner')) {
    return { step: 'Step 2: Tone & Balance', time: 'AM & PM', tip: 'Apply directly onto clean skin to restore hydration and prep skin for serums.' };
  }
  if (cat.includes('serum') || cat.includes('essence') || cat.includes('peeling') || cat.includes('treatment')) {
    const isNightOnly = cat.includes('peel') || cat.includes('retinol') || cat.includes('aha') || cat.includes('bha') || cat.includes('exfoliat');
    return { step: 'Step 3: Treat & Target', time: isNightOnly ? 'PM Only' : 'AM & PM', tip: 'Dispense 3-4 drops and gently press into skin before heavier moisturizers.' };
  }
  if (cat.includes('eye')) {
    return { step: 'Step 4a: Eye Care', time: 'AM & PM', tip: 'Gently pat a rice-grain amount around orbital eye contours with your ring finger.' };
  }
  if (cat.includes('sunscreen') || cat.includes('sun')) {
    return { step: 'Step 5: Sun Protection', time: 'AM Only', tip: 'Apply generously as the final morning step 15 minutes prior to sun exposure.' };
  }
  if (cat.includes('mask')) {
    return { step: 'Weekly Special Treatment', time: 'PM (2–3x / week)', tip: 'Apply an even layer on cleansed skin, leaving on according to formula guidance.' };
  }
  if (cat.includes('oil')) {
    return { step: 'Step 5: Seal & Nourish', time: 'PM', tip: 'Warm 2 drops in palms and press over moisturizer to lock in moisture and nourish lipid barrier.' };
  }
  if (cat.includes('moisturiz') || cat.includes('cream') || cat.includes('lotion')) {
    return { step: 'Step 4: Moisturize & Barrier', time: 'AM & PM', tip: 'Massage evenly onto face and neck to seal in hydration and reinforce skin barrier.' };
  }
  return { step: 'Skincare Support', time: 'Daily', tip: 'Incorporate into your daily skincare regimen according to instructions.' };
}

function getIngredientStats(ingredients) {
  if (!Array.isArray(ingredients) || ingredients.length === 0) return [];
  const counts = {};
  ingredients.forEach(i => {
    const group = i.functionGroup || 'Other';
    counts[group] = (counts[group] || 0) + 1;
  });
  return Object.entries(counts)
    .filter(([k]) => k !== 'Other')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));
}

const CATEGORY_EMOJI = {
  'Moisturizers': '🧴',
  'Serums & Essences': '💧',
  'Face Wash & Cleansers': '🫧',
  'Face Masks': '🎭',
  'Eye Creams': '👁️',
  'Lip Balm & Treatments': '💋',
  'Face Sunscreen': '☀️',
  'Face Oils': '💧',
  'Toners': '💦',
  'Anti-Aging': '⏳',
  'Acne & Blemishes': '🌿',
  'Makeup Removers': '🌸',
};

function getCategoryEmoji(cat) {
  if (!cat) return '💄';
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (cat.includes(key)) return emoji;
  }
  return '💄';
}

function StarRating({ value = 0, size = 16, interactive = false, onChange }) {
  const [hovered, setHovered] = useState(0);
  const display = interactive ? (hovered || value) : value;
  return (
    <span className="pd-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          fill={n <= display ? 'currentColor' : 'none'}
          style={{
            color: n <= display ? 'var(--accent)' : 'var(--text-muted)',
            cursor: interactive ? 'pointer' : 'default',
            transition: 'color 0.15s',
          }}
          onMouseEnter={() => interactive && setHovered(n)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onChange?.(n)}
        />
      ))}
    </span>
  );
}

/* ── Review Card ─────────────────────────────── */
function ReviewCard({ review }) {
  const { t, lang } = useApp();

  const getSkinTypeLabel = (skin) => {
    if (!skin) return '';
    const norm = skin.toLowerCase().trim();
    const map = {
      'da thường': t('skin_type_normal'),
      'da khô': t('skin_type_dry'),
      'da dầu': t('skin_type_oily'),
      'da hỗn hợp': t('skin_type_combination'),
      'da nhạy cảm': t('skin_type_sensitive'),
      'normal': t('skin_type_normal'),
      'dry': t('skin_type_dry'),
      'oily': t('skin_type_oily'),
      'combination': t('skin_type_combination'),
      'sensitive': t('skin_type_sensitive'),
    };
    return map[norm] || skin;
  };

  return (
    <div className="pd-review-card glass-card">
      <div className="pd-review-header">
        <div className="pd-review-avatar">
          {(review.author_name || review.reviewer_name || review.user_name || 'A')[0].toUpperCase()}
        </div>
        <div className="pd-review-meta">
          <span className="pd-review-name">
            {review.author_name || review.reviewer_name || review.user_name || 'Anonymous'}
          </span>
          {review.skin_type && (
            <span className="pd-review-skin badge badge-secondary">
              {getSkinTypeLabel(review.skin_type)}
            </span>
          )}
        </div>
        <div className="pd-review-right">
          <StarRating value={parseInt(review.rating) || review.star_rating || 0} size={13} />
          {review.created_at && (
            <span className="pd-review-date">
              {new Date(review.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN')}
            </span>
          )}
        </div>
      </div>
      {review.review_text && (
        <p className="pd-review-text">{review.review_text}</p>
      )}
      {review.is_recommended !== undefined && (
        <div className={`pd-review-recommend ${review.is_recommended ? 'yes' : 'no'}`}>
          {review.is_recommended
            ? <><ThumbsUp size={13} /> {t('pd_review_recommend')}</>
            : <><ThumbsDown size={13} /> {t('pd_review_not_recommend')}</>}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ──────────────────────────── */
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItemToCart, toggleWishlistItem, isInWishlist, formatPrice, formatDualPrice, lang, t, user } = useApp();

  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [copied, setCopied] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showFullInci, setShowFullInci] = useState(false);
  const [skinIdModalOpen, setSkinIdModalOpen] = useState(false);

  // QR & Barcode modal state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);

  // Helper to map English skin type for review options
  const getInitialSkinType = useCallback((userSkinType) => {
    if (!userSkinType) return '';
    const map = {
      'normal': 'Normal',
      'dry': 'Dry',
      'oily': 'Oily',
      'combination': 'Combination',
      'sensitive': 'Sensitive'
    };
    return map[userSkinType.toLowerCase()] || '';
  }, []);

  const [initialInWishlist, setInitialInWishlist] = useState(null);

  // Reset initialInWishlist when product id changes
  useEffect(() => {
    setInitialInWishlist(null);
    setQuantity(1);
    setQrData(null);
    setShowFullInci(false);
    setActiveTab('info');
  }, [id]);

  // Set initial wishlist state once product is loaded
  useEffect(() => {
    if (product && initialInWishlist === null) {
      setInitialInWishlist(isInWishlist(product.product_id));
    }
  }, [product, isInWishlist, initialInWishlist]);

  /* review form */
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    reviewer_name: '',
    rating: 0,
    review_text: '',
    skin_type: '',
    is_recommended: true,
  });

  // Update skin type in form whenever user loads/changes
  useEffect(() => {
    if (user) {
      setReviewForm((f) => ({
        ...f,
        skin_type: getInitialSkinType(user.skin_type),
      }));
    }
  }, [user, getInitialSkinType]);

  const inWishlist = isInWishlist(id);

  /* fetch product and reviews */
  const fetchProductDetail = useCallback(() => {
    getProduct(id)
      .then((res) => setProduct(res.data))
      .catch(() => toast.error(t('pd_not_found', 'Product not found')))
      .finally(() => setLoadingProduct(false));
  }, [id, t]);

  useEffect(() => {
    setLoadingProduct(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchProductDetail();

    getSimilarProducts(id, 8)
      .then((res) => setSimilar(res.data?.recommendations || res.data || []))
      .catch(() => setSimilar([]));

    setLoadingReviews(true);
    getReviews(id)
      .then((res) => setReviews(res.data?.reviews || res.data || []))
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [id, t, fetchProductDetail]);

  // Re-evaluate product verdict whenever user logs in or updates Skin ID
  useEffect(() => {
    if (!loadingProduct && id) {
      getProduct(id)
        .then((res) => setProduct(res.data))
        .catch(() => {});
    }
  }, [user, id, loadingProduct]);

  /* fetch QR code on modal open */
  const handleOpenQrModal = async () => {
    setQrModalOpen(true);
    if (!qrData && product) {
      setLoadingQr(true);
      try {
        const res = await getProductQrCode(product.product_id);
        setQrData(res.data);
      } catch (err) {
        console.error("QR Fetch error:", err);
      } finally {
        setLoadingQr(false);
      }
    }
  };

  /* share */
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success(t('pd_share_link', 'Link copied to clipboard!'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('pd_share_fail', 'Failed to copy link'));
    }
  };

  /* submit review */
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error(t('toast_login_required_review'));
      window.dispatchEvent(new CustomEvent('open-auth-modal'));
      return;
    }
    if (!reviewForm.rating) { toast.error(t('pd_err_stars', 'Please select a star rating')); return; }
    if (!reviewForm.review_text.trim()) { toast.error(t('pd_err_content', 'Please enter your review text')); return; }
    if (reviewForm.review_text.trim().length < 10) {
      toast.error(t('pd_err_content_len', 'Review text must be at least 10 characters'));
      return;
    }
    setSubmitting(true);
    try {
      await addReview({
        product_id: id,
        author_id: String(user.user_id),
        author_name: user.name,
        rating: reviewForm.rating,
        review_text: reviewForm.review_text,
        skin_type: reviewForm.skin_type,
        is_recommended: reviewForm.is_recommended ? 1 : 0
      });
      toast.success(t('pd_review_success', 'Review submitted successfully!'));
      setShowReviewForm(false);
      setReviewForm({
        reviewer_name: '',
        rating: 0,
        review_text: '',
        skin_type: user ? getInitialSkinType(user.skin_type) : '',
        is_recommended: true
      });
      // Refresh reviews
      const res = await getReviews(id);
      setReviews(res.data?.reviews || res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.detail || t('pd_review_failed', 'Failed to submit review'));
    } finally {
      setSubmitting(false);
    }
  };

  /* parse highlights */
  const parseHighlights = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw); } catch { /* noop */ }
    return raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
  };

  /* parse ingredients */
  const parseIngredients = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    } catch { /* noop */ }
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  };

  /* rating breakdown */
  const ratingBreakdown = useCallback(() => {
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      const s = parseInt(r.rating || r.star_rating || 0);
      if (s >= 1 && s <= 5) counts[s - 1]++;
    });
    return counts.reverse(); // [5→0]
  }, [reviews]);

  /* ── LOADING ── */
  if (loadingProduct) {
    return (
      <div className="pd-page">
        <div className="container">
          <div className="pd-loading-wrapper">
            <div className="pd-loading-inner">
              <div className="pd-skeleton pd-skeleton-image" />
              <div className="pd-skeleton-info">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="pd-skeleton pd-skeleton-line" style={{ width: `${90 - i * 12}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pd-page">
        <div className="container">
          <div className="pd-not-found">
            <h2>{t('pd_not_found', 'Product Not Found')}</h2>
            <button className="btn btn-primary" onClick={() => navigate('/products')}>
              {t('pd_back_list', 'Back to Catalog')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const productId = product.id ?? product.product_id;
  const productName = product.name ?? product.product_name ?? 'Beauty Product';
  const brandName = product.brandName ?? product.brand_name ?? (typeof product.brand === 'string' ? product.brand : product.brand?.name) ?? 'BeautyAI Brand';
  const categoryName = product.categoryName ?? product.primary_category ?? (typeof product.category === 'string' ? product.category : product.category?.name) ?? 'Skincare';
  const price = parseFloat(product.priceUsd ?? product.price_usd ?? product.price) || 0;
  const salePrice = product.salePriceUsd ? parseFloat(product.salePriceUsd) : (product.sale_price_usd ? parseFloat(product.sale_price_usd) : null);
  const rating = parseFloat(product.rating) || 5.0;
  const reviewCount = product.reviewsCount ?? reviews.length;
  const volumeMl = product.volumeMl ? `${product.volumeMl} ml` : (product.size || null);
  const department = product.department || 'Skincare';
  const suitabilityVerdict = product.suitabilityVerdict ?? product.suitability_verdict ?? 'RequiresSkinId';
  const suitabilityLabel = product.suitabilityLabel ?? product.suitability_label ?? 'Good Match';
  const suitabilityReason = product.suitabilityReason ?? product.suitability_reason ?? '';
  const hasAllergyWarning = product.hasAllergyWarning || product.has_allergy_warning || suitabilityVerdict === 'AllergyConflict';
  const matchedAllergen = product.matchedAllergen || product.matched_allergen;
  const isNonCosmeticTool = Boolean(product.isNonCosmeticTool || department === 'Tools & Brushes' || suitabilityVerdict === 'AccessoryTool');
  const structuredIngredients = Array.isArray(product.ingredients) && product.ingredients.length > 0 && typeof product.ingredients[0] === 'object'
    ? product.ingredients
    : [];
  const rawIngredients = parseIngredients(
    product.ingredientListRaw ||
    (Array.isArray(product.ingredients) && typeof product.ingredients[0] === 'string' ? product.ingredients : null) ||
    product.ingredients_clean ||
    ''
  ).filter((s) => s.toLowerCase() !== 'no ingredients listed');
  const hasIngredients = !isNonCosmeticTool && (
    product.hasIngredients !== undefined
      ? Boolean(product.hasIngredients) && (structuredIngredients.length > 0 || rawIngredients.length > 0)
      : (structuredIngredients.length > 0 || rawIngredients.length > 0)
  );
  const formulaBreakdown = product.formulaBreakdown || null;
  const totalInciCount = formulaBreakdown?.totalIngredientsCount || rawIngredients.length || structuredIngredients.length;

  const handleDeepAnalysisClick = () => {
    const inciString = (formulaBreakdown?.rawInciList?.length > 0
      ? formulaBreakdown.rawInciList.join(', ')
      : rawIngredients.length > 0
      ? rawIngredients.join(', ')
      : structuredIngredients.map((i) => i.inciName).join(', '));

    const targetUrl = `/ingredient-analyzer?ingredients=${encodeURIComponent(inciString)}&product_name=${encodeURIComponent(productName)}&brand_name=${encodeURIComponent(brandName)}&department=${encodeURIComponent(department)}&category=${encodeURIComponent(categoryName)}&target_area=${encodeURIComponent(formulaBreakdown?.targetArea || '')}`;

    if (!user) {
      sessionStorage.setItem('beautyai_post_login_redirect', targetUrl);
      toast('Please sign in to access personalized Deep Formula Analysis', { icon: '🔒' });
      window.dispatchEvent(new CustomEvent('open-auth-modal'));
      return;
    }
    navigate(targetUrl);
  };
  const routine = getRoutineInfo(categoryName, product?.department);
  const loves = (() => {
    const baseLoves = parseInt(product?.loves_count) || 0;
    if (initialInWishlist === null || !product) return baseLoves;
    const currentIn = isInWishlist(productId);
    if (currentIn && !initialInWishlist) return baseLoves + 1;
    if (!currentIn && initialInWishlist) return Math.max(0, baseLoves - 1);
    return baseLoves;
  })();
  const highlights = parseHighlights(product.highlights_clean || product.highlights);
  const breakdown = ratingBreakdown();

  return (
    <div className="pd-page animate-fadeIn">
      <div className="container">

        {/* ── Breadcrumb Navigation ─────────────────────── */}
        <nav className="pd-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">{t('pd_breadcrumb_home', 'Home')}</Link>
          <ChevronRight size={14} />
          <Link to="/products">{t('nav_products', 'Products')}</Link>
          {categoryName && (
            <>
              <ChevronRight size={14} />
              <Link to={`/products?category=${encodeURIComponent(categoryName)}`}>
                {categoryName}
              </Link>
            </>
          )}
          <ChevronRight size={14} />
          <span className="pd-breadcrumb-current">{productName}</span>
        </nav>

        {/* ── PART 1 & 2: HERO PURCHASE GRID ────────────── */}
        <div className="pd-hero-grid">

          {/* ── PART 1: VISUAL & TRUST SHOWCASE (LEFT) ── */}
          <div className="pd-part-visual">
            <div className="pd-visual-card">
              {/* Main Visual Display */}
              <div className="pd-visual-box">
                <img
                  src={getProductImage(product, 800)}
                  alt={productName}
                  className="pd-visual-real-img"
                  loading="eager"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement.querySelector('.pd-visual-emoji');
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
                <span className="pd-visual-emoji" style={{ display: 'none' }}>
                  {getCategoryEmoji(categoryName)}
                </span>

                {/* Badges Stack */}
                <div className="pd-visual-badges">
                  {product.clean_at_sephora == 1 && (
                    <span className="badge badge-clean">{t('badge_clean', '🌿 Clean at Sephora')}</span>
                  )}
                  {product.new == 1 && (
                    <span className="badge badge-new">{t('badge_new', 'NEW')}</span>
                  )}
                  {salePrice && (
                    <span className="badge badge-sale">{t('badge_sale', 'SALE')}</span>
                  )}
                  {product.limited_edition == 1 && !salePrice && (
                    <span className="badge badge-warning">{t('badge_limited', 'LIMITED')}</span>
                  )}
                </div>

                {/* Floating Quick Action Buttons */}
                <div className="pd-visual-actions">
                  <button
                    className={`pd-action-btn ${inWishlist ? 'active' : ''}`}
                    onClick={() => toggleWishlistItem(productId)}
                    aria-label={inWishlist ? t('pd_unfavorite') : t('pd_favorite')}
                    title={inWishlist ? t('pd_unfavorite') : t('pd_favorite')}
                  >
                    <Heart
                      size={18}
                      fill={inWishlist ? '#E11D48' : 'none'}
                      color={inWishlist ? '#E11D48' : '#4A3728'}
                    />
                  </button>
                  <button
                    className="pd-action-btn"
                    onClick={handleShare}
                    aria-label={t('pd_share')}
                    title={t('pd_share')}
                  >
                    {copied ? <Check size={18} color="#2E6F4E" /> : <Share2 size={18} color="#4A3728" />}
                  </button>
                </div>
              </div>

              {/* QR & Barcode Lookup Trigger */}
              <div className="pd-qr-trigger-wrap">
                <button className="pd-qr-trigger-btn" onClick={handleOpenQrModal}>
                  <QrCode size={16} />
                  <span>{t('pd_qr_btn')}</span>
                </button>
              </div>

              {/* Trust Checklist */}
              <div className="pd-trust-checklist">
                <div className="pd-trust-item">
                  <div className="pd-trust-icon-wrap">
                    <ShieldCheck size={16} className="pd-trust-icon" />
                  </div>
                  <div>
                    <strong>{t('pd_trust_authentic')}</strong>
                    <p>{t('pd_trust_authentic_sub')}</p>
                  </div>
                </div>

                <div className="pd-trust-item">
                  <div className="pd-trust-icon-wrap">
                    <Truck size={16} className="pd-trust-icon" />
                  </div>
                  <div>
                    <strong>{t('pd_trust_shipping')}</strong>
                    <p>{t('pd_trust_shipping_sub')}</p>
                  </div>
                </div>

                <div className="pd-trust-item">
                  <div className="pd-trust-icon-wrap">
                    <RefreshCw size={16} className="pd-trust-icon" />
                  </div>
                  <div>
                    <strong>{t('pd_trust_return')}</strong>
                    <p>{t('pd_trust_return_sub')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── PART 2: PRIMARY BUY BOX (RIGHT) ────────── */}
          <div className="pd-part-buybox">
            <div className="pd-buybox-card">
              {/* Allergy Alert Banner (Core USP) */}
              {hasAllergyWarning && (
                <div className="pd-allergy-warning-box">
                  <div className="pd-allergy-warning-top">
                    <ShieldAlert size={22} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <h4>Safety Allergy Warning</h4>
                      <p>
                        This product contains <strong>{matchedAllergen}</strong>, which matches your personal <strong>Allergy Blacklist</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="pd-allergy-warning-action">
                    <Link
                      to={`/products?safeForMe=true&category=${encodeURIComponent(categoryName)}`}
                      className="btn btn-sm pd-allergy-safe-btn"
                    >
                      <ShieldCheck size={14} /> Find Safe Alternatives
                    </Link>
                  </div>
                </div>
              )}

              {/* Suitability Verdict Banner (No numeric % — Strictly Text Verdict) */}
              {!hasAllergyWarning && isNonCosmeticTool && (
                <div
                  className="pd-suitability-match-pill"
                  style={{ background: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.25)', color: '#1D4ED8' }}
                >
                  <Sparkles size={16} color="#2563EB" />
                  <span>Accessory / Tool · Contains no chemical cosmetic ingredients</span>
                </div>
              )}

              {!hasAllergyWarning && !isNonCosmeticTool && !hasIngredients && (
                <div
                  className="pd-suitability-match-pill"
                  style={{ background: 'rgba(100, 116, 139, 0.08)', borderColor: 'rgba(100, 116, 139, 0.25)', color: '#475569' }}
                >
                  <AlertCircle size={16} color="#64748B" />
                  <span>Insufficient INCI Data · Manufacturer ingredient list unavailable</span>
                </div>
              )}

              {!hasAllergyWarning && !isNonCosmeticTool && hasIngredients && !user && (
                <button
                  type="button"
                  onClick={() => {
                    toast('Sign in to check your personal Skin ID & Allergy match', { icon: '✨' });
                    window.dispatchEvent(new CustomEvent('open-auth-modal'));
                  }}
                  className="pd-suitability-match-pill"
                  style={{
                    width: '100%',
                    cursor: 'pointer',
                    background: 'rgba(196, 139, 113, 0.1)',
                    border: '1px solid rgba(196, 139, 113, 0.35)',
                    color: '#6B442A',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Lock size={15} color="#8F5B42" />
                    <span>Sign in to check if this formula matches your Skin ID</span>
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.78rem', textDecoration: 'underline' }}>Sign In →</span>
                </button>
              )}

              {!hasAllergyWarning && !isNonCosmeticTool && hasIngredients && user && suitabilityVerdict === 'RequiresSkinId' && (
                <button
                  type="button"
                  onClick={() => setSkinIdModalOpen(true)}
                  className="pd-suitability-match-pill"
                  style={{
                    width: '100%',
                    cursor: 'pointer',
                    background: 'rgba(217, 119, 6, 0.1)',
                    border: '1px solid rgba(217, 119, 6, 0.35)',
                    color: '#92400E',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={16} color="#D97706" />
                    <span>Complete your 30-second Skin ID to unlock personalized verdict</span>
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.78rem', textDecoration: 'underline' }}>Set Up Now →</span>
                </button>
              )}

              {!hasAllergyWarning && !isNonCosmeticTool && hasIngredients && user && suitabilityVerdict === 'GoodMatch' && (
                <div className="pd-suitability-match-pill" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, color: '#065F46' }}>
                    <CheckCircle2 size={16} color="#10B981" />
                    <span>{suitabilityLabel || 'Good Match'} For Your Skin ID</span>
                  </div>
                  {suitabilityReason && (
                    <span style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 500, paddingLeft: 23 }}>
                      {suitabilityReason}
                    </span>
                  )}
                </div>
              )}

              {!hasAllergyWarning && !isNonCosmeticTool && hasIngredients && user && suitabilityVerdict === 'MatchWithNotes' && (
                <div
                  className="pd-suitability-match-pill"
                  style={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 3,
                    background: 'rgba(245, 158, 11, 0.1)',
                    borderColor: 'rgba(245, 158, 11, 0.35)',
                    color: '#92400E',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700 }}>
                    <AlertCircle size={16} color="#D97706" />
                    <span>{suitabilityLabel || 'Match with Notes'}</span>
                  </div>
                  {suitabilityReason && (
                    <span style={{ fontSize: '0.8rem', color: '#B45309', fontWeight: 500, paddingLeft: 23 }}>
                      {suitabilityReason}
                    </span>
                  )}
                </div>
              )}

              {/* Brand & Title */}
              <div className="pd-buybox-header">
                {brandName && (
                  <Link
                    to={`/products?brand=${encodeURIComponent(brandName)}`}
                    className="pd-buybox-brand"
                  >
                    {brandName}
                  </Link>
                )}
                <h1 className="pd-buybox-title">{productName}</h1>
              </div>

              {/* Rating & Social Proof */}
              <div className="pd-buybox-rating">
                <StarRating value={Math.round(rating)} size={17} />
                <span className="pd-buybox-score">{rating.toFixed(1)}</span>
                <button
                  className="pd-buybox-review-link"
                  onClick={() => setActiveTab('reviews')}
                >
                  ({reviewCount.toLocaleString()} {t('pd_rating', 'reviews')})
                </button>
                {loves > 0 && (
                  <div className="pd-buybox-loves">
                    <Heart size={14} fill="#E11D48" color="#E11D48" />
                    <span>{loves.toLocaleString()} {t('pd_loves', 'loves')}</span>
                  </div>
                )}
              </div>

              {/* High Contrast Price Section */}
              <div className="pd-buybox-price-block">
                <div className="pd-buybox-price-row">
                  <span className="pd-buybox-price">{formatPrice(salePrice || price)}</span>
                  {salePrice && (
                    <>
                      <span className="pd-buybox-price-old">{formatPrice(price)}</span>
                      <span className="pd-buybox-discount-tag">
                        -{Math.round((1 - salePrice / price) * 100)}%
                      </span>
                    </>
                  )}
                </div>
                <div className="pd-buybox-tax-hint">{formatPrice(salePrice || price)} · {t('pd_tax_included')}</div>
              </div>

              {/* 3-Column Quick Specs Card */}
              <div className="pd-specs-grid">
                <div className="pd-spec-box">
                  <span className="pd-spec-label">{t('prod_category', 'Category')}</span>
                  <span className="pd-spec-val" title={categoryName}>
                    {categoryName}
                  </span>
                </div>
                <div className="pd-spec-box">
                  <span className="pd-spec-label">{t('pd_size', 'Size')}</span>
                  <span className="pd-spec-val" title={volumeMl || 'Standard Size'}>
                    {volumeMl || 'Standard Size'}
                  </span>
                </div>
                <div className="pd-spec-box">
                  <span className="pd-spec-label">{t('pd_skin_type', 'Target Skin')}</span>
                  <span className="pd-spec-val" title={product.targetSkinTypes?.join(', ') || 'All Skin Types'}>
                    {product.targetSkinTypes?.length > 0 ? product.targetSkinTypes.join(', ') : 'All Skin Types'}
                  </span>
                </div>
              </div>

              {/* Purchase Actions (Quantity + Add to Cart) */}
              <div className="pd-purchase-controls">
                <div className="pd-qty-selector">
                  <button
                    className="pd-qty-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label={t('pd_decrease_qty')}
                  >
                    <Minus size={15} />
                  </button>
                  <span className="pd-qty-number">{quantity}</span>
                  <button
                    className="pd-qty-btn"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label={t('pd_increase_qty')}
                  >
                    <Plus size={15} />
                  </button>
                </div>

                <button
                  className="btn btn-primary pd-cta-btn"
                  onClick={() => addItemToCart(productId, quantity)}
                >
                  <ShoppingBag size={18} />
                  <span>{t('prod_add_to_cart', 'Add to Bag')} · {formatPrice((salePrice || price) * quantity)}</span>
                </button>
              </div>

              {/* Subtle Shipping Alert */}
              <div className="pd-shipping-banner">
                <Truck size={16} color="var(--accent-sage, #2E6F4E)" />
                <span>
                  {t('pd_shipping_eligible')}{' '}
                  <strong>{t('pd_shipping_free_standard')}</strong>{' '}
                  {t('pd_shipping_threshold')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── PART 3: SEGMENTED DEEP DIVE TABS (MIDDLE) ────── */}
        <div className="pd-part-tabs">
          <div className="pd-tab-navigation" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'info'}
              className={`pd-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              <Info size={16} />
              <span>{t('pd_tab_info', 'Description & Routine')}</span>
            </button>

            {!isNonCosmeticTool && (
              <button
                role="tab"
                aria-selected={activeTab === 'ingredients'}
                className={`pd-tab-btn ${activeTab === 'ingredients' ? 'active' : ''}`}
                onClick={() => setActiveTab('ingredients')}
              >
                <FlaskConical size={16} />
                <span>
                  {t('pd_tab_ingredients', 'Formula & Ingredients')}
                  {hasIngredients ? ` (${totalInciCount})` : ' (Not Listed)'}
                </span>
              </button>
            )}

            <button
              role="tab"
              aria-selected={activeTab === 'reviews'}
              className={`pd-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              <MessageSquare size={16} />
              <span>{t('pd_tab_reviews', 'Customer Reviews')} ({reviewCount})</span>
            </button>
          </div>

          <div className="pd-tab-panel">
            {/* TAB 1: MÔ TẢ & CÔNG DỤNG & ROUTINE */}
            {activeTab === 'info' && (
              <div className="pd-tab-info-content animate-fadeIn">
                {highlights.length > 0 && (
                  <div className="pd-highlights-block">
                    <h3 className="pd-block-heading">
                      <Star size={18} color="var(--primary, #4A3728)" />
                      {t('pd_highlights', 'Key Highlights')}
                    </h3>
                    <div className="pd-highlights-grid">
                      {highlights.map((h, i) => (
                        <div key={i} className="pd-highlight-card">
                          <CheckCircle size={16} color="var(--accent-sage, #2E6F4E)" className="pd-hl-icon" />
                          <span>{translateHighlight(h, lang)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Department Context Card / Routine Positioning Card */}
                {routine ? (
                  <div className="pd-routine-card">
                    <div className="pd-routine-header">
                      <span className="pd-routine-step-badge">{routine.step}</span>
                      <span className="pd-routine-time-badge">
                        {routine.time.includes('AM') && <Sun size={13} style={{ marginRight: 3, verticalAlign: 'middle' }} />}
                        {routine.time.includes('PM') && <Moon size={13} style={{ marginRight: 3, verticalAlign: 'middle' }} />}
                        {routine.time}
                      </span>
                    </div>
                    <p className="pd-routine-tip">{routine.tip}</p>
                  </div>
                ) : product?.department === 'Tools & Brushes' ? (
                  <div className="pd-routine-card" style={{ borderColor: 'var(--border-subtle, #E2E8F0)' }}>
                    <div className="pd-routine-header">
                      <span className="pd-routine-step-badge" style={{ background: '#3B82F6', color: '#FFF' }}>Tool & Accessory Care</span>
                      <span className="pd-routine-time-badge">Hygiene & Care</span>
                    </div>
                    <p className="pd-routine-tip">
                      Clean bristles or applicator weekly with a gentle brush cleaner or warm soapy water. Lay flat to dry to preserve shape and prevent bacteria accumulation.
                    </p>
                  </div>
                ) : product?.department === 'Fragrance' ? (
                  <div className="pd-routine-card" style={{ borderColor: 'var(--border-subtle, #E2E8F0)' }}>
                    <div className="pd-routine-header">
                      <span className="pd-routine-step-badge" style={{ background: '#8B5CF6', color: '#FFF' }}>Scent Application</span>
                      <span className="pd-routine-time-badge">Pulse Points</span>
                    </div>
                    <p className="pd-routine-tip">
                      Spritz onto pulse points (wrists, neck, behind ears) from 5-7 inches away. Allow to dry naturally without rubbing to preserve the delicate olfactory top and heart notes.
                    </p>
                  </div>
                ) : product?.department === 'Makeup' ? (
                  <div className="pd-routine-card" style={{ borderColor: 'var(--border-subtle, #E2E8F0)' }}>
                    <div className="pd-routine-header">
                      <span className="pd-routine-step-badge" style={{ background: '#D97706', color: '#FFF' }}>Makeup Artistry</span>
                      <span className="pd-routine-time-badge">Application Tip</span>
                    </div>
                    <p className="pd-routine-tip">
                      Apply onto hydrated skin. Blend smoothly with appropriate brush, sponge, or fingertips, layering gradually for desired opacity and long-lasting finish.
                    </p>
                  </div>
                ) : product?.department === 'Hair' ? (
                  <div className="pd-routine-card" style={{ borderColor: 'var(--border-subtle, #E2E8F0)' }}>
                    <div className="pd-routine-header">
                      <span className="pd-routine-step-badge" style={{ background: '#059669', color: '#FFF' }}>Hair Ritual</span>
                      <span className="pd-routine-time-badge">Hair Care</span>
                    </div>
                    <p className="pd-routine-tip">
                      Work evenly through damp or dry hair, focusing on mid-lengths and ends. Style or rinse according to formula directions.
                    </p>
                  </div>
                ) : null}

                {product.description && (
                  <div className="pd-desc-block">
                    <h3 className="pd-block-heading">{t('pd_description', 'Product Description')}</h3>
                    <p className="pd-desc-text">{product.description}</p>
                  </div>
                )}

                {product.how_to_use && (
                  <div className="pd-how-block">
                    <h3 className="pd-block-heading">{t('pd_how_to_use', 'How to Use')}</h3>
                    <div className="pd-how-box">
                      <p>{product.how_to_use}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: 3-TIER PROGRESSIVE DISCLOSURE INCI BREAKDOWN */}
            {activeTab === 'ingredients' && !isNonCosmeticTool && (
              <div className="pd-tab-ingredients-content animate-fadeIn">
                <div className="pd-ingredients-top">
                  <div>
                    <h3 className="pd-block-heading" style={{ marginBottom: 4 }}>
                      Formula Breakdown & INCI Transparency
                    </h3>
                    <p className="pd-block-subtext">
                      {hasIngredients
                        ? 'Key functional ingredients explained in plain English, with the full packaging INCI list below.'
                        : 'Manufacturer ingredient disclosure status for this product.'}
                    </p>
                  </div>

                  {/* Deep Formula Analysis Button — ONLY shown when product actually has ingredients */}
                  {hasIngredients && (
                    <button
                      type="button"
                      onClick={handleDeepAnalysisClick}
                      className="btn btn-secondary btn-sm pd-ai-analyze-btn"
                      style={{ cursor: 'pointer' }}
                    >
                      <FlaskConical size={15} />
                      <span>Deep Formula Analysis</span>
                      <ExternalLink size={13} />
                    </button>
                  )}
                </div>

                {!hasIngredients ? (
                  /* Group B: Cosmetic product missing manufacturer INCI list */
                  <div
                    className="pd-empty-block"
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '16px',
                      padding: '32px 24px',
                      textAlign: 'center',
                    }}
                  >
                    <AlertCircle size={36} color="#64748B" style={{ marginBottom: 10 }} />
                    <h4 style={{ margin: '0 0 6px', color: '#1E293B', fontSize: '1.05rem' }}>
                      Insufficient INCI Data
                    </h4>
                    <p style={{ maxWidth: 540, margin: '0 auto', color: '#475569', fontSize: '0.9rem', lineHeight: 1.55 }}>
                      The manufacturer has not provided a detailed INCI ingredient list for this product. Because we cannot verify its exact chemical composition, it is excluded from &ldquo;Safe for Me&rdquo; allergy filtering.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                    {/* ── TIER 1: PERSONALIZED VERDICT & ALLERGY SUMMARY ── */}
                    <div
                      style={{
                        padding: '16px 20px',
                        borderRadius: '14px',
                        background: hasAllergyWarning
                          ? 'rgba(239, 68, 68, 0.08)'
                          : suitabilityVerdict === 'MatchWithNotes'
                          ? 'rgba(245, 158, 11, 0.08)'
                          : suitabilityVerdict === 'GoodMatch' && user
                          ? 'rgba(16, 185, 129, 0.08)'
                          : 'rgba(196, 139, 113, 0.08)',
                        border: hasAllergyWarning
                          ? '1px solid rgba(239, 68, 68, 0.3)'
                          : suitabilityVerdict === 'MatchWithNotes'
                          ? '1px solid rgba(245, 158, 11, 0.3)'
                          : suitabilityVerdict === 'GoodMatch' && user
                          ? '1px solid rgba(16, 185, 129, 0.28)'
                          : '1px solid rgba(196, 139, 113, 0.28)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        {hasAllergyWarning ? (
                          <ShieldAlert size={22} color="#DC2626" style={{ marginTop: 2, flexShrink: 0 }} />
                        ) : suitabilityVerdict === 'MatchWithNotes' ? (
                          <AlertCircle size={22} color="#D97706" style={{ marginTop: 2, flexShrink: 0 }} />
                        ) : user && suitabilityVerdict === 'GoodMatch' ? (
                          <CheckCircle2 size={22} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                        ) : (
                          <Sparkles size={22} color="#8F5B42" style={{ marginTop: 2, flexShrink: 0 }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.96rem', color: '#2C2018' }}>
                            {!user
                              ? 'Personal Skin ID Cross-Check Available'
                              : suitabilityLabel || 'Good Match'}
                          </div>
                          <div style={{ fontSize: '0.86rem', color: '#574B42', marginTop: 3, lineHeight: 1.45 }}>
                            {!user
                              ? 'Sign in to automatically check this formula against your personal Allergy Blacklist and Skin Type.'
                              : suitabilityReason}
                          </div>
                        </div>
                      </div>

                      {!user ? (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
                        >
                          Sign In
                        </button>
                      ) : suitabilityVerdict === 'RequiresSkinId' ? (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setSkinIdModalOpen(true)}
                        >
                          Complete Skin ID (30s)
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSkinIdModalOpen(true)}
                        >
                          Edit Skin ID
                        </button>
                      )}
                    </div>

                    {/* ── TIER 2A: KEY INGREDIENTS STRIP (3–6 HERO CARDS) ── */}
                    {formulaBreakdown?.keyIngredients?.length > 0 && (
                      <div>
                        <h4 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 700, color: '#2C2018', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Star size={17} color="#C48B71" />
                          <span>Key Notable Ingredients ({formulaBreakdown.keyIngredients.length})</span>
                        </h4>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                            gap: '12px',
                          }}
                        >
                          {formulaBreakdown.keyIngredients.map((item, idx) => (
                            <div
                              key={idx}
                              style={{
                                background: '#FFFFFF',
                                border: item.isFeaturedInProductName
                                  ? '1.5px solid rgba(196, 139, 113, 0.55)'
                                  : '1px solid #EAE3DC',
                                borderRadius: '14px',
                                padding: '14px 16px',
                                boxShadow: '0 2px 8px rgba(74, 55, 40, 0.04)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.03em',
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                    background: 'rgba(196, 139, 113, 0.12)',
                                    color: '#8F5B42',
                                  }}
                                >
                                  {item.roleLabel}
                                </span>
                                {item.isFeaturedInProductName && (
                                  <span
                                    style={{
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      padding: '2px 7px',
                                      borderRadius: '999px',
                                      background: 'rgba(16, 185, 129, 0.12)',
                                      color: '#047857',
                                    }}
                                  >
                                    ★ Featured Hero
                                  </span>
                                )}
                              </div>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#2C2018' }}>
                                {item.commonName}
                              </div>
                              {item.commonName.toLowerCase() !== item.inciName.toLowerCase() && (
                                <div style={{ fontSize: '0.76rem', color: '#8C7A6B', fontStyle: 'italic', marginBottom: 6 }}>
                                  INCI: {item.inciName}
                                </div>
                              )}
                              <p style={{ margin: '6px 0 0', fontSize: '0.84rem', color: '#574B42', lineHeight: 1.45 }}>
                                {item.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── TIER 2B: FUNCTIONAL ROLE GROUPING (BASE, PIGMENTS, SCENT, PRESERVATIVES) ── */}
                    {formulaBreakdown?.functionalGroups?.length > 0 && (
                      <div>
                        <h4 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 700, color: '#2C2018', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Layers size={17} color="#2E6F4E" />
                          <span>How the Complete Formula Is Built</span>
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                          {formulaBreakdown.functionalGroups.map((grp, idx) => (
                            <div
                              key={idx}
                              style={{
                                background: '#FAF8F5',
                                border: '1px solid #EAE3DC',
                                borderRadius: '12px',
                                padding: '14px 16px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <strong style={{ fontSize: '0.9rem', color: '#2C2018' }}>{grp.groupTitle}</strong>
                                <span
                                  style={{
                                    background: '#EAE3DC',
                                    color: '#4A3728',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                  }}
                                >
                                  {grp.count}
                                </span>
                              </div>
                              <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#6B5E55', lineHeight: 1.4 }}>
                                {grp.plainExplanation}
                              </p>
                              <div style={{ fontSize: '0.76rem', color: '#8C7A6B', lineHeight: 1.4 }}>
                                <strong>Includes:</strong> {grp.ingredients.slice(0, 5).join(', ')}
                                {grp.ingredients.length > 5 && ` +${grp.ingredients.length - 5} more`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── TIER 2C: CATEGORY-APPROPRIATE NOTES & FRAGRANCE DISCLOSURE ── */}
                    {(formulaBreakdown?.cautions?.length > 0 || formulaBreakdown?.fragranceDisclosure) && (
                      <div
                        style={{
                          background: '#FFFDF9',
                          border: '1px solid #F3E5D8',
                          borderRadius: '12px',
                          padding: '14px 18px',
                        }}
                      >
                        <h4 style={{ margin: '0 0 8px', fontSize: '0.92rem', fontWeight: 700, color: '#4A3728' }}>
                          Usage & Sensitivity Notes
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {formulaBreakdown.cautions?.map((c, i) => (
                            <div key={i} style={{ fontSize: '0.84rem', color: c.type === 'allergy' ? '#DC2626' : '#6B5E55', lineHeight: 1.45 }}>
                              <strong>{c.title}:</strong> {c.message}
                            </div>
                          ))}
                          {formulaBreakdown.fragranceDisclosure && (
                            <div style={{ fontSize: '0.82rem', color: '#6B5E55', lineHeight: 1.45 }}>
                              <strong>Scent & Allergen Transparency:</strong> {formulaBreakdown.fragranceDisclosure}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── TIER 3: COLLAPSIBLE FULL PACKAGING INCI LIST ── */}
                    <div
                      style={{
                        border: '1px solid #EAE3DC',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        background: '#FFFFFF',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setShowFullInci((v) => !v)}
                        style={{
                          width: '100%',
                          padding: '14px 18px',
                          background: '#FAF8F5',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: '#2C2018',
                        }}
                      >
                        <span>
                          View Full Packaging INCI List ({totalInciCount} ingredients in concentration order)
                        </span>
                        {showFullInci ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>

                      {showFullInci && (
                        <div style={{ padding: '16px 18px', borderTop: '1px solid #EAE3DC' }}>
                          <div className="pd-ingredient-tag-cloud">
                            {(formulaBreakdown?.rawInciList?.length > 0
                              ? formulaBreakdown.rawInciList
                              : rawIngredients
                            ).map((ing, i) => {
                              const isAllergen = matchedAllergen && ing.toLowerCase().includes(matchedAllergen.toLowerCase());
                              const isKey = formulaBreakdown?.keyIngredients?.some(
                                (k) => k.inciName.toLowerCase() === ing.toLowerCase()
                              );
                              return (
                                <span
                                  key={i}
                                  className={`pd-ingredient-pill ${isAllergen ? 'pd-allergen-pill' : ''}`}
                                  style={
                                    !isAllergen && isKey
                                      ? {
                                          borderColor: '#C48B71',
                                          background: 'rgba(196, 139, 113, 0.12)',
                                          color: '#6B442A',
                                          fontWeight: 600,
                                        }
                                      : undefined
                                  }
                                >
                                  {ing}
                                  {isAllergen && ' ⚠️ (Allergy Match)'}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ĐÁNH GIÁ NGƯỜI DÙNG */}
            {activeTab === 'reviews' && (
              <div className="pd-tab-reviews-content animate-fadeIn">
                {/* Rating Distribution Overview */}
                <div className="pd-reviews-overview">
                  <div className="pd-rating-spotlight">
                    <span className="pd-spotlight-num">{rating.toFixed(1)}</span>
                    <StarRating value={Math.round(rating)} size={22} />
                    <span className="pd-spotlight-sub">{reviewCount} {t('pd_real_reviews')}</span>
                  </div>

                  <div className="pd-rating-bars-wrap">
                    {[5, 4, 3, 2, 1].map((star, i) => {
                      const count = breakdown[i];
                      const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={star} className="pd-bar-row">
                          <span className="pd-bar-label">{star}★</span>
                          <div className="pd-bar-track">
                            <div className="pd-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="pd-bar-count">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Write Review Toggle Button */}
                <div className="pd-write-review-toggle">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      if (!user) {
                        toast.error(t('toast_login_required_review'));
                        window.dispatchEvent(new CustomEvent('open-auth-modal'));
                        return;
                      }
                      setShowReviewForm((v) => !v);
                    }}
                  >
                    <MessageSquare size={15} />
                    <span>{t('pd_write_review', 'Write a Review')}</span>
                    {showReviewForm ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>

                {/* Review Form */}
                {showReviewForm && (
                  <form className="pd-review-form animate-scaleIn" onSubmit={handleSubmitReview}>
                    <h4 className="pd-review-form-title">{t('pd_write_review_title', 'Share Your Review')}</h4>

                    <div className="pd-form-group">
                      <label className="pd-form-label">{t('pd_satisfaction_prompt', 'Rate this product *')}</label>
                      <StarRating
                        value={reviewForm.rating}
                        size={28}
                        interactive
                        onChange={(n) => setReviewForm((f) => ({ ...f, rating: n }))}
                      />
                    </div>

                    <div className="pd-form-group">
                      <label className="pd-form-label">{t('pd_skin_type', 'Your Skin Type')}</label>
                      <select
                        className="form-select"
                        value={reviewForm.skin_type}
                        onChange={(e) => setReviewForm((f) => ({ ...f, skin_type: e.target.value }))}
                      >
                        <option value="">{t('pd_select_skintype')}</option>
                        <option value="Normal">Normal</option>
                        <option value="Dry">Dry</option>
                        <option value="Oily">Oily</option>
                        <option value="Combination">Combination</option>
                        <option value="Sensitive">Sensitive</option>
                      </select>
                    </div>

                    <div className="pd-form-group">
                      <label className="pd-form-label">{t('pd_review_text_label', 'Your Review *')}</label>
                      <textarea
                        className="form-textarea"
                        placeholder={t('pd_review_text_placeholder', 'Share your honest experience and results with this formula...')}
                        rows={4}
                        value={reviewForm.review_text}
                        onChange={(e) => setReviewForm((f) => ({ ...f, review_text: e.target.value }))}
                      />
                    </div>

                    <div className="pd-form-group">
                      <label className="pd-form-label">{t('pd_review_recommend_ask', 'Would you recommend this product to others?')}</label>
                      <div className="pd-rec-toggle-group">
                        <button
                          type="button"
                          className={`pd-rec-btn ${reviewForm.is_recommended ? 'active-yes' : ''}`}
                          onClick={() => setReviewForm((f) => ({ ...f, is_recommended: true }))}
                        >
                          <ThumbsUp size={15} /> {t('pd_recommend_yes', 'Yes')}
                        </button>
                        <button
                          type="button"
                          className={`pd-rec-btn ${!reviewForm.is_recommended ? 'active-no' : ''}`}
                          onClick={() => setReviewForm((f) => ({ ...f, is_recommended: false }))}
                        >
                          <ThumbsDown size={15} /> {t('pd_recommend_no', 'No')}
                        </button>
                      </div>
                    </div>

                    <div className="pd-form-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowReviewForm(false)}
                      >
                        {t('pd_cancel', 'Cancel')}
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        <Send size={15} />
                        {submitting ? t('pd_submitting') : t('pd_submit_review', 'Submit Review')}
                      </button>
                    </div>
                  </form>
                )}

                {/* Reviews List */}
                {loadingReviews ? (
                  <div className="loading-container">
                    <div className="loading-spinner" />
                    <span>{t('pd_loading_reviews', 'Loading customer reviews...')}</span>
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="pd-reviews-list">
                    {reviews.map((r, i) => (
                      <ReviewCard key={r.review_id || i} review={r} />
                    ))}
                  </div>
                ) : (
                  <div className="pd-empty-block">
                    <span className="pd-empty-icon">💬</span>
                    <p>{t('pd_no_reviews', 'No reviews yet. Be the first to share your experience!')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── PART 4: DISCOVERY RAILS (BOTTOM) ────────────── */}
        {/* Similar Products in Category */}
        {similar.length > 0 && (
          <section className="pd-discovery-section">
            <div className="pd-discovery-header">
              <div className="pd-discovery-title-wrap">
                <span className="pd-discovery-badge">Category Match</span>
                <h2 className="pd-discovery-title">
                  {t('pd_similar_title', 'Similar Products You May Like')}
                </h2>
              </div>
              <Link to={`/products?category=${encodeURIComponent(categoryName)}`} className="btn btn-secondary btn-sm">
                {t('home_view_all', 'View All')}
              </Link>
            </div>
            <div className="pd-discovery-grid">
              {similar.slice(0, 6).map((prod) => (
                <div key={prod.id ?? prod.product_id} className="pd-discovery-card-wrap">
                  <ProductCard product={prod} />
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      {/* ── MODAL: QR CODE & BARCODE LOOKUP ─────────────── */}
      {qrModalOpen && (
        <div className="pd-modal-overlay animate-fadeIn" onClick={() => setQrModalOpen(false)}>
          <div className="pd-modal-content animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="pd-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <QrCode size={20} color="var(--primary, #4A3728)" />
                <h3 className="pd-modal-title">{t('pd_qr_modal_title')}</h3>
              </div>
              <button
                className="pd-modal-close"
                onClick={() => setQrModalOpen(false)}
                aria-label={t('pd_close')}
              >
                <X size={20} />
              </button>
            </div>

            <div className="pd-modal-body">
              {loadingQr ? (
                <div className="loading-container" style={{ padding: '2rem' }}>
                  <div className="loading-spinner" />
                  <span>{t('pd_qr_loading')}</span>
                </div>
              ) : qrData ? (
                <div className="pd-qr-content">
                  <div className="pd-qr-code-box">
                    <img
                      src={qrData.qr_code_svg}
                      alt={`QR Code ${product.product_name}`}
                      className="pd-qr-image"
                    />
                    <span className="pd-qr-hint">{t('pd_qr_hint')}</span>
                  </div>

                  <div className="pd-barcode-box">
                    <img
                      src={qrData.barcode_svg}
                      alt={`Barcode ${product.product_id}`}
                      className="pd-barcode-image"
                    />
                    <span className="pd-barcode-sku">SKU / ID: {product.product_id}</span>
                  </div>

                  <div className="pd-qr-product-info">
                    <div className="pd-qr-product-brand">{product.brand_name}</div>
                    <div className="pd-qr-product-name">{product.product_name}</div>
                  </div>
                </div>
              ) : (
                <div className="pd-empty-block">
                  <p>{t('pd_qr_error')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── MODAL: 30-SECOND DIGITAL SKIN ID SETUP ──────── */}
      <SkinIdQuickModal
        isOpen={skinIdModalOpen}
        onClose={() => setSkinIdModalOpen(false)}
        onSaved={() => {
          fetchProductDetail();
        }}
      />
    </div>
  );
}
