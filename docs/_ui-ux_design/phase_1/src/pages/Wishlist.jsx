import React, { useEffect, useState } from 'react';
import { getWishlist } from '../services/api';
import { Heart } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useApp } from '../context/AppContext';

export default function Wishlist() {
  const { user, t } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getWishlist()
        .then(res => {
          setProducts(res.data.wishlist || []);
        })
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="container section empty-state animate-fadeIn">
        <Heart size={48} color="var(--primary)" style={{ marginBottom: '16px', opacity: 0.5 }} />
        <h3>{t('wl_not_logged_title', 'Chưa đăng nhập')}</h3>
        <p>{t('wl_not_logged')}</p>
      </div>
    );
  }

  return (
    <div className="container section animate-fadeIn">
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="section-title display-font" style={{ fontSize: '2.5rem' }}>{t('wl_title')}</h1>
        <p className="section-subtitle">{t('wl_subtitle')}</p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('wl_loading', 'Đang tải danh sách yêu thích...')}</p>
        </div>
      ) : products.length > 0 ? (
        <div className="product-grid">
          {products.map(p => (
            <ProductCard key={p.product_id} product={p} />
          ))}
        </div>
      ) : (
        <div className="empty-state glass-card" style={{ padding: '60px' }}>
          <Heart size={48} color="var(--primary)" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3>{t('wl_empty_title', 'Danh sách yêu thích trống')}</h3>
          <p>{t('wl_empty')}</p>
        </div>
      )}
    </div>
  );
}
