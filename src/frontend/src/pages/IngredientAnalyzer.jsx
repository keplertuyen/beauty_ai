import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FlaskConical,
  AlertTriangle,
  XCircle,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  RotateCcw,
  Copy,
  Star,
  Layers,
  Sparkles,
  Lock,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { analyzeIngredients, getSkintypeGuide } from '../services/api';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import SkinIdQuickModal from '../components/SkinIdQuickModal';
import './IngredientAnalyzer.css';

// Category-aware sample formulas for each Target Care Area
const SAMPLES = {
  face: 'Water, Glycerin, Niacinamide, Sodium Hyaluronate, Panthenol, Squalane, Ceramide NP, Centella Asiatica Extract, Tocopherol, Phenoxyethanol',
  eye: 'Water, Glycerin, Caffeine, Acetyl Hexapeptide-8, Sodium Hyaluronate, Cucumis Sativus (Cucumber) Fruit Extract, Panthenol, Squalane, Phenoxyethanol',
  lips: 'Hydrogenated Polyisobutene, Diisostearyl Malate, Butyrospermum Parkii (Shea) Butter, Simmondsia Chinensis (Jojoba) Seed Oil, Sodium Hyaluronate, Mentha Piperita (Peppermint) Oil, Tocopherol, CI 77891',
  hair: 'Water, Cetearyl Alcohol, Behentrimonium Chloride, Argania Spinosa Kernel Oil, Hydrolyzed Keratin, Panthenol, Biotin, Amodimethicone, Citric Acid, Phenoxyethanol',
  body: 'Water, Glycerin, Urea, Avena Sativa (Oat) Kernel Flour, Butyrospermum Parkii (Shea) Butter, Ceramide NP, Allantoin, Lactic Acid, Caprylic/Capric Triglyceride, Phenoxyethanol',
  fragrance: 'Alcohol Denat., Parfum (Fragrance), Aqua (Water), Rosa Damascena Flower Water, Vanilla Planifolia Fruit Extract, Limonene, Linalool, Citronellol, Geraniol, Coumarin',
  nails: 'Simmondsia Chinensis (Jojoba) Seed Oil, Prunus Amygdalus Dulcis (Sweet Almond) Oil, Tocopheryl Acetate, Biotin, Panthenol',
};

const TARGET_AREA_OPTIONS = [
  { key: 'face', label: 'Face & Complexion', badge: 'Skincare / Makeup' },
  { key: 'eye', label: 'Eye Area', badge: 'Delicate Contour' },
  { key: 'lips', label: 'Lips', badge: 'Lip Care & Gloss' },
  { key: 'hair', label: 'Hair & Scalp', badge: 'Strands & Roots' },
  { key: 'body', label: 'Bath & Body', badge: 'Body Skin' },
  { key: 'fragrance', label: 'Fragrance (Pulse Points)', badge: 'Scent & Eau de Parfum' },
  { key: 'nails', label: 'Nails & Cuticles', badge: 'Nail Care' },
];

function detectTargetArea(department, category, explicitArea) {
  if (explicitArea && TARGET_AREA_OPTIONS.some((o) => o.key === explicitArea.toLowerCase())) {
    return explicitArea.toLowerCase();
  }
  const dept = (department || '').toLowerCase();
  const cat = (category || '').toLowerCase();

  if (cat.includes('eye') || cat.includes('mascara') || cat.includes('brow')) return 'eye';
  if (cat.includes('lip')) return 'lips';
  if (cat.includes('nail')) return 'nails';
  if (dept === 'hair' || cat.includes('hair') || cat.includes('scalp') || cat.includes('shampoo') || cat.includes('conditioner')) return 'hair';
  if (dept === 'fragrance' || cat.includes('fragrance') || cat.includes('perfume') || cat.includes('cologne')) return 'fragrance';
  if (dept === 'bath & body' || cat.includes('body') || cat.includes('bath') || cat.includes('shower') || cat.includes('hand') || cat.includes('self tanner')) return 'body';
  return 'face';
}

