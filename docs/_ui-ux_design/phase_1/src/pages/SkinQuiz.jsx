import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, RotateCcw } from 'lucide-react';
import { getSkinQuizRecs } from '../services/api';
import ProductCard from '../components/ProductCard';
import { useApp } from '../context/AppContext';
import './SkinQuiz.css';

export default function SkinQuiz() {
  const { t } = useApp();

  /* ─── Quiz data ─────────────────────────────────────── */
  const STEPS = [
    {
      id: 'skin_type',
      question: t('quiz_q_skin_type', 'Loại da của bạn là gì?'),
      subtitle: t('quiz_sub_skin_type', 'Hãy chọn loại da gần giống nhất với da của bạn'),
      type: 'single',
      icon: '🌸',
      options: [
        { value: 'dry',         label: t('skin_type_dry'),       icon: '🏜️', desc: t('quiz_desc_dry', 'Dễ bong tróc, căng da') },
        { value: 'oily',        label: t('skin_type_oily'),        icon: '✨', desc: t('quiz_desc_oily', 'Bóng nhờn, lỗ chân lông to') },
        { value: 'combination', label: t('skin_type_combination'),   icon: '☯️', desc: t('quiz_desc_combination', 'Vùng T dầu, má khô') },
        { value: 'normal',      label: t('skin_type_normal'),     icon: '🌿', desc: t('quiz_desc_normal', 'Cân bằng, ít vấn đề') },
        { value: 'sensitive',   label: t('skin_type_sensitive'),  icon: '🌺', desc: t('quiz_desc_sensitive', 'Dễ kích ứng, đỏ da') },
      ],
    },
    {
      id: 'concerns',
      question: t('quiz_q_concerns', 'Vấn đề da chính của bạn?'),
      subtitle: t('quiz_sub_concerns', 'Có thể chọn nhiều vấn đề cùng một lúc'),
      type: 'multi',
      icon: '🔍',
      options: [
        { value: 'acne',       label: t('quiz_concern_acne', 'Mụn'),           icon: '🫧' },
        { value: 'aging',      label: t('quiz_concern_aging', 'Lão hóa'),       icon: '⏳' },
        { value: 'hydration',  label: t('quiz_concern_hydration', 'Thiếu ẩm'),      icon: '💧' },
        { value: 'dark_spots', label: t('quiz_concern_dark_spots', 'Thâm nám'),      icon: '🌑' },
        { value: 'pores',      label: t('quiz_concern_pores', 'Lỗ chân lông to'), icon: '🔬' },
        { value: 'dullness',   label: t('quiz_concern_dullness', 'Da sạm tối'),    icon: '🌙' },
      ],
    },
    {
      id: 'budget',
      question: t('quiz_q_budget', 'Ngân sách của bạn?'),
      subtitle: t('quiz_sub_budget', 'Chúng tôi sẽ gợi ý sản phẩm phù hợp với túi tiền của bạn'),
      type: 'single',
      icon: '💰',
      options: [
        { value: 20,   label: t('quiz_budget_under_20', 'Dưới $20'),       icon: '🟢', desc: t('quiz_budget_desc_under_20', 'Thân thiện với ví tiền') },
        { value: 50,   label: '$20 – $50',       icon: '🔵', desc: t('quiz_budget_desc_mid', 'Tầm trung, hiệu quả') },
        { value: 100,  label: '$50 – $100',      icon: '🟣', desc: t('quiz_budget_desc_high', 'Cao cấp, chất lượng') },
        { value: 9999, label: t('quiz_budget_unlimited', 'Không giới hạn'),  icon: '👑', desc: t('quiz_budget_desc_unlimited', 'Chỉ cần hiệu quả nhất') },
      ],
    },
    {
      id: 'category',
      question: t('quiz_q_category', 'Danh mục sản phẩm?'),
      subtitle: t('quiz_sub_category', 'Bạn đang tìm kiếm loại sản phẩm nào?'),
      type: 'single',
      icon: '🛍️',
      options: [
        { value: 'Moisturizers',          label: t('cat_Moisturizers'),       icon: '🧴' },
        { value: 'Serums & Essences',     label: t('cat_Serums & Essences'),           icon: '💧' },
        { value: 'Face Wash & Cleansers', label: t('cat_Face Wash & Cleansers'),    icon: '🫧' },
        { value: 'Face Masks',            label: t('cat_Face Masks'),          icon: '🎭' },
        { value: 'Face Sunscreen',        label: t('cat_Face Sunscreen'),      icon: '☀️' },
        { value: 'Anti-Aging',            label: t('cat_Anti-Aging'),   icon: '⏳' },
      ],
    },
  ];

  const TOTAL_STEPS = STEPS.length + 1; // +1 for results

  /* ─── Loading messages ──────────────────────────────── */
  const LOADING_MSGS = [
    t('quiz_loading_msg_1', 'Đang phân tích loại da của bạn…'),
    t('quiz_loading_msg_2', 'Tìm kiếm sản phẩm phù hợp nhất…'),
    t('quiz_loading_msg_3', 'Kiểm tra thành phần và đánh giá…'),
    t('quiz_loading_msg_4', 'Chuẩn bị gợi ý dành riêng cho bạn…'),
  ];

  const [step, setStep]               = useState(0);   // 0-3 = quiz, 4 = results
  const [direction, setDirection]     = useState('forward');
  const [animating, setAnimating]     = useState(false);

  // answers
  const [skinType, setSkinType]       = useState('');
  const [concerns, setConcerns]       = useState([]);
  const [budget, setBudget]           = useState(null);
  const [category, setCategory]       = useState('');

  // results
  const [loading, setLoading]         = useState(false);
  const [loadingMsg, setLoadingMsg]   = useState(0);
  const [products, setProducts]       = useState([]);
  const [error, setError]             = useState('');

  const stepRef = useRef(null);

  /* rotate loading messages */
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setLoadingMsg(m => (m + 1) % LOADING_MSGS.length), 1400);
    return () => clearInterval(id);
  }, [loading]);

  /* ── Navigation ── */
  const navigate = (newStep) => {
    if (animating) return;
    setDirection(newStep > step ? 'forward' : 'backward');
    setAnimating(true);
    setTimeout(() => {
      setStep(newStep);
      setAnimating(false);
    }, 320);
  };

  const canProceed = () => {
    if (step === 0) return !!skinType;
    if (step === 1) return concerns.length > 0;
    if (step === 2) return budget !== null;
    if (step === 3) return !!category;
    return false;
  };

  const handleNext = () => {
    if (!canProceed()) return;
    if (step < STEPS.length - 1) {
      navigate(step + 1);
    } else {
      // last quiz step → fetch results
      navigate(STEPS.length);
      fetchResults();
    }
  };

  const handleBack = () => {
    if (step > 0) navigate(step - 1);
  };

  /* ── API call ── */
  const fetchResults = async () => {
    setLoading(true);
    setError('');
    setProducts([]);
    try {
      // budget value: 20 → dưới $20, 50 → $20-50, 100 → $50-100, 9999 → không giới hạn
      // Backend sẽ tự parse bracket từ budget_max
      const { data } = await getSkinQuizRecs({
        skin_type:  skinType,
        concerns,
        category,           // giá trị khớp tertiary_category trong DB
        budget_max: budget, // bracket value: 20 | 50 | 100 | 9999
        top_k:      12,
      });
      setProducts(Array.isArray(data) ? data : data?.recommendations ?? []);
    } catch (e) {
      setError(t('quiz_error_msg', 'Không thể tải gợi ý. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  /* ── Reset ── */
  const restart = () => {
    setSkinType('');
    setConcerns([]);
    setBudget(null);
    setCategory('');
    setProducts([]);
    setError('');
    setStep(0);
  };

  /* ── Option toggle ── */
  const toggleConcern = (val) => {
    setConcerns(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  /* ── Render ── */
  const currentStep = STEPS[step];
  const isResults   = step === STEPS.length;
  const progress    = isResults ? 100 : ((step) / TOTAL_STEPS) * 100;

  return (
    <div className="quiz-page">
      {/* Background blobs */}
      <div className="quiz-bg-blob quiz-bg-blob--1" />
      <div className="quiz-bg-blob quiz-bg-blob--2" />
      <div className="quiz-bg-blob quiz-bg-blob--3" />

      <div className="quiz-wrapper">
        {/* ── Header / Progress ── */}
        <header className="quiz-header">
          <div className="quiz-header-top">
            <div className="quiz-logo">
              <Sparkles size={20} />
              <span>BeautyAI Skin Quiz</span>
            </div>
            {step > 0 && !isResults && (
              <button className="quiz-back-top" onClick={handleBack}>
                <ChevronLeft size={16} />
                {t('quiz_back')}
              </button>
            )}
          </div>

          {!isResults && (
            <>
              <div className="quiz-progress-bar" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className="quiz-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="quiz-step-indicator">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`quiz-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}
                  />
                ))}
                <span className="quiz-step-text">{t('quiz_step_indicator')} {step + 1}/{STEPS.length}</span>
              </div>
            </>
          )}
        </header>

        {/* ── Step content ── */}
        <div
          ref={stepRef}
          className={`quiz-step-content ${animating ? (direction === 'forward' ? 'exit-left' : 'exit-right') : 'enter'}`}
        >
          {!isResults ? (
            /* ── Quiz question ── */
            <div className="quiz-question-panel">
              <div className="quiz-question-icon">{currentStep.icon}</div>
              <h1 className="quiz-question-title">{currentStep.question}</h1>
              <p className="quiz-question-subtitle">{currentStep.subtitle}</p>

              {/* multi-select hint */}
              {currentStep.type === 'multi' && (
                <div className="quiz-multi-hint">
                  <span className="badge badge-primary">✓ {t('quiz_select_multiple', 'Chọn nhiều') || 'Chọn nhiều'}</span>
                </div>
              )}

              {/* Options grid */}
              <div className={`quiz-options-grid ${currentStep.options.length <= 4 ? 'grid-2' : 'grid-3'}`}>
                {currentStep.options.map((opt) => {
                  const isSelected = currentStep.type === 'multi'
                    ? concerns.includes(opt.value)
                    : (
                        step === 0 ? skinType === opt.value :
                        step === 2 ? budget === opt.value :
                        category === opt.value
                      );

                  const handleSelect = () => {
                    if (currentStep.type === 'multi') {
                      toggleConcern(opt.value);
                    } else {
                      if (step === 0) setSkinType(opt.value);
                      if (step === 2) setBudget(opt.value);
                      if (step === 3) setCategory(opt.value);
                    }
                  };

                  return (
                    <button
                      key={opt.value}
                      className={`quiz-option-card ${isSelected ? 'selected' : ''}`}
                      onClick={handleSelect}
                      aria-pressed={isSelected}
                    >
                      <span className="quiz-option-icon">{opt.icon}</span>
                      <span className="quiz-option-label">{opt.label}</span>
                      {opt.desc && <span className="quiz-option-desc">{opt.desc}</span>}
                      {isSelected && (
                        <span className="quiz-option-check" aria-hidden="true">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="quiz-nav">
                {step > 0 && (
                  <button className="btn btn-secondary quiz-btn-back" onClick={handleBack}>
                    <ChevronLeft size={18} />
                    {t('quiz_back')}
                  </button>
                )}
                <button
                  className={`btn btn-primary quiz-btn-next ${!canProceed() ? 'disabled' : ''}`}
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  {step === STEPS.length - 1 ? t('quiz_results_btn') : t('quiz_next')}
                  {step < STEPS.length - 1 && <ChevronRight size={18} />}
                </button>
              </div>
            </div>
          ) : (
            /* ── Results ── */
            <div className="quiz-results">
              {loading ? (
                <div className="quiz-loading">
                  <div className="quiz-loading-animation">
                    <div className="quiz-loading-ring" />
                    <div className="quiz-loading-ring quiz-loading-ring--2" />
                    <div className="quiz-loading-ring quiz-loading-ring--3" />
                    <span className="quiz-loading-emoji">✨</span>
                  </div>
                  <h2 className="quiz-loading-title">{t('quiz_loading_title')}</h2>
                  <p className="quiz-loading-msg">{LOADING_MSGS[loadingMsg]}</p>
                  <div className="quiz-loading-dots">
                    <span /><span /><span />
                  </div>
                </div>
              ) : error ? (
                <div className="quiz-error">
                  <div className="quiz-error-icon">😢</div>
                  <h2>{t('quiz_error_title', 'Ôi! Có lỗi xảy ra') || 'Ôi! Có lỗi xảy ra'}</h2>
                  <p>{error}</p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button className="btn btn-primary" onClick={fetchResults}>{t('common_retry', 'Thử lại')}</button>
                    <button className="btn btn-secondary" onClick={restart}>
                      <RotateCcw size={16} /> {t('quiz_restart')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Results header */}
                  <div className="quiz-results-header">
                    <div className="quiz-results-sparkle">✨</div>
                    <h1 className="quiz-results-title">
                      {t('quiz_results_title')}
                    </h1>
                    <p className="quiz-results-subtitle">
                      {t('quiz_results_subtitle')}
                    </p>

                    {/* Summary tags */}
                    <div className="quiz-results-tags">
                      {skinType && (
                        <span className="badge badge-primary">
                          🌸 {STEPS[0].options.find(o => o.value === skinType)?.label}
                        </span>
                      )}
                      {concerns.map(c => (
                        <span key={c} className="badge badge-secondary">
                          {STEPS[1].options.find(o => o.value === c)?.icon}{' '}
                          {STEPS[1].options.find(o => o.value === c)?.label}
                        </span>
                      ))}
                      {budget && (
                        <span className="badge badge-warning">
                          💰 {STEPS[2].options.find(o => o.value === budget)?.label}
                        </span>
                      )}
                      {category && (
                        <span className="badge badge-success">
                          {STEPS[3].options.find(o => o.value === category)?.icon}{' '}
                          {STEPS[3].options.find(o => o.value === category)?.label}
                        </span>
                      )}
                    </div>

                    <button className="btn btn-outline quiz-restart-btn" onClick={restart}>
                      <RotateCcw size={16} />
                      {t('quiz_restart')}
                    </button>
                  </div>

                  {/* Product grid */}
                  {products.length > 0 ? (
                    <div className="product-grid quiz-product-grid">
                      {products.map((p, i) => (
                        <div
                          key={p.product_id ?? i}
                          className="quiz-product-appear"
                          style={{ animationDelay: `${i * 60}ms` }}
                        >
                          <ProductCard product={p} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state-icon">🔍</div>
                      <h3>{t('quiz_no_results')}</h3>
                      <p>{t('prod_empty_desc')}</p>
                      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={restart}>
                        {t('quiz_restart')}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
