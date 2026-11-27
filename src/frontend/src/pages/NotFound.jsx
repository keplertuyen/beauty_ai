import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ShoppingBag, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container section animate-fadeIn" style={{ padding: '72px 24px' }}>
      <div
        className="glass-card"
        style={{
          maxWidth: '560px',
          margin: '0 auto',
          padding: '48px 36px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(196, 139, 113, 0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: 'var(--primary-light)',
          }}
        >
          <Compass size={32} />
        </div>
        <p
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--primary-light)',
            margin: '0 0 8px',
          }}
        >
          Error 404
        </p>
        <h1 className="display-font" style={{ fontSize: '2.1rem', margin: '0 0 12px' }}>
          Page Not Found
        </h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 28px' }}>
          The page you are looking for does not exist or may have been moved. Return to the
          BeautyAI storefront to continue exploring skincare formulas.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary">
            <Home size={16} />
            <span>Back to Home</span>
          </Link>
          <Link to="/products" className="btn btn-secondary">
            <ShoppingBag size={16} />
            <span>Explore Products</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
