import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sun, Moon, Sparkles, ShieldCheck, ShoppingBag, Bookmark,
  RotateCcw, Check, ChevronRight, DollarSign, Clock, ArrowRight,
  ShieldAlert, Trash2, Heart
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { generateRoutine, saveRoutine, getMyRoutines, deleteRoutine } from '../services/api';
import { getProductImage, DEFAULT_PRODUCT_IMAGE } from '../utils/productImages';
import ProductCard from '../components/ProductCard';
import './RoutineView.css';

export default function RoutineView() {
  const navigate = useNavigate();
  const { user, addItemToCart } = useApp();

  const [skinType, setSkinType] = useState(user?.skin_type || 'Combination');
  const [budgetLevel, setBudgetLevel] = useState(user?.budget_level || 'Medium');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [routineResult, setRoutineResult] = useState(null);
  const [savedRoutines, setSavedRoutines] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Sync user defaults when user logs in
  useEffect(() => {
    if (user?.skin_type) setSkinType(user.skin_type);
    if (user?.budget_level) setBudgetLevel(user.budget_level);
  }, [user]);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await generateRoutine({
        skinType,
        budgetLevel
      });
      setRoutineResult(res.data);
      toast.success('Your skincare routine is ready!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate routine');
    } finally {
      setLoading(false);
    }
  }, [skinType, budgetLevel]);

  // Load initial routine on mount
  useEffect(() => {
    handleGenerate();
  }, [handleGenerate]);

  // Load user saved routines
  const loadSaved = useCallback(async () => {
    if (!user) return;
    setLoadingSaved(true);
    try {
      const res = await getMyRoutines();
      setSavedRoutines(res.data || []);
    } catch {
      setSavedRoutines([]);
    } finally {
      setLoadingSaved(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadSaved();
  }, [user, loadSaved]);

  // Chat-to-Cart: Add entire AM + PM routine to cart in 1 click
  const handleAddEntireRoutineToCart = () => {
    if (!routineResult) return;
    const all = [...(routineResult.amRoutine || []), ...(routineResult.pmRoutine || [])];
    const unique = [];
    const seen = new Set();
    all.forEach(p => {
      if (p && !seen.has(p.id)) {
        seen.add(p.id);
        unique.push(p);
      }
    });

    unique.forEach(p => addItemToCart(p, 1));
    toast.success(`Added all ${unique.length} routine products to your cart!`);
  };

  const handleSaveRoutine = async () => {
    if (!user) {
      toast.error('Please log in to save your routine');
      window.dispatchEvent(new CustomEvent('open-auth-modal'));
      return;
    }
    if (!routineResult) return;

    const all = [...(routineResult.amRoutine || []), ...(routineResult.pmRoutine || [])];
    const ids = Array.from(new Set(all.map(p => p.id)));

    setSaving(true);
    try {
      await saveRoutine({
        routineName: `${skinType} Skincare Routine (${budgetLevel} Tier)`,
        routineType: 'Morning',
        productIds: ids,
        notes: `Generated from Digital Skin ID. Total $${routineResult.totalCostUsd}`
      });
      toast.success('Routine saved to your profile!');
      loadSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save routine');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSaved = async (id) => {
    try {
      await deleteRoutine(id);
      toast.success('Routine removed');
      loadSaved();
    } catch {
      toast.error('Failed to delete routine');
    }
  };

  return (
    <div className="routine-view-page">
      <div className="routine-container">
        {/* Hero Section */}
        <div className="routine-hero">
          <div className="routine-hero-badge">
            <Sparkles size={16} />
            <span>AI Routine Builder & Chat-to-Cart</span>
          </div>
          <h1 className="routine-hero-title">
            Personalized Science-Backed Skincare Routine
          </h1>
          <p className="routine-hero-sub">
            Auto-synthesized from your Digital Skin ID. Clinically screened for 0 active ingredient conflicts, with 1-click Chat-to-Cart checkout.
          </p>

          {/* Quick Filters */}
          <div className="routine-filter-card glass-card">
            <div className="routine-filter-group">
              <label>Your Skin Type</label>
              <div className="routine-pill-group">
                {['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'].map(st => (
                  <button
                    key={st}
                    type="button"
                    className={`routine-pill ${skinType.toLowerCase() === st.toLowerCase() ? 'active' : ''}`}
                    onClick={() => setSkinType(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="routine-filter-group">
              <label>Budget Preference</label>
              <div className="routine-pill-group">
                {['Low', 'Medium', 'High'].map(bg => (
                  <button
                    key={bg}
                    type="button"
                    className={`routine-pill ${budgetLevel.toLowerCase() === bg.toLowerCase() ? 'active' : ''}`}
                    onClick={() => setBudgetLevel(bg)}
                  >
                    {bg === 'Low' ? '$ Economy' : bg === 'Medium' ? '$$ Balanced' : '$$$ Luxury'}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn btn-primary routine-generate-btn"
              onClick={handleGenerate}
              disabled={loading}
            >
              <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Synthesizing...' : 'Regenerate Routine'}</span>
            </button>
          </div>
        </div>

        {/* Safety & Conflict Banner */}
        {routineResult && (
          <div className="routine-safety-banner animate-fadeIn">
            <div className="safety-badge-left">
              <ShieldCheck size={26} color="#059669" />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#065F46' }}>
                  {routineResult.internalConflicts?.length === 0
                    ? 'Zero Active Ingredient Conflicts Detected'
                    : 'Active Ingredient Interactions Detected'}
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#047857' }}>
                  {routineResult.internalConflicts?.length === 0
                    ? 'AM & PM steps are scientifically sequenced (Retinoids at night, Vitamin C in morning) for maximum absorption without irritation.'
                    : 'The system has segregated steps into separate routines to safeguard your skin barrier.'}
                </p>
              </div>
            </div>

            {/* Chat-to-Cart Action Bar */}
            <div className="routine-cta-wrap">
              <div className="routine-total-price">
                <span className="price-label">Complete Regimen:</span>
                <span className="price-val">${routineResult.totalCostUsd?.toFixed(2)}</span>
              </div>
              <button
                className="btn btn-primary btn-chat-to-cart"
                onClick={handleAddEntireRoutineToCart}
              >
                <ShoppingBag size={18} />
                <span>Add Entire Routine to Cart</span>
              </button>
              <button
                className="btn btn-secondary btn-save-routine"
                onClick={handleSaveRoutine}
                disabled={saving}
              >
                <Bookmark size={16} />
                <span>{saving ? '...' : 'Save'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Morning & Evening Columns */}
        {routineResult && (
          <div className="routine-columns-grid">
            {/* AM ROUTINE */}
            <div className="routine-column-card glass-card animate-fadeIn">
              <div className="routine-column-header am-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sun size={24} color="#D97706" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#92400E' }}>
                      Morning Routine (AM)
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#B45309' }}>
                      Gentle Cleanse, Antioxidant Defense & Broad-Spectrum UV Protection
                    </span>
                  </div>
                </div>
                <span className="routine-step-count">{routineResult.amRoutine?.length || 0} Steps</span>
              </div>

              <div className="routine-steps-list">
                {routineResult.detailedSteps?.filter(s => s.timing === 'AM').map((step, idx) => (
                  <div key={idx} className="routine-step-item">
                    <div className="step-num-badge">Step {step.stepOrder}</div>
                    <div className="step-content">
                      <div className="step-title-row">
                        <span className="step-name">{step.stepName}</span>
                        <span className="step-timing-badge">AM</span>
                      </div>
                      <p className="step-desc">{step.description}</p>
                      {step.product && (
                        <div className="step-product-mini">
                          <Link to={`/products/${step.product.id || step.product.code}`} className="step-prod-link">
                            <img
                              src={getProductImage(step.product)}
                              alt={step.product.name}
                              className="step-prod-img"
                              onError={(e) => { e.currentTarget.src = DEFAULT_PRODUCT_IMAGE; }}
                            />
                            <div className="step-prod-info">
                              <span className="step-prod-brand">{step.product.brandName}</span>
                              <span className="step-prod-name">{step.product.name}</span>
                              <span className="step-prod-price">${step.product.priceUsd?.toFixed(2)}</span>
                            </div>
                          </Link>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary step-cart-btn"
                            onClick={() => {
                              addItemToCart(step.product, 1);
                              toast.success(`Added ${step.product.name}`);
                            }}
                          >
                            <ShoppingBag size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PM ROUTINE */}
            <div className="routine-column-card glass-card animate-fadeIn">
              <div className="routine-column-header pm-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Moon size={24} color="#6366F1" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#3730A3' }}>
                      Night Routine (PM)
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#4F46E5' }}>
                      Double Cleanse, Targeted Actives & Nighttime Barrier Recovery
                    </span>
                  </div>
                </div>
                <span className="routine-step-count">{routineResult.pmRoutine?.length || 0} Steps</span>
              </div>

              <div className="routine-steps-list">
                {routineResult.detailedSteps?.filter(s => s.timing === 'PM').map((step, idx) => (
                  <div key={idx} className="routine-step-item">
                    <div className="step-num-badge pm-step-num">Step {step.stepOrder}</div>
                    <div className="step-content">
                      <div className="step-title-row">
                        <span className="step-name">{step.stepName}</span>
                        <span className="step-timing-badge pm-badge">PM</span>
                      </div>
                      <p className="step-desc">{step.description}</p>
                      {step.product && (
                        <div className="step-product-mini">
                          <Link to={`/products/${step.product.id || step.product.code}`} className="step-prod-link">
                            <img
                              src={getProductImage(step.product)}
                              alt={step.product.name}
                              className="step-prod-img"
                              onError={(e) => { e.currentTarget.src = DEFAULT_PRODUCT_IMAGE; }}
                            />
                            <div className="step-prod-info">
                              <span className="step-prod-brand">{step.product.brandName}</span>
                              <span className="step-prod-name">{step.product.name}</span>
                              <span className="step-prod-price">${step.product.priceUsd?.toFixed(2)}</span>
                            </div>
                          </Link>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary step-cart-btn"
                            onClick={() => {
                              addItemToCart(step.product, 1);
                              toast.success(`Added ${step.product.name}`);
                            }}
                          >
                            <ShoppingBag size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Saved Routines Drawer/Section */}
        {user && savedRoutines.length > 0 && (
          <div className="routine-saved-section animate-fadeIn">
            <h3 className="saved-section-title">
              <Bookmark size={20} color="var(--accent)" />
              <span>Your Saved Skincare Routines</span>
            </h3>

            <div className="saved-routines-grid">
              {savedRoutines.map(sr => (
                <div key={sr.id} className="saved-routine-card glass-card">
                  <div className="saved-routine-top">
                    <div>
                      <h4 className="saved-routine-name">{sr.routineName}</h4>
                      <span className="saved-routine-date">
                        {new Date(sr.createdAtUtc).toLocaleDateString('en-US')}
                      </span>
                    </div>
                    <button
                      className="btn-delete-saved"
                      onClick={() => handleDeleteSaved(sr.id)}
                      title="Delete saved routine"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="saved-routine-thumbs">
                    {sr.products?.slice(0, 5).map(p => (
                      <img
                        key={p.id}
                        src={getProductImage(p)}
                        alt={p.name}
                        title={p.name}
                        className="saved-thumb-img"
                        onError={(e) => { e.currentTarget.src = DEFAULT_PRODUCT_IMAGE; }}
                      />
                    ))}
                    {(sr.products?.length || 0) > 5 && (
                      <span className="saved-thumb-more">+{sr.products.length - 5}</span>
                    )}
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', marginTop: '12px' }}
                    onClick={() => {
                      sr.products?.forEach(p => addItemToCart(p, 1));
                      toast.success(`Added ${sr.products.length} products to cart!`);
                    }}
                  >
                    <ShoppingBag size={14} />
                    <span>Add to Cart</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
