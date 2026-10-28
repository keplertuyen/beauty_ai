import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight, AlertTriangle, ShieldCheck, FlaskConical } from 'lucide-react';
import { getProductImage } from '../utils/productImages';
import { checkProductConflicts } from '../services/api';

export default function Cart() {
  const { cart, cartConflicts, updateItemQuantity, removeItemFromCart, user, formatPrice, formatDualPrice, lang, t } = useApp();
  const navigate = useNavigate();
  const [conflictsData, setConflictsData] = useState(cartConflicts || { has_conflicts: false, conflicts: [], product_actives: [] });

  useEffect(() => {
    if (cart.length >= 2) {
      const pids = cart.map((item) => String(item.product_id));
      checkProductConflicts(pids)
        .then((res) => setConflictsData(res.data))
        .catch(() => {
          if (cartConflicts) setConflictsData(cartConflicts);
        });
    } else {
      setConflictsData({ has_conflicts: false, conflicts: [], product_actives: [] });
    }
  }, [cart, lang, cartConflicts]);

  const total = cart.reduce((sum, item) => sum + (item.price_usd * item.quantity), 0);

  if (!user) {
    return (
      <div className="container section empty-state animate-fadeIn">
        <ShoppingBag size={48} color="var(--primary)" style={{ marginBottom: '16px', opacity: 0.5 }} />
        <h3>{t('cart_not_logged_title')}</h3>
        <p>{t('cart_not_logged')}</p>
      </div>
    );
  }

  return (
    <div className="container section animate-fadeIn">
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="section-title display-font" style={{ fontSize: '2.5rem' }}>{t('cart_title')}</h1>
        <p className="section-subtitle">{t('cart_subtitle')}</p>
      </div>

      {cart.length > 0 ? (
        <div className="cart-grid-layout" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'start' }}>
          {/* Left Column: Conflict Detector + Cart Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* FR-07.1: Active Ingredient Conflict Detector */}
            {cart.length >= 2 && (
              <div
                className="glass-card"
                style={{
                  padding: '18px 22px',
                  borderLeft: conflictsData?.has_conflicts
                    ? '4px solid var(--accent-red, #DC2626)'
                    : '4px solid var(--accent-green, #16A34A)',
                  background: conflictsData?.has_conflicts
                    ? 'rgba(220, 38, 38, 0.04)'
                    : 'rgba(22, 163, 74, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: conflictsData?.has_conflicts ? '12px' : '0' }}>
                  {conflictsData?.has_conflicts ? (
                    <AlertTriangle size={20} color="#DC2626" />
                  ) : (
                    <ShieldCheck size={20} color="#16A34A" />
                  )}
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {conflictsData?.has_conflicts
                      ? (lang === 'en'
                          ? `Active Ingredient Conflict Detected (${conflictsData.conflict_count})`
                          : `Phát hiện xung đột hoạt chất trong giỏ hàng (${conflictsData.conflict_count})`)
                      : (lang === 'en'
                          ? 'Routine Compatibility Check: Safe to combine'
                          : 'Kiểm tra tương thích Routine: Chưa phát hiện xung đột hoạt chất mạnh')}
                  </h4>
                </div>

                {conflictsData?.has_conflicts && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {conflictsData.conflicts.map((conf, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-primary, #FFFFFF)',
                          border: '1px solid rgba(220, 38, 38, 0.18)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <span
                            className="badge"
                            style={{
                              background: conf.severity === 'high' ? '#FEE2E2' : '#FEF3C7',
                              color: conf.severity === 'high' ? '#B91C1C' : '#B45309',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                            }}
                          >
                            {conf.severity === 'high'
                              ? (lang === 'en' ? 'HIGH RISK' : 'MỨC ĐỘ CAO')
                              : (lang === 'en' ? 'CAUTION' : 'LƯU Ý PHỐI HỢP')}
                          </span>
                          <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{conf.title}</strong>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                          <FlaskConical size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                          <strong>{conf.product_a?.brand_name}</strong> {conf.product_a?.product_name}
                          {'  ⚡  '}
                          <strong>{conf.product_b?.brand_name}</strong> {conf.product_b?.product_name}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                          💡 {conf.advice}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cart Items List */}
            <div className="glass-card" style={{ padding: '24px' }}>
              {cart.map(item => (
                <div
                  key={item.product_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 0',
                    borderBottom: '1px solid var(--glass-border)',
                    gap: '16px',
                  }}
                >
                  {/* Thumbnail */}
                  <Link
                    to={`/products/${item.product_id}`}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      background: '#FFFFFF',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={getProductImage(item, 120)}
                      alt={item.product_name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </Link>

                  {/* Product Info */}
                  <div style={{ flex: 1, paddingRight: '16px' }}>
                    <div style={{ color: 'var(--primary-light)', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {item.brand_name}
                    </div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600', margin: '4px 0' }}>
                      <Link to={`/products/${item.product_id}`} style={{ color: 'var(--text-primary)' }}>
                        {item.product_name}
                      </Link>
                    </h4>
                    <div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                      {formatPrice(item.price_usd)}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: '32px' }}>
                    <button
                      className="btn-icon"
                      onClick={() => updateItemQuantity(item.product_id, item.quantity - 1)}
                      style={{ padding: '4px', borderRadius: '50%' }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: '600' }}>{item.quantity}</span>
                    <button
                      className="btn-icon"
                      onClick={() => updateItemQuantity(item.product_id, item.quantity + 1)}
                      style={{ padding: '4px', borderRadius: '50%' }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Subtotal & Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', minWidth: '85px', textAlign: 'right' }}>
                      {formatPrice(item.price_usd * item.quantity)}
                    </div>
                    <button
                      onClick={() => removeItemFromCart(item.product_id)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>{t('cart_summary')}</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('cart_subtotal')}:</span>
              <span style={{ fontWeight: '600' }}>{formatPrice(total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('cart_shipping')}:</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: '600' }}>{t('cart_free')}</span>
            </div>
            <div className="divider" style={{ margin: '16px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '1.15rem', fontWeight: 'bold', gap: '8px' }}>
              <span>{t('cart_total')}:</span>
              <span style={{ color: 'var(--primary-light)', textAlign: 'right' }}>{formatDualPrice(total)}</span>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => navigate('/checkout')}
            >
              {t('cart_checkout_btn')}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="empty-state glass-card" style={{ padding: '60px' }}>
          <ShoppingBag size={48} color="var(--primary)" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3>{t('cart_empty_title')}</h3>
          <p>{t('cart_empty')}</p>
          <div style={{ marginTop: '24px' }}>
            <Link to="/products" className="btn btn-primary">
              {t('cart_shop_now')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
