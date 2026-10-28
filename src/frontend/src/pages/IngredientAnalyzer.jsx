import React, { useState, useEffect, useRef } from 'react';
import {
  FlaskConical,
  Sparkles,
  AlertTriangle,
  XCircle,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Zap,
  Shield,
  Loader2,
  Info,
  RotateCcw,
  Copy,
  Star,
  Layers,
} from 'lucide-react';
import { analyzeIngredients, getSkintypeGuide } from '../services/api';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import './IngredientAnalyzer.css';

// Mẫu thành phần mẫu đa phân vùng
const SAMPLES = {
  face: 'Water, Glycerin, Niacinamide, Hyaluronic Acid, Squalane, Retinol, Fragrance',
  hair: 'Water, Cetearyl Alcohol, Behentrimonium Chloride, Argania Spinosa Kernel Oil, Hydrolyzed Keratin, Polyquaternium-10, Biotin, Caffeine, Fragrance',
  body: 'Water, Glycerin, Urea, Colloidal Oatmeal, Butyrospermum Parkii (Shea) Butter, Ceramide, Allantoin, Lactic Acid',
};

// Danh mục tình trạng theo từng phân vùng
const CONDITIONS_BY_AREA = {
  face: [
    { value: '', labelKey: 'skin_type_all' },
    { value: 'dry', labelKey: 'skin_type_dry' },
    { value: 'oily', labelKey: 'skin_type_oily' },
    { value: 'combination', labelKey: 'skin_type_combination' },
    { value: 'normal', labelKey: 'skin_type_normal' },
    { value: 'sensitive', labelKey: 'skin_type_sensitive' },
    { value: 'acne-prone', labelKey: 'quiz_concern_acne' },
    { value: 'mature', labelKey: 'quiz_concern_aging' },
  ],
  hair: [
    { value: '', labelKey: 'ia_condition_all' },
    { value: 'dry-damaged', labelKey: 'cond_dry_damaged' },
    { value: 'oily-scalp', labelKey: 'cond_oily_scalp' },
    { value: 'dandruff', labelKey: 'cond_dandruff' },
    { value: 'color-treated', labelKey: 'cond_color_treated' },
    { value: 'curly-frizzy', labelKey: 'cond_curly_frizzy' },
    { value: 'hair-loss', labelKey: 'cond_hair_loss' },
  ],
  body: [
    { value: '', labelKey: 'ia_condition_all' },
    { value: 'dry-cracked', labelKey: 'cond_dry_cracked' },
    { value: 'keratosis-pilaris', labelKey: 'cond_keratosis_pilaris' },
    { value: 'sensitive-eczema', labelKey: 'cond_sensitive_eczema' },
    { value: 'normal-body', labelKey: 'cond_normal_body' },
  ],
};

const CATEGORY_COLORS = {
  moisturizer: { bg: 'rgba(92,200,160,0.12)', color: '#5CC8A0', border: 'rgba(92,200,160,0.3)' },
  humectant: { bg: 'rgba(92,200,160,0.12)', color: '#5CC8A0', border: 'rgba(92,200,160,0.3)' },
  active: { bg: 'rgba(143,117,95,0.12)', color: '#8F755F', border: 'rgba(143,117,95,0.3)' },
  exfoliant: { bg: 'rgba(240,168,107,0.12)', color: '#F0A86B', border: 'rgba(240,168,107,0.3)' },
  preservative: { bg: 'rgba(232,107,107,0.12)', color: '#E86B6B', border: 'rgba(232,107,107,0.3)' },
  fragrance: { bg: 'rgba(232,107,107,0.12)', color: '#E86B6B', border: 'rgba(232,107,107,0.3)' },
  emollient: { bg: 'rgba(163,145,130,0.12)', color: '#A39182', border: 'rgba(163,145,130,0.3)' },
  'hair-conditioning': { bg: 'rgba(181, 101, 118, 0.12)', color: '#b56576', border: 'rgba(181, 101, 118, 0.3)' },
  protein: { bg: 'rgba(108, 92, 231, 0.12)', color: '#6c5ce7', border: 'rgba(108, 92, 231, 0.3)' },
  soothing: { bg: 'rgba(46, 111, 78, 0.12)', color: '#2e6f4e', border: 'rgba(46, 111, 78, 0.3)' },
  'barrier-repair': { bg: 'rgba(52, 152, 219, 0.12)', color: '#3498db', border: 'rgba(52, 152, 219, 0.3)' },
  'sebum-control': { bg: 'rgba(230, 126, 34, 0.12)', color: '#e67e22', border: 'rgba(230, 126, 34, 0.3)' },
  'sun-protection': { bg: 'rgba(241, 196, 15, 0.12)', color: '#f39c12', border: 'rgba(241, 196, 15, 0.3)' },
  brightening: { bg: 'rgba(253, 203, 110, 0.15)', color: '#d68910', border: 'rgba(253, 203, 110, 0.4)' },
  'anti-aging': { bg: 'rgba(155, 89, 182, 0.12)', color: '#9b59b6', border: 'rgba(155, 89, 182, 0.3)' },
  default: { bg: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: 'var(--glass-border)' },
};

