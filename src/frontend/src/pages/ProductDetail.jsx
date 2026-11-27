import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Heart,
  Share2,
  ShoppingBag,
  Star,
  ChevronRight,
  Truck,
  FlaskConical,
  Info,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Send,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Check,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Plus,
  Minus,
  X,
  ExternalLink,
  Sun,
  Moon,
  AlertCircle,
  Sparkles,
  Lock,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import {
  getProduct,
  getSimilarProducts,
  getReviews,
  addReview,
  getProductQrCode,
} from '../services/api';
import ProductCard from '../components/ProductCard';
import SkinIdQuickModal from '../components/SkinIdQuickModal';
import { getProductImage, DEFAULT_PRODUCT_IMAGE } from '../utils/productImages';
import { translateHighlight } from '../utils/highlightTranslator';
import './ProductDetail.css';

/* ── helpers ─────────────────────────────────── */
function getRoutineInfo(categoryName, department) {
  if (department && department !== 'Skincare') {
    return null;
  }
  const cat = (categoryName || '').toLowerCase();
  if (cat.includes('cleanser') || cat.includes('wash')) {
    return {
      step: 'Step 1: Cleanse',
      time: 'AM & PM',
      tip: 'Use as the foundational first step to remove impurities without stripping skin barrier.',
    };
  }
  if (cat.includes('toner')) {
    return {
      step: 'Step 2: Tone & Balance',
      time: 'AM & PM',
      tip: 'Apply directly onto clean skin to restore hydration and prep skin for serums.',
    };
  }
  if (
    cat.includes('serum') ||
    cat.includes('essence') ||
    cat.includes('peeling') ||
    cat.includes('treatment')
  ) {
    const isNightOnly =
      cat.includes('peel') ||
      cat.includes('retinol') ||
      cat.includes('aha') ||
      cat.includes('bha') ||
      cat.includes('exfoliat');
    return {
      step: 'Step 3: Treat & Target',
      time: isNightOnly ? 'PM Only' : 'AM & PM',
      tip: 'Dispense 3-4 drops and gently press into skin before heavier moisturizers.',
    };
  }
  if (cat.includes('eye')) {
    return {
      step: 'Step 4a: Eye Care',
      time: 'AM & PM',
      tip: 'Gently pat a rice-grain amount around orbital eye contours with your ring finger.',
    };
  }
  if (cat.includes('sunscreen') || cat.includes('sun')) {
    return {
      step: 'Step 5: Sun Protection',
      time: 'AM Only',
      tip: 'Apply generously as the final morning step 15 minutes prior to sun exposure.',
    };
  }
  if (cat.includes('mask')) {
    return {
      step: 'Weekly Special Treatment',
      time: 'PM (2–3x / week)',
      tip: 'Apply an even layer on cleansed skin, leaving on according to formula guidance.',
    };
  }
  if (cat.includes('oil')) {
    return {
      step: 'Step 5: Seal & Nourish',
      time: 'PM',
      tip: 'Warm 2 drops in palms and press over moisturizer to lock in moisture and nourish lipid barrier.',
    };
  }
  if (cat.includes('moisturiz') || cat.includes('cream') || cat.includes('lotion')) {
    return {
      step: 'Step 4: Moisturize & Barrier',
      time: 'AM & PM',
      tip: 'Massage evenly onto face and neck to seal in hydration and reinforce skin barrier.',
    };
  }
  return {
    step: 'Skincare Support',
    time: 'Daily',
    tip: 'Incorporate into your daily skincare regimen according to instructions.',
  };
}

/**
 * Parenthesis-aware fallback INCI parser that preserves commas inside (...)
 * (e.g. "Iron Oxides (CI 77491, CI 77492, CI 77499)") and separates
 * "[+/- May Contain / Peut Contenir: ...]" into { mainList, mayContainList }.
 */
function splitInciFallback(raw) {
  if (!raw) return { mainList: [], mayContainList: [] };
  if (Array.isArray(raw)) {
    return {
      mainList: raw.filter((s) => s && s.toLowerCase() !== 'no ingredients listed'),
      mayContainList: [],
    };
  }
  let text = String(raw).trim();
  try {
    const arr = JSON.parse(text);
    if (Array.isArray(arr)) {
      return {
        mainList: arr.filter((s) => s && String(s).toLowerCase() !== 'no ingredients listed'),
        mayContainList: [],
      };
    }
  } catch {
    /* normal string */
  }

  let mainPart = text;
  let mayPart = '';
  const mayRegex =
    /(\[\s*\+\/-\s*(?:may\s+contain\s*(?:\/\s*peut\s+contenir)?\s*:?)?|\[\s*may\s+contain\s*(?:\/\s*peut\s+contenir)?\s*:?|may\s+contain\s*(?:\/\s*peut\s+contenir)?\s*(?:\(\+\/-\))?\s*:|\(\+\/-\)\s*may\s+contain\s*:?)/i;
  const match = text.match(mayRegex);
  if (match && match.index !== undefined) {
    mainPart = text.slice(0, match.index).trim().replace(/[,;.]$/, '');
    mayPart = text
      .slice(match.index + match[0].length)
      .trim()
      .replace(/[\].\s]+$/, '')
      .replace(/^(?:\/\s*)?peut\s+contenir\s*:?\s*/i, '')
      .trim();
  }

  const splitTopLevel = (str) => {
    if (!str) return [];
    const tokens = [];
    let current = '';
    let parenDepth = 0;
    let bracketDepth = 0;

    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (c === '(') {
        parenDepth++;
        current += c;
      } else if (c === ')') {
        if (parenDepth > 0) parenDepth--;
        current += c;
      } else if (c === '[') {
        bracketDepth++;
      } else if (c === ']') {
        if (bracketDepth > 0) bracketDepth--;
      } else if ((c === ',' || c === ';' || c === '\n') && parenDepth === 0 && bracketDepth === 0) {
        const cleaned = current
          .trim()
          .replace(/^[.[\]\s]+|[.[\]\s]+$/g, '')
          .replace(/^(?:\+\/-\s*:?\s*|may\s+contain\s*(?:\/\s*peut\s+contenir)?\s*:?\s*)/i, '')
          .trim();
        if (cleaned.length > 1 && cleaned.toLowerCase() !== 'no ingredients listed') {
          tokens.push(cleaned);
        }
        current = '';
      } else {
        current += c;
      }
    }

    if (current.trim()) {
      const cleaned = current
        .trim()
        .replace(/^[.[\]\s]+|[.[\]\s]+$/g, '')
        .replace(/^(?:\+\/-\s*:?\s*|may\s+contain\s*(?:\/\s*peut\s+contenir)?\s*:?\s*)/i, '')
        .trim();
      if (cleaned.length > 1 && cleaned.toLowerCase() !== 'no ingredients listed') {
        tokens.push(cleaned);
      }
    }
    return [...new Set(tokens)];
  };

  return {
    mainList: splitTopLevel(mainPart),
    mayContainList: splitTopLevel(mayPart),
  };
}

