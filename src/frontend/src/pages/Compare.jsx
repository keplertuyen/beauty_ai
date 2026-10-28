import React, { useState, useEffect } from 'react';
import { getProducts } from '../services/api';
import { Search, Scale, X, HelpCircle, Star } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useApp } from '../context/AppContext';
import { getProductImage } from '../utils/productImages';
import { translateHighlight } from '../utils/highlightTranslator';
import './Products.css'; // use existing styles

export default function Compare() {
  const { t, lang, formatPrice } = useApp();
  const [query1, setQuery1] = useState('');
  const [query2, setQuery2] = useState('');
  const [results1, setResults1] = useState([]);
  const [results2, setResults2] = useState([]);
  const [prod1, setProd1] = useState(null);
  const [prod2, setProd2] = useState(null);
  const [showDropdown1, setShowDropdown1] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);

  useEffect(() => {
    if (query1.trim().length > 1) {
      getProducts({ query: query1, per_page: 5 }).then(res => {
        setResults1(res.data.products || []);
      });
    } else {
      setResults1([]);
    }
  }, [query1]);

  useEffect(() => {
    if (query2.trim().length > 1) {
      getProducts({ query: query2, per_page: 5 }).then(res => {
        setResults2(res.data.products || []);
      });
    } else {
      setResults2([]);
    }
  }, [query2]);

  const selectProduct = (p, slot) => {
    if (slot === 1) {
      setProd1(p);
      setQuery1('');
      setShowDropdown1(false);
    } else {
      setProd2(p);
      setQuery2('');
      setShowDropdown2(false);
    }
  };

  return (
    <div className="container section animate-fadeIn">
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="section-title display-font" style={{ fontSize: '2.5rem' }}>{t('comp_title')}</h1>
        <p className="section-subtitle">{t('comp_subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
        {/* Slot 1 Search */}
        <div style={{ position: 'relative' }}>
          <label className="form-label">{t('comp_prod_1')}</label>
          <div className="search-bar">
            <Search size={16} color="var(--text-muted)" />
            <input
               type="text"
               placeholder={t('comp_prod_1_placeholder')}
               value={query1}
               onChange={(e) => { setQuery1(e.target.value); setShowDropdown1(true); }}
               onFocus={() => setShowDropdown1(true)}
            />
            {prod1 && (
              <button className="btn-icon" onClick={() => setProd1(null)} style={{ border: 'none', background: 'none' }}>
                <X size={16} />
              </button>
            )}
          </div>
          {showDropdown1 && results1.length > 0 && (
            <div className="glass-card" style={{ position: 'absolute', top: '75px', left: 0, right: 0, zIndex: 10, padding: '10px', background: 'var(--bg-elevated)' }}>
              {results1.map(p => (
                <div
                  key={p.product_id}
                  onClick={() => selectProduct(p, 1)}
                  style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span style={{ fontWeight: '500', fontSize: '0.85rem' }}>{p.product_name}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary-light)' }}>{p.brand_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Slot 2 Search */}
        <div style={{ position: 'relative' }}>
          <label className="form-label">{t('comp_prod_2')}</label>
          <div className="search-bar">
            <Search size={16} color="var(--text-muted)" />
            <input
               type="text"
               placeholder={t('comp_prod_2_placeholder')}
               value={query2}
               onChange={(e) => { setQuery2(e.target.value); setShowDropdown2(true); }}
               onFocus={() => setShowDropdown2(true)}
            />
            {prod2 && (
              <button className="btn-icon" onClick={() => setProd2(null)} style={{ border: 'none', background: 'none' }}>
                <X size={16} />
              </button>
            )}
          </div>
          {showDropdown2 && results2.length > 0 && (
            <div className="glass-card" style={{ position: 'absolute', top: '75px', left: 0, right: 0, zIndex: 10, padding: '10px', background: 'var(--bg-elevated)' }}>
              {results2.map(p => (
                <div
                  key={p.product_id}
                  onClick={() => selectProduct(p, 2)}
                  style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span style={{ fontWeight: '500', fontSize: '0.85rem' }}>{p.product_name}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary-light)' }}>{p.brand_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comparison Grid */}
      {(prod1 || prod2) ? (
        <div className="glass-card" style={{ padding: '24px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                <th style={{ width: '20%', textAlign: 'left', padding: '12px' }}>{t('comp_feature')}</th>
                <th style={{ width: '40%', textAlign: 'center', padding: '16px' }}>
                  {prod1 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#FFFFFF', border: '1px solid var(--glass-border)', padding: '6px' }}>
                        <img
                          src={getProductImage(prod1, 160)}
                          alt={prod1.product_name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div style={{ fontWeight: 'bold', color: 'var(--primary-light)', fontSize: '1.05rem' }}>{prod1.brand_name}</div>
                      <div style={{ fontSize: '0.9rem' }}>{prod1.product_name}</div>
                    </div>
                  ) : t('comp_not_selected')}
                </th>
                <th style={{ width: '40%', textAlign: 'center', padding: '16px' }}>
                  {prod2 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#FFFFFF', border: '1px solid var(--glass-border)', padding: '6px' }}>
                        <img
                          src={getProductImage(prod2, 160)}
                          alt={prod2.product_name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div style={{ fontWeight: 'bold', color: 'var(--primary-light)', fontSize: '1.05rem' }}>{prod2.brand_name}</div>
                      <div style={{ fontSize: '0.9rem' }}>{prod2.product_name}</div>
                    </div>
                  ) : t('comp_not_selected')}
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Category */}
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ fontWeight: '600', padding: '16px 12px' }}>{t('comp_category')}</td>
                <td style={{ textAlign: 'center', padding: '16px 12px' }}>{prod1 ? t(`cat_${prod1.primary_category}`, prod1.primary_category) : '-'}</td>
                <td style={{ textAlign: 'center', padding: '16px 12px' }}>{prod2 ? t(`cat_${prod2.primary_category}`, prod2.primary_category) : '-'}</td>
              </tr>
              {/* Price */}
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ fontWeight: '600', padding: '16px 12px' }}>{t('comp_price')}</td>
                <td style={{ textAlign: 'center', padding: '16px 12px', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                  {prod1 ? formatPrice(prod1.price_usd) : '-'}
                </td>
                <td style={{ textAlign: 'center', padding: '16px 12px', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                  {prod2 ? formatPrice(prod2.price_usd) : '-'}
                </td>
              </tr>
              {/* Rating */}
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ fontWeight: '600', padding: '16px 12px' }}>{t('comp_rating')}</td>
                <td style={{ padding: '16px 12px' }}>
                  {prod1 ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                      <Star size={16} fill="var(--accent)" stroke="var(--accent)" />
                      <span>{prod1.rating} ({prod1.reviews} {t('pd_rating')})</span>
                    </div>
                  ) : '-'}
                </td>
                <td style={{ padding: '16px 12px' }}>
                  {prod2 ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                      <Star size={16} fill="var(--accent)" stroke="var(--accent)" />
                      <span>{prod2.rating} ({prod2.reviews} {t('pd_rating')})</span>
                    </div>
                  ) : '-'}
                </td>
              </tr>
              {/* Loves Count */}
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ fontWeight: '600', padding: '16px 12px' }}>{t('comp_loves')}</td>
                <td style={{ textAlign: 'center', padding: '16px 12px' }}>{prod1 ? `${Number(prod1.loves_count).toLocaleString()} ❤️` : '-'}</td>
                <td style={{ textAlign: 'center', padding: '16px 12px' }}>{prod2 ? `${Number(prod2.loves_count).toLocaleString()} ❤️` : '-'}</td>
              </tr>
              {/* Highlights */}
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ fontWeight: '600', padding: '16px 12px' }}>{t('comp_highlights')}</td>
                <td style={{ textAlign: 'center', padding: '16px 12px' }}>
                  {(prod1?.highlights || prod1?.highlights_clean) ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                      {(prod1.highlights || prod1.highlights_clean).split(',').map((h, i) => (
                        <span key={i} className="badge badge-primary">{translateHighlight(h.trim(), lang)}</span>
                      ))}
                    </div>
                  ) : '-'}
                </td>
                <td style={{ textAlign: 'center', padding: '16px 12px' }}>
                  {(prod2?.highlights || prod2?.highlights_clean) ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                      {(prod2.highlights || prod2.highlights_clean).split(',').map((h, i) => (
                        <span key={i} className="badge badge-primary">{translateHighlight(h.trim(), lang)}</span>
                      ))}
                    </div>
                  ) : '-'}
                </td>
              </tr>
              {/* Ingredients */}
              <tr>
                <td style={{ fontWeight: '600', padding: '16px 12px' }}>{t('comp_ingredients')}</td>
                <td style={{ padding: '16px 12px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {prod1?.ingredients || prod1?.ingredients_clean || '-'}
                </td>
                <td style={{ padding: '16px 12px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {prod2?.ingredients || prod2?.ingredients_clean || '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state glass-card" style={{ padding: '60px' }}>
          <Scale size={48} color="var(--primary)" style={{ marginBottom: '16px', opacity: 0.7 }} />
          <h3>{t('comp_empty').split('.')[0]}</h3>
          <p>{t('comp_empty').split('.')[1] || ''}</p>
        </div>
      )}
    </div>
  );
}
