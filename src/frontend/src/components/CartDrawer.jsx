import React, { useEffect, useRef } from 'react';
import { X, ShoppingBag, Trash2, Plus, Minus, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getProductImage } from '../utils/productImages';
import './CartDrawer.css';

export default function CartDrawer() {
  const {
    cart,
    cartConflicts,
    conflictAcknowledged,
    cartOpen,
    setCartOpen,
    removeItemFromCart,
    updateItemQuantity,
    cartCount,
    formatPrice,
    t
  } = useApp();
  const drawerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setCartOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [setCartOpen]);

  useEffect(() => {
    document.body.style.overflow = cartOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [cartOpen]);

  const total = cart.reduce((sum, item) => sum + ((parseFloat(item.price_usd) || 0) * item.quantity), 0);
  const hasConflict = Boolean(cartConflicts?.has_conflict ?? cartConflicts?.has_conflicts);

  return (
    <>
      {cartOpen && (
        <div className="cart-overlay" onClick={() => setCartOpen(false)} />
      )}
      <div ref={drawerRef} className={`cart-drawer ${cartOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="cart-header">
          <div className="cart-title">
            <ShoppingBag size={20} />
            <span>{t('nav_cart', 'Shopping Bag')}</span>
            {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setCartOpen(false)}
            aria-label="Close shopping bag drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <ShoppingBag size={48} opacity={0.3} />
              <p>{t('cart_empty', 'Your shopping bag is empty')}</p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => { setCartOpen(false); navigate('/products'); }}
              >
                {t('cart_shop_now', 'Shop Now')}
              </button>
            </div>
          ) : (
            <div className="cart-items">
              {hasConflict && (
                <div
                  style={{
                    padding: '10px 12px',
                    marginBottom: '12px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(217, 119, 6, 0.35)',
                    color: '#92400E',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Active Ingredient Interaction Detected</strong>
                    <div style={{ marginTop: '2px' }}>
                      Review alternating routine advice in your Shopping Bag before checkout.
                    </div>
                  </div>
                </div>
              )}

              {cart.map((item) => (
                <div key={item.product_id} className="cart-item">
                  <div className="cart-item-image">
                    <img
                      src={getProductImage(item, 120)}
                      alt={item.product_name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement.querySelector('.cart-item-fallback-emoji');
                        if (fallback) fallback.style.display = 'inline';
                      }}
                    />
                    <span className="cart-item-fallback-emoji" style={{ display: 'none' }}>💄</span>
                  </div>
                  <div className="cart-item-info">
                    <div className="cart-item-brand">{item.brand_name}</div>
                    <div className="cart-item-name">{item.product_name}</div>
                    <div className="cart-item-price">{formatPrice(item.price_usd)}</div>
                  </div>
                  <div className="cart-item-controls">
                    <div className="quantity-control">
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item.product_id, item.quantity - 1)}
                        aria-label={`Decrease quantity of ${item.product_name}`}
                      >
                        <Minus size={12} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item.product_id, item.quantity + 1)}
                        aria-label={`Increase quantity of ${item.product_name}`}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="cart-remove-btn"
                      onClick={() => removeItemFromCart(item.product_id)}
                      aria-label={`Remove ${item.product_name} from bag`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>{t('cart_total', 'Total')}</span>
              <span className="price-tag">{formatPrice(total)}</span>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => {
                setCartOpen(false);
                if (hasConflict && !conflictAcknowledged) {
                  navigate('/cart');
                } else {
                  navigate('/checkout');
                }
              }}
            >
              {hasConflict && !conflictAcknowledged
                ? 'Review Conflict & Checkout'
                : t('cart_checkout_btn', 'Proceed to Checkout')}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: 8 }}
              onClick={() => { setCartOpen(false); navigate('/cart'); }}
            >
              {t('cart_view_btn', 'View Full Bag')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