function SafetyScore({ score, maxScore = 5 }) {
  const { t } = useApp();
  const [animated, setAnimated] = useState(false);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const percentage = score / maxScore;
  const offset = circumference - percentage * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const getColor = () => {
    if (percentage >= 0.8) return '#5CC8A0';
    if (percentage >= 0.6) return '#F0A86B';
    if (percentage >= 0.4) return '#F0A86B';
    return '#E86B6B';
  };

  const getLabel = () => {
    if (percentage >= 0.8) return t('safety_safe') || 'An toàn';
    if (percentage >= 0.6) return t('safety_fair') || 'Khá an toàn';
    if (percentage >= 0.4) return t('safety_warning') || 'Cần chú ý';
    return t('safety_danger') || 'Cần thận trọng';
  };

  const color = getColor();

  return (
    <div className="safety-score-wrapper">
      <div className="safety-score-ring" style={{ '--score-color': color }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke="var(--bg-elevated)"
            strokeWidth="10"
          />
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animated ? offset : circumference}
            transform="rotate(-90 70 70)"
            filter="url(#glow)"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
        </svg>
        <div className="safety-score-center">
          <span className="safety-score-number" style={{ color }}>
            {score.toFixed(1)}
          </span>
          <span className="safety-score-max">/ {maxScore}</span>
        </div>
      </div>
      <div className="safety-score-label" style={{ color }}>
        <Shield size={14} />
        {getLabel()}
      </div>
      <div className="safety-stars">
        {Array.from({ length: maxScore }).map((_, i) => (
          <Star
            key={i}
            size={18}
            fill={i < Math.round(score) ? color : 'none'}
            stroke={i < Math.round(score) ? color : 'var(--glass-border)'}
            style={{ transition: `fill 0.3s ease ${i * 0.1}s, stroke 0.3s ease ${i * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Ingredient Card ─── */
function IngredientCard({ ingredient, index }) {
  const { t } = useApp();
  const [expanded, setExpanded] = useState(false);
  const cat = ingredient.category?.toLowerCase() || 'default';
  const catStyle = CATEGORY_COLORS[cat] || CATEGORY_COLORS.default;

  const safetyClass =
    ingredient.safety === 'safe' ? 'safe' :
    ingredient.safety === 'warning' ? 'warning' :
    ingredient.safety === 'danger' ? 'danger' : 'unknown';

  const safetyIcon =
    ingredient.safety === 'safe' ? <CheckCircle size={14} /> :
    ingredient.safety === 'warning' ? <AlertTriangle size={14} /> :
    ingredient.safety === 'danger' ? <XCircle size={14} /> :
    <HelpCircle size={14} />;

  return (
    <div
      className="ingredient-card animate-in"
      style={{ '--delay': `${index * 0.06}s` }}
    >
      <div className="ingredient-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="ingredient-card-title">
          <span className={`ingredient-safety-dot ${safetyClass}`} />
          <span className="ingredient-name">{ingredient.name}</span>
          {ingredient.target_areas?.map(area => (
            <span key={area} className={`ia-target-pill ia-target-${area}`}>
              {area === 'hair' ? '💆 Tóc' : area === 'body' ? '🧴 Body' : '🌸 Mặt'}
            </span>
          ))}
        </div>
        <div className="ingredient-card-meta">
          <span
            className="ingredient-category-badge"
            style={{ background: catStyle.bg, color: catStyle.color, borderColor: catStyle.border }}
          >
            {ingredient.category || 'Active'}
          </span>
          <span className={`ingredient-safety-badge ${safetyClass}`}>
            {safetyIcon}
            {ingredient.safety === 'safe' ? t('safety_safe') || 'An toàn' :
             ingredient.safety === 'warning' ? t('safety_warning') || 'Cần chú ý' :
             ingredient.safety === 'danger' ? t('safety_danger') || 'Nguy hiểm' : t('safety_unknown') || 'Chưa rõ'}
          </span>
          {expanded ? <ChevronUp size={16} className="chevron" /> : <ChevronDown size={16} className="chevron" />}
        </div>
      </div>
      {expanded && (
        <div className="ingredient-card-body">
          {ingredient.vi_name && (
            <p style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: 6 }}>
              {ingredient.vi_name}
            </p>
          )}
          {ingredient.function && (
            <p className="ingredient-function">
              <Zap size={13} />
              <span>{ingredient.function}</span>
            </p>
          )}
          {ingredient.benefits?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {t('ia_benefits') || 'Lợi ích'}:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {ingredient.benefits.map((b, bi) => (
                  <span key={bi} className="ingredient-tag safe" style={{ fontSize: '0.78rem' }}>
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}
          {ingredient.caution && (
            <p className="caution-text" style={{ marginTop: 8, color: '#e56b6f', fontSize: '0.85rem' }}>
              <AlertTriangle size={13} style={{ display: 'inline', marginRight: 4 }} />
              {ingredient.caution}
            </p>
          )}
          {ingredient.suitable_skin_types?.length > 0 && (
            <div className="ingredient-skin-types" style={{ marginTop: 8 }}>
              <span className="skin-types-label">{t('ia_best_for') || 'Phù hợp với'}:</span>
              {ingredient.suitable_skin_types.map((st) => (
                <span key={st} className="skin-type-chip">
                  {st}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Skintype & Hair/Body Guide Component ─── */
function SkintypeGuide() {
  const { t } = useApp();
  const [guideData, setGuideData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getSkinTypeLabel = (key) => {
    return t(`cond_${key.replace('-', '_')}`) || t(`skin_type_${key}`) || key;
  };

  useEffect(() => {
    getSkintypeGuide()
      .then(res => setGuideData(res.data))
      .catch(() => setError(t('ia_error_loading_guide') || 'Không thể tải hướng dẫn'))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <span>{t('ia_loading_guide') || 'Đang tải hướng dẫn...'}</span>
    </div>
  );

  if (error) return (
    <div className="guide-error">
      <AlertTriangle size={32} />
      <p>{error}</p>
    </div>
  );

  const guideEntries = guideData?.guide || guideData || {};

  return (
    <div className="skintype-guide animate-fadeIn">
      {Object.entries(guideEntries).map(([skinType, info]) => (
        <div key={skinType} className="guide-section card">
          <h3 className="guide-skin-type">
            {info.vi_name || getSkinTypeLabel(skinType)}
          </h3>
          {typeof info === 'object' && (
            <div className="guide-details">
              {info.tip && (
                <p className="guide-text" style={{ fontStyle: 'italic', marginBottom: 12 }}>
                  💡 {info.tip}
                </p>
              )}
              {info.recommended?.length > 0 && (
                <div>
                  <p className="guide-sub-label">✅ {t('ia_recommended_ingredients') || 'Thành phần khuyên dùng'}:</p>
                  <div className="guide-tags">
                    {info.recommended.map(i => (
                      <span key={i} className="ingredient-tag safe">{i}</span>
                    ))}
                  </div>
                </div>
              )}
              {info.avoid?.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <p className="guide-sub-label">⚠️ {t('ia_avoid_ingredients') || 'Thành phần nên tránh'}:</p>
                  <div className="guide-tags">
                    {info.avoid.map(i => (
                      <span key={i} className="ingredient-tag danger">{i}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ─── */
export default function IngredientAnalyzer() {
  const { t, user } = useApp();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const urlIngredients = searchParams.get('ingredients') || location.state?.ingredients || '';
  const urlProductName = searchParams.get('product_name') || location.state?.product_name || '';
  const urlBrandName = searchParams.get('brand_name') || location.state?.brand_name || '';
  const urlCategory = searchParams.get('category') || location.state?.category || '';
  const urlTargetArea = searchParams.get('target_area') || location.state?.target_area || '';

  const initialProductName = (urlBrandName && urlProductName)
    ? `${urlBrandName} - ${urlProductName}`
    : (urlProductName || '');

  // Helper detect category to targetArea
  const detectArea = (cat) => {
    if (!cat) return 'face';
    const c = cat.toLowerCase();
    if (c.includes('hair') || c.includes('shampoo') || c.includes('conditioner') || c.includes('scalp')) return 'hair';
    if (c.includes('body') || c.includes('bath') || c.includes('shower') || c.includes('deodorant') || c.includes('hand cream')) return 'body';
    return 'face';
  };

  const [targetArea, setTargetArea] = useState(() => {
    if (urlTargetArea && ['face', 'hair', 'body'].includes(urlTargetArea)) return urlTargetArea;
    return detectArea(urlCategory);
  });

  const [inputText, setInputText] = useState(urlIngredients);
  const [condition, setCondition] = useState(() => (user?.skin_type?.toLowerCase() || ''));
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('analysis');
  const [sourceProduct, setSourceProduct] = useState(initialProductName);

  const textareaRef = useRef(null);
  const resultsRef = useRef(null);

  // Pre-fill context when navigated from product page, keeping user at the top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (urlIngredients) {
      setInputText(urlIngredients);

      if (urlBrandName && urlProductName) {
        setSourceProduct(`${urlBrandName} - ${urlProductName}`);
      } else if (urlProductName) {
        setSourceProduct(urlProductName);
      }

      if (urlCategory || urlTargetArea) {
        setTargetArea(urlTargetArea || detectArea(urlCategory));
      }
    }
  }, [urlIngredients, urlBrandName, urlProductName, urlCategory, urlTargetArea]);

  const getConditionLabel = (key) => {
    return t(`cond_${key.replace('-', '_')}`) || t(`skin_type_${key}`) || key;
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      toast.error(t('ia_error_empty') || 'Vui lòng nhập danh sách thành phần!');
      return;
    }
    setLoading(true);
    setResults(null);
    try {
      const res = await analyzeIngredients({
        ingredients_text: inputText,
        target_area: targetArea,
        category: urlCategory || undefined,
        condition: condition || undefined,
        skin_type: condition || undefined,
      });
      setResults(res.data);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      const errorDetail = err.response?.data?.detail;
      const msg = typeof errorDetail === 'string'
        ? errorDetail
        : (Array.isArray(errorDetail)
          ? errorDetail.map(d => d.msg).join(', ')
          : (t('ia_error_failed') || 'Không thể phân tích thành phần. Vui lòng thử lại!'));
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFillSample = (area = targetArea) => {
    const sampleText = SAMPLES[area] || SAMPLES.face;
    setInputText(sampleText);
    setSourceProduct('');
    textareaRef.current?.focus();
    toast.success(t('ia_sample_filled') || 'Đã điền thành phần mẫu!');
  };

  const handleClear = () => {
    setInputText('');
    setResults(null);
    setCondition('');
    setSourceProduct('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inputText);
    toast.success(t('copied') || 'Đã sao chép!');
  };

  const charCount = inputText.trim().split(',').filter(s => s.trim()).length;
  const currentConditions = CONDITIONS_BY_AREA[targetArea] || CONDITIONS_BY_AREA.face;

  const identifiedList = results ? (results.identified_ingredients || results.identified || []) : [];
  const unknownList = results ? (results.unknown_ingredients || results.unknown || []) : [];

  return (
    <div className="ia-page">
      {/* ── Background Decoration ── */}
      <div className="ia-bg-glow ia-bg-glow-1" />
      <div className="ia-bg-glow ia-bg-glow-2" />

      <div className="container">
        {/* ── Header ── */}
        <div className="ia-header">
          <div className="ia-header-badge">
            <FlaskConical size={16} />
            AI Multi-Category Formula Analyzer
          </div>
          <h1 className="ia-title display-font">
            {t('ia_title')}
          </h1>
          <p className="ia-subtitle">
            {t('ia_subtitle')}
          </p>
        </div>

        {/* ── Tab Bar ── */}
        <div className="ia-tabs tabs">
          <button
            className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            <FlaskConical size={15} />
            {t('ia_title_tab') || t('ia_breakdown_title')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
            onClick={() => setActiveTab('guide')}
          >
            <BookOpen size={15} />
            {t('ia_skin_guide_tab') || 'Hướng dẫn chuyên sâu theo vùng'}
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
                    background: 'rgba(196, 139, 113, 0.08)',
                    border: '1px solid rgba(196, 139, 113, 0.22)',
                    borderRadius: 'var(--radius-md, 10px)',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    fontSize: '0.88rem',
                    color: 'var(--text-primary)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <span>
                      {t('ia_analyzing_for', 'Đang phân tích công thức của')}:{' '}
                      <strong style={{ color: 'var(--primary)' }}>{sourceProduct}</strong>
                    </span>
                  </div>
                  <span className="badge badge-clean" style={{ fontSize: '0.75rem' }}>
                    ✨ {t('ia_auto_filled', 'Tự động điền công thức')}
                  </span>
                </div>
              )}

              {/* 1. Danh sách thành phần (Header + Textarea) */}
              <div className="ia-input-header">
                <div className="ia-field-label">
                  <FlaskConical size={16} className="label-icon" />
                  <span>{t('ia_input_label', 'Danh sách thành phần')}</span>
                  {charCount > 0 && (
                    <span className="ia-count-badge">{charCount} {t('ia_ingredients') || 'thành phần'}</span>
                  )}
                </div>
                <div className="ia-input-actions-top">
                  {inputText && (
                    <>
                      <button className="btn btn-icon btn-sm" onClick={handleCopy} title="Copy">
                        <Copy size={14} />
                      </button>
                      <button className="btn btn-icon btn-sm" onClick={handleClear} title={t('ia_clear_btn')}>
                        <RotateCcw size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <textarea
                ref={textareaRef}
                className="ia-textarea form-textarea"
                placeholder={t('ia_placeholder_textarea')}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                rows={6}
              />

              {/* 2 & 3: Phân vùng mục tiêu & Tình trạng cụ thể (Đặt dưới textarea, heading đồng bộ) */}
              <div className="ia-bottom-controls">
                <div className="ia-control-group">
                  <div className="ia-field-label">
                    <Layers size={16} className="label-icon" />
                    <span>{t('ia_select_area', 'Phân vùng mục tiêu')}</span>
                  </div>
                  <div className="ia-area-pills">
                    <button
                      type="button"
                      className={`ia-area-pill ${targetArea === 'face' ? 'active' : ''}`}
                      onClick={() => {
                        setTargetArea('face');
                        setCondition('');
                      }}
                    >
                      {t('ia_area_face', 'Da mặt')}
                    </button>
                    <button
                      type="button"
                      className={`ia-area-pill ${targetArea === 'hair' ? 'active' : ''}`}
                      onClick={() => {
                        setTargetArea('hair');
                        setCondition('');
                      }}
                    >
                      {t('ia_area_hair', 'Tóc & Da đầu')}
                    </button>
                    <button
                      type="button"
                      className={`ia-area-pill ${targetArea === 'body' ? 'active' : ''}`}
                      onClick={() => {
                        setTargetArea('body');
                        setCondition('');
                      }}
                    >
                      {t('ia_area_body', 'Chăm sóc cơ thể')}
                    </button>
                  </div>
                </div>

                <div className="ia-control-group">
                  <div className="ia-field-label">
                    <Sparkles size={16} className="label-icon" />
                    <span>{t('ia_select_condition', 'Tình trạng cụ thể')}</span>
                  </div>
                  <select
                    className="form-select ia-condition-select"
                    value={condition}
                    onChange={e => setCondition(e.target.value)}
                  >
                    {currentConditions.map(c => (
                      <option key={c.value} value={c.value}>
                        {t(c.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ia-action-bar">
                <button
                  className="btn btn-secondary btn-sm ia-sample-btn"
                  onClick={() => handleFillSample(targetArea)}
                  type="button"
                >
                  <Sparkles size={14} />
                  {targetArea === 'hair' ? t('ia_sample_hair') : targetArea === 'body' ? t('ia_sample_body') : t('ia_sample_face')}
                </button>
                <button
                  className="btn btn-primary ia-analyze-btn"
                  onClick={handleAnalyze}
                  disabled={loading}
                  type="button"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="spin-icon" />
                      {t('ia_analyzing')}
                    </>
                  ) : (
                    <>
                      <FlaskConical size={16} />
                      {t('ia_analyze_btn')}
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
                  <p className="ia-loading-text">🔬 {t('ia_analyzing')}</p>
                  <p className="ia-loading-sub">{t('ia_analyzing_sub')}</p>
                </div>
              </div>
            )}

            {/* ── Results ── */}
            {results && !loading && (
              <div className="ia-results" ref={resultsRef}>

                {/* Condition evaluation callout if provided */}
                {results.condition_evaluation && (
                  <div
                    className="glass-card animate-fadeIn"
                    style={{
                      padding: '14px 18px',
                      marginBottom: '20px',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: '4px solid #5CC8A0',
                      background: 'rgba(92, 200, 160, 0.08)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={18} color="#5CC8A0" />
                      <span style={{ fontWeight: 600 }}>
                        {t('ia_for_target', 'Đánh giá cho')}: <strong>{results.condition_evaluation.condition_name}</strong>
                      </span>
                    </div>
                    <p style={{ margin: '6px 0 0 26px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {results.condition_evaluation.is_suitable
                        ? '✅ Công thức này chứa thành phần tương thích hỗ trợ tích cực cho tình trạng đã chọn!'
                        : 'ℹ️ Công thức chưa có nhiều hoạt chất chuyên biệt cho tình trạng này, hoặc bạn nên kiểm tra kỹ các lưu ý an toàn.'}
                    </p>
                  </div>
                )}

                {/* ── Row: Score + Summary ── */}
                <div className="ia-results-top">
                  {/* Safety Score */}
                  <div className="ia-score-card glass-card">
                    <h2 className="ia-section-title">
                      <Shield size={18} />
                      {t('ia_safety_score')}
                    </h2>
                    <SafetyScore score={results.safety_score ?? 0} maxScore={5} />
                    {results.summary && (
                      <p className="ia-summary-text">{results.summary}</p>
                    )}
                  </div>

                  {/* Condition / Skin Compatibility */}
                  {results.compatible_skin_types?.length > 0 && (
                    <div className="ia-compat-card glass-card">
                      <h2 className="ia-section-title">
                        <Sparkles size={18} />
                        {targetArea === 'hair'
                          ? 'Độ tương thích với tình trạng tóc & da đầu'
                          : targetArea === 'body'
                          ? 'Độ tương thích với da cơ thể'
                          : t('ia_skin_compatibility')}
                      </h2>
                      <div className="ia-compat-list">
                        {results.compatible_skin_types.map((item) => {
                          const pct = item.score ?? 0;
                          const color = pct >= 70 ? '#5CC8A0' : pct >= 40 ? '#F0A86B' : '#E86B6B';
                          return (
                            <div key={item.key} className="ia-compat-item">
                              <div className="ia-compat-label">
                                <span>{item.vi_name || getConditionLabel(item.key)}</span>
                                <span style={{ color, fontWeight: 600 }}>{pct}%</span>
                              </div>
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{
                                    width: `${pct}%`,
                                    background: color,
                                    boxShadow: `0 0 8px ${color}60`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Benefits ── */}
                {results.benefits?.length > 0 && (
                  <div className="ia-section-card glass-card animate-fadeIn">
                    <h2 className="ia-section-title">
                      <CheckCircle size={18} style={{ color: '#5CC8A0' }} />
                      {t('ia_tab_benefits') || t('ia_benefits')}
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

                {/* ── Cautions ── */}
                {results.cautions?.length > 0 && (
                  <div className="ia-section-card glass-card animate-fadeIn">
                    <h2 className="ia-section-title">
                      <AlertTriangle size={18} style={{ color: '#F0A86B' }} />
                      {t('ia_tab_cautions') || 'Lưu ý & Cảnh báo'}
                    </h2>
                    <div className="ia-cautions-list">
                      {results.cautions.map((caution, i) => (
                        <div key={i} className="ia-caution-card" style={{ '--delay': `${i * 0.07}s` }}>
                          <AlertTriangle size={16} className="caution-icon" />
                          <div>
                            <p className="caution-text">
                              {typeof caution === 'string' ? caution : (caution.caution || caution.message)}
                            </p>
                            {caution.ingredient && (
                              <span className="caution-ingredient">{caution.ingredient}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Combination Warnings ── */}
                {results.combination_warnings?.length > 0 && (
                  <div className="ia-section-card glass-card animate-fadeIn">
                    <h2 className="ia-section-title">
                      <XCircle size={18} style={{ color: '#E86B6B' }} />
                      {t('ia_warnings_title')}
                    </h2>
                    <div className="ia-warnings-list">
                      {results.combination_warnings.map((warn, i) => (
                        <div key={i} className="ia-warning-card" style={{ '--delay': `${i * 0.07}s` }}>
                          <div className="warning-header">
                            <XCircle size={15} className="warning-icon" />
                            <span className="warning-title">
                              {typeof warn === 'string' ? warn : (warn.warning || warn.message || warn.combination?.join(' + '))}
                            </span>
                          </div>
                          {warn.ingredients_involved && (
                            <div className="warning-ingredients">
                              {warn.ingredients_involved.map(c => (
                                <span key={c} className="ingredient-tag danger">{c}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Identified Ingredients Grid ── */}
                {identifiedList.length > 0 && (
                  <div className="ia-section-card glass-card animate-fadeIn">
                    <h2 className="ia-section-title">
                      <Info size={18} />
                      {t('ia_identified_ingredients')}
                      <span className="ia-count-pill">{identifiedList.length}</span>
                    </h2>
                    <div className="ia-ingredient-grid">
                      {identifiedList.map((ing, i) => (
                        <IngredientCard key={ing.name || i} ingredient={ing} index={i} />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Unknown Ingredients ── */}
                {unknownList.length > 0 && (
                  <div className="ia-section-card glass-card animate-fadeIn">
                    <h2 className="ia-section-title">
                      <HelpCircle size={18} style={{ color: '#888' }} />
                      {t('ia_tab_unknown')}
                      <span className="ia-count-pill ia-count-muted">{unknownList.length}</span>
                    </h2>
                    <div className="ia-unknown-list">
                      {unknownList.map((name, i) => (
                        <span key={i} className="ia-unknown-tag">
                          <HelpCircle size={11} />
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Best For ── */}
                {results.best_for_skin_types?.length > 0 && (
                  <div className="ia-section-card glass-card animate-fadeIn">
                    <h2 className="ia-section-title">
                      <Sparkles size={18} style={{ color: '#C39B75' }} />
                      {t('ia_best_for')}
                    </h2>
                    <div className="ia-best-for">
                      {results.best_for_skin_types.map((st) => (
                        <span key={st} className="ia-skin-type-tag best">
                          ✨ {getConditionLabel(st)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
