import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FlaskConical,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  RotateCcw,
  Copy,
  Sparkles,
  ArrowRight,
  UserCheck,
  Edit3,
} from 'lucide-react';
import { analyzeIngredients, getSkintypeGuide } from '../services/api';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import SkinIdQuickModal from '../components/SkinIdQuickModal';
import './IngredientAnalyzer.css';

const SAMPLE_FORMULA =
  'Water, Glycerin, Niacinamide, Sodium Hyaluronate, Panthenol, Squalane, Ceramide NP, Centella Asiatica Extract, Tocopherol, Phenoxyethanol';

function detectTargetAreaFromFormula(rawText, department, category, explicitArea) {
  if (explicitArea) {
    const exp = explicitArea.toLowerCase();
    if (['face', 'eye', 'lips', 'hair', 'body', 'fragrance', 'nails'].includes(exp)) {
      return exp;
    }
  }
  const dept = (department || '').toLowerCase();
  const cat = (category || '').toLowerCase();
  const lower = (rawText || '').toLowerCase();

  if (cat.includes('eye') || cat.includes('mascara') || cat.includes('brow')) return 'eye';
  if (cat.includes('lip')) return 'lips';
  if (cat.includes('nail')) return 'nails';
  if (
    dept === 'hair' ||
    cat.includes('hair') ||
    cat.includes('scalp') ||
    cat.includes('shampoo') ||
    cat.includes('conditioner') ||
    lower.includes('behentrimonium') ||
    lower.includes('cetrimonium') ||
    lower.includes('amodimethicone') ||
    lower.includes('hydrolyzed keratin')
  ) {
    return 'hair';
  }
  if (
    dept === 'fragrance' ||
    cat.includes('fragrance') ||
    cat.includes('perfume') ||
    cat.includes('cologne') ||
    (lower.startsWith('alcohol denat') && (lower.includes('parfum') || lower.includes('fragrance')))
  ) {
    return 'fragrance';
  }
  if (
    dept === 'bath & body' ||
    cat.includes('body') ||
    cat.includes('bath') ||
    cat.includes('shower') ||
    cat.includes('hand')
  ) {
    return 'body';
  }
  return 'face';
}

function inferAreaSuitability(rawTokens, detectedArea, potentActives, hasFragranceOrAlcohol) {
  const joined = rawTokens.join(' ');

  if (detectedArea === 'hair') {
    return {
      recommendedFor: 'Hair strands & scalp care',
      notSuitableFor: 'Not suitable for facial skin or eye area (contains hair-conditioning surfactants/polymers that can clog facial pores).',
    };
  }

  if (detectedArea === 'fragrance') {
    return {
      recommendedFor: 'Pulse points (wrists, neck, behind ears)',
      notSuitableFor: 'Not suitable for facial skin, eye contour, lips, or freshly shaved/irritated skin due to concentrated fragrance and alcohol.',
    };
  }

  if (detectedArea === 'lips') {
    return {
      recommendedFor: 'Lips & lip contour',
      notSuitableFor: 'Formulated with rich occlusive waxes/oils specifically for lips; may feel overly heavy on blemish-prone facial zones.',
    };
  }

  if (detectedArea === 'nails') {
    return {
      recommendedFor: 'Nails, cuticles & hands',
      notSuitableFor: 'Avoid eye area and mucous membranes.',
    };
  }

  if (detectedArea === 'body') {
    const hasBodyAcids = potentActives.length > 0 || joined.includes('urea');
    return {
      recommendedFor: 'Body skin (arms, legs, torso & hands)',
      notSuitableFor: hasBodyAcids
        ? 'Not recommended for delicate facial skin, eye contour, or broken skin.'
        : 'Formulated for body skin; check texture weight before applying on acne-prone facial areas.',
    };
  }

  if (detectedArea === 'eye') {
    return {
      recommendedFor: 'Orbital eye contour & face',
      notSuitableFor: potentActives.length > 0
        ? 'Contains active resurfacing ingredients — keep away from the lash line and upper eyelids.'
        : 'Safe for the delicate eye area and facial skin; avoid direct contact with eyes.',
    };
  }

  // Default: Face formula
  if (potentActives.length > 0) {
    return {
      recommendedFor: 'Face & neck (evening treatment or targeted care)',
      notSuitableFor: `Not suitable for the delicate eye area, lips, or compromised/broken skin (contains ${potentActives.slice(0, 3).join(', ')}).`,
    };
  }

  if (hasFragranceOrAlcohol) {
    return {
      recommendedFor: 'Face & neck',
      notSuitableFor: 'Avoid applying too close to the eye contour, lips, or actively irritated skin due to fragrance or alcohol content.',
    };
  }

  return {
    recommendedFor: 'Face, neck, outer eye contour & hands',
    notSuitableFor: 'Gentle barrier-friendly formula — suitable across facial and body skin zones.',
  };
}

