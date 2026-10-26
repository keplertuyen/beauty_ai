import React, { useEffect, useRef } from 'react';
import { X, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getProductImage } from '../utils/productImages';
import './CartDrawer.css';

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, removeItemFromCart, updateItemQuantity, cartCount, formatPrice, t } = useApp();
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

  const total = cart.reduce((sum, item) => sum + (item.subtotal || 0), 0);

  return (
    <>
      {cartOpen && (
        <div className="cart-overlay" onClick={() => setCartOpen(false)} />
      )}
      <div className={`cart-drawer ${cartOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="cart-header">
          <div className="cart-title">
            <ShoppingBag size={20} />
            <span>{t('nav_cart')}</span>
            {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
          </div>
          <button className="btn-icon" onClick={() => setCartOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <ShoppingBag size={48} opacity={0.3} />
              <p>{t('cart_empty')}</p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { setCartOpen(false); navigate('/products'); }}
              >
                {t('cart_shop_now')}
              </button>
            </div>
          ) : (
            <div className="cart-items">
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
                      <button onClick={() => updateItemQuantity(item.product_id, item.quantity - 1)}>
                        <Minus size={12} />
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateItemQuantity(item.product_id, item.quantity + 1)}>
                        <Plus size={12} />
                      </button>
                    </div>
                    <button
                      className="cart-remove-btn"
                      onClick={() => removeItemFromCart(item.product_id)}
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
              <span>{t('cart_total')}</span>
              <span className="price-tag">{formatPrice(total)}</span>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => { setCartOpen(false); navigate('/checkout'); }}
            >
              {t('cart_checkout_btn')}
            </button>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: 8 }}
              onClick={() => { setCartOpen(false); navigate('/cart'); }}
            >
              {t('cart_view_btn')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
