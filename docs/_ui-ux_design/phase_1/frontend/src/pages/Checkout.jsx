import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { checkout as checkoutAPI } from '../services/api';
import toast from 'react-hot-toast';
import { ChevronLeft } from 'lucide-react';
import { getProductImage } from '../utils/productImages';

export default function Checkout() {
  const { cart, loadCart, user, currency, exchangeRate, formatPrice, formatDualPrice, t } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shipping_name: user?.name || '',
    shipping_address: '',
    shipping_phone: '',
    payment_method: 'cod',
    note: '',
  });

  const total = cart.reduce((sum, item) => sum + (item.price_usd * item.quantity), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.shipping_name || !formData.shipping_address || !formData.shipping_phone) {
      toast.error(t('checkout_err_missing', 'Vui lòng nhập đầy đủ thông tin giao hàng'));
      return;
    }
    setLoading(true);
    try {
      const res = await checkoutAPI({ ...formData, currency, exchange_rate: exchangeRate });
      toast.success(res.data.message || t('checkout_success', 'Đặt hàng thành công! 🎉'));
      loadCart(); // Refresh cart (will be empty)
      navigate('/profile'); // Go to profile to see orders
    } catch (err) {
      toast.error(err.response?.data?.detail || t('checkout_failed', 'Đặt hàng thất bại'));
    } finally {
      setLoading(false);
    }
  };

  if (!user || cart.length === 0) {
    return (
      <div className="container section empty-state animate-fadeIn">
        <h3>{t('checkout_empty')}</h3>
        <p>{t('checkout_empty_desc', 'Vui lòng chọn sản phẩm vào giỏ hàng trước khi thanh toán.')}</p>
        <div style={{ marginTop: '24px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/products')}>
            {t('checkout_view_products', 'Xem sản phẩm')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container section animate-fadeIn">
      <button
        onClick={() => navigate('/cart')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--primary-light)', cursor: 'pointer', marginBottom: '24px' }}
      >
        <ChevronLeft size={16} /> {t('checkout_back_cart')}
      </button>

      <div className="checkout-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '40px', alignItems: 'start' }}>
        {/* Checkout Form */}
        <div className="glass-card" style={{ padding: '32px' }}>
          <h2 className="display-font" style={{ marginBottom: '24px', fontSize: '1.8rem' }}>{t('checkout_shipping_title')}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('checkout_name')}</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.shipping_name}
                onChange={(e) => setFormData({ ...formData, shipping_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('checkout_phone')}</label>
              <input
                type="tel"
                className="form-input"
                required
                value={formData.shipping_phone}
                onChange={(e) => setFormData({ ...formData, shipping_phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('checkout_address')}</label>
              <textarea
                className="form-input"
                rows={3}
                required
                value={formData.shipping_address}
                onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('checkout_payment')}</label>
              <select
                className="form-select"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              >
                <option value="cod">{t('checkout_cod')}</option>
                <option value="banking">{t('checkout_banking')}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('checkout_notes')}</label>
              <textarea
                className="form-input"
                rows={2}
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
              disabled={loading}
            >
              {loading ? (t('profile_saving') || 'Đang xử lý...') : `${t('checkout_order_btn')} — ${formatPrice(total)}`}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>{t('checkout_summary')}</h3>
          <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '20px' }}>
            {cart.map(item => (
              <div
                key={item.product_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  fontSize: '0.9rem',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm, 6px)', overflow: 'hidden', background: '#FFFFFF', border: '1px solid var(--glass-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={getProductImage(item, 80)}
                      alt={item.product_name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <span style={{ fontWeight: '500' }}>{item.product_name}</span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('checkout_qty')}: {item.quantity} x {formatPrice(item.price_usd)}</div>
                  </div>
                </div>
                <span style={{ fontWeight: '600' }}>{formatPrice(item.price_usd * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{t('cart_subtotal')}:</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{t('cart_shipping')}:</span>
            <span style={{ color: 'var(--accent-green)' }}>{t('cart_free')}</span>
          </div>
          <div className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 'bold' }}>
            <span>{t('cart_total')}:</span>
            <span style={{ color: 'var(--primary-light)' }}>{formatDualPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