function toFriendlyName(rawName) {
  if (!rawName) return '';
  const match = rawName.match(/^.*?\(([^)]+)\)\s*(.*)$/);
  if (match && !rawName.toLowerCase().startsWith('aqua')) {
    const eng = match[1].trim();
    const rest = match[2].trim();
    const combined = rest ? `${eng} ${rest}` : eng;
    return combined.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  if (rawName === rawName.toLowerCase()) {
    return rawName.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return rawName;
}

function cleanExplanation(explanation, commonName) {
  if (!explanation || explanation.toLowerCase().includes('formulation stabilizing')) {
    const lower = (commonName || '').toLowerCase();
    if (lower.includes('bilberry') || lower.includes('vaccinium')) {
      return 'Rich in berry antioxidants that help brighten dull skin and defend against environmental stress.';
    }
    if (lower.includes('orange') || lower.includes('lemon') || lower.includes('citrus')) {
      return 'Natural citrus fruit extract used for tone brightening and mild fruit-acid renewal.';
    }
    if (lower.includes('sugar cane') || lower.includes('maple')) {
      return 'Natural botanical source of gentle fruit acids that smooths rough skin texture.';
    }
    if (lower.includes('extract') || lower.includes('ferment') || lower.includes('filtrate')) {
      return 'Plant-derived botanical extract rich in soothing antioxidants and skin-conditioning nutrients.';
    }
    return 'Supports smooth texture, moisture balance, and formula stability on your skin.';
  }
  return explanation;
}

// Ensures frontend & backend verdict logic stay 100% consistent for Sensitive skin & potent actives
function normalizeAnalysisResults(rawResults, userSkinType, urlTargetSkins, detectedArea) {
  if (!rawResults) return null;
  const data = { ...rawResults };
  const skinType = data.user_skin_type || userSkinType || '';
  const isSensitive = skinType.toLowerCase().includes('sensitive');
  const rawTokens = (data.raw_inci_list || []).map((t) => t.toLowerCase());
  const area = detectedArea || data.target_area || 'face';

  // Clean up key ingredient names & explanations
  data.key_ingredients = (data.key_ingredients || []).map((item) => ({
    ...item,
    common_name: toFriendlyName(item.common_name),
    explanation: cleanExplanation(item.explanation, item.common_name || item.inci_name),
  }));

  // Detect potent exfoliating acids / retinoids / citrus extracts
  const potentWatched = [];
  let hasFragranceOrAlcohol = Boolean(data.fragrance_disclosure);
  rawTokens.forEach((tok) => {
    if (tok.includes('glycolic acid')) potentWatched.push('Glycolic Acid (AHA)');
    else if (tok.includes('lactic acid')) potentWatched.push('Lactic Acid (AHA)');
    else if (tok.includes('salicylic acid')) potentWatched.push('Salicylic Acid (BHA)');
    else if (tok.includes('retinol') || tok.includes('retinal')) potentWatched.push('Retinoid (Vitamin A)');
    else if (tok.includes('benzoyl peroxide')) potentWatched.push('Benzoyl Peroxide');
    else if (tok.includes('citrus limon') || tok.includes('lemon')) potentWatched.push('Lemon Fruit Extract');
    else if (tok.includes('citrus aurantium') || tok.includes('orange')) potentWatched.push('Orange Fruit Extract');

    if (tok.includes('parfum') || tok.includes('fragrance') || tok.includes('alcohol denat')) {
      hasFragranceOrAlcohol = true;
    }
  });
  const uniquePotent = [...new Set(potentWatched)];
  data._watchIngredients = uniquePotent;
  data._areaGuidance = inferAreaSuitability(rawTokens, area, uniquePotent, hasFragranceOrAlcohol);

  const cautions = [...(data.cautions || [])];

  // If user has Sensitive skin and formula has potent acids/extracts, enforce MatchWithNotes
  if (isSensitive && uniquePotent.length > 0 && data.verdict === 'GoodMatch') {
    data.verdict = 'MatchWithNotes';
    data.verdict_label = 'Match with Notes (Use with Caution)';
    data.verdict_reason = `Zero personal allergy conflicts, but contains active exfoliating or brightening ingredients (${uniquePotent.slice(0, 3).join(', ')}) that may tingle on Sensitive Skin — patch-test first and introduce gradually.`;

    const hasSensitiveCaution = cautions.some((c) => c.type === 'sensitive-note');
    if (!hasSensitiveCaution) {
      cautions.unshift({
        type: 'sensitive-note',
        title: 'Potent Actives on Sensitive Skin',
        caution: `Contains ${uniquePotent.join(', ')}. Start 1–2 times per week, avoid applying on compromised skin, and wear SPF 30+ every morning.`,
        ingredients_involved: uniquePotent,
      });
    }
  }

  // Also check if product's target skin types from Product Detail page exclude the user's skin type
  if (
    data.verdict === 'GoodMatch' &&
    skinType &&
    Array.isArray(urlTargetSkins) &&
    urlTargetSkins.length > 0
  ) {
    const matchesTarget = urlTargetSkins.some(
      (s) => s.toLowerCase() === skinType.toLowerCase() || s.toLowerCase() === 'all'
    );
    if (!matchesTarget) {
      data.verdict = 'MatchWithNotes';
      data.verdict_label = 'Match with Notes';
      data.verdict_reason = `Safe for your allergy list, though primarily formulated for ${urlTargetSkins.join(' / ')} skin — adjust frequency for your ${skinType} skin.`;
    }
  }

  data.cautions = cautions;
  return data;
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
        <AlertTriangle size={28} />
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
                  <p className="guide-text">{info.tip || info.characteristics}</p>
                )}
                {recommendedList.length > 0 && (
                  <div>
                    <p className="guide-sub-label">
                      <span className="ia-dot dot-safe" />
                      Recommended Ingredients
                    </p>
                    <div className="guide-tags">
                      {recommendedList.map((i) => (
                        <span key={i} className="ingredient-tag safe">{i}</span>
                      ))}
                    </div>
                  </div>
                )}
                {avoidList.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <p className="guide-sub-label">
                      <span className="ia-dot dot-warn" />
                      Ingredients to Watch or Avoid
                    </p>
                    <div className="guide-tags">
                      {avoidList.map((i) => (
                        <span key={i} className="ingredient-tag warn">{i}</span>
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
  const urlTargetSkinTypesRaw = searchParams.get('target_skin_types') || '';
  const urlTargetSkinTypes = urlTargetSkinTypesRaw
    ? urlTargetSkinTypesRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const initialProductName = urlBrandName && urlProductName
    ? `${urlBrandName} — ${urlProductName}`
    : urlProductName || '';

  const [inputText, setInputText] = useState(urlIngredients);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('analysis');
  const [sourceProduct, setSourceProduct] = useState(initialProductName);
  const [showFullInci, setShowFullInci] = useState(false);
  const [isInputExpanded, setIsInputExpanded] = useState(true);
  const [skinIdModalOpen, setSkinIdModalOpen] = useState(false);

  const textareaRef = useRef(null);
  const resultsRef = useRef(null);

  const isUserSkinIdConfigured = useCallback((u) => {
    if (!u) return false;
    const sp = u.skinProfile;
    if (!sp) return Boolean(u.skin_type);
    const hasConcerns = Array.isArray(sp.skinConcerns) && sp.skinConcerns.length > 0;
    const hasAllergies = Array.isArray(sp.allergies) && sp.allergies.length > 0;
    const hasCustomGoal = sp.primaryGoal && sp.primaryGoal !== 'Maintain Healthy Skin';
    return Boolean(hasConcerns || hasAllergies || hasCustomGoal);
  }, []);

  useEffect(() => {
    if (!authLoading && user && !isUserSkinIdConfigured(user)) {
      setSkinIdModalOpen(true);
    }
  }, [authLoading, user, isUserSkinIdConfigured]);

  const userSkinTypeLabel = user?.skinProfile?.skinType || user?.skin_type || 'Sensitive';

  const runAnalysis = useCallback(
    async (textToAnalyze) => {
      const clean = (textToAnalyze ?? inputText).trim();
      if (!clean) {
        toast.error('Please enter or paste an INCI ingredient list to analyze.');
        return;
      }
      const detectedArea = detectTargetAreaFromFormula(
        clean,
        urlDepartment,
        urlCategory,
        urlTargetArea
      );
      setLoading(true);
      setShowFullInci(false);
      try {
        const res = await analyzeIngredients({
          ingredients_text: clean,
          target_area: detectedArea,
          department: urlDepartment || undefined,
          category: urlCategory || undefined,
          product_name: urlProductName || sourceProduct || undefined,
          target_skin_types: urlTargetSkinTypes.length > 0 ? urlTargetSkinTypes : undefined,
        });
        const normalized = normalizeAnalysisResults(
          res.data,
          userSkinTypeLabel,
          urlTargetSkinTypes,
          detectedArea
        );
        setResults(normalized);
        setIsInputExpanded(false);
        if (res.data?.requires_skin_id) {
          setSkinIdModalOpen(true);
        }
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
    [inputText, urlDepartment, urlCategory, urlTargetArea, urlProductName, sourceProduct, userSkinTypeLabel, urlTargetSkinTypes]
  );

  // Sync URL params when navigated from ProductDetail "Deep Formula Analysis"
  // Pre-fills the ingredient table only; analysis runs when the user clicks "Analyze for My Skin"
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (urlIngredients) {
      setInputText(urlIngredients);
      if (urlBrandName && urlProductName) {
        setSourceProduct(`${urlBrandName} — ${urlProductName}`);
      } else if (urlProductName) {
        setSourceProduct(urlProductName);
      }
      setResults(null);
      setIsInputExpanded(true);
    }
  }, [urlIngredients, urlBrandName, urlProductName]);

  const handleFillSample = () => {
    setInputText(SAMPLE_FORMULA);
    setSourceProduct('');
    setResults(null);
    setIsInputExpanded(true);
    textareaRef.current?.focus();
    toast.success('Loaded sample formula!');
  };

  const handleClear = () => {
    setInputText('');
    setResults(null);
    setSourceProduct('');
    setShowFullInci(false);
    setIsInputExpanded(true);
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

  // Collect all ingredients to watch (allergens + potent actives/cautions)
  const watchIngredientsList = results
    ? [
        ...(results.allergy_matches || []),
        ...(results._watchIngredients || []),
        ...(results.cautions || []).flatMap((c) => c.ingredients_involved || []),
      ].filter((v, idx, arr) => v && arr.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === idx)
    : [];

  return (
    <div className="ia-page">
      <div className="ia-bg-glow ia-bg-glow-1" />
      <div className="ia-bg-glow ia-bg-glow-2" />

      <div className="container">
        {/* ── 1. COMPACT PAGE HEADER & TOOLBAR ── */}
        <header className="ia-layout-header">
          <div className="ia-header-top-row">
            <div className="ia-header-title-group">
              <div className="ia-header-badge">
                <FlaskConical size={13} />
                <span>Personalized INCI &amp; Skin ID Formula Analyzer</span>
              </div>
              <h1 className="ia-title display-font">
                {t('ia_title', 'Cosmetic Ingredient Analyzer')}
              </h1>
              <p className="ia-subtitle">
                Cross-check any cosmetic formula against your personal Skin ID and Allergy Blacklist in plain English.
              </p>
            </div>

            {user && (
              <div className="ia-segmented-control" role="tablist" aria-label="Analyzer mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'analysis'}
                  className={`ia-segment-btn ${activeTab === 'analysis' ? 'active' : ''}`}
                  onClick={() => setActiveTab('analysis')}
                >
                  <FlaskConical size={15} />
                  <span>Formula Breakdown</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'guide'}
                  className={`ia-segment-btn ${activeTab === 'guide' ? 'active' : ''}`}
                  onClick={() => setActiveTab('guide')}
                >
                  <BookOpen size={15} />
                  <span>Skin Type Guide</span>
                </button>
              </div>
            )}
          </div>

          {/* Integrated Skin ID Status Strip */}
          {user && (
            <div
              className={`ia-skinid-strip ${
                isUserSkinIdConfigured(user) ? 'configured' : 'unconfigured'
              }`}
            >
              <div className="ia-skinid-strip-left">
                <UserCheck
                  size={16}
                  color={isUserSkinIdConfigured(user) ? '#2D5A43' : '#7C4D2B'}
                  style={{ flexShrink: 0 }}
                />
                <span className="ia-skinid-label">Active Skin ID:</span>
                {isUserSkinIdConfigured(user) ? (
                  <>
                    <span className="ia-skinid-pill">
                      {user.skinProfile?.skinType || user.skin_type || 'Combination'} Skin
                    </span>
                    <span className="ia-skinid-divider">·</span>
                    <span className="ia-skinid-allergies">
                      Allergy Blacklist:{' '}
                      <strong>
                        {userAllergyList.length > 0 ? userAllergyList.join(', ') : 'None set'}
                      </strong>
                    </span>
                  </>
                ) : (
                  <span className="ia-skinid-warning">
                    Not yet configured — complete your 30-second Skin ID for personalized verdicts.
                  </span>
                )}
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm ia-skinid-edit-btn"
                onClick={() => setSkinIdModalOpen(true)}
              >
                <Sparkles size={13} />
                <span>
                  {isUserSkinIdConfigured(user)
                    ? 'Edit Skin ID & Allergies'
                    : 'Complete Skin ID (30s)'}
                </span>
              </button>
            </div>
          )}
        </header>

        {/* ── AUTHENTICATION BLURRED PREVIEW GATE (Unauthenticated Users) ── */}
        {!authLoading && !user ? (
          <div style={{ position: 'relative', marginBottom: '64px' }}>
            <div
              aria-hidden="true"
              style={{
                filter: 'blur(7px)',
                WebkitFilter: 'blur(7px)',
                opacity: 0.62,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              <div className="ia-verdict-card verdict-good" style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 700, fontSize: '1.25rem', color: '#2D5A43', marginBottom: '6px' }}>
                  Good Match For Your Personal Skin ID
                </div>
                <p style={{ margin: 0, color: '#3D312A' }}>
                  Cross-checked against your personal Allergy Blacklist and skin barrier profile.
                </p>
              </div>
            </div>

            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                zIndex: 10,
              }}
            >
              <div
                className="glass-card animate-fadeIn"
                style={{
                  maxWidth: '540px',
                  width: '100%',
                  padding: '36px 32px',
                  textAlign: 'center',
                  borderRadius: '20px',
                  border: '1px solid rgba(196, 139, 113, 0.35)',
                  background: 'rgba(255, 255, 255, 0.96)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 24px 60px rgba(44, 32, 24, 0.14)',
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'rgba(196, 139, 113, 0.14)',
                    color: '#8F5B42',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <Sparkles size={24} />
                </div>

                <h2 style={{ margin: '0 0 10px', fontSize: '1.35rem', fontWeight: 700, color: '#2C2018' }}>
                  Personal Skin ID Cross-Check Available
                </h2>
                <p style={{ margin: '0 auto 24px', maxWidth: 440, color: '#574B42', fontSize: '0.94rem', lineHeight: 1.55 }}>
                  Sign in to check this formula against your personal <strong>Allergy Blacklist</strong> and <strong>Skin Type</strong>.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      sessionStorage.setItem(
                        'beautyai_post_login_redirect',
                        `${location.pathname}${location.search}`
                      );
                      window.dispatchEvent(new CustomEvent('open-auth-modal'));
                    }}
                    style={{ padding: '12px 28px', fontSize: '0.95rem', fontWeight: 600 }}
                  >
                    Sign In to Unlock Analysis
                  </button>
                  <Link to="/products" className="btn btn-secondary" style={{ padding: '12px 20px' }}>
                    Back to Catalog
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'guide' ? (
              <SkintypeGuide />
            ) : (
              <>
                {/* ── 2. COLLAPSIBLE FORMULA INPUT BAR ── */}
                {results && !isInputExpanded ? (
                  <div className="ia-collapsed-workbench glass-card animate-fadeIn">
                    <div className="ia-collapsed-main">
                      <div className="ia-collapsed-identity">
                        <span className="ia-collapsed-icon">
                          <FlaskConical size={16} />
                        </span>
                        <div className="ia-collapsed-text">
                          <div className="ia-collapsed-title-row">
                            <span className="ia-collapsed-label">
                              {sourceProduct ? 'Product:' : 'Formula:'}
                            </span>
                            <strong className="ia-collapsed-product">
                              {sourceProduct || 'Custom Pasted INCI Formula'}
                            </strong>
                            <span className="ia-count-badge">
                              {results.total_ingredients_count || ingredientCount} ingredients
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="ia-collapsed-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm ia-expand-btn"
                          onClick={() => setIsInputExpanded(true)}
                        >
                          <Edit3 size={13} />
                          <span>Edit / Paste Another INCI</span>
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="ia-input-section glass-card animate-fadeIn">
                    <div className="ia-workbench-top-bar">
                      {sourceProduct ? (
                        <div className="ia-source-banner">
                          <CheckCircle size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
                          <span>
                            Product formula:{' '}
                            <strong style={{ color: 'var(--primary)' }}>{sourceProduct}</strong>
                          </span>
                          <span className="ia-autofill-tag">Auto-filled from Product Page</span>
                        </div>
                      ) : (
                        <div className="ia-workbench-heading">
                          <FlaskConical size={15} color="var(--primary)" />
                          <span>Paste Packaging Ingredient List (INCI)</span>
                        </div>
                      )}

                      {results && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setIsInputExpanded(false)}
                        >
                          <span>Hide Input Box</span>
                          <ChevronUp size={14} />
                        </button>
                      )}
                    </div>

                    <div>
                      <div className="ia-input-header" style={{ marginBottom: '8px' }}>
                        <div className="ia-field-label" style={{ marginBottom: 0 }}>
                          <span>Packaging Ingredient List (INCI)</span>
                          {ingredientCount > 0 && (
                            <span className="ia-count-badge">{ingredientCount} ingredients</span>
                          )}
                        </div>
                        <div className="ia-input-actions-top">
                          {inputText && (
                            <>
                              <button className="btn btn-icon btn-sm" onClick={handleCopy} title="Copy INCI" type="button">
                                <Copy size={14} />
                              </button>
                              <button className="btn btn-icon btn-sm" onClick={handleClear} title="Clear" type="button">
                                <RotateCcw size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <textarea
                        ref={textareaRef}
                        className="ia-textarea form-textarea"
                        placeholder="Paste the product's ingredient list separated by commas (e.g., Water, Glycerin, Niacinamide, Sodium Hyaluronate, Squalane...)"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="ia-action-bar">
                      <button
                        className="btn btn-secondary btn-sm ia-sample-btn"
                        onClick={handleFillSample}
                        type="button"
                      >
                        <BookOpen size={14} />
                        Try Sample Formula
                      </button>
                      <button
                        className="btn btn-primary ia-analyze-btn"
                        onClick={() => runAnalysis(inputText)}
                        disabled={loading}
                        type="button"
                      >
                        {loading ? (
                          <>
                            <Loader2 size={16} className="spin-icon" />
                            Checking Formula...
                          </>
                        ) : (
                          <>
                            <FlaskConical size={16} />
                            Analyze for My Skin
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Loading Skeleton ── */}
                {loading && (
                  <div className="ia-loading-overlay">
                    <div className="ia-loading-card glass-card">
                      <div className="ia-loading-animation">
                        <div className="ia-loading-orb" />
                        <div className="ia-loading-orb ia-orb-2" />
                        <div className="ia-loading-orb ia-orb-3" />
                      </div>
                      <p className="ia-loading-text">Checking Formula Against Your Skin ID...</p>
                      <p className="ia-loading-sub">Evaluating active ingredients, skin compatibility, and suitability</p>
                    </div>
                  </div>
                )}

                {/* ── 3. RESULTS (HARMONIOUS EDITORIAL PALETTE, ZERO EMOJI CLUTTER) ── */}
                {results && !loading && (
                  <div className="ia-simple-results animate-fadeIn" ref={resultsRef}>
                    {/* ── BLOCK 1: PERSONAL VERDICT & AREA SUITABILITY CARD ── */}
                    <div
                      className={`ia-verdict-card card ${
                        results.verdict === 'AllergyConflict'
                          ? 'verdict-conflict'
                          : results.verdict === 'MatchWithNotes'
                          ? 'verdict-notes'
                          : results.verdict === 'GoodMatch'
                          ? 'verdict-good'
                          : 'verdict-neutral'
                      }`}
                    >
                      <div className="ia-verdict-header">
                        <div className="ia-verdict-main">
                          <div className="ia-verdict-icon-box">
                            {results.verdict === 'AllergyConflict' ? (
                              <ShieldAlert size={24} />
                            ) : results.verdict === 'MatchWithNotes' ? (
                              <AlertTriangle size={24} />
                            ) : (
                              <CheckCircle2 size={24} />
                            )}
                          </div>

                          <div className="ia-verdict-body">
                            <div className="ia-verdict-pills">
                              <span className="ia-verdict-tag">
                                Checked for {results.user_skin_type || userSkinTypeLabel} Skin
                              </span>
                            </div>

                            <h2 className="ia-verdict-title">
                              {results.verdict === 'AllergyConflict'
                                ? 'Avoid — Contains Your Personal Allergen'
                                : results.verdict === 'MatchWithNotes'
                                ? results.verdict_label || 'Match with Notes (Use with Caution)'
                                : results.verdict_label || 'Good Match for Your Skin'}
                            </h2>
                            <p className="ia-verdict-reason">{results.verdict_reason}</p>
                          </div>
                        </div>
                      </div>

                      {/* Automatic Application & Area Suitability Guidance */}
                      {results._areaGuidance && (
                        <div className="ia-area-suitability-box">
                          <div className="ia-area-suitability-row">
                            <span className="ia-area-suitability-label">Recommended for:</span>
                            <span className="ia-area-suitability-val">
                              {results._areaGuidance.recommendedFor}
                            </span>
                          </div>
                          <div className="ia-area-suitability-row">
                            <span className="ia-area-suitability-label">Area suitability note:</span>
                            <span className="ia-area-suitability-note">
                              {results._areaGuidance.notSuitableFor}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 3 Clean Summary Pills */}
                      <div className="ia-verdict-summary-pills">
                        <span
                          className={`ia-summary-pill ${
                            results.allergy_matches?.length > 0 ? 'pill-danger' : 'pill-safe'
                          }`}
                        >
                          <span
                            className={`ia-dot ${
                              results.allergy_matches?.length > 0 ? 'dot-danger' : 'dot-safe'
                            }`}
                          />
                          {results.allergy_matches?.length > 0
                            ? `Allergy Blacklist: ${results.allergy_matches.length} Found (${results.allergy_matches.join(', ')})`
                            : 'Allergy Blacklist: Safe (0 matches)'}
                        </span>

                        <span className="ia-summary-pill pill-safe">
                          <span className="ia-dot dot-safe" />
                          Beneficial Actives: {results.key_ingredients?.length || 0} Key Ingredients
                        </span>

                        <span
                          className={`ia-summary-pill ${
                            watchIngredientsList.length > 0 || results.cautions?.length > 0
                              ? 'pill-warn'
                              : 'pill-safe'
                          }`}
                        >
                          <span
                            className={`ia-dot ${
                              watchIngredientsList.length > 0 || results.cautions?.length > 0
                                ? 'dot-warn'
                                : 'dot-safe'
                            }`}
                          />
                          {watchIngredientsList.length > 0 || results.cautions?.length > 0
                            ? `Usage & Sensitivity Notes: ${Math.max(watchIngredientsList.length, results.cautions?.length || 0)}`
                            : 'Gentle Formula: 0 Irritant Notes'}
                        </span>
                      </div>
                    </div>

                    {/* ── BLOCK 2: TWO-COLUMN COMPARISON (UNIFIED WITH SKIN TYPE GUIDE) ── */}
                    <div className="ia-guide-comparison-grid">
                      {/* LEFT CARD: WHAT HELPS YOUR SKIN IN THIS FORMULA */}
                      <div className="guide-section card ia-comparison-card">
                        <h3 className="guide-skin-type ia-card-heading-good">
                          What Helps Your Skin in This Formula
                        </h3>

                        <p className="guide-text" style={{ margin: 0 }}>
                          Primary benefits and standout nourishing ingredients identified in this formula:
                        </p>

                        {/* Benefits Tags */}
                        {results.benefits?.length > 0 && (
                          <div>
                            <p className="guide-sub-label">
                              <span className="ia-dot dot-safe" />
                              Key Benefits
                            </p>
                            <div className="guide-tags">
                              {results.benefits.map((b, idx) => (
                                <span key={idx} className="ingredient-tag safe">
                                  {b}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Beneficial Key Ingredients Explained Simply */}
                        {results.key_ingredients?.length > 0 && (
                          <div>
                            <p className="guide-sub-label">
                              <span className="ia-dot dot-safe" />
                              Notable Ingredients &amp; What They Do ({results.key_ingredients.length})
                            </p>
                            <div className="ia-simple-ing-list">
                              {results.key_ingredients.map((item, idx) => {
                                const isStrongActive = watchIngredientsList.some(
                                  (w) =>
                                    w.toLowerCase().includes(item.common_name.toLowerCase()) ||
                                    item.common_name.toLowerCase().includes(w.toLowerCase()) ||
                                    item.inci_name.toLowerCase().includes(w.toLowerCase())
                                );
                                return (
                                  <div
                                    key={idx}
                                    className={`ia-simple-ing-item ${
                                      isStrongActive ? 'item-watch' : 'item-good'
                                    }`}
                                  >
                                    <div className="ia-simple-ing-header">
                                      <strong className="ia-simple-ing-name">
                                        {item.common_name}
                                      </strong>
                                      <div className="ia-simple-ing-badges">
                                        <span
                                          className={`ingredient-tag ${
                                            isStrongActive ? 'warn' : 'safe'
                                          }`}
                                        >
                                          {item.role_label}
                                        </span>
                                        {isStrongActive && (
                                          <span className="ingredient-tag warn">
                                            Active — See Usage Note
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <p className="ia-simple-ing-desc">{item.explanation}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* RIGHT CARD: WHAT TO WATCH & HOW TO USE SAFELY */}
                      <div className="guide-section card ia-comparison-card">
                        <h3 className="guide-skin-type ia-card-heading-watch">
                          What to Watch &amp; How to Use Safely
                        </h3>

                        <p className="guide-text" style={{ margin: 0 }}>
                          Cross-checked against your <strong>{results.user_skin_type || userSkinTypeLabel} Skin</strong> profile and personal <strong>Allergy Blacklist</strong>:
                        </p>

                        {/* 1. Personal Allergy Check */}
                        <div>
                          <p className="guide-sub-label">
                            <span
                              className={`ia-dot ${
                                results.allergy_matches?.length > 0 ? 'dot-danger' : 'dot-safe'
                              }`}
                            />
                            Your Personal Allergy Blacklist
                          </p>
                          {results.allergy_matches?.length > 0 ? (
                            <div className="ia-watch-alert-box alert-danger">
                              <div style={{ marginBottom: 8 }}>
                                <strong>Avoid this product:</strong> It contains ingredients on your personal Allergy Blacklist:
                              </div>
                              <div className="guide-tags">
                                {results.allergy_matches.map((alg) => (
                                  <span key={alg} className="ingredient-tag danger">
                                    {alg}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="ia-watch-alert-box alert-safe">
                              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                              <span>
                                <strong>Passed:</strong> Contains <strong>0 ingredients</strong> from your Allergy Blacklist
                                {userAllergyList.length > 0
                                  ? ` (${userAllergyList.join(', ')})`
                                  : ''}.
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 2. Ingredients to Watch for Your Skin Type */}
                        <div>
                          <p className="guide-sub-label">
                            <span className="ia-dot dot-warn" />
                            Ingredients to Watch for {results.user_skin_type || userSkinTypeLabel} Skin
                          </p>
                          {watchIngredientsList.length > 0 ? (
                            <div className="guide-tags" style={{ marginBottom: 10 }}>
                              {watchIngredientsList.map((ing) => (
                                <span key={ing} className="ingredient-tag warn">
                                  {ing}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="ia-gentle-text">
                              No harsh acids, drying alcohols, or sensitizing ingredients detected.
                            </p>
                          )}

                          {/* Detailed Plain-English Cautions */}
                          {(results.cautions?.length > 0 || results.fragrance_disclosure) && (
                            <div className="ia-simple-cautions-stack">
                              {results.cautions?.map((c, i) => (
                                <div
                                  key={i}
                                  className={`ia-simple-caution-box ${
                                    c.type === 'allergy' ? 'caution-danger' : 'caution-warn'
                                  }`}
                                >
                                  <strong>{c.title || 'How to Use Safely'}:</strong>
                                  <p>{c.caution}</p>
                                </div>
                              ))}

                              {results.fragrance_disclosure && (
                                <div className="ia-simple-caution-box caution-neutral">
                                  <strong>Scent &amp; Fragrance Note:</strong>
                                  <p>{results.fragrance_disclosure}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Active Layering Warnings if any */}
                          {results.combination_warnings?.length > 0 && (
                            <div className="ia-simple-cautions-stack" style={{ marginTop: 10 }}>
                              {results.combination_warnings.map((warn, i) => (
                                <div key={i} className="ia-simple-caution-box caution-danger">
                                  <strong>Active Combination Note:</strong>
                                  <p>{warn.warning}</p>
                                  {warn.recommendation && (
                                    <p style={{ marginTop: 4, fontWeight: 600 }}>
                                      Recommendation: {warn.recommendation}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Safe Alternatives CTA */}
                        <div className="ia-watch-card-footer">
                          <Link
                            to={`/products?safeForMe=true${urlCategory ? `&category=${encodeURIComponent(urlCategory)}` : ''}`}
                            className="btn btn-primary btn-sm ia-safe-catalog-link"
                          >
                            <ShieldCheck size={15} />
                            <span>Browse Products Filtered &ldquo;Safe for My Skin&rdquo;</span>
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* ── BLOCK 3: FULL INGREDIENT LIST IN SIMPLE GROUPS (COLLAPSIBLE) ── */}
                    {results.raw_inci_list?.length > 0 && (
                      <div className="guide-section card ia-full-list-card">
                        <div
                          className="ia-full-list-header"
                          onClick={() => setShowFullInci((v) => !v)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') setShowFullInci((v) => !v);
                          }}
                        >
                          <div>
                            <h3 className="guide-skin-type" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 4 }}>
                              All {results.total_ingredients_count} Ingredients Inside This Formula
                            </h3>
                            <p className="guide-text" style={{ margin: 0, fontSize: '0.84rem' }}>
                              Listed in order of concentration. Sage = Key Beneficial Active · Warm Amber = Active / Watch Note · Neutral = Supporting Base.
                            </p>
                          </div>
                          <button type="button" className="btn btn-secondary btn-sm">
                            <span>{showFullInci ? 'Hide Role Groups' : 'Group by Function'}</span>
                            {showFullInci ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </div>

                        {/* Color-coded token pills */}
                        <div className="guide-tags" style={{ marginTop: 6 }}>
                          {results.raw_inci_list.map((token, i) => {
                            const isAllergen = results.allergy_matches?.some(
                              (a) => a.toLowerCase() === token.toLowerCase()
                            );
                            const isWatch = watchIngredientsList.some(
                              (w) =>
                                token.toLowerCase().includes(w.toLowerCase().split('(')[0].trim()) ||
                                w.toLowerCase().includes(token.toLowerCase())
                            );
                            const isKey = results.key_ingredients?.some(
                              (k) => k.inci_name.toLowerCase() === token.toLowerCase()
                            );
                            return (
                              <span
                                key={i}
                                className={`ingredient-tag ${
                                  isAllergen
                                    ? 'danger'
                                    : isWatch
                                    ? 'warn'
                                    : isKey
                                    ? 'safe'
                                    : ''
                                }`}
                              >
                                {i + 1}. {toFriendlyName(token)}
                              </span>
                            );
                          })}
                        </div>

                        {/* Expanded Role Breakdown */}
                        {showFullInci && results.functional_groups?.length > 0 && (
                          <div className="ia-role-groups-expanded">
                            {results.functional_groups.map((grp, idx) => (
                              <div key={idx} className="ia-role-group-box">
                                <div className="ia-role-group-title">
                                  <strong>{grp.group_title}</strong>
                                  <span className="ia-count-badge">{grp.count} items</span>
                                </div>
                                <p className="ia-role-group-desc">{grp.plain_explanation}</p>
                                <div className="guide-tags">
                                  {grp.ingredients.map((ing, j) => (
                                    <span key={j} className="ingredient-tag">
                                      {toFriendlyName(ing)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
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
          if (results && inputText.trim()) {
            runAnalysis(inputText);
          }
        }}
      />
    </div>
  );
}