function StarRating({ value = 0, size = 16, interactive = false, onChange }) {
  const [hovered, setHovered] = useState(0);
  const display = interactive ? hovered || value : value;
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
      normal: t('skin_type_normal'),
      dry: t('skin_type_dry'),
      oily: t('skin_type_oily'),
      combination: t('skin_type_combination'),
      sensitive: t('skin_type_sensitive'),
    };
    return map[norm] || skin;
  };

  const author =
    review.authorName ||
    review.author_name ||
    review.reviewer_name ||
    review.user_name ||
    'BeautyAI Shopper';
  const skinType = review.skinType || review.skin_type;
  const ratingValue = parseInt(review.rating, 10) || review.star_rating || 5;
  const dateVal = review.createdAt || review.created_at;
  const content = review.content || review.review_text;

  return (
    <div className="pd-review-card glass-card">
      <div className="pd-review-header">
        <div className="pd-review-avatar">{author[0].toUpperCase()}</div>
        <div className="pd-review-meta">
          <span className="pd-review-name">{author}</span>
          {skinType && skinType !== 'Unknown' && (
            <span className="pd-review-skin badge badge-secondary">
              {getSkinTypeLabel(skinType)}
            </span>
          )}
          {review.skinConcerns && (
            <span className="pd-review-skin badge badge-subtle" style={{ fontSize: '0.72rem' }}>
              {review.skinConcerns}
            </span>
          )}
        </div>
        <div className="pd-review-right">
          <StarRating value={ratingValue} size={13} />
          {dateVal && (
            <span className="pd-review-date">
              {new Date(dateVal).toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN')}
            </span>
          )}
        </div>
      </div>
      {content && <p className="pd-review-text">{content}</p>}
      {review.is_recommended !== undefined && (
        <div className={`pd-review-recommend ${review.is_recommended ? 'yes' : 'no'}`}>
          {review.is_recommended ? (
            <>
              <ThumbsUp size={13} /> {t('pd_review_recommend')}
            </>
          ) : (
            <>
              <ThumbsDown size={13} /> {t('pd_review_not_recommend')}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Reusable Suitability Banner (No Safety Allergy Alert — that stays at top of BuyBox) ── */
function SuitabilityBanner({
  hasAllergyWarning,
  isNonCosmeticTool,
  hasIngredients,
  user,
  suitabilityVerdict,
  suitabilityLabel,
  suitabilityReason,
  onOpenSkinModal,
  showEditButton = false,
}) {
  if (hasAllergyWarning) return null;

  if (isNonCosmeticTool) {
    return (
      <div className="pd-suitability-match-pill pill-tool">
        <Sparkles size={16} />
        <span>Accessory / Tool · Contains no chemical cosmetic ingredients</span>
      </div>
    );
  }

  if (!hasIngredients) {
    return (
      <div className="pd-suitability-match-pill pill-insufficient">
        <AlertCircle size={16} />
        <span>Insufficient INCI Data · Manufacturer ingredient list unavailable</span>
      </div>
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => {
          toast('Sign in to check your personal Skin ID & Allergy match');
          window.dispatchEvent(new CustomEvent('open-auth-modal'));
        }}
        className="pd-suitability-match-pill pill-signin"
      >
        <span className="pd-suitability-left">
          <Lock size={15} />
          <span>Sign in to check if this formula matches your Skin ID</span>
        </span>
        <span className="pd-suitability-cta">Sign In →</span>
      </button>
    );
  }

  if (suitabilityVerdict === 'RequiresSkinId') {
    return (
      <button
        type="button"
        onClick={onOpenSkinModal}
        className="pd-suitability-match-pill pill-setup"
      >
        <span className="pd-suitability-left">
          <Sparkles size={16} />
          <span>Complete your 30-second Skin ID to unlock personalized verdict</span>
        </span>
        <span className="pd-suitability-cta">Set Up Now →</span>
      </button>
    );
  }

  const isNotes = suitabilityVerdict === 'MatchWithNotes';

  return (
    <div className={`pd-suitability-match-pill ${isNotes ? 'pill-notes' : 'pill-good'}`}>
      <div className="pd-suitability-content">
        <div className="pd-suitability-title-row">
          {isNotes ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>
            {suitabilityLabel || (isNotes ? 'Match with Notes' : 'Good Match')}
            {!isNotes ? ' For Your Skin ID' : ''}
          </span>
        </div>
        {suitabilityReason && <span className="pd-suitability-reason">{suitabilityReason}</span>}
      </div>
      {showEditButton && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenSkinModal}>
          Edit Skin ID
        </button>
      )}
    </div>
  );
}

/* ── Main Component ──────────────────────────── */
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addItemToCart, toggleWishlistItem, isInWishlist, formatPrice, lang, t, user } =
    useApp();

  const previewFromState = location.state?.productPreview;
  const isMatchingPreview =
    previewFromState &&
    (String(previewFromState.id) === String(id) ||
      String(previewFromState.product_id) === String(id) ||
      String(previewFromState.code) === String(id) ||
      String(previewFromState.slug) === String(id));

  const [product, setProduct] = useState(() => (isMatchingPreview ? previewFromState : null));
  const [similar, setSimilar] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingProduct, setLoadingProduct] = useState(!isMatchingPreview);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [copied, setCopied] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showFullInci, setShowFullInci] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [skinIdModalOpen, setSkinIdModalOpen] = useState(false);

  // QR & Barcode modal state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);

  // Track user identity signature so we only re-fetch verdict when user actually logs in or updates Skin ID
  const userSignature = user
    ? `${user.id ?? user.user_id}:${user.skinProfile?.skinType ?? user.skin_type}:${(
        user.skinProfile?.allergies || []
      )
        .map((a) => a.ingredientName || a)
        .join(',')}`
    : 'guest';
  const prevUserSigRef = useRef(userSignature);

  const getInitialSkinType = useCallback((userSkinType) => {
    if (!userSkinType) return '';
    const map = {
      normal: 'Normal',
      dry: 'Dry',
      oily: 'Oily',
      combination: 'Combination',
      sensitive: 'Sensitive',
    };
    return map[userSkinType.toLowerCase()] || '';
  }, []);

  const [initialInWishlist, setInitialInWishlist] = useState(null);

  useEffect(() => {
    setInitialInWishlist(null);
    setQuantity(1);
    setQrData(null);
    setShowFullInci(false);
    setExpandedGroups({});
    setActiveTab('info');
  }, [id]);

  useEffect(() => {
    if (product && initialInWishlist === null) {
      setInitialInWishlist(isInWishlist(product.id ?? product.product_id ?? id));
    }
  }, [product, isInWishlist, initialInWishlist, id]);

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

  useEffect(() => {
    if (user) {
      setReviewForm((f) => ({
        ...f,
        skin_type: getInitialSkinType(user.skinProfile?.skinType || user.skin_type),
      }));
    }
  }, [user, getInitialSkinType]);

  const inWishlist = isInWishlist(product?.id ?? product?.product_id ?? id);

  /* Reviews pagination & skin filtering */
  const [selectedReviewSkin, setSelectedReviewSkin] = useState('All');
  const [reviewPage, setReviewPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [totalReviewPages, setTotalReviewPages] = useState(1);

  /* fetch product detail (Single call on mount/id change!) */
  const fetchProductDetail = useCallback(
    (showSkeleton = false) => {
      if (showSkeleton) setLoadingProduct(true);
      getProduct(id)
        .then((res) => setProduct(res.data))
        .catch(() => toast.error(t('pd_not_found', 'Product not found')))
        .finally(() => setLoadingProduct(false));
    },
    [id, t]
  );

  /* fetch reviews */
  const loadReviews = useCallback(
    (skinType = selectedReviewSkin, page = 1) => {
      if (!id) return;
      setLoadingReviews(true);
      const params = {
        page,
        per_page: 8,
      };
      if (skinType && skinType !== 'All') {
        params.skin_type = skinType;
      }
      getReviews(id, params)
        .then((res) => {
          const items = res.data?.reviews || res.data || [];
          setReviews(items);
          setTotalReviews(res.data?.total ?? items.length);
          setTotalReviewPages(res.data?.pages || 1);
          setReviewPage(page);
        })
        .catch(() => {
          setReviews([]);
          setTotalReviews(0);
          setTotalReviewPages(1);
        })
        .finally(() => setLoadingReviews(false));
    },
    [id, selectedReviewSkin]
  );

  // Initial load on product ID change (Runs ONCE per product ID)
  useEffect(() => {
    const hasPreview =
      location.state?.productPreview &&
      (String(location.state.productPreview.id) === String(id) ||
        String(location.state.productPreview.product_id) === String(id) ||
        String(location.state.productPreview.code) === String(id));

    if (hasPreview) {
      setProduct(location.state.productPreview);
      setLoadingProduct(false);
    } else {
      setLoadingProduct(true);
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
    fetchProductDetail(!hasPreview);

    getSimilarProducts(id, 8)
      .then((res) => setSimilar(res.data?.recommendations || res.data || []))
      .catch(() => setSimilar([]));
  }, [id, fetchProductDetail, location.state]);

  useEffect(() => {
    loadReviews(selectedReviewSkin, 1);
  }, [id, selectedReviewSkin, loadReviews]);

  // Re-evaluate product verdict ONLY when user actually logs in or updates Skin ID (never on initial mount!)
  useEffect(() => {
    if (prevUserSigRef.current !== userSignature) {
      prevUserSigRef.current = userSignature;
      if (id) {
        fetchProductDetail(false);
      }
    }
  }, [userSignature, id, fetchProductDetail]);

  // Update document title dynamically for SEO & browser tab clarity
  useEffect(() => {
    if (product) {
      const pName = product.name ?? product.product_name ?? 'Product';
      const bName =
        product.brandName ??
        product.brand_name ??
        (typeof product.brand === 'string' ? product.brand : product.brand?.name) ??
        'BeautyAI';
      document.title = `${pName} — ${bName} | BeautyAI`;
    }
    return () => {
      document.title = 'BeautyAI — Personalized Clean Beauty & INCI Intelligence';
    };
  }, [product]);

  /* Normalized product fields */
  const productId = product?.id ?? product?.product_id ?? id;
  const productCode = product?.code ?? product?.product_id ?? String(productId);
  const productName = product?.name ?? product?.product_name ?? 'Beauty Product';
  const brandName =
    product?.brandName ??
    product?.brand_name ??
    (typeof product?.brand === 'string' ? product.brand : product?.brand?.name) ??
    'BeautyAI Brand';
  const categoryName =
    product?.categoryName ??
    product?.primary_category ??
    (typeof product?.category === 'string' ? product.category : product?.category?.name) ??
    'Skincare';

  /* fetch QR code on modal open using normalized productCode / productId */
  const handleOpenQrModal = async () => {
    setQrModalOpen(true);
    if (!qrData && product) {
      setLoadingQr(true);
      try {
        const res = await getProductQrCode(productCode || productId);
        setQrData(res.data);
      } catch (err) {
        console.error('QR Fetch error:', err);
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
    if (!reviewForm.rating) {
      toast.error(t('pd_err_stars', 'Please select a star rating'));
      return;
    }
    if (!reviewForm.review_text.trim()) {
      toast.error(t('pd_err_content', 'Please enter your review text'));
      return;
    }
    if (reviewForm.review_text.trim().length < 10) {
      toast.error(t('pd_err_content_len', 'Review text must be at least 10 characters'));
      return;
    }
    setSubmitting(true);
    try {
      await addReview({
        product_id: String(productId),
        author_id: String(user.id ?? user.user_id),
        author_name: user.name,
        rating: reviewForm.rating,
        review_text: reviewForm.review_text,
        skin_type: reviewForm.skin_type,
        is_recommended: reviewForm.is_recommended ? 1 : 0,
      });
      toast.success(t('pd_review_success', 'Review submitted successfully!'));
      setShowReviewForm(false);
      setReviewForm({
        reviewer_name: '',
        rating: 0,
        review_text: '',
        skin_type: user ? getInitialSkinType(user.skinProfile?.skinType || user.skin_type) : '',
        is_recommended: true,
      });
      fetchProductDetail(false);
      loadReviews(selectedReviewSkin, 1);
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
    try {
      return JSON.parse(raw);
    } catch {
      /* noop */
    }
    return raw
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  /* ── LOADING ── */
  if (loadingProduct && !product) {
    return (
      <div className="pd-page">
        <div className="container">
          <div className="pd-loading-wrapper">
            <div className="pd-loading-inner">
              <div className="pd-skeleton pd-skeleton-image" />
              <div className="pd-skeleton-info">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="pd-skeleton pd-skeleton-line"
                    style={{ width: `${90 - i * 12}%` }}
                  />
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

  const price = parseFloat(product.priceUsd ?? product.price_usd ?? product.price) || 0;
  const salePrice = product.salePriceUsd
    ? parseFloat(product.salePriceUsd)
    : product.sale_price_usd
    ? parseFloat(product.sale_price_usd)
    : null;

  // Accurate review count & nullable rating (Never fake 5.0 when reviewCount === 0!)
  const reviewCount = parseInt(product.reviewsCount ?? product.reviews_count ?? totalReviews ?? 0, 10) || 0;
  const rawRating =
    product.rating !== null && product.rating !== undefined ? parseFloat(product.rating) : null;
  const rating = reviewCount > 0 && rawRating && rawRating > 0 ? rawRating : null;

  // Size comes only from size_display (raw CSV string). volumeMl is deprecated (integer, lossy) — do not use.
  const sizeDisplay =
    product.sizeDisplay ||
    product.size_display ||
    (product.size && String(product.size).toUpperCase() !== 'N/A' ? product.size : null);

  const department = product.department || 'Skincare';
  const suitabilityVerdict =
    product.suitabilityVerdict ?? product.suitability_verdict ?? 'RequiresSkinId';
  const suitabilityLabel =
    product.suitabilityLabel ?? product.suitability_label ?? 'Good Match';
  const suitabilityReason = product.suitabilityReason ?? product.suitability_reason ?? '';
  const hasAllergyWarning =
    product.hasAllergyWarning ||
    product.has_allergy_warning ||
    suitabilityVerdict === 'AllergyConflict';
  const matchedAllergen = product.matchedAllergen || product.matched_allergen;
  const isNonCosmeticTool = Boolean(
    product.isNonCosmeticTool ||
      department === 'Tools & Brushes' ||
      suitabilityVerdict === 'AccessoryTool'
  );

  const structuredIngredients =
    Array.isArray(product.ingredients) &&
    product.ingredients.length > 0 &&
    typeof product.ingredients[0] === 'object'
      ? product.ingredients
      : [];

  const formulaBreakdown = product.formulaBreakdown || null;

  // Backend formulaBreakdown.rawInciList is the single source of truth; splitInciFallback is used only if formulaBreakdown isn't loaded yet
  const fallbackParsed = splitInciFallback(
    product.ingredientListRaw ||
      (Array.isArray(product.ingredients) && typeof product.ingredients[0] === 'string'
        ? product.ingredients
        : null) ||
      product.ingredients_clean ||
      ''
  );

  const mainInciList =
    formulaBreakdown?.rawInciList?.length > 0
      ? formulaBreakdown.rawInciList
      : fallbackParsed.mainList;

  const mayContainInciList =
    formulaBreakdown?.mayContainList?.length > 0
      ? formulaBreakdown.mayContainList
      : fallbackParsed.mayContainList;

  const hasIngredients =
    !isNonCosmeticTool &&
    (product.hasIngredients !== undefined
      ? Boolean(product.hasIngredients) &&
        (structuredIngredients.length > 0 || mainInciList.length > 0)
      : structuredIngredients.length > 0 || mainInciList.length > 0);

  const totalInciCount =
    formulaBreakdown?.totalIngredientsCount ||
    mainInciList.length ||
    structuredIngredients.length;

  const handleDeepAnalysisClick = () => {
    const inciString =
      mainInciList.length > 0
        ? mainInciList.join(', ')
        : structuredIngredients.map((i) => i.inciName).join(', ');

    const targetSkins = Array.isArray(product.targetSkinTypes)
      ? product.targetSkinTypes.join(',')
      : Array.isArray(product.target_skin_types)
      ? product.target_skin_types.join(',')
      : '';

    const targetUrl = `/ingredient-analyzer?ingredients=${encodeURIComponent(
      inciString
    )}&product_name=${encodeURIComponent(productName)}&brand_name=${encodeURIComponent(
      brandName
    )}&department=${encodeURIComponent(department)}&category=${encodeURIComponent(
      categoryName
    )}&target_area=${encodeURIComponent(formulaBreakdown?.targetArea || '')}${
      targetSkins ? `&target_skin_types=${encodeURIComponent(targetSkins)}` : ''
    }`;

    navigate(targetUrl);
  };

  const routine = getRoutineInfo(categoryName, department);
  const loves = (() => {
    const baseLoves = parseInt(product?.lovesCount ?? product?.loves_count ?? 0, 10) || 0;
    if (initialInWishlist === null || !product) return baseLoves;
    const currentIn = isInWishlist(productId);
    if (currentIn && !initialInWishlist) return baseLoves + 1;
    if (!currentIn && initialInWishlist) return Math.max(0, baseLoves - 1);
    return baseLoves;
  })();

  const highlights = parseHighlights(product.highlights_clean || product.highlights);

  // Use API ratingDistribution across all reviews of the product (fallback to current page only if missing)
  const apiDist = product.ratingDistribution || product.rating_distribution;
  const starDistribution = [5, 4, 3, 2, 1].map((star) => {
    if (apiDist && (apiDist[star] !== undefined || apiDist[String(star)] !== undefined)) {
      return Number(apiDist[star] ?? apiDist[String(star)] ?? 0);
    }
    return reviews.filter((r) => parseInt(r.rating || r.star_rating || 0, 10) === star).length;
  });
  const totalDistCount = starDistribution.reduce((a, b) => a + b, 0) || reviewCount;

  // Similar products: 8 (2 rows of 4) or 4 (1 row of 4) — never 6 (4+2 orphan row)
  const displayedSimilar =
    similar.length >= 8 ? similar.slice(0, 8) : similar.slice(0, 4);

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
              {/* Main Visual Display (Unified vector placeholder fallback — no emoji) */}
              <div className="pd-visual-box">
                <img
                  src={getProductImage(product, 800)}
                  alt={productName}
                  className="pd-visual-real-img"
                  loading="eager"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    if (e.currentTarget.src !== DEFAULT_PRODUCT_IMAGE) {
                      e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                    }
                  }}
                />

                {/* Badges Stack */}
                <div className="pd-visual-badges">
                  {product.clean_at_sephora == 1 && (
                    <span className="badge badge-clean">
                      {t('badge_clean', 'Clean at Sephora')}
                    </span>
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
                    type="button"
                    className={`pd-action-btn ${inWishlist ? 'active' : ''}`}
                    onClick={() => toggleWishlistItem(productId)}
                    aria-pressed={inWishlist}
                    aria-label={`Save ${productName} to wishlist`}
                  >
                    <Heart
                      size={18}
                      fill={inWishlist ? '#E11D48' : 'none'}
                      color={inWishlist ? '#E11D48' : '#4A3728'}
                    />
                  </button>
                  <button
                    type="button"
                    className="pd-action-btn"
                    onClick={handleShare}
                    aria-label={t('pd_share')}
                    title={t('pd_share')}
                  >
                    {copied ? (
                      <Check size={18} color="#2E6F4E" />
                    ) : (
                      <Share2 size={18} color="#4A3728" />
                    )}
                  </button>
                </div>
              </div>

              {/* QR & Barcode Lookup Trigger */}
              <div className="pd-qr-trigger-wrap">
                <button type="button" className="pd-qr-trigger-btn" onClick={handleOpenQrModal}>
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

          {/* ── PART 2: PRIMARY BUY BOX (RIGHT — STICKY) ── */}
          <div className="pd-part-buybox">
            <div className="pd-buybox-card">
              {/* 1. CRITICAL SAFETY ALLERGY ALERT (Always stays at top of BuyBox!) */}
              {hasAllergyWarning && (
                <div className="pd-allergy-warning-box">
                  <div className="pd-allergy-warning-top">
                    <ShieldAlert
                      size={22}
                      color="#DC2626"
                      style={{ flexShrink: 0, marginTop: 2 }}
                    />
                    <div>
                      <h4>Safety Allergy Warning</h4>
                      <p>
                        This product contains <strong>{matchedAllergen}</strong>, which matches your
                        personal <strong>Allergy Blacklist</strong>.
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

              {/* 2. Brand & Product Title */}
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

              {/* 3. Real Rating & Social Proof (Shows "No reviews yet" when reviewCount === 0) */}
              <div className="pd-buybox-rating">
                {rating !== null ? (
                  <>
                    <StarRating value={Math.round(rating)} size={17} />
                    <span className="pd-buybox-score">{rating.toFixed(1)}</span>
                    <button
                      type="button"
                      className="pd-buybox-review-link"
                      onClick={() => setActiveTab('reviews')}
                    >
                      ({reviewCount.toLocaleString()} {t('pd_rating', 'reviews')})
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="pd-no-reviews-btn"
                    onClick={() => setActiveTab('reviews')}
                  >
                    {t('pd_no_reviews_short', 'No reviews yet')} ·{' '}
                    <span>{t('pd_write_first_review', 'Write a review')}</span>
                  </button>
                )}
                {loves > 0 && (
                  <div className="pd-buybox-loves">
                    <Heart size={14} fill="#E11D48" color="#E11D48" />
                    <span>
                      {loves.toLocaleString()} {t('pd_loves', 'loves')}
                    </span>
                  </div>
                )}
              </div>

              {/* 4. Balanced Price Section (No duplicated price in tax hint) */}
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
                <div className="pd-buybox-tax-hint">{t('pd_tax_included', 'VAT included')}</div>
              </div>

              {/* 5. Quick Specs Card (Hides Size box when sizeDisplay is missing) */}
              <div className={`pd-specs-grid ${sizeDisplay ? '' : 'pd-specs-grid-2'}`}>
                <div className="pd-spec-box">
                  <span className="pd-spec-label">{t('prod_category', 'Category')}</span>
                  <span className="pd-spec-val" title={categoryName}>
                    {categoryName}
                  </span>
                </div>
                {sizeDisplay && (
                  <div className="pd-spec-box">
                    <span className="pd-spec-label">{t('pd_size', 'Size')}</span>
                    <span className="pd-spec-val" title={sizeDisplay}>
                      {sizeDisplay}
                    </span>
                  </div>
                )}
                <div className="pd-spec-box">
                  <span className="pd-spec-label">{t('pd_skin_type', 'Target Skin')}</span>
                  <span
                    className="pd-spec-val"
                    title={product.targetSkinTypes?.join(', ') || 'All Skin Types'}
                  >
                    {product.targetSkinTypes?.length > 0
                      ? product.targetSkinTypes.join(', ')
                      : 'All Skin Types'}
                  </span>
                </div>
              </div>

              {/* 6. Suitability / Sign-In Prompt Banner (Positioned cleanly below Specs & above Add to Bag) */}
              <SuitabilityBanner
                hasAllergyWarning={hasAllergyWarning}
                isNonCosmeticTool={isNonCosmeticTool}
                hasIngredients={hasIngredients}
                user={user}
                suitabilityVerdict={suitabilityVerdict}
                suitabilityLabel={suitabilityLabel}
                suitabilityReason={suitabilityReason}
                onOpenSkinModal={() => setSkinIdModalOpen(true)}
              />

              {/* 7. Purchase Actions (Quantity + Add to Cart) */}
              <div className="pd-purchase-controls">
                <div className="pd-qty-selector">
                  <button
                    type="button"
                    className="pd-qty-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label={t('pd_decrease_qty')}
                  >
                    <Minus size={15} />
                  </button>
                  <span className="pd-qty-number">{quantity}</span>
                  <button
                    type="button"
                    className="pd-qty-btn"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label={t('pd_increase_qty')}
                  >
                    <Plus size={15} />
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-primary pd-cta-btn"
                  onClick={() => addItemToCart(product, quantity)}
                >
                  <ShoppingBag size={18} />
                  <span>
                    {t('prod_add_to_cart', 'Add to Bag')} ·{' '}
                    {formatPrice((salePrice || price) * quantity)}
                  </span>
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
          <div className="pd-tab-navigation" role="tablist" aria-label="Product Details">
            <button
              type="button"
              id="pd-tab-info"
              role="tab"
              aria-selected={activeTab === 'info'}
              aria-controls="pd-panel-info"
              className={`pd-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              <Info size={16} />
              <span>{t('pd_tab_info', 'Description & Routine')}</span>
            </button>

            {!isNonCosmeticTool && (
              <button
                type="button"
                id="pd-tab-ingredients"
                role="tab"
                aria-selected={activeTab === 'ingredients'}
                aria-controls="pd-panel-ingredients"
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
              type="button"
              id="pd-tab-reviews"
              role="tab"
              aria-selected={activeTab === 'reviews'}
              aria-controls="pd-panel-reviews"
              className={`pd-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              <MessageSquare size={16} />
              <span>
                {t('pd_tab_reviews', 'Customer Reviews')} ({reviewCount})
              </span>
            </button>
          </div>

          <div className="pd-tab-panel">
            {/* TAB 1: DESCRIPTION & ROUTINE */}
            {activeTab === 'info' && (
              <div
                id="pd-panel-info"
                role="tabpanel"
                aria-labelledby="pd-tab-info"
                className="pd-tab-info-content animate-fadeIn"
              >
                {highlights.length > 0 && (
                  <div className="pd-highlights-block">
                    <h3 className="pd-block-heading">
                      <Star size={18} color="var(--primary, #4A3728)" />
                      {t('pd_highlights', 'Key Highlights')}
                    </h3>
                    <div className="pd-highlights-grid">
                      {highlights.map((h, i) => (
                        <div key={i} className="pd-highlight-card">
                          <CheckCircle
                            size={16}
                            color="var(--accent-sage, #2E6F4E)"
                            className="pd-hl-icon"
                          />
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
                        {routine.time.includes('AM') && (
                          <Sun size={13} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                        )}
                        {routine.time.includes('PM') && (
                          <Moon size={13} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                        )}
                        {routine.time}
                      </span>
                    </div>
                    <p className="pd-routine-tip">{routine.tip}</p>
                  </div>
                ) : department === 'Tools & Brushes' ? (
                  <div className="pd-routine-card pd-routine-dept">
                    <div className="pd-routine-header">
                      <span className="pd-routine-step-badge badge-dept-tool">
                        Tool &amp; Accessory Care
                      </span>
                      <span className="pd-routine-time-badge">Hygiene &amp; Care</span>
                    </div>
                    <p className="pd-routine-tip">
                      Clean bristles or applicator weekly with a gentle brush cleaner or warm soapy
                      water. Lay flat to dry to preserve shape and prevent bacteria accumulation.
                    </p>
                  </div>
                ) : department === 'Fragrance' ? (
                  <div className="pd-routine-card pd-routine-dept">
                    <div className="pd-routine-header">
                      <span className="pd-routine-step-badge badge-dept-fragrance">
                        Scent Application
                      </span>
                      <span className="pd-routine-time-badge">Pulse Points</span>
                    </div>
                    <p className="pd-routine-tip">
                      Spritz onto pulse points (wrists, neck, behind ears) from 5-7 inches away.
                      Allow to dry naturally without rubbing to preserve the delicate olfactory top
                      and heart notes.
                    </p>
                  </div>
                ) : department === 'Makeup' ? (
                  <div className="pd-routine-card pd-routine-dept">
                    <div className="pd-routine-header">
                      <span className="pd-routine-step-badge badge-dept-makeup">
                        Makeup Artistry
                      </span>
                      <span className="pd-routine-time-badge">Application Tip</span>
                    </div>
                    <p className="pd-routine-tip">
                      Apply onto hydrated skin. Blend smoothly with appropriate brush, sponge, or
                      fingertips, layering gradually for desired opacity and long-lasting finish.
                    </p>
                  </div>
                ) : department === 'Hair' ? (
                  <div className="pd-routine-card pd-routine-dept">
                    <div className="pd-routine-header">
                      <span className="pd-routine-step-badge badge-dept-hair">Hair Ritual</span>
                      <span className="pd-routine-time-badge">Hair Care</span>
                    </div>
                    <p className="pd-routine-tip">
                      Work evenly through damp or dry hair, focusing on mid-lengths and ends. Style
                      or rinse according to formula directions.
                    </p>
                  </div>
                ) : null}

                {product.description && (
                  <div className="pd-desc-block">
                    <h3 className="pd-block-heading">
                      {t('pd_description', 'Product Description')}
                    </h3>
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
              <div
                id="pd-panel-ingredients"
                role="tabpanel"
                aria-labelledby="pd-tab-ingredients"
                className="pd-tab-ingredients-content animate-fadeIn"
              >
                <div className="pd-ingredients-top">
                  <div>
                    <h3 className="pd-block-heading" style={{ marginBottom: 4 }}>
                      Formula Breakdown &amp; INCI Transparency
                    </h3>
                    <p className="pd-block-subtext">
                      {hasIngredients
                        ? 'Key functional ingredients explained in plain English, with the full packaging INCI list below.'
                        : 'Manufacturer ingredient disclosure status for this product.'}
                    </p>
                  </div>

                  {hasIngredients && (
                    <button
                      type="button"
                      onClick={handleDeepAnalysisClick}
                      className="btn btn-secondary btn-sm pd-ai-analyze-btn"
                    >
                      <FlaskConical size={15} />
                      <span>Deep Formula Analysis</span>
                      <ExternalLink size={13} />
                    </button>
                  )}
                </div>

                {!hasIngredients ? (
                  <div className="pd-empty-inci-card">
                    <AlertCircle size={36} color="#64748B" style={{ marginBottom: 10 }} />
                    <h4 className="pd-empty-inci-title">Insufficient INCI Data</h4>
                    <p className="pd-empty-inci-desc">
                      The manufacturer has not provided a detailed INCI ingredient list for this
                      product. Because we cannot verify its exact chemical composition, it is
                      excluded from &ldquo;Safe for Me&rdquo; allergy filtering.
                    </p>
                  </div>
                ) : (
                  <div className="pd-inci-tiers-stack">
                    {/* ── TIER 1: REUSABLE PERSONALIZED VERDICT SUMMARY ── */}
                    {user && !hasAllergyWarning && (
                      <SuitabilityBanner
                        hasAllergyWarning={false}
                        isNonCosmeticTool={false}
                        hasIngredients={true}
                        user={user}
                        suitabilityVerdict={suitabilityVerdict}
                        suitabilityLabel={suitabilityLabel}
                        suitabilityReason={suitabilityReason}
                        onOpenSkinModal={() => setSkinIdModalOpen(true)}
                        showEditButton={true}
                      />
                    )}

                    {/* ── TIER 2A: KEY INGREDIENTS STRIP (AUTO-FIT GRID) ── */}
                    {formulaBreakdown?.keyIngredients?.length > 0 && (
                      <div>
                        <h4 className="pd-tier-heading">
                          <Star size={17} color="var(--accent)" />
                          <span>
                            Key Notable Ingredients ({formulaBreakdown.keyIngredients.length})
                          </span>
                        </h4>
                        <div className="pd-key-ingredients-grid">
                          {formulaBreakdown.keyIngredients.map((item, idx) => (
                            <div
                              key={idx}
                              className={`pd-key-card ${
                                item.isFeaturedInProductName ? 'is-featured' : ''
                              }`}
                            >
                              <div className="pd-key-card-top">
                                <span className="pd-key-role-tag">{item.roleLabel}</span>
                                {item.isFeaturedInProductName && (
                                  <span className="pd-key-featured-tag">Featured Hero</span>
                                )}
                              </div>
                              <div className="pd-key-name">{item.commonName}</div>
                              {item.commonName.toLowerCase() !== item.inciName.toLowerCase() && (
                                <div className="pd-key-inci">INCI: {item.inciName}</div>
                              )}
                              <p className="pd-key-desc">{item.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── TIER 2B: FUNCTIONAL ROLE GROUPING (AUTO-FIT 3-COL GRID + EXPANDABLE "+N MORE") ── */}
                    {formulaBreakdown?.functionalGroups?.length > 0 && (
                      <div>
                        <h4 className="pd-tier-heading">
                          <Layers size={17} color="#2E6F4E" />
                          <span>How the Complete Formula Is Built</span>
                        </h4>
                        <div className="pd-functional-groups-grid">
                          {formulaBreakdown.functionalGroups.map((grp, idx) => {
                            const isExpanded = Boolean(expandedGroups[idx]);
                            const visibleItems = isExpanded
                              ? grp.ingredients
                              : grp.ingredients.slice(0, 5);
                            const remainingCount = grp.ingredients.length - 5;

                            return (
                              <div key={idx} className="pd-group-card">
                                <div className="pd-group-card-header">
                                  <strong className="pd-group-title">{grp.groupTitle}</strong>
                                  <span className="pd-group-count">{grp.count}</span>
                                </div>
                                <p className="pd-group-desc">{grp.plainExplanation}</p>
                                <div className="pd-group-includes">
                                  <strong>Includes:</strong> {visibleItems.join(', ')}
                                  {remainingCount > 0 && (
                                    <button
                                      type="button"
                                      className="pd-group-expand-btn"
                                      onClick={() =>
                                        setExpandedGroups((prev) => ({
                                          ...prev,
                                          [idx]: !prev[idx],
                                        }))
                                      }
                                    >
                                      {isExpanded ? 'Show less' : `+${remainingCount} more`}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── TIER 2C: CATEGORY-APPROPRIATE NOTES & FRAGRANCE DISCLOSURE ── */}
                    {(formulaBreakdown?.cautions?.length > 0 ||
                      formulaBreakdown?.fragranceDisclosure) && (
                      <div className="pd-cautions-card">
                        <h4 className="pd-cautions-heading">Usage &amp; Sensitivity Notes</h4>
                        <div className="pd-cautions-list">
                          {formulaBreakdown.cautions?.map((c, i) => (
                            <div
                              key={i}
                              className={`pd-caution-item ${
                                c.type === 'allergy' ? 'is-allergy' : ''
                              }`}
                            >
                              <strong>{c.title}:</strong> {c.message}
                            </div>
                          ))}
                          {formulaBreakdown.fragranceDisclosure && (
                            <div className="pd-caution-item">
                              <strong>Scent &amp; Allergen Transparency:</strong>{' '}
                              {formulaBreakdown.fragranceDisclosure}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── TIER 3: COLLAPSIBLE FULL PACKAGING INCI LIST + SEPARATE "MAY CONTAIN" ── */}
                    <div className="pd-full-inci-accordion">
                      <button
                        type="button"
                        className="pd-full-inci-trigger"
                        onClick={() => setShowFullInci((v) => !v)}
                        aria-expanded={showFullInci}
                      >
                        <span>
                          View Full Packaging INCI List ({mainInciList.length} base ingredients in
                          concentration order
                          {mayContainInciList.length > 0
                            ? ` + ${mayContainInciList.length} shade pigments`
                            : ''}
                          )
                        </span>
                        {showFullInci ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>

                      {showFullInci && (
                        <div className="pd-full-inci-body">
                          <div className="pd-ingredient-tag-cloud">
                            {mainInciList.map((ing, i) => {
                              const isAllergen =
                                matchedAllergen &&
                                ing.toLowerCase().includes(matchedAllergen.toLowerCase());
                              const isKey = formulaBreakdown?.keyIngredients?.some(
                                (k) => k.inciName.toLowerCase() === ing.toLowerCase()
                              );
                              return (
                                <span
                                  key={i}
                                  className={`pd-ingredient-pill ${
                                    isAllergen
                                      ? 'pd-allergen-pill'
                                      : isKey
                                      ? 'pd-key-pill'
                                      : ''
                                  }`}
                                >
                                  {ing}
                                  {isAllergen && ' (Allergy Match)'}
                                </span>
                              );
                            })}
                          </div>

                          {mayContainInciList.length > 0 && (
                            <div className="pd-may-contain-block">
                              <div className="pd-may-contain-title">
                                May Contain (Varies by Shade — {mayContainInciList.length})
                              </div>
                              <div className="pd-ingredient-tag-cloud">
                                {mayContainInciList.map((ing, idx) => (
                                  <span
                                    key={idx}
                                    className="pd-ingredient-pill pd-may-contain-pill"
                                  >
                                    {ing}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CUSTOMER REVIEWS */}
            {activeTab === 'reviews' && (
              <div
                id="pd-panel-reviews"
                role="tabpanel"
                aria-labelledby="pd-tab-reviews"
                className="pd-tab-reviews-content animate-fadeIn"
              >
                {/* Rating Distribution Overview (Powered by full product RatingDistribution) */}
                <div className="pd-reviews-overview">
                  <div className="pd-rating-spotlight">
                    <span className="pd-spotlight-num">
                      {rating !== null ? rating.toFixed(1) : '—'}
                    </span>
                    <StarRating value={rating !== null ? Math.round(rating) : 0} size={22} />
                    <span className="pd-spotlight-sub">
                      {reviewCount > 0
                        ? `${reviewCount.toLocaleString()} ${t('pd_real_reviews', 'verified reviews')}`
                        : t('pd_no_reviews_short', 'No reviews yet')}
                    </span>
                  </div>

                  <div className="pd-rating-bars-wrap">
                    {[5, 4, 3, 2, 1].map((star, i) => {
                      const count = starDistribution[i] || 0;
                      const pct = totalDistCount > 0 ? (count / totalDistCount) * 100 : 0;
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
                    type="button"
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
                    <h4 className="pd-review-form-title">
                      {t('pd_write_review_title', 'Share Your Review')}
                    </h4>

                    <div className="pd-form-group">
                      <label className="pd-form-label">
                        {t('pd_satisfaction_prompt', 'Rate this product *')}
                      </label>
                      <StarRating
                        value={reviewForm.rating}
                        size={28}
                        interactive
                        onChange={(n) => setReviewForm((f) => ({ ...f, rating: n }))}
                      />
                    </div>

                    <div className="pd-form-group">
                      <label className="pd-form-label">
                        {t('pd_skin_type', 'Your Skin Type')}
                      </label>
                      <select
                        className="form-select"
                        value={reviewForm.skin_type}
                        onChange={(e) =>
                          setReviewForm((f) => ({ ...f, skin_type: e.target.value }))
                        }
                      >
                        <option value="">{t('pd_select_skintype', 'Select skin type')}</option>
                        <option value="Normal">Normal</option>
                        <option value="Dry">Dry</option>
                        <option value="Oily">Oily</option>
                        <option value="Combination">Combination</option>
                        <option value="Sensitive">Sensitive</option>
                      </select>
                    </div>

                    <div className="pd-form-group">
                      <label className="pd-form-label">
                        {t('pd_review_text_label', 'Your Review *')}
                      </label>
                      <textarea
                        className="form-textarea"
                        placeholder={t(
                          'pd_review_text_placeholder',
                          'Share your honest experience and results with this formula...'
                        )}
                        rows={4}
                        value={reviewForm.review_text}
                        onChange={(e) =>
                          setReviewForm((f) => ({ ...f, review_text: e.target.value }))
                        }
                      />
                    </div>

                    <div className="pd-form-group">
                      <label className="pd-form-label">
                        {t(
                          'pd_review_recommend_ask',
                          'Would you recommend this product to others?'
                        )}
                      </label>
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
                        {submitting
                          ? t('pd_submitting', 'Submitting...')
                          : t('pd_submit_review', 'Submit Review')}
                      </button>
                    </div>
                  </form>
                )}

                {/* Personalized Skin Match Banner */}
                {(user?.skinProfile?.skinType || user?.skin_type) && (
                  <div className="pd-reviews-user-match-banner">
                    <div className="pd-reviews-match-left">
                      <Sparkles size={18} color="#D4A373" />
                      <span>
                        {t('pd_your_skin_id', 'Your Skin ID')}:{' '}
                        <strong>{user.skinProfile?.skinType || user.skin_type}</strong>.{' '}
                        {t(
                          'pd_filter_same_skin_prompt',
                          'Explore verified reviews from shoppers with your skin type?'
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`btn btn-sm ${
                        selectedReviewSkin.toLowerCase() ===
                        (user.skinProfile?.skinType || user.skin_type).toLowerCase()
                          ? 'btn-primary'
                          : 'btn-secondary'
                      }`}
                      onClick={() =>
                        setSelectedReviewSkin(user.skinProfile?.skinType || user.skin_type)
                      }
                    >
                      {t('pd_see_skin_reviews', 'Filter for My Skin Type')}
                    </button>
                  </div>
                )}

                {/* Skin Type Filter Tabs */}
                <div className="pd-review-filters">
                  <span className="pd-review-filter-label">
                    {t('pd_filter_by_skin', 'Filter by skin type:')}
                  </span>
                  {['All', 'Oily', 'Dry', 'Combination', 'Normal', 'Sensitive'].map((st) => {
                    const active = selectedReviewSkin.toLowerCase() === st.toLowerCase();
                    return (
                      <button
                        key={st}
                        type="button"
                        className={`btn btn-sm pd-review-skin-pill ${
                          active ? 'btn-primary' : 'btn-secondary'
                        }`}
                        onClick={() => setSelectedReviewSkin(st)}
                      >
                        {st === 'All' ? t('prod_rating_all', 'All') : `${st} Skin`}
                      </button>
                    );
                  })}
                  {selectedReviewSkin !== 'All' && (
                    <span className="pd-review-filter-count">
                      Showing {totalReviews.toLocaleString()} reviews for {selectedReviewSkin} skin
                    </span>
                  )}
                </div>

                {/* Reviews List */}
                {loadingReviews ? (
                  <div className="loading-container">
                    <div className="loading-spinner" />
                    <span>{t('pd_loading_reviews', 'Loading customer reviews...')}</span>
                  </div>
                ) : reviews.length > 0 ? (
                  <>
                    <div className="pd-reviews-list">
                      {reviews.map((r, i) => (
                        <ReviewCard key={r.id || r.review_id || i} review={r} />
                      ))}
                    </div>

                    {totalReviewPages > 1 && (
                      <div className="pd-reviews-pagination">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={reviewPage <= 1 || loadingReviews}
                          onClick={() => loadReviews(selectedReviewSkin, reviewPage - 1)}
                        >
                          ← {t('pd_prev_page', 'Previous')}
                        </button>
                        <span className="pd-reviews-page-info">
                          Page {reviewPage} of {totalReviewPages} ({totalReviews.toLocaleString()}{' '}
                          reviews)
                        </span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={reviewPage >= totalReviewPages || loadingReviews}
                          onClick={() => loadReviews(selectedReviewSkin, reviewPage + 1)}
                        >
                          {t('pd_next_page', 'Next')} →
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="pd-empty-block">
                    <p>
                      {t(
                        'pd_no_reviews',
                        'No reviews yet for this filter. Be the first to share your experience!'
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── PART 4: DISCOVERY RAILS (BOTTOM — 4 OR 8 ITEMS FOR BALANCED 4-COL GRID) ── */}
        {displayedSimilar.length > 0 && (
          <section className="pd-discovery-section">
            <div className="pd-discovery-header">
              <div className="pd-discovery-title-wrap">
                <span className="pd-discovery-badge">Category Match</span>
                <h2 className="pd-discovery-title">
                  {t('pd_similar_title', 'Similar Products You May Like')}
                </h2>
              </div>
              <Link
                to={`/products?category=${encodeURIComponent(categoryName)}`}
                className="btn btn-secondary btn-sm"
              >
                {t('home_view_all', 'View All')}
              </Link>
            </div>
            <div className="pd-discovery-grid">
              {displayedSimilar.map((prod) => (
                <div key={prod.id ?? prod.product_id} className="pd-discovery-card-wrap">
                  <ProductCard product={prod} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── MODAL: QR CODE & BARCODE LOOKUP (USING NORMALIZED VARIABLES) ── */}
      {qrModalOpen && (
        <div className="pd-modal-overlay animate-fadeIn" onClick={() => setQrModalOpen(false)}>
          <div className="pd-modal-content animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="pd-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <QrCode size={20} color="var(--primary, #4A3728)" />
                <h3 className="pd-modal-title">{t('pd_qr_modal_title')}</h3>
              </div>
              <button
                type="button"
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
                      alt={`QR Code ${productName}`}
                      className="pd-qr-image"
                    />
                    <span className="pd-qr-hint">{t('pd_qr_hint')}</span>
                  </div>

                  <div className="pd-barcode-box">
                    <img
                      src={qrData.barcode_svg}
                      alt={`Barcode ${productCode}`}
                      className="pd-barcode-image"
                    />
                    <span className="pd-barcode-sku">SKU / ID: {productCode}</span>
                  </div>

                  <div className="pd-qr-product-info">
                    <div className="pd-qr-product-brand">{brandName}</div>
                    <div className="pd-qr-product-name">{productName}</div>
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
          fetchProductDetail(false);
        }}
      />
    </div>
  );
}
