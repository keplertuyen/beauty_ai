import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import {
  Trash2, ShoppingBag, Plus, Minus, ArrowRight,
  AlertTriangle, ShieldCheck, FlaskConical, Lock, CalendarClock
} from 'lucide-react';
import { getProductImage } from '../utils/productImages';
import { checkProductConflicts } from '../services/api';

export default function Cart() {
  const {
    cart,
    cartConflicts,
    conflictAcknowledged,
    setConflictAcknowledged,
    updateItemQuantity,
    removeItemFromCart,
    clearCart,
    user,
    formatPrice,
    formatDualPrice,
    t
  } = useApp();
  const navigate = useNavigate();
  const [conflictsData, setConflictsData] = useState(
    cartConflicts || { has_conflict: false, conflicts: [] }
  );

  useEffect(() => {
    if (cart.length >= 2) {
      const pids = cart.map((item) => Number(item.product_id ?? item.id));
      checkProductConflicts(pids)
        .then((res) => {
          const d = res.data || {};
          const list = d.conflicts || [];
          setConflictsData({
            has_conflict: Boolean(d.has_conflict ?? d.has_conflicts ?? list.length > 0),
            conflicts: list,
          });
        })
        .catch(() => {
          if (cartConflicts) setConflictsData(cartConflicts);
        });
    } else {
      setConflictsData({ has_conflict: false, conflicts: [] });
    }
  }, [cart, cartConflicts]);

  const hasConflict = Boolean(
    conflictsData?.has_conflict ??
    conflictsData?.has_conflicts ??
    (conflictsData?.conflicts?.length > 0)
  );
  const conflictList = conflictsData?.conflicts || [];
  const total = cart.reduce((sum, item) => sum + ((parseFloat(item.price_usd) || 0) * item.quantity), 0);

  const handleProceedToCheckout = () => {
    if (hasConflict && !conflictAcknowledged) {
      toast.error('Please review and acknowledge the active ingredient alternating schedule before checkout.');
      return;
    }
    navigate('/checkout');
  };

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
            {t('cart_not_logged_title', 'Sign In to View Your Shopping Bag')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
            {t('cart_not_logged', 'Sign in to check active ingredient compatibility in your bag and place your order.')}
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
            {t('cart_title', 'Shopping Bag')}
          </h1>
          <p className="section-subtitle" style={{ margin: 0 }}>
            {t('cart_subtitle', 'Automatic clinical ingredient conflict screening for your routine')}
          </p>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              clearCart();
              toast.success('Shopping bag cleared');
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Trash2 size={15} />
            <span>Clear Bag</span>
          </button>
        )}
      </div>

      {cart.length > 0 ? (
        <div className="cart-grid-layout" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'start' }}>
          {/* Left Column: Smart Conflict Detector + Cart Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* FR-CONF-01 & FR-CONF-02: Smart Conflict Detector */}
            {cart.length >= 2 && (
              <div
                className="glass-card"
                role="region"
                aria-label="Active Ingredient Compatibility Check"
                style={{
                  padding: '20px 24px',
                  borderLeft: hasConflict
                    ? '5px solid #D97706'
                    : '5px solid #16A34A',
                  background: hasConflict
                    ? 'rgba(245, 158, 11, 0.06)'
                    : 'rgba(22, 163, 74, 0.05)',
                  border: hasConflict
                    ? '1px solid rgba(217, 119, 6, 0.35)'
                    : '1px solid rgba(22, 163, 74, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: hasConflict ? '14px' : '0' }}>
                  {hasConflict ? (
                    <AlertTriangle size={22} color="#D97706" style={{ flexShrink: 0 }} />
                  ) : (
                    <ShieldCheck size={22} color="#16A34A" style={{ flexShrink: 0 }} />
                  )}
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {hasConflict
                        ? `Smart Conflict Detector: ${conflictList.length} Active Interaction${conflictList.length > 1 ? 's' : ''} Found`
                        : 'Routine Compatibility Check: Safe to Combine'}
                    </h3>
                    {!hasConflict && (
                      <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                        No conflicting potent actives (Retinoids, AHA/BHA, Benzoyl Peroxide, Pure Vitamin C) detected across your selected products.
                      </p>
                    )}
                  </div>
                </div>

                {hasConflict && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {conflictList.map((conf, idx) => {
                      const isHigh = String(conf.severity).toLowerCase().includes('contra') || String(conf.severity).toLowerCase() === 'high';
                      const prodAName = typeof conf.product_a === 'object'
                        ? `${conf.product_a?.brand_name || ''} ${conf.product_a?.product_name || ''}`.trim()
                        : conf.product_a;
                      const prodBName = typeof conf.product_b === 'object'
                        ? `${conf.product_b?.brand_name || ''} ${conf.product_b?.product_name || ''}`.trim()
                        : conf.product_b;
                      const ingA = conf.ingredient_a || '';
                      const ingB = conf.ingredient_b || '';

                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '14px 16px',
                            borderRadius: '12px',
                            background: '#FFFFFF',
                            border: isHigh
                              ? '1px solid rgba(220, 38, 38, 0.28)'
                              : '1px solid rgba(217, 119, 6, 0.28)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                            <span
                              className="badge"
                              style={{
                                background: isHigh ? '#FEE2E2' : '#FEF3C7',
                                color: isHigh ? '#B91C1C' : '#92400E',
                                fontWeight: 700,
                                fontSize: '0.72rem',
                                padding: '3px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              {isHigh ? 'DO NOT LAYER TOGETHER' : 'ALTERNATE SCHEDULE'}
                            </span>
                            <strong style={{ fontSize: '0.94rem', color: '#2C2018' }}>
                              {ingA && ingB ? `${ingA}  ×  ${ingB}` : (conf.title || 'Active Ingredient Interaction')}
                            </strong>
                          </div>

                          <div style={{ fontSize: '0.84rem', color: '#4A3728', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <FlaskConical size={14} color="#8F5B42" />
                            <span>
                              <strong>{prodAName}</strong> (contains <em>{ingA}</em>) &amp; <strong>{prodBName}</strong> (contains <em>{ingB}</em>)
                            </span>
                          </div>

                          {(conf.reason || conf.warning) && (
                            <p style={{ margin: '0 0 8px', fontSize: '0.84rem', color: '#574C44', lineHeight: 1.5 }}>
                              <strong>Why this matters:</strong> {conf.reason || conf.warning}
                            </p>
                          )}

                          {(conf.recommendation || conf.advice) && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: 'rgba(16, 185, 129, 0.08)',
                              color: '#065F46',
                              fontSize: '0.83rem',
                              lineHeight: 1.45,
                            }}>
                              <CalendarClock size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                              <span>
                                <strong>Safe Routine Schedule:</strong> {conf.recommendation || conf.advice}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* FR-CONF-02: Non-blocking acknowledgment checkbox */}
                    <label
                      htmlFor="conflict-acknowledge-checkbox"
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: conflictAcknowledged ? 'rgba(22, 163, 74, 0.08)' : 'rgba(255, 255, 255, 0.85)',
                        border: conflictAcknowledged ? '1px solid rgba(22, 163, 74, 0.35)' : '1px solid rgba(217, 119, 6, 0.35)',
                        cursor: 'pointer',
                        marginTop: '4px',
                      }}
                    >
                      <input
                        id="conflict-acknowledge-checkbox"
                        name="conflict_acknowledged"
                        type="checkbox"
                        checked={conflictAcknowledged}
                        onChange={(e) => setConflictAcknowledged(e.target.checked)}
                        style={{ width: '17px', height: '17px', marginTop: '2px', accentColor: '#2E6F4E', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#2C2018', lineHeight: 1.45 }}>
                        I have read and understand the recommended alternating schedule (AM/PM or alternate nights) for these active ingredients.
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Cart Items List */}
            <div className="glass-card" style={{ padding: '24px' }}>
              {cart.map((item) => (
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
                      width: '68px',
                      height: '68px',
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
                      src={getProductImage(item, 140)}
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
                    <h4 style={{ fontSize: '0.96rem', fontWeight: '600', margin: '4px 0' }}>
                      <Link to={`/products/${item.product_id}`} style={{ color: 'var(--text-primary)' }}>
                        {item.product_name}
                      </Link>
                    </h4>
                    <div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                      {formatPrice(item.price_usd)}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: '24px' }}>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => updateItemQuantity(item.product_id, item.quantity - 1)}
                      aria-label={`Decrease quantity of ${item.product_name}`}
                      style={{ padding: '5px', borderRadius: '50%' }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ minWidth: '22px', textAlign: 'center', fontWeight: '600' }}>{item.quantity}</span>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => updateItemQuantity(item.product_id, item.quantity + 1)}
                      aria-label={`Increase quantity of ${item.product_name}`}
                      style={{ padding: '5px', borderRadius: '50%' }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Subtotal & Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', minWidth: '80px', textAlign: 'right' }}>
                      {formatPrice(item.price_usd * item.quantity)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItemFromCart(item.product_id)}
                      aria-label={`Remove ${item.product_name} from bag`}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="glass-card" style={{ padding: '24px', position: 'sticky', top: '96px' }}>
            <h3 style={{ marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
              {t('cart_summary', 'Order Summary')}
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('cart_subtotal', 'Subtotal')}:</span>
              <span style={{ fontWeight: '600' }}>{formatPrice(total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('cart_shipping', 'Standard Shipping')}:</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: '600' }}>{t('cart_free', 'FREE')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.86rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Payment Method:</span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Cash on Delivery (COD)</span>
            </div>
            <div className="divider" style={{ margin: '16px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '1.15rem', fontWeight: 'bold', gap: '8px' }}>
              <span>{t('cart_total', 'Total')}:</span>
              <span style={{ color: 'var(--primary-light)', textAlign: 'right' }}>{formatDualPrice(total)}</span>
            </div>

            {hasConflict && !conflictAcknowledged && (
              <p style={{
                margin: '0 0 12px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(217, 119, 6, 0.1)',
                color: '#92400E',
                fontSize: '0.8rem',
                lineHeight: 1.4,
              }}>
                Please check the acknowledgment box in the Smart Conflict Detector banner before proceeding to checkout.
              </p>
            )}

            <button
              type="button"
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                opacity: hasConflict && !conflictAcknowledged ? 0.65 : 1,
              }}
              onClick={handleProceedToCheckout}
            >
              <span>{t('cart_checkout_btn', 'Proceed to COD Checkout')}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="empty-state glass-card" style={{ padding: '60px', textAlign: 'center' }}>
          <ShoppingBag size={48} color="var(--primary)" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3>{t('cart_empty_title', 'Your Shopping Bag Is Empty')}</h3>
          <p>{t('cart_empty', 'Explore our catalog to add personalized skincare and beauty formulas.')}</p>
          <div style={{ marginTop: '24px' }}>
            <Link to="/products" className="btn btn-primary">
              {t('cart_shop_now', 'Shop Catalog')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
