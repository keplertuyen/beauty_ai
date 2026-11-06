import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { createOrder } from '../services/api';
import toast from 'react-hot-toast';
import { ChevronLeft, CheckCircle2, Truck, ShoppingBag, Package, ShieldCheck } from 'lucide-react';
import { getProductImage } from '../utils/productImages';

export default function Checkout() {
  const {
    cart,
    clearCart,
    cartConflicts,
    conflictAcknowledged,
    user,
    formatPrice,
    formatDualPrice,
    t
  } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  const [formData, setFormData] = useState({
    recipient_name: user?.fullName || user?.name || '',
    phone_number: user?.phone || '',
    shipping_address: user?.shippingAddress || '',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        recipient_name: prev.recipient_name || user.fullName || user.name || '',
        phone_number: prev.phone_number || user.phone || '',
        shipping_address: prev.shipping_address || user.shippingAddress || '',
      }));
    }
  }, [user]);

  const total = cart.reduce((sum, item) => sum + ((parseFloat(item.price_usd) || 0) * item.quantity), 0);
  const hasConflict = Boolean(cartConflicts?.has_conflict ?? cartConflicts?.has_conflicts);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.recipient_name.trim() || !formData.phone_number.trim() || !formData.shipping_address.trim()) {
      toast.error('Please fill in your full name, phone number, and delivery address.');
      return;
    }

    if (hasConflict && !conflictAcknowledged) {
      toast.error('Please review and acknowledge the ingredient conflict notice in your bag first.');
      navigate('/cart');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        recipient_name: formData.recipient_name.trim(),
        phone_number: formData.phone_number.trim(),
        shipping_address: formData.shipping_address.trim(),
        notes: formData.notes.trim() || null,
        conflict_acknowledged: Boolean(conflictAcknowledged),
        items: cart.map((item) => ({
          product_id: Number(item.product_id ?? item.id),
          quantity: Number(item.quantity) || 1,
        })),
      };

      const res = await createOrder(payload);
      setPlacedOrder(res.data);
      clearCart();
      toast.success('Order placed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'Unable to place your order.');
    } finally {
      setLoading(false);
    }
  };

  if (placedOrder) {
    return (
      <div className="container section animate-fadeIn">
        <div className="glass-card" style={{ maxWidth: '680px', margin: '0 auto', padding: '44px 36px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(22, 163, 74, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <CheckCircle2 size={34} color="#16A34A" />
            </div>
            <span className="badge" style={{ background: 'rgba(22, 163, 74, 0.12)', color: '#15803D', fontWeight: 700, marginBottom: '8px' }}>
              ORDER CONFIRMED · CASH ON DELIVERY (COD)
            </span>
            <h1 className="display-font" style={{ fontSize: '2rem', margin: '6px 0 8px' }}>
              Thank You for Your Order!
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Order Code: <strong style={{ color: 'var(--text-primary)' }}>{placedOrder.order_code || `#${placedOrder.order_id}`}</strong>
            </p>
          </div>

          <div style={{
            padding: '18px 20px',
            borderRadius: '12px',
            background: '#FAF8F5',
            border: '1px solid #EAE3DC',
            marginBottom: '24px',
            fontSize: '0.9rem',
            lineHeight: 1.6,
          }}>
            <div><strong>Recipient:</strong> {placedOrder.recipient_name} ({placedOrder.phone_number})</div>
            <div><strong>Delivery Address:</strong> {placedOrder.shipping_address}</div>
            <div><strong>Payment Method:</strong> Cash on Delivery (COD) — Pay {formatPrice(placedOrder.total_usd)} upon delivery</div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Items Ordered</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(placedOrder.items || []).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: '#FFFFFF',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{item.product_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {item.brand_name} · Qty: {item.quantity} × {formatPrice(item.unit_price_usd)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    {formatPrice(item.total_price_usd)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '16px',
            borderTop: '1px solid var(--glass-border)',
            marginBottom: '28px',
            fontSize: '1.15rem',
            fontWeight: 700,
          }}>
            <span>Total Due on Delivery (COD):</span>
            <span style={{ color: 'var(--primary-light)' }}>{formatDualPrice(placedOrder.total_usd)}</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/profile?tab=orders')}
            >
              <Package size={16} />
              <span>View Order History</span>
            </button>
            <Link to="/products" className="btn btn-secondary">
              <ShoppingBag size={16} />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user || cart.length === 0) {
    return (
      <div className="container section empty-state animate-fadeIn" style={{ textAlign: 'center', padding: '60px 24px' }}>
        <h3>{t('checkout_empty', 'Your Shopping Bag Is Empty')}</h3>
        <p>{t('checkout_empty_desc', 'Please add products to your shopping bag before proceeding to checkout.')}</p>
        <div style={{ marginTop: '24px' }}>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/products')}>
            {t('checkout_view_products', 'Explore Products')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container section animate-fadeIn">
      <button
        type="button"
        onClick={() => navigate('/cart')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: 'var(--primary-light)',
          cursor: 'pointer',
          marginBottom: '24px',
          fontWeight: 600,
        }}
      >
        <ChevronLeft size={16} /> {t('checkout_back_cart', 'Back to Shopping Bag')}
      </button>

      <div className="checkout-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '40px', alignItems: 'start' }}>
        {/* Checkout Form */}
        <div className="glass-card" style={{ padding: '32px' }}>
          <h1 className="display-font" style={{ marginBottom: '8px', fontSize: '1.85rem' }}>
            {t('checkout_shipping_title', 'Delivery & COD Checkout')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Enter your delivery details below. You will pay in cash only when your package arrives.
          </p>

          <form onSubmit={handleSubmit} method="POST" action="/api/v1/orders">
            <div className="form-group">
              <label htmlFor="checkout-recipient-name" className="form-label">
                {t('checkout_name', 'Recipient Full Name')} *
              </label>
              <input
                id="checkout-recipient-name"
                name="recipient_name"
                type="text"
                autoComplete="name"
                className="form-input"
                required
                placeholder="e.g. Sarah Jenkins"
                value={formData.recipient_name}
                onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="checkout-phone" className="form-label">
                {t('checkout_phone', 'Phone Number')} *
              </label>
              <input
                id="checkout-phone"
                name="phone_number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className="form-input"
                required
                placeholder="e.g. +1 555-234-5678 or 0901234567"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="checkout-address" className="form-label">
                {t('checkout_address', 'Full Street Delivery Address')} *
              </label>
              <textarea
                id="checkout-address"
                name="shipping_address"
                autoComplete="street-address"
                className="form-input"
                rows={3}
                required
                placeholder="Apartment, street address, city, state / province, postal code"
                value={formData.shipping_address}
                onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
              />
            </div>

            {/* Strictly Cash on Delivery (COD) in Phase 1 */}
            <div className="form-group">
              <label className="form-label">{t('checkout_payment', 'Payment Method')}</label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.07)',
                  border: '1.5px solid rgba(16, 185, 129, 0.35)',
                }}
              >
                <Truck size={20} color="#059669" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#065F46' }}>
                    {t('checkout_cod', 'Cash on Delivery (COD)')}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#047857' }}>
                    Pay directly to the courier upon receiving and inspecting your order.
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="checkout-notes" className="form-label">
                {t('checkout_notes', 'Delivery Instructions (Optional)')}
              </label>
              <textarea
                id="checkout-notes"
                name="notes"
                className="form-input"
                rows={2}
                placeholder="Gate code, preferred delivery window, etc."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '14px 20px' }}
              disabled={loading}
            >
              <ShieldCheck size={18} />
              <span>
                {loading
                  ? 'Placing Your Order...'
                  : `Place COD Order — ${formatPrice(total)}`}
              </span>
            </button>
          </form>
        </div>

        {/* Order Summary (No coupon/voucher input per Phase 1 scope) */}
        <div className="glass-card" style={{ padding: '24px', position: 'sticky', top: '96px' }}>
          <h3 style={{ marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
            {t('checkout_summary', 'Order Summary')} ({cart.reduce((s, i) => s + i.quantity, 0)} items)
          </h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
            {cart.map((item) => (
              <div
                key={item.product_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                  fontSize: '0.9rem',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#FFFFFF',
                    border: '1px solid var(--glass-border)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <img
                      src={getProductImage(item, 90)}
                      alt={item.product_name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.product_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {t('checkout_qty', 'Qty')}: {item.quantity} × {formatPrice(item.price_usd)}
                    </div>
                  </div>
                </div>
                <span style={{ fontWeight: '700' }}>{formatPrice(item.price_usd * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{t('cart_subtotal', 'Subtotal')}:</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{t('cart_shipping', 'Standard Shipping')}:</span>
            <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{t('cart_free', 'FREE')}</span>
          </div>
          <div className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 'bold' }}>
            <span>{t('cart_total', 'Total Due (COD)')}:</span>
            <span style={{ color: 'var(--primary-light)' }}>{formatDualPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
