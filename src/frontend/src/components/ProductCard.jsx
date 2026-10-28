import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Star, Eye, ShieldAlert, CheckCircle2, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getProductImage, DEFAULT_PRODUCT_IMAGE } from '../utils/productImages';

export default function ProductCard({ product }) {
  const { addItemToCart, toggleWishlistItem, isInWishlist, formatPrice, t } = useApp();
  const navigate = useNavigate();
  const productId = product.id ?? product.product_id;
  const productName = product.name ?? product.product_name ?? 'Beauty Product';
  const brandName = product.brandName ?? product.brand_name ?? 'BeautyAI Brand';
  const inWishlist = isInWishlist(productId);

  const [imgSrc, setImgSrc] = useState(() => getProductImage(product, 500));
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgSrc(getProductImage(product, 500));
    setImgLoaded(false);
    setImgError(false);
  }, [product]);

  const rating = parseFloat(product.rating) || 0;
  const price = parseFloat(product.priceUsd ?? product.price_usd ?? product.price) || 0;
  const suitability = product.suitabilityScore ?? product.suitability_score;
  const hasAllergyWarning = product.hasAllergyWarning || product.has_allergy_warning;
  const allergen = product.matchedAllergen || product.matched_allergen;

  return (
    <div className="product-card">
      {/* Image */}
      <div
        className="product-card-image"
        onClick={() => navigate(`/products/${productId}`)}
        style={{ cursor: 'pointer', background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden' }}
      >
        {!imgLoaded && !imgError && (
          <div className="skeleton product-card-skeleton-img" style={{ position: 'absolute', inset: 0 }} />
        )}
        {!imgError ? (
          <img
            src={imgSrc}
            alt={productName}
            className={`product-card-real-img ${imgLoaded ? 'loaded' : ''}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              if (imgSrc !== DEFAULT_PRODUCT_IMAGE) {
                setImgSrc(DEFAULT_PRODUCT_IMAGE);
              } else {
                setImgError(true);
              }
            }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <Package size={48} strokeWidth={1.5} />
          </div>
        )}

        {/* Badges */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 2 }}>
          {hasAllergyWarning && (
            <span
              className="badge"
              style={{
                background: '#EF4444',
                color: '#FFFFFF',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ShieldAlert size={12} strokeWidth={2.5} /> ALLERGY: {allergen || 'Contains allergen'}
            </span>
          )}
          {!hasAllergyWarning && suitability != null && suitability > 0 && (
            <span
              className="badge"
              style={{
                background: suitability >= 90 ? 'rgba(16, 185, 129, 0.92)' : 'rgba(74, 144, 226, 0.92)',
                color: '#FFFFFF',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                backdropFilter: 'blur(4px)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <CheckCircle2 size={12} strokeWidth={2.5} /> {suitability}% MATCH
            </span>
          )}
          {product.new == 1 && <span className="badge badge-new" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>{t('badge_new', 'NEW')}</span>}
          {product.sale_price_usd && <span className="badge badge-sale" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>{t('badge_sale', 'SALE')}</span>}
          {product.limited_edition == 1 && !product.sale_price_usd && (
            <span className="badge badge-warning" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>{t('badge_limited', 'LIMITED')}</span>
          )}
        </div>

        {/* Wishlist Button - Clean White Circular Floating Button */}
        <button
          className={`wishlist-btn-float ${inWishlist ? 'active' : ''}`}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#FFFFFF',
            border: '1px solid rgba(74, 55, 40, 0.1)',
            boxShadow: '0 2px 8px rgba(74, 55, 40, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 2,
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s ease',
          }}
          onClick={(e) => { e.stopPropagation(); toggleWishlistItem(productId); }}
          aria-label={inWishlist ? t('pd_unfavorite') : t('pd_favorite')}
          title={inWishlist ? t('pd_unfavorite') : t('pd_favorite')}
        >
          <Heart
            size={17}
            fill={inWishlist ? '#E11D48' : 'none'}
            color={inWishlist ? '#E11D48' : '#6B5E55'}
            strokeWidth={2}
          />
        </button>
      </div>

      {/* Body */}
      <div className="product-card-body" onClick={() => navigate(`/products/${productId}`)} style={{ cursor: 'pointer' }}>
        <div className="product-card-brand">{brandName}</div>
        <div className="product-card-name" title={productName}>{productName}</div>
        
        {/* Rating */}
        {rating > 0 && (
          <div className="product-card-rating" style={{ color: 'var(--accent-amber)' }}>
            <Star size={13} fill="currentColor" color="var(--accent-amber)" />
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', marginLeft: 2 }}>{rating.toFixed(1)}</span>
            {(product.reviewsCount || product.reviews) && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 2 }}>
                ({parseInt(product.reviewsCount ?? product.reviews).toLocaleString()})
              </span>
            )}
          </div>
        )}

        {/* Price Row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 'auto', paddingTop: 6 }}>
          <span className="product-card-price" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            {formatPrice(product.sale_price_usd ? parseFloat(product.sale_price_usd) : price)}
          </span>
          {product.sale_price_usd && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
              {formatPrice(price)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="product-card-actions">
        <button
          className="btn btn-primary btn-sm"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontWeight: 600,
            borderRadius: 'var(--radius-full)',
          }}
          onClick={() => addItemToCart(product.product_id)}
        >
          <ShoppingBag size={14} />
          {t('prod_add_to_cart')}
        </button>
        <button
          className="btn-icon"
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
          }}
          onClick={() => navigate(`/products/${product.product_id}`)}
          title={t('prod_view_details')}
        >
          <Eye size={15} />
        </button>
      </div>
    </div>
  );
}