/* ─── Skin Type Guide Component (Authenticated) ─── */
function SkintypeGuide() {
  const { t } = useApp();
  const [guideData, setGuideData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSkintypeGuide()
      .then((res) => setGuideData(res.data))
      .catch(() => setError(t('ia_error_loading_guide') || 'Could not load skin type guide.'))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <span>Loading Skin Type Guide...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="guide-error">
        <AlertTriangle size={32} />
        <p>{error}</p>
      </div>
    );
  }

  const guideEntries = guideData?.guide || guideData || {};

  return (
    <div className="skintype-guide animate-fadeIn">
      {Object.entries(guideEntries).map(([skinType, info]) => {
        const recommendedList = info.recommended || info.recommended_ingredients || [];
        const avoidList = info.avoid || info.ingredients_to_avoid || [];
        return (
          <div key={skinType} className="guide-section card">
            <h3 className="guide-skin-type">{info.vi_name || skinType}</h3>
            {typeof info === 'object' && (
              <div className="guide-details">
                {(info.tip || info.characteristics) && (
                  <p className="guide-text" style={{ fontStyle: 'italic', marginBottom: 12 }}>
                    💡 {info.tip || info.characteristics}
                  </p>
                )}
                {recommendedList.length > 0 && (
                  <div>
                    <p className="guide-sub-label">✅ Recommended Ingredients:</p>
                    <div className="guide-tags">
                      {recommendedList.map((i) => (
                        <span key={i} className="ingredient-tag safe">{i}</span>
                      ))}
                    </div>
                  </div>
                )}
                {avoidList.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <p className="guide-sub-label">⚠️ Ingredients to Watch / Avoid:</p>
                    <div className="guide-tags">
                      {avoidList.map((i) => (
                        <span key={i} className="ingredient-tag danger">{i}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Component ─── */
export default function IngredientAnalyzer() {
  const { t, user, authLoading } = useApp();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const urlIngredients = searchParams.get('ingredients') || location.state?.ingredients || '';
  const urlProductName = searchParams.get('product_name') || location.state?.product_name || '';
  const urlBrandName = searchParams.get('brand_name') || location.state?.brand_name || '';
  const urlDepartment = searchParams.get('department') || location.state?.department || '';
  const urlCategory = searchParams.get('category') || location.state?.category || '';
  const urlTargetArea = searchParams.get('target_area') || location.state?.target_area || '';

  const initialProductName = urlBrandName && urlProductName
    ? `${urlBrandName} — ${urlProductName}`
    : urlProductName || '';

  const [targetArea, setTargetArea] = useState(() =>
    detectTargetArea(urlDepartment, urlCategory, urlTargetArea)
  );
  const [inputText, setInputText] = useState(urlIngredients);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('analysis');
  const [sourceProduct, setSourceProduct] = useState(initialProductName);
  const [showFullInci, setShowFullInci] = useState(false);
  const [skinIdModalOpen, setSkinIdModalOpen] = useState(false);

  const textareaRef = useRef(null);
  const resultsRef = useRef(null);
  const autoAnalyzedRef = useRef(false);

  // Check if logged-in user has completed their Skin ID beyond the blank registration default
  const isUserSkinIdConfigured = useCallback((u) => {
    if (!u) return false;
    const sp = u.skinProfile;
    if (!sp) return Boolean(u.skin_type);
    const hasConcerns = Array.isArray(sp.skinConcerns) && sp.skinConcerns.length > 0;
    const hasAllergies = Array.isArray(sp.allergies) && sp.allergies.length > 0;
    const hasCustomGoal = sp.primaryGoal && sp.primaryGoal !== 'Maintain Healthy Skin';
    return Boolean(hasConcerns || hasAllergies || hasCustomGoal);
  }, []);

  // Automatically prompt Skin ID setup popup if user is logged in but hasn't configured Skin ID yet
  useEffect(() => {
    if (!authLoading && user && !isUserSkinIdConfigured(user)) {
      setSkinIdModalOpen(true);
    }
  }, [authLoading, user, isUserSkinIdConfigured]);

  const runAnalysis = useCallback(
    async (textToAnalyze, areaToUse) => {
      const clean = (textToAnalyze ?? inputText).trim();
      if (!clean) {
        toast.error('Please enter or paste an INCI ingredient list to analyze.');
        return;
      }
      setLoading(true);
      setShowFullInci(false);
      try {
        const res = await analyzeIngredients({
          ingredients_text: clean,
          target_area: areaToUse || targetArea,
          department: urlDepartment || undefined,
          category: urlCategory || undefined,
          product_name: urlProductName || sourceProduct || undefined,
        });
        setResults(res.data);
        if (res.data?.requires_skin_id) {
          setSkinIdModalOpen(true);
        }
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          err.response?.data?.detail ||
          'Could not analyze formula. Please check your connection and try again.';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [inputText, targetArea, urlDepartment, urlCategory, urlProductName, sourceProduct]
  );

  // Sync URL params when navigated from ProductDetail "Deep Formula Analysis"
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (urlIngredients) {
      setInputText(urlIngredients);
      if (urlBrandName && urlProductName) {
        setSourceProduct(`${urlBrandName} — ${urlProductName}`);
      } else if (urlProductName) {
        setSourceProduct(urlProductName);
      }
      const detected = detectTargetArea(urlDepartment, urlCategory, urlTargetArea);
      setTargetArea(detected);

      if (user && !autoAnalyzedRef.current) {
        autoAnalyzedRef.current = true;
        runAnalysis(urlIngredients, detected);
      }
    }
  }, [urlIngredients, urlBrandName, urlProductName, urlDepartment, urlCategory, urlTargetArea, user, runAnalysis]);

  const handleFillSample = (area = targetArea) => {
    const sampleText = SAMPLES[area] || SAMPLES.face;
    setInputText(sampleText);
    setSourceProduct('');
    textareaRef.current?.focus();
    toast.success(`Loaded sample ${area.toUpperCase()} formula!`);
  };

  const handleClear = () => {
    setInputText('');
    setResults(null);
    setSourceProduct('');
    setShowFullInci(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inputText);
    toast.success('Copied INCI list to clipboard!');
  };

  const ingredientCount = inputText
    .trim()
    .split(/[,;\n]+/)
    .filter((s) => s.trim().length > 1).length;

  const userAllergyList = (user?.skinProfile?.allergies || []).map((a) => a.ingredientName || a);

  return (
    <div className="ia-page">
      <div className="ia-bg-glow ia-bg-glow-1" />
      <div className="ia-bg-glow ia-bg-glow-2" />

      <div className="container">
        {/* ── Header ── */}
        <div className="ia-header">
          <div className="ia-header-badge">
            <FlaskConical size={16} />
            Personalized INCI & Skin ID Formula Analyzer
          </div>
          <h1 className="ia-title display-font">
            {t('ia_title', 'Deep Formula & Ingredient Analyzer')}
          </h1>
          <p className="ia-subtitle">
            Cross-check any cosmetic formula against your personal Skin ID, Allergy Blacklist, and target care area — with key ingredients explained in plain English.
          </p>
        </div>

        {/* ── AUTHENTICATION GATE (Unauthenticated Users) ── */}
        {!authLoading && !user ? (
          <div
            className="glass-card animate-fadeIn"
            style={{
              maxWidth: '640px',
              margin: '16px auto 60px',
              padding: '40px 32px',
              textAlign: 'center',
              borderRadius: '20px',
              border: '1px solid rgba(196, 139, 113, 0.3)',
              background: '#FFFFFF',
              boxShadow: '0 16px 40px rgba(74, 55, 40, 0.08)',
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'rgba(196, 139, 113, 0.14)',
                color: '#8F5B42',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
              }}
            >
              <Lock size={28} />
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: '1.5rem', color: '#2C2018' }}>
              Sign In to Use Personalized Formula Analysis
            </h2>
            <p style={{ margin: '0 auto 24px', maxWidth: 480, color: '#6B5E55', fontSize: '0.94rem', lineHeight: 1.55 }}>
              Instead of generic chemical scores, BeautyAI evaluates every formula directly against your personal <strong>Digital Skin ID</strong> (your skin type, concerns, and allergy blacklist). Sign in to unlock both the <strong>Formula Breakdown</strong> and <strong>Skin Type Guide</strong>.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
                style={{ padding: '12px 28px', fontSize: '0.95rem', fontWeight: 700 }}
              >
                Sign In / Create Free Account
              </button>
              <Link to="/products" className="btn btn-secondary" style={{ padding: '12px 22px' }}>
                Browse Catalog
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* ── Active User Skin ID Summary Bar ── */}
            {user && (
              <div
                className="glass-card animate-fadeIn"
                style={{
                  padding: '12px 18px',
                  marginBottom: '20px',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  background: isUserSkinIdConfigured(user)
                    ? 'rgba(46, 111, 78, 0.06)'
                    : 'rgba(217, 119, 6, 0.08)',
                  border: isUserSkinIdConfigured(user)
                    ? '1px solid rgba(46, 111, 78, 0.22)'
                    : '1px solid rgba(217, 119, 6, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <UserCheck size={18} color={isUserSkinIdConfigured(user) ? '#2E6F4E' : '#D97706'} />
                  <span style={{ fontSize: '0.88rem', color: '#2C2018' }}>
                    <strong>Active Skin ID:</strong>{' '}
                    {isUserSkinIdConfigured(user) ? (
                      <>
                        <span className="badge badge-clean" style={{ marginLeft: 4 }}>
                          {user.skinProfile?.skinType || user.skin_type || 'Combination'} Skin
                        </span>
                        <span style={{ marginLeft: 8, color: '#574B42' }}>
                          · Allergy Blacklist:{' '}
                          <strong>
                            {userAllergyList.length > 0 ? userAllergyList.join(', ') : 'None set'}
                          </strong>
                        </span>
                      </>
                    ) : (
                      <span style={{ color: '#92400E', fontWeight: 600 }}>
                        Not yet configured — complete your 30-second Skin ID for accurate verdicts.
                      </span>
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSkinIdModalOpen(true)}
                  style={{ fontSize: '0.8rem' }}
                >
                  <Sparkles size={13} />
                  <span>{isUserSkinIdConfigured(user) ? 'Edit Skin ID & Allergies' : 'Complete Skin ID (30s)'}</span>
                </button>
              </div>
            )}

            {/* ── Tab Bar ── */}
            <div className="ia-tabs tabs">
              <button
                className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
                onClick={() => setActiveTab('analysis')}
              >
                <FlaskConical size={15} />
                Formula Breakdown
              </button>
              <button
                className={`tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
                onClick={() => setActiveTab('guide')}
              >
                <BookOpen size={15} />
                Skin Type & Ingredient Guide
              </button>
            </div>

            {activeTab === 'guide' ? (
              <SkintypeGuide />
            ) : (
              <>
                {/* ── Input Area ── */}
                <div className="ia-input-section glass-card">
                  {sourceProduct && (
                    <div
                      className="ia-source-banner animate-fadeIn"
                      style={{
                        background: 'rgba(196, 139, 113, 0.09)',
                        border: '1px solid rgba(196, 139, 113, 0.25)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '10px',
                        fontSize: '0.9rem',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                        <span>
                          Analyzing product formula:{' '}
                          <strong style={{ color: 'var(--primary)' }}>{sourceProduct}</strong>
                          {urlCategory && (
                            <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                              ({urlDepartment ? `${urlDepartment} · ` : ''}{urlCategory})
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="badge badge-clean" style={{ fontSize: '0.75rem' }}>
                        Auto-filled from Product Page
                      </span>
                    </div>
                  )}

                  {/* 1. Target Care Area Selector (Category-Aware) */}
                  <div style={{ marginBottom: '16px' }}>
                    <div className="ia-field-label" style={{ marginBottom: '8px' }}>
                      <Layers size={16} className="label-icon" />
                      <span>Target Care Area (Tailors benefits & sensitivity rules)</span>
                    </div>
                    <div className="ia-area-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {TARGET_AREA_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          className={`ia-area-pill ${targetArea === opt.key ? 'active' : ''}`}
                          onClick={() => setTargetArea(opt.key)}
                          title={opt.badge}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. INCI Textarea */}
                  <div className="ia-input-header">
                    <div className="ia-field-label">
                      <FlaskConical size={16} className="label-icon" />
                      <span>Packaging INCI Ingredient List</span>
                      {ingredientCount > 0 && (
                        <span className="ia-count-badge">{ingredientCount} ingredients</span>
                      )}
                    </div>
                    <div className="ia-input-actions-top">
                      {inputText && (
                        <>
                          <button className="btn btn-icon btn-sm" onClick={handleCopy} title="Copy INCI">
                            <Copy size={14} />
                          </button>
                          <button className="btn btn-icon btn-sm" onClick={handleClear} title="Clear">
                            <RotateCcw size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <textarea
                    ref={textareaRef}
                    className="ia-textarea form-textarea"
                    placeholder="Paste the product's INCI ingredient list separated by commas (e.g., Water, Glycerin, Niacinamide, Sodium Hyaluronate, Squalane...)"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows={5}
                  />

                  <div className="ia-action-bar" style={{ marginTop: '14px' }}>
                    <button
                      className="btn btn-secondary btn-sm ia-sample-btn"
                      onClick={() => handleFillSample(targetArea)}
                      type="button"
                    >
                      <BookOpen size={14} />
                      Load Sample ({TARGET_AREA_OPTIONS.find((o) => o.key === targetArea)?.label || 'Formula'})
                    </button>
                    <button
                      className="btn btn-primary ia-analyze-btn"
                      onClick={() => runAnalysis(inputText, targetArea)}
                      disabled={loading}
                      type="button"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="spin-icon" />
                          Analyzing Formula...
                        </>
                      ) : (
                        <>
                          <FlaskConical size={16} />
                          Check Personal Compatibility
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* ── Loading Skeleton ── */}
                {loading && (
                  <div className="ia-loading-overlay">
                    <div className="ia-loading-card glass-card">
                      <div className="ia-loading-animation">
                        <div className="ia-loading-orb" />
                        <div className="ia-loading-orb ia-orb-2" />
                        <div className="ia-loading-orb ia-orb-3" />
                      </div>
                      <p className="ia-loading-text">🔬 Cross-Checking Formula Against Your Skin ID...</p>
                      <p className="ia-loading-sub">Mapping hero actives, functional roles, and personal allergy rules</p>
                    </div>
                  </div>
                )}

                {/* ── 3-TIER PROGRESSIVE DISCLOSURE RESULTS ── */}
                {results && !loading && (
                  <div className="ia-results" ref={resultsRef} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* ── TIER 1: PERSONALIZED VERDICT BANNER (No numeric % or /5 score) ── */}
                    <div
                      className="glass-card animate-fadeIn"
                      style={{
                        padding: '24px',
                        borderRadius: '18px',
                        background:
                          results.verdict === 'AllergyConflict'
                            ? 'rgba(239, 68, 68, 0.08)'
                            : results.verdict === 'MatchWithNotes'
                            ? 'rgba(245, 158, 11, 0.08)'
                            : results.verdict === 'GoodMatch'
                            ? 'rgba(16, 185, 129, 0.08)'
                            : '#FFFFFF',
                        border:
                          results.verdict === 'AllergyConflict'
                            ? '1.5px solid rgba(239, 68, 68, 0.38)'
                            : results.verdict === 'MatchWithNotes'
                            ? '1.5px solid rgba(245, 158, 11, 0.38)'
                            : results.verdict === 'GoodMatch'
                            ? '1.5px solid rgba(16, 185, 129, 0.35)'
                            : '1px solid rgba(196, 139, 113, 0.3)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', maxWidth: '720px' }}>
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              background:
                                results.verdict === 'AllergyConflict'
                                  ? '#FEE2E2'
                                  : results.verdict === 'MatchWithNotes'
                                  ? '#FEF3C7'
                                  : results.verdict === 'GoodMatch'
                                  ? '#D1FAE5'
                                  : '#F5EBE6',
                            }}
                          >
                            {results.verdict === 'AllergyConflict' ? (
                              <ShieldAlert size={26} color="#DC2626" />
                            ) : results.verdict === 'MatchWithNotes' ? (
                              <AlertCircle size={26} color="#D97706" />
                            ) : results.verdict === 'GoodMatch' ? (
                              <CheckCircle2 size={26} color="#059669" />
                            ) : (
                              <Sparkles size={26} color="#8F5B42" />
                            )}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <span
                                style={{
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  padding: '3px 9px',
                                  borderRadius: '999px',
                                  background: 'rgba(44, 32, 24, 0.08)',
                                  color: '#4A3728',
                                }}
                              >
                                Personal Verdict · {TARGET_AREA_OPTIONS.find((o) => o.key === results.target_area)?.label || 'Formula'}
                              </span>
                              {results.user_skin_type && (
                                <span
                                  style={{
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    padding: '3px 9px',
                                    borderRadius: '999px',
                                    background: 'rgba(196, 139, 113, 0.16)',
                                    color: '#6B442A',
                                  }}
                                >
                                  Checked for {results.user_skin_type} Skin
                                </span>
                              )}
                            </div>

                            <h2
                              style={{
                                margin: '2px 0 6px',
                                fontSize: '1.4rem',
                                fontWeight: 800,
                                color:
                                  results.verdict === 'AllergyConflict'
                                    ? '#B91C1C'
                                    : results.verdict === 'MatchWithNotes'
                                    ? '#92400E'
                                    : results.verdict === 'GoodMatch'
                                    ? '#065F46'
                                    : '#2C2018',
                              }}
                            >
                              {results.verdict_label}
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.94rem', color: '#3D312A', lineHeight: 1.5 }}>
                              {results.verdict_reason}
                            </p>
                            {results.summary && (
                              <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#6B5E55' }}>
                                {results.summary}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSkinIdModalOpen(true)}
                        >
                          {results.requires_skin_id ? 'Complete Skin ID (30s)' : 'Update Skin ID'}
                        </button>
                      </div>

                      {/* Personal Allergy Match Callout (Concise single-line list as requested) */}
                      {results.allergy_matches?.length > 0 && (
                        <div
                          style={{
                            marginTop: '16px',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            background: '#FFFFFF',
                            border: '1px solid rgba(220, 38, 38, 0.35)',
                            color: '#B91C1C',
                            fontSize: '0.88rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '10px',
                          }}
                        >
                          <div>
                            <strong>⚠️ Contains ingredients that trigger your personal Allergy Blacklist:</strong>{' '}
                            <span style={{ fontWeight: 700, textDecoration: 'underline' }}>
                              {results.allergy_matches.join(', ')}
                            </span>
                          </div>
                          <Link
                            to={`/products?safeForMe=true${urlCategory ? `&category=${encodeURIComponent(urlCategory)}` : ''}`}
                            className="btn btn-sm"
                            style={{ background: '#DC2626', color: '#FFFFFF', borderRadius: '8px', fontSize: '0.78rem' }}
                          >
                            Find Safe Alternatives →
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* ── TIER 2A: KEY INGREDIENTS STRIP (3–6 HERO CARDS) ── */}
                    {results.key_ingredients?.length > 0 && (
                      <div className="ia-section-card glass-card animate-fadeIn">
                        <div style={{ marginBottom: '14px' }}>
                          <h2 className="ia-section-title" style={{ marginBottom: 4 }}>
                            <Star size={18} style={{ color: '#C48B71' }} />
                            Key Notable Ingredients ({results.key_ingredients.length})
                          </h2>
                          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                            The standout active, hydrating, or conditioning ingredients driving this formula&apos;s performance.
                          </p>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                            gap: '14px',
                          }}
                        >
                          {results.key_ingredients.map((item, idx) => (
                            <div
                              key={idx}
                              style={{
                                background: '#FFFFFF',
                                border: item.is_featured_in_product_name
                                  ? '1.5px solid rgba(196, 139, 113, 0.6)'
                                  : '1px solid #EAE3DC',
                                borderRadius: '14px',
                                padding: '16px',
                                boxShadow: '0 2px 10px rgba(74, 55, 40, 0.04)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.03em',
                                    padding: '3px 9px',
                                    borderRadius: '999px',
                                    background: 'rgba(196, 139, 113, 0.14)',
                                    color: '#8F5B42',
                                  }}
                                >
                                  {item.role_label}
                                </span>
                                {item.is_featured_in_product_name && (
                                  <span
                                    style={{
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      padding: '2px 8px',
                                      borderRadius: '999px',
                                      background: 'rgba(16, 185, 129, 0.14)',
                                      color: '#047857',
                                    }}
                                  >
                                    ★ Featured in Title
                                  </span>
                                )}
                              </div>
                              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#2C2018' }}>
                                {item.common_name}
                              </div>
                              {item.common_name.toLowerCase() !== item.inci_name.toLowerCase() && (
                                <div style={{ fontSize: '0.76rem', color: '#8C7A6B', fontStyle: 'italic', marginTop: 2 }}>
                                  INCI: {item.inci_name}
                                </div>
                              )}
                              <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#574B42', lineHeight: 1.48 }}>
                                {item.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── TIER 2B: CATEGORY-TAILORED BENEFITS & FUNCTIONAL STRUCTURE ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                      {/* Benefits */}
                      {results.benefits?.length > 0 && (
                        <div className="ia-section-card glass-card animate-fadeIn" style={{ margin: 0 }}>
                          <h2 className="ia-section-title">
                            <CheckCircle size={18} style={{ color: '#2E6F4E' }} />
                            {results.benefits_title || 'Key Formula Benefits'}
                          </h2>
                          <div className="ia-benefits-grid">
                            {results.benefits.map((benefit, i) => (
                              <div key={i} className="ia-benefit-tag" style={{ '--delay': `${i * 0.05}s` }}>
                                <CheckCircle size={13} />
                                {benefit}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cautions & Fragrance Transparency */}
                      {(results.cautions?.length > 0 || results.fragrance_disclosure) && (
                        <div className="ia-section-card glass-card animate-fadeIn" style={{ margin: 0 }}>
                          <h2 className="ia-section-title">
                            <AlertTriangle size={18} style={{ color: '#D97706' }} />
                            Personalized Notes & Scent Transparency
                          </h2>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {results.cautions?.map((c, i) => (
                              <div
                                key={i}
                                style={{
                                  padding: '10px 14px',
                                  borderRadius: '10px',
                                  background: c.type === 'allergy' ? 'rgba(239, 68, 68, 0.08)' : '#FAF8F5',
                                  border: c.type === 'allergy' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #EAE3DC',
                                  fontSize: '0.85rem',
                                  color: c.type === 'allergy' ? '#B91C1C' : '#4A3728',
                                  lineHeight: 1.45,
                                }}
                              >
                                <strong>{c.title || 'Note'}:</strong> {c.caution}
                              </div>
                            ))}
                            {results.fragrance_disclosure && (
                              <div
                                style={{
                                  padding: '10px 14px',
                                  borderRadius: '10px',
                                  background: '#FAF8F5',
                                  border: '1px solid #EAE3DC',
                                  fontSize: '0.84rem',
                                  color: '#574B42',
                                  lineHeight: 1.45,
                                }}
                              >
                                <strong>Scent & Allergen Disclosure:</strong> {results.fragrance_disclosure}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── TIER 2C: FUNCTIONAL ROLE GROUPING (HOW THE FORMULA IS BUILT) ── */}
                    {results.functional_groups?.length > 0 && (
                      <div className="ia-section-card glass-card animate-fadeIn">
                        <div style={{ marginBottom: '14px' }}>
                          <h2 className="ia-section-title" style={{ marginBottom: 4 }}>
                            <Layers size={18} style={{ color: '#2E6F4E' }} />
                            Formula Architecture by Functional Role
                          </h2>
                          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                            Instead of a confusing wall of chemical names, here is how all {results.total_ingredients_count} ingredients work together.
                          </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                          {results.functional_groups.map((grp, idx) => (
                            <div
                              key={idx}
                              style={{
                                background: '#FAF8F5',
                                border: '1px solid #EAE3DC',
                                borderRadius: '12px',
                                padding: '14px 16px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <strong style={{ fontSize: '0.92rem', color: '#2C2018' }}>{grp.group_title}</strong>
                                <span
                                  style={{
                                    background: '#EAE3DC',
                                    color: '#4A3728',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                  }}
                                >
                                  {grp.count}
                                </span>
                              </div>
                              <p style={{ margin: '0 0 8px', fontSize: '0.81rem', color: '#6B5E55', lineHeight: 1.4 }}>
                                {grp.plain_explanation}
                              </p>
                              <div style={{ fontSize: '0.76rem', color: '#8C7A6B', lineHeight: 1.45 }}>
                                <strong>Ingredients:</strong> {grp.ingredients.join(', ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── SKINCARE ACTIVE COMBINATION WARNINGS (Only when applicable) ── */}
                    {results.combination_warnings?.length > 0 && (
                      <div className="ia-section-card glass-card animate-fadeIn">
                        <h2 className="ia-section-title">
                          <XCircle size={18} style={{ color: '#E86B6B' }} />
                          Active Layering & Combination Notes
                        </h2>
                        <div className="ia-warnings-list">
                          {results.combination_warnings.map((warn, i) => (
                            <div key={i} className="ia-warning-card">
                              <div className="warning-header">
                                <XCircle size={15} className="warning-icon" />
                                <span className="warning-title">{warn.warning}</span>
                              </div>
                              {warn.recommendation && (
                                <p style={{ margin: '6px 0 0 22px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                                  💡 <strong>Tip:</strong> {warn.recommendation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── TIER 3: COLLAPSIBLE FULL PACKAGING INCI LIST + ACTION CTA ── */}
                    {results.raw_inci_list?.length > 0 && (
                      <div className="ia-section-card glass-card animate-fadeIn" style={{ padding: 0, overflow: 'hidden' }}>
                        <button
                          type="button"
                          onClick={() => setShowFullInci((v) => !v)}
                          style={{
                            width: '100%',
                            padding: '16px 22px',
                            background: 'transparent',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.94rem',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <span>
                            View Full Packaging INCI List ({results.total_ingredients_count} ingredients in concentration order)
                          </span>
                          {showFullInci ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>

                        {showFullInci && (
                          <div style={{ padding: '0 22px 20px', borderTop: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginTop: '14px' }}>
                              {results.raw_inci_list.map((token, i) => {
                                const isAllergen = results.allergy_matches?.some(
                                  (a) => a.toLowerCase() === token.toLowerCase()
                                );
                                const isKey = results.key_ingredients?.some(
                                  (k) => k.inci_name.toLowerCase() === token.toLowerCase()
                                );
                                return (
                                  <span
                                    key={i}
                                    style={{
                                      padding: '4px 10px',
                                      borderRadius: '999px',
                                      fontSize: '0.78rem',
                                      background: isAllergen
                                        ? 'rgba(239, 68, 68, 0.14)'
                                        : isKey
                                        ? 'rgba(196, 139, 113, 0.15)'
                                        : '#FAF8F5',
                                      color: isAllergen ? '#B91C1C' : isKey ? '#6B442A' : '#574B42',
                                      border: isAllergen
                                        ? '1px solid rgba(239, 68, 68, 0.4)'
                                        : isKey
                                        ? '1px solid rgba(196, 139, 113, 0.45)'
                                        : '1px solid #EAE3DC',
                                      fontWeight: isAllergen || isKey ? 600 : 400,
                                    }}
                                  >
                                    {i + 1}. {token}
                                    {isAllergen ? ' ⚠️' : isKey ? ' ★' : ''}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actionable Footer CTA */}
                    <div
                      className="glass-card animate-fadeIn"
                      style={{
                        padding: '18px 22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                        borderRadius: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ShieldCheck size={20} color="#2E6F4E" />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          Want to browse products automatically filtered against your personal Allergy Blacklist?
                        </span>
                      </div>
                      <Link
                        to={`/products?safeForMe=true${urlCategory ? `&category=${encodeURIComponent(urlCategory)}` : ''}`}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <span>Explore &ldquo;Safe for Me&rdquo; Catalog</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ── MODAL: 30-SECOND DIGITAL SKIN ID SETUP ── */}
      <SkinIdQuickModal
        isOpen={skinIdModalOpen}
        onClose={() => setSkinIdModalOpen(false)}
        onSaved={() => {
          if (inputText.trim()) {
            runAnalysis(inputText, targetArea);
          }
        }}
      />
    </div>
  );
}
