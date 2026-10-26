import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Heart, Share2, ShoppingBag, Star, ChevronRight,
  Truck, Package, FlaskConical, Info, MessageSquare,
  ThumbsUp, ThumbsDown, Send, ChevronDown, ChevronUp,
  CheckCircle, Sparkles, Copy, Check, QrCode, ShieldCheck,
  RefreshCw, Plus, Minus, X, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import {
  getProduct,
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getReviews,
  addReview,
  getProductQrCode
} from '../services/api';
import ProductCard from '../components/ProductCard';
import { getProductImage, DEFAULT_PRODUCT_IMAGE } from '../utils/productImages';
import { translateHighlight } from '../utils/highlightTranslator';
import './ProductDetail.css';

/* ── helpers ─────────────────────────────────── */
const CATEGORY_EMOJI = {
  'Moisturizers': '🧴',
  'Serums & Essences': '💧',
  'Face Wash & Cleansers': '🫧',
  'Face Masks': '🎭',
  'Eye Creams': '👁️',
  'Lip Balm & Treatments': '💋',
  'Face Sunscreen': '☀️',
  'Face Oils': '✨',
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
  const [frequentlyBought, setFrequentlyBought] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [copied, setCopied] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // QR & Barcode modal state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);

  // Helper to map English skin type to Vietnamese used in review options
  const getInitialSkinType = useCallback((userSkinType) => {
    if (!userSkinType) return '';
    const map = {
      'normal': 'Da thường',
      'dry': 'Da khô',
      'oily': 'Da dầu',
      'combination': 'Da hỗn hợp',
      'sensitive': 'Da nhạy cảm'
    };
    return map[userSkinType.toLowerCase()] || '';
  }, []);

  const [initialInWishlist, setInitialInWishlist] = useState(null);

  // Reset initialInWishlist when product id changes
  useEffect(() => {
    setInitialInWishlist(null);
    setQuantity(1);
    setQrData(null);
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
  useEffect(() => {
    setLoadingProduct(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    getProduct(id)
      .then((res) => setProduct(res.data))
      .catch(() => toast.error(t('pd_not_found', 'Không tìm thấy sản phẩm')))
      .finally(() => setLoadingProduct(false));

    getSimilarProducts(id, 8)
      .then((res) => setSimilar(res.data?.recommendations || []))
      .catch(() => setSimilar([]));

    getFrequentlyBoughtTogether(id, 4)
      .then((res) => setFrequentlyBought(res.data?.recommendations || []))
      .catch(() => setFrequentlyBought([]));

    setLoadingReviews(true);
    getReviews(id)
      .then((res) => setReviews(res.data?.reviews || res.data || []))
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [id, t]);

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
      toast.success(t('pd_share_link', 'Đã sao chép liên kết!'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('pd_share_fail', 'Không thể sao chép'));
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
    if (!reviewForm.rating) { toast.error(t('pd_err_stars', 'Vui lòng chọn số sao')); return; }
    if (!reviewForm.review_text.trim()) { toast.error(t('pd_err_content', 'Vui lòng nhập nội dung đánh giá')); return; }
    if (reviewForm.review_text.trim().length < 10) {
      toast.error(t('pd_err_content_len', 'Nội dung đánh giá phải có tối thiểu 10 ký tự'));
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
      toast.success(t('pd_review_success', 'Đã gửi đánh giá! 🌟'));
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
      toast.error(err.response?.data?.detail || t('pd_review_failed', 'Không thể gửi đánh giá'));
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
    );
  }

  if (!product) {
    return (
      <div className="pd-not-found">
        <span className="pd-not-found-icon">🔍</span>
        <h2>{t('pd_not_found', 'Không tìm thấy sản phẩm')}</h2>
        <button className="btn btn-primary" onClick={() => navigate('/products')}>
          {t('pd_back_list', 'Quay lại danh sách')}
        </button>
      </div>
    );
  }

  const price = parseFloat(product.price_usd) || 0;
  const salePrice = product.sale_price_usd ? parseFloat(product.sale_price_usd) : null;
  const rating = parseFloat(product.rating) || 0;
  const reviewCount = reviews.length;
  const loves = (() => {
    const baseLoves = parseInt(product?.loves_count) || 0;
    if (initialInWishlist === null || !product) return baseLoves;
    const currentIn = isInWishlist(product.product_id);
    if (currentIn && !initialInWishlist) return baseLoves + 1;
    if (!currentIn && initialInWishlist) return Math.max(0, baseLoves - 1);
    return baseLoves;
  })();
  const highlights = parseHighlights(product.highlights_clean || product.highlights);
  const ingredients = parseIngredients(product.ingredients_clean || product.ingredients);
  const breakdown = ratingBreakdown();

  return (
    <div className="pd-page animate-fadeIn">
      <div className="container">

        {/* ── Breadcrumb Navigation ─────────────────────── */}
        <nav className="pd-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">{t('pd_breadcrumb_home', 'Trang chủ')}</Link>
          <ChevronRight size={14} />
          <Link to="/products">{t('nav_products', 'Sản phẩm')}</Link>
          {product.primary_category && (
            <>
              <ChevronRight size={14} />
              <Link to={`/products?category=${encodeURIComponent(product.primary_category)}`}>
                {t('cat_' + product.primary_category, product.primary_category)}
              </Link>
            </>
          )}
          <ChevronRight size={14} />
          <span className="pd-breadcrumb-current">{product.product_name}</span>
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
                  alt={product.product_name}
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
                  {getCategoryEmoji(product.primary_category)}
                </span>

                {/* Badges Stack */}
                <div className="pd-visual-badges">
                  {product.clean_at_sephora == 1 && (
                    <span className="badge badge-clean">{t('badge_clean', '🌿 Clean tại Sephora')}</span>
                  )}
                  {product.new == 1 && (
                    <span className="badge badge-new">{t('badge_new', 'MỚI')}</span>
                  )}
                  {salePrice && (
                    <span className="badge badge-sale">{t('badge_sale', 'GIẢM GIÁ')}</span>
                  )}
                  {product.limited_edition == 1 && !salePrice && (
                    <span className="badge badge-warning">{t('badge_limited', 'GIỚI HẠN')}</span>
                  )}
                </div>

                {/* Floating Quick Action Buttons */}
                <div className="pd-visual-actions">
                  <button
                    className={`pd-action-btn ${inWishlist ? 'active' : ''}`}
                    onClick={() => toggleWishlistItem(product.product_id)}
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

              {/* Trust Checklist (Cam kết chất lượng) */}
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
              {/* Brand & Title */}
              <div className="pd-buybox-header">
                {product.brand_name && (
                  <Link
                    to={`/products?brand=${encodeURIComponent(product.brand_name)}`}
                    className="pd-buybox-brand"
                  >
                    {product.brand_name}
                  </Link>
                )}
                <h1 className="pd-buybox-title">{product.product_name}</h1>
              </div>

              {/* Rating & Social Proof */}
              <div className="pd-buybox-rating">
                <StarRating value={Math.round(rating)} size={17} />
                <span className="pd-buybox-score">{rating.toFixed(1)}</span>
                <button
                  className="pd-buybox-review-link"
                  onClick={() => setActiveTab('reviews')}
                >
                  ({reviewCount.toLocaleString()} {t('pd_rating', 'đánh giá')})
                </button>
                {loves > 0 && (
                  <div className="pd-buybox-loves">
                    <Heart size={14} fill="#E11D48" color="#E11D48" />
                    <span>{loves.toLocaleString()} {t('pd_loves', 'yêu thích')}</span>
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
                <div className="pd-buybox-tax-hint">{formatDualPrice(salePrice || price)} · {t('pd_tax_included')}</div>
              </div>

              {/* 3-Column Quick Specs Card */}
              <div className="pd-specs-grid">
                <div className="pd-spec-box">
                  <span className="pd-spec-label">{t('prod_category', 'Danh mục')}</span>
                  <span className="pd-spec-val" title={product.primary_category || '-'}>
                    {product.primary_category ? (t('cat_' + product.primary_category) || product.primary_category) : t('pd_spec_care')}
                  </span>
                </div>
                <div className="pd-spec-box">
                  <span className="pd-spec-label">{t('pd_size', 'Dung tích')}</span>
                  <span className="pd-spec-val" title={product.size || '-'}>
                    {product.size || t('pd_spec_standard')}
                  </span>
                </div>
                <div className="pd-spec-box">
                  <span className="pd-spec-label">{t('pd_skin_type', 'Phù hợp da')}</span>
                  <span className="pd-spec-val" title={product.skin_type || t('pd_spec_all_skin')}>
                    {product.skin_type ? (t('skin_type_' + product.skin_type.toLowerCase()) || product.skin_type) : t('pd_spec_all_skin')}
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
                  onClick={() => addItemToCart(product.product_id, quantity)}
                >
                  <ShoppingBag size={18} />
                  <span>{t('prod_add_to_cart', 'Thêm vào giỏ hàng')} · {formatPrice((salePrice || price) * quantity)}</span>
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
              <span>{t('pd_tab_info', 'Mô tả & Công dụng')}</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'ingredients'}
              className={`pd-tab-btn ${activeTab === 'ingredients' ? 'active' : ''}`}
              onClick={() => setActiveTab('ingredients')}
            >
              <FlaskConical size={16} />
              <span>{t('pd_tab_ingredients', 'Bảng thành phần')}</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'reviews'}
              className={`pd-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              <MessageSquare size={16} />
              <span>{t('pd_tab_reviews', 'Đánh giá người dùng')} ({reviewCount})</span>
            </button>
          </div>

          <div className="pd-tab-panel">
            {/* TAB 1: MÔ TẢ & CÔNG DỤNG */}
            {activeTab === 'info' && (
              <div className="pd-tab-info-content animate-fadeIn">
                {highlights.length > 0 && (
                  <div className="pd-highlights-block">
                    <h3 className="pd-block-heading">
                      <Sparkles size={18} color="var(--primary, #4A3728)" />
                      {t('pd_highlights', 'Điểm nổi bật chính')}
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

                {product.description && (
                  <div className="pd-desc-block">
                    <h3 className="pd-block-heading">{t('pd_description', 'Mô tả chi tiết')}</h3>
                    <p className="pd-desc-text">{product.description}</p>
                  </div>
                )}

                {product.how_to_use && (
                  <div className="pd-how-block">
                    <h3 className="pd-block-heading">{t('pd_how_to_use', 'Hướng dẫn sử dụng')}</h3>
                    <div className="pd-how-box">
                      <p>{product.how_to_use}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: THÀNH PHẦN & AI SAFETY */}
            {activeTab === 'ingredients' && (
              <div className="pd-tab-ingredients-content animate-fadeIn">
                <div className="pd-ingredients-top">
                  <div>
                    <h3 className="pd-block-heading" style={{ marginBottom: 4 }}>
                      {t('pd_tab_ingredients', 'Thành phần')} ({ingredients.length})
                    </h3>
                    <p className="pd-block-subtext">
                      {t('pd_formula_note')}
                    </p>
                  </div>

                  {ingredients.length > 0 && (
                    <Link
                      to={`/ingredient-analyzer?ingredients=${encodeURIComponent(ingredients.join(', '))}&product_name=${encodeURIComponent(product.product_name || '')}&brand_name=${encodeURIComponent(product.brand_name || '')}&category=${encodeURIComponent(product.primary_category || product.category || '')}`}
                      state={{
                        ingredients: ingredients.join(', '),
                        product_name: product.product_name,
                        brand_name: product.brand_name,
                        category: product.primary_category || product.category || '',
                      }}
                      className="btn btn-secondary btn-sm pd-ai-analyze-btn"
                    >
                      <FlaskConical size={15} />
                      <span>{t('pd_ai_analyze')}</span>
                      <ExternalLink size={13} />
                    </Link>
                  )}
                </div>

                {ingredients.length > 0 ? (
                  <div className="pd-ingredient-tag-cloud">
                    {ingredients.map((ing, i) => (
                      <span key={i} className="pd-ingredient-pill">
                        {ing}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="pd-empty-block">
                    <span className="pd-empty-icon">🧪</span>
                    <p>{t('pd_no_ingredients', 'Thông tin thành phần chưa có')}</p>
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
                    <span>{t('pd_write_review', 'Viết đánh giá của bạn')}</span>
                    {showReviewForm ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>

                {/* Review Form */}
                {showReviewForm && (
                  <form className="pd-review-form animate-scaleIn" onSubmit={handleSubmitReview}>
                    <h4 className="pd-review-form-title">{t('pd_write_review_title', '✍️ Viết đánh giá của bạn')}</h4>

                    <div className="pd-form-group">
                      <label className="pd-form-label">{t('pd_satisfaction_prompt')}</label>
                      <StarRating
                        value={reviewForm.rating}
                        size={28}
                        interactive
                        onChange={(n) => setReviewForm((f) => ({ ...f, rating: n }))}
                      />
                    </div>

                    <div className="pd-form-group">
                      <label className="pd-form-label">{t('pd_skin_type', 'Loại da của bạn')}</label>
                      <select
                        className="form-select"
                        value={reviewForm.skin_type}
                        onChange={(e) => setReviewForm((f) => ({ ...f, skin_type: e.target.value }))}
                      >
                        <option value="">{t('pd_select_skintype')}</option>
                        <option value="Da thường">{t('skin_type_normal')}</option>
                        <option value="Da khô">{t('skin_type_dry')}</option>
                        <option value="Da dầu">{t('skin_type_oily')}</option>
                        <option value="Da hỗn hợp">{t('skin_type_combination')}</option>
                        <option value="Da nhạy cảm">{t('skin_type_sensitive')}</option>
                      </select>
                    </div>

                    <div className="pd-form-group">
                      <label className="pd-form-label">{t('pd_review_text_label', 'Nội dung chia sẻ *')}</label>
                      <textarea
                        className="form-textarea"
                        placeholder={t('pd_review_text_placeholder', 'Chia sẻ cảm nhận chân thực của bạn về hiệu quả sản phẩm...')}
                        rows={4}
                        value={reviewForm.review_text}
                        onChange={(e) => setReviewForm((f) => ({ ...f, review_text: e.target.value }))}
                      />
                    </div>

                    <div className="pd-form-group">
                      <label className="pd-form-label">{t('pd_review_recommend_ask', 'Bạn có đề xuất sản phẩm này cho người khác?')}</label>
                      <div className="pd-rec-toggle-group">
                        <button
                          type="button"
                          className={`pd-rec-btn ${reviewForm.is_recommended ? 'active-yes' : ''}`}
                          onClick={() => setReviewForm((f) => ({ ...f, is_recommended: true }))}
                        >
                          <ThumbsUp size={15} /> {t('pd_recommend_yes')}
                        </button>
                        <button
                          type="button"
                          className={`pd-rec-btn ${!reviewForm.is_recommended ? 'active-no' : ''}`}
                          onClick={() => setReviewForm((f) => ({ ...f, is_recommended: false }))}
                        >
                          <ThumbsDown size={15} /> {t('pd_recommend_no')}
                        </button>
                      </div>
                    </div>

                    <div className="pd-form-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowReviewForm(false)}
                      >
                        {t('pd_cancel', 'Hủy')}
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        <Send size={15} />
                        {submitting ? t('pd_submitting') : t('pd_submit_review', 'Gửi đánh giá')}
                      </button>
                    </div>
                  </form>
                )}

                {/* Reviews List */}
                {loadingReviews ? (
                  <div className="loading-container">
                    <div className="loading-spinner" />
                    <span>{t('pd_loading_reviews', 'Đang tải danh sách đánh giá...')}</span>
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
                    <p>{t('pd_no_reviews', 'Chưa có đánh giá nào. Hãy là người đầu tiên trải nghiệm!')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── PART 4: DISCOVERY RAILS (BOTTOM) ────────────── */}
        {/* 1. Apriori Co-purchase Recommendations */}
        {frequentlyBought.length > 0 && (
          <section className="pd-discovery-section pd-apriori-section">
            <div className="pd-discovery-header">
              <div className="pd-discovery-title-wrap">
                <span className="pd-discovery-badge">Apriori AI Mining</span>
                <h2 className="pd-discovery-title">
                  {t('pd_frequently_bought_together', 'Thường được mua & kết hợp cùng')}
                </h2>
              </div>
            </div>
            <div className="pd-discovery-grid">
              {frequentlyBought.map((prod) => (
                <div key={prod.product_id} className="pd-discovery-card-wrap">
                  <ProductCard product={prod} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 2. Content-Based Similar Recommendations */}
        {similar.length > 0 && (
          <section className="pd-discovery-section">
            <div className="pd-discovery-header">
              <div className="pd-discovery-title-wrap">
                <span className="pd-discovery-badge">TF-IDF Matching</span>
                <h2 className="pd-discovery-title">
                  {t('pd_similar_title', 'Sản phẩm tương tự bạn có thể thích')}
                </h2>
              </div>
              <Link to="/products" className="btn btn-secondary btn-sm">
                {t('home_view_all', 'Xem tất cả')}
              </Link>
            </div>
            <div className="pd-discovery-grid">
              {similar.slice(0, 4).map((prod) => (
                <div key={prod.product_id} className="pd-discovery-card-wrap">
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
    </div>
  );
}
