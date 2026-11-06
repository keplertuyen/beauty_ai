import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProduct } from '../services/api';
import { Heart, Trash2, ShoppingBag, Lock } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useApp } from '../context/AppContext';

export default function Wishlist() {
  const { user, wishlist, clearWishlist, t } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }

    if (!wishlist || wishlist.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.allSettled(wishlist.map((pid) => getProduct(pid)))
      .then((results) => {
        if (!active) return;
        const loaded = results
          .filter((r) => r.status === 'fulfilled' && r.value?.data)
          .map((r) => r.value.data);
        setProducts(loaded);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, wishlist]);

  if (!user) {
    return (
      <div className="container section animate-fadeIn">
        <div className="empty-state glass-card" style={{ padding: '64px 32px', maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(196, 139, 113, 0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px',
          }}>
            <Lock size={24} color="#8F5B42" />
          </div>
          <h2 className="display-font" style={{ fontSize: '1.6rem', marginBottom: '10px' }}>
            {t('wl_not_logged_title', 'Sign In to View Your Wishlist')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
            {t('wl_not_logged', 'Sign in to save your favorite products and check them against your personal Digital Skin ID.')}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
          >
            Sign In / Create Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container section animate-fadeIn">
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '36px',
      }}>
        <div>
          <h1 className="section-title display-font" style={{ fontSize: '2.35rem', marginBottom: '6px' }}>
            {t('wl_title', 'My Wishlist')}
          </h1>
          <p className="section-subtitle" style={{ margin: 0 }}>
            {t('wl_subtitle', 'Your saved products with live Skin ID suitability & allergy checks')}
          </p>
        </div>

        {products.length > 0 && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={clearWishlist}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Trash2 size={15} />
            <span>Clear All ({products.length})</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('wl_loading', 'Loading your saved products...')}</p>
        </div>
      ) : products.length > 0 ? (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id ?? p.product_id} product={p} />
          ))}
        </div>
      ) : (
        <div className="empty-state glass-card" style={{ padding: '60px 32px', textAlign: 'center' }}>
          <Heart size={48} color="var(--primary)" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ marginBottom: '8px' }}>{t('wl_empty_title', 'Your Wishlist Is Empty')}</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {t('wl_empty', 'Tap the heart icon on any product to save it here for quick comparison and allergy checks.')}
          </p>
          <Link to="/products" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={16} />
            <span>Explore Catalog</span>
          </Link>
        </div>
      )}
    </div>
  );
}
