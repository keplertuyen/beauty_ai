import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Search, Plus, Edit3, Trash2, FlaskConical, AlertTriangle, X, Info } from 'lucide-react';
import {
  getAdminIngredients,
  createAdminIngredient,
  updateAdminIngredient,
  deleteAdminIngredient,
  getAdminConflictRules,
  createAdminConflictRule,
  updateAdminConflictRule,
  deleteAdminConflictRule,
} from '../../services/api';
import ConfirmDialog from './ConfirmDialog';

const EMPTY_ING = {
  inciName: '',
  functionGroup: 'Humectant',
  description: '',
  isActiveIngredient: false,
  comedogenicRating: '',
  irritationRating: '',
};

const EMPTY_CONFLICT = {
  activeIngredientA: '',
  activeIngredientB: '',
  severity: 'Warning',
  reason: '',
  recommendation: '',
};

const FUNCTION_GROUPS = [
  'Active',
  'Antioxidant',
  'Brightening',
  'Emollient',
  'Exfoliating',
  'Fragrance',
  'Humectant',
  'Preservative',
  'Soothing',
  'Sunscreen',
  'Surfactant',
  'Other',
];

const SEVERITY_STYLE = {
  high: { color: '#B91C1C', bg: '#FEE2E2', border: '#FECACA', label: 'High Risk' },
  danger: { color: '#B91C1C', bg: '#FEE2E2', border: '#FECACA', label: 'High Risk' },
  contraindication: { color: '#B91C1C', bg: '#FEE2E2', border: '#FECACA', label: 'Contraindication' },
  warning: { color: '#B45309', bg: '#FEF3C7', border: '#FDE68A', label: 'Warning' },
  info: { color: '#1D4ED8', bg: '#DBEAFE', border: '#BFDBFE', label: 'Info' },
};

const BANNER_STORAGE_KEY = 'beautyai_admin_intel_notice_dismissed';

export default function AdminIntelligenceSection({ defaultSubTab = 'ingredients', onSubTabChange }) {
  const [subTab, setSubTab] = useState(defaultSubTab);
  const [noticeDismissed, setNoticeDismissed] = useState(() => {
    try {
      return localStorage.getItem(BANNER_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    setSubTab(defaultSubTab);
  }, [defaultSubTab]);

  const switchSubTab = (next) => {
    setSubTab(next);
    onSubTabChange?.(next);
  };

  const toggleNotice = (dismissed) => {
    setNoticeDismissed(dismissed);
    try {
      localStorage.setItem(BANNER_STORAGE_KEY, dismissed ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

  // Autocomplete active ingredient suggestions
  const [activeSuggestions, setActiveSuggestions] = useState([]);

  useEffect(() => {
    getAdminIngredients({ active_only: true, page: 1, per_page: 100 })
      .then((res) => {
        const names = (res.data?.ingredients || []).map((i) => i.inciName).filter(Boolean);
        setActiveSuggestions(Array.from(new Set(names)));
      })
      .catch(() => {});
  }, []);

  // Ingredients state
  const [ingredients, setIngredients] = useState([]);
  const [ingLoading, setIngLoading] = useState(true);
  const [ingSearch, setIngSearch] = useState('');
  const [ingActiveOnly, setIngActiveOnly] = useState(false);
  const [ingPage, setIngPage] = useState(1);
  const [ingMeta, setIngMeta] = useState({ total: 0, pages: 1 });
  const [ingModal, setIngModal] = useState(null);
  const [ingForm, setIngForm] = useState(EMPTY_ING);

  // Conflicts state
  const [conflicts, setConflicts] = useState([]);
  const [confLoading, setConfLoading] = useState(true);
  const [confSearch, setConfSearch] = useState('');
  const [confSeverity, setConfSeverity] = useState('');
  const [confModal, setConfModal] = useState(null);
  const [confForm, setConfForm] = useState(EMPTY_CONFLICT);

  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'ingredient' | 'conflict', item }
  const [saving, setSaving] = useState(false);

  const loadIngredients = useCallback(async () => {
    setIngLoading(true);
    try {
      const res = await getAdminIngredients({
        q: ingSearch.trim() || undefined,
        active_only: ingActiveOnly || undefined,
        page: ingPage,
        per_page: 15,
      });
      setIngredients(res.data?.ingredients || []);
      setIngMeta({ total: res.data?.total || 0, pages: res.data?.pages || 1 });
    } catch (err) {
      if (err?.response?.status !== 401) {
        toast.error('Failed to load INCI dictionary.');
      }
    } finally {
      setIngLoading(false);
    }
  }, [ingSearch, ingActiveOnly, ingPage]);

  const loadConflicts = useCallback(async () => {
    setConfLoading(true);
    try {
      const res = await getAdminConflictRules({
        q: confSearch.trim() || undefined,
        severity: confSeverity || undefined,
      });
      setConflicts(res.data?.conflicts || []);
    } catch (err) {
      if (err?.response?.status !== 401) {
        toast.error('Failed to load conflict rules.');
      }
    } finally {
      setConfLoading(false);
    }
  }, [confSearch, confSeverity]);

  useEffect(() => {
    if (subTab === 'ingredients') {
      const t = setTimeout(loadIngredients, 200);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(loadConflicts, 200);
      return () => clearTimeout(t);
    }
  }, [subTab, loadIngredients, loadConflicts]);

  useEffect(() => {
    if (!ingModal && !confModal) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !saving) {
        setIngModal(null);
        setConfModal(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ingModal, confModal, saving]);

  const dynamicFunctionGroups = Array.from(
    new Set([...FUNCTION_GROUPS, ...ingredients.map((i) => i.functionGroup).filter(Boolean)])
  ).sort();

  const openCreateIng = () => {
    setIngForm(EMPTY_ING);
    setIngModal({ mode: 'create' });
  };

  const openEditIng = (item) => {
    setIngForm({
      inciName: item.inciName || '',
      functionGroup: item.functionGroup || 'Other',
      description: item.description || '',
      isActiveIngredient: Boolean(item.isActiveIngredient),
      comedogenicRating: item.comedogenicRating != null ? String(item.comedogenicRating) : '',
      irritationRating: item.irritationRating != null ? String(item.irritationRating) : '',
    });
    setIngModal({ mode: 'edit', id: item.id });
  };

  const handleSaveIng = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        inciName: ingForm.inciName.trim(),
        functionGroup: ingForm.functionGroup.trim() || 'Other',
        description: ingForm.description.trim() || null,
        isActiveIngredient: ingForm.isActiveIngredient,
        comedogenicRating: ingForm.comedogenicRating !== '' ? Number(ingForm.comedogenicRating) : null,
        irritationRating: ingForm.irritationRating !== '' ? Number(ingForm.irritationRating) : null,
      };
      if (ingModal.mode === 'create') {
        await createAdminIngredient(payload);
        toast.success('INCI ingredient added.');
      } else {
        await updateAdminIngredient(ingModal.id, payload);
        toast.success('INCI ingredient updated.');
      }
      setIngModal(null);
      await loadIngredients();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save ingredient.');
    } finally {
      setSaving(false);
    }
  };

  const requestDeleteIng = (item) => {
    if (item.productsCount > 0) {
      toast.error(`Cannot delete "${item.inciName}" because it is linked to ${item.productsCount} products.`);
      return;
    }
    setDeleteTarget({ type: 'ingredient', item });
  };

  const openCreateConf = () => {
    setConfForm(EMPTY_CONFLICT);
    setConfModal({ mode: 'create' });
  };

  const openEditConf = (item) => {
    setConfForm({
      activeIngredientA: item.activeIngredientA || '',
      activeIngredientB: item.activeIngredientB || '',
      severity: item.severity || 'Warning',
      reason: item.reason || '',
      recommendation: item.recommendation || '',
    });
    setConfModal({ mode: 'edit', id: item.id });
  };

  const handleSaveConf = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        activeIngredientA: confForm.activeIngredientA.trim(),
        activeIngredientB: confForm.activeIngredientB.trim(),
        severity: confForm.severity,
        reason: confForm.reason.trim(),
        recommendation: confForm.recommendation.trim(),
      };
      if (confModal.mode === 'create') {
        await createAdminConflictRule(payload);
        toast.success('Conflict rule created.');
      } else {
        await updateAdminConflictRule(confModal.id, payload);
        toast.success('Conflict rule updated.');
      }
      setConfModal(null);
      await loadConflicts();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save conflict rule.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      if (deleteTarget.type === 'ingredient') {
        await deleteAdminIngredient(deleteTarget.item.id);
        toast.success(`Deleted ingredient "${deleteTarget.item.inciName}".`);
        await loadIngredients();
      } else {
        await deleteAdminConflictRule(deleteTarget.item.id);
        toast.success('Conflict rule deleted.');
        await loadConflicts();
      }
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Delete failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="ad-section">
      <div className="ad-section-header">
        <div>
          <h2 className="ad-section-title">
            {subTab === 'ingredients' ? 'INCI Ingredient Dictionary' : 'Active Ingredient Conflict Rules'}
          </h2>
          <p className="ad-section-subtitle">
            {subTab === 'ingredients'
              ? 'Manage ingredient functions, comedogenic (0–5), and irritation ratings powering INCI analysis'
              : 'Configure incompatible active pairs for the Smart Conflict Detector'}
          </p>
        </div>

        <div className="ad-action-group">
          {noticeDismissed && (
            <button
              type="button"
              className="btn btn-secondary btn-sm ad-btn-icon"
              onClick={() => toggleNotice(false)}
              title="Show data safety notice"
            >
              <Info size={14} /> Safety Note
            </button>
          )}
          <div className="ad-segmented" role="tablist" aria-label="Cosmetic intelligence tabs">
            <button
              type="button"
              role="tab"
              aria-selected={subTab === 'ingredients'}
              className={`ad-seg-btn ${subTab === 'ingredients' ? 'active' : ''}`}
              onClick={() => switchSubTab('ingredients')}
            >
              <FlaskConical size={14} /> INCI
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={subTab === 'conflicts'}
              className={`ad-seg-btn ${subTab === 'conflicts' ? 'active' : ''}`}
              onClick={() => switchSubTab('conflicts')}
            >
              <AlertTriangle size={14} /> Conflicts
            </button>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm ad-btn-icon"
            onClick={subTab === 'ingredients' ? openCreateIng : openCreateConf}
          >
            <Plus size={15} />
            <span>{subTab === 'ingredients' ? 'Add INCI' : 'Add Rule'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Safety Impact Notice */}
      {!noticeDismissed && (
        <div className="ad-warning-banner" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              {subTab === 'ingredients'
                ? 'Data safety notice: Editing INCI names or Comedogenic/Irritation ratings directly affects Ingredient Analyzer and product suitability scores. Ingredients linked to products cannot be deleted.'
                : 'Dermatological safety notice: Deleting or lowering conflict severities disables customer warnings in Cart and Routine Builder. Edit only with verified evidence.'}
            </span>
          </div>
          <button
            type="button"
            className="ad-icon-close"
            style={{ width: 26, height: 26, background: 'rgba(146,64,14,0.1)', color: '#92400E', flexShrink: 0 }}
            onClick={() => toggleNotice(true)}
            aria-label="Dismiss safety notice"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── SUBTAB 1: INCI DICTIONARY ── */}
      {subTab === 'ingredients' && (
        <>
          <div className="ad-toolbar glass-card">
            <div className="ad-search-box">
              <Search size={16} className="ad-search-icon" />
              <input
                type="search"
                className="form-input ad-search-input"
                placeholder="Search by INCI name, function group, or description..."
                value={ingSearch}
                onChange={(e) => {
                  setIngPage(1);
                  setIngSearch(e.target.value);
                }}
                aria-label="Search INCI ingredients"
              />
            </div>
            <label className="ad-checkbox-pill">
              <input
                type="checkbox"
                checked={ingActiveOnly}
                onChange={(e) => {
                  setIngPage(1);
                  setIngActiveOnly(e.target.checked);
                }}
              />
              <span>Active ingredients only</span>
            </label>
          </div>

          <div className="ad-table-card glass-card">
            <div className="ad-table-wrapper">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>INCI Name</th>
                    <th>Function Group</th>
                    <th>Type</th>
                    <th>Comedogenic</th>
                    <th>Irritation</th>
                    <th>Linked Products</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className={ingLoading && ingredients.length > 0 ? 'ad-tbody-loading' : ''}>
                  {ingredients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="ad-table-empty">
                        {ingLoading ? 'Loading INCI dictionary...' : 'No ingredients found.'}
                      </td>
                    </tr>
                  ) : (
                    ingredients.map((item) => (
                      <tr key={item.id} className="ad-table-row">
                        <th scope="row" className="ad-row-header">
                          <strong>{item.inciName}</strong>
                          {item.description && (
                            <div className="ad-cell-meta ad-truncate-cell" title={item.description}>
                              {item.description}
                            </div>
                          )}
                        </th>
                        <td><span className="ad-category-chip">{item.functionGroup}</span></td>
                        <td>
                          {item.isActiveIngredient ? (
                            <span className="ad-status-pill" style={{ color: '#047857', background: '#D1FAE5' }}>Active</span>
                          ) : (
                            <span className="ad-cell-meta">Base</span>
                          )}
                        </td>
                        <td>{item.comedogenicRating != null ? `${item.comedogenicRating}/5` : '—'}</td>
                        <td>{item.irritationRating != null ? `${item.irritationRating}/5` : '—'}</td>
                        <td>
                          <span className="ad-meta-tag">
                            {item.productsCount} {item.productsCount === 1 ? 'item' : 'items'}
                          </span>
                        </td>
                        <td>
                          <div className="ad-action-group">
                            <button type="button" className="btn btn-secondary btn-sm ad-btn-icon" onClick={() => openEditIng(item)}>
                              <Edit3 size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm ad-archive-btn ad-btn-icon"
                              onClick={() => requestDeleteIng(item)}
                              aria-label={`Delete ingredient ${item.inciName}`}
                              title={item.productsCount > 0 ? 'Cannot delete ingredient linked to products' : 'Delete ingredient'}
                              style={{ opacity: item.productsCount > 0 ? 0.45 : 1 }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="ad-pagination-bar">
              <span className="ad-pagination-info">
                Page {ingPage} of {ingMeta.pages} ({ingMeta.total.toLocaleString('en-US')} ingredients)
              </span>
              <div className="ad-action-group">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={ingPage <= 1 || ingLoading}
                  onClick={() => setIngPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={ingPage >= ingMeta.pages || ingLoading}
                  onClick={() => setIngPage((p) => Math.min(ingMeta.pages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── SUBTAB 2: CONFLICT RULES ── */}
      {subTab === 'conflicts' && (
        <>
          <div className="ad-toolbar glass-card">
            <div className="ad-search-box">
              <Search size={16} className="ad-search-icon" />
              <input
                type="search"
                className="form-input ad-search-input"
                placeholder="Search active A, B, mechanism, or recommendation..."
                value={confSearch}
                onChange={(e) => setConfSearch(e.target.value)}
                aria-label="Search conflict rules"
              />
            </div>
            <div className="ad-toolbar-selects">
              <select
                className="form-select"
                value={confSeverity}
                onChange={(e) => setConfSeverity(e.target.value)}
                aria-label="Filter by severity"
              >
                <option value="">All Severities</option>
                <option value="Contraindication">Contraindication</option>
                <option value="High">High Risk</option>
                <option value="Warning">Warning</option>
                <option value="Info">Info</option>
              </select>
            </div>
          </div>

          <div className="ad-table-card glass-card">
            <div className="ad-table-wrapper">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Conflicting Active Pair</th>
                    <th>Severity</th>
                    <th>Mechanism / Reason</th>
                    <th>Recommendation</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className={confLoading && conflicts.length > 0 ? 'ad-tbody-loading' : ''}>
                  {conflicts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="ad-table-empty">
                        {confLoading ? 'Loading conflict rules...' : 'No conflict rules found.'}
                      </td>
                    </tr>
                  ) : (
                    conflicts.map((c) => {
                      const sevKey = String(c.severity || 'warning').toLowerCase();
                      const sev = SEVERITY_STYLE[sevKey] || SEVERITY_STYLE.warning;
                      return (
                        <tr key={c.id} className="ad-table-row">
                          <th scope="row" className="ad-row-header">
                            <strong>{c.activeIngredientA}</strong>
                            <span style={{ color: '#B91C1C', margin: '0 6px' }}>×</span>
                            <strong>{c.activeIngredientB}</strong>
                          </th>
                          <td>
                            <span
                              className="ad-status-pill"
                              style={{ color: sev.color, background: sev.bg, borderColor: sev.border }}
                            >
                              {sev.label}
                            </span>
                          </td>
                          <td><div className="ad-review-content" title={c.reason}>{c.reason}</div></td>
                          <td><div className="ad-review-content" title={c.recommendation}>{c.recommendation}</div></td>
                          <td>
                            <div className="ad-action-group">
                              <button type="button" className="btn btn-secondary btn-sm ad-btn-icon" onClick={() => openEditConf(c)}>
                                <Edit3 size={13} /> Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm ad-archive-btn ad-btn-icon"
                                onClick={() => setDeleteTarget({ type: 'conflict', item: c })}
                                aria-label={`Delete conflict rule ${c.activeIngredientA} and ${c.activeIngredientB}`}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Ingredient Modal */}
      {ingModal && (
        <div className="ad-modal-backdrop" role="presentation" onClick={() => !saving && setIngModal(null)}>
          <div className="ad-modal-card" role="dialog" aria-modal="true" aria-labelledby="ing-modal-title" onClick={(e) => e.stopPropagation()}>
            <div className="ad-drawer-header">
              <h3 id="ing-modal-title" className="ad-drawer-title">
                {ingModal.mode === 'create' ? 'Add INCI Ingredient' : 'Edit INCI Ingredient'}
              </h3>
              <button type="button" className="ad-icon-close" onClick={() => setIngModal(null)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveIng} className="ad-modal-form">
              <div className="form-group">
                <label htmlFor="ing-name" className="form-label">Standard INCI Name *</label>
                <input
                  id="ing-name"
                  className="form-input"
                  required
                  value={ingForm.inciName}
                  onChange={(e) => setIngForm({ ...ingForm, inciName: e.target.value })}
                  placeholder="e.g. Niacinamide"
                />
              </div>
              <div className="ad-form-grid-2">
                <div className="form-group">
                  <label htmlFor="ing-group" className="form-label">Function Group</label>
                  <input
                    id="ing-group"
                    list="ing-function-groups"
                    className="form-input"
                    value={ingForm.functionGroup}
                    onChange={(e) => setIngForm({ ...ingForm, functionGroup: e.target.value })}
                    placeholder="Select or type function group..."
                  />
                  <datalist id="ing-function-groups">
                    {dynamicFunctionGroups.map((g) => (
                      <option key={g} value={g} />
                    ))}
                  </datalist>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <label className="ad-checkbox-pill" style={{ width: '100%' }}>
                    <input
                      type="checkbox"
                      checked={ingForm.isActiveIngredient}
                      onChange={(e) => setIngForm({ ...ingForm, isActiveIngredient: e.target.checked })}
                    />
                    <span>Key Active Ingredient</span>
                  </label>
                </div>
              </div>
              <div className="ad-form-grid-2">
                <div className="form-group">
                  <label htmlFor="ing-comedo" className="form-label">Comedogenic Rating (0–5)</label>
                  <input
                    id="ing-comedo"
                    type="number"
                    min="0"
                    max="5"
                    className="form-input"
                    value={ingForm.comedogenicRating}
                    onChange={(e) => setIngForm({ ...ingForm, comedogenicRating: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="ing-irrit" className="form-label">Irritation Rating (0–5)</label>
                  <input
                    id="ing-irrit"
                    type="number"
                    min="0"
                    max="5"
                    className="form-input"
                    value={ingForm.irritationRating}
                    onChange={(e) => setIngForm({ ...ingForm, irritationRating: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="ing-desc" className="form-label">Description</label>
                <textarea
                  id="ing-desc"
                  className="form-input"
                  rows={3}
                  value={ingForm.description}
                  onChange={(e) => setIngForm({ ...ingForm, description: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIngModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conflict Rule Modal with INCI Autocomplete */}
      {confModal && (
        <div className="ad-modal-backdrop" role="presentation" onClick={() => !saving && setConfModal(null)}>
          <div className="ad-modal-card" role="dialog" aria-modal="true" aria-labelledby="conf-modal-title" onClick={(e) => e.stopPropagation()}>
            <div className="ad-drawer-header">
              <h3 id="conf-modal-title" className="ad-drawer-title">
                {confModal.mode === 'create' ? 'Add Conflict Rule' : 'Edit Conflict Rule'}
              </h3>
              <button type="button" className="ad-icon-close" onClick={() => setConfModal(null)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveConf} className="ad-modal-form">
              <datalist id="active-inci-suggestions">
                {activeSuggestions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <div className="ad-form-grid-2">
                <div className="form-group">
                  <label htmlFor="conf-a" className="form-label">Active Ingredient A *</label>
                  <input
                    id="conf-a"
                    list="active-inci-suggestions"
                    className="form-input"
                    required
                    value={confForm.activeIngredientA}
                    onChange={(e) => setConfForm({ ...confForm, activeIngredientA: e.target.value })}
                    placeholder="e.g. Retinol"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="conf-b" className="form-label">Active Ingredient B *</label>
                  <input
                    id="conf-b"
                    list="active-inci-suggestions"
                    className="form-input"
                    required
                    value={confForm.activeIngredientB}
                    onChange={(e) => setConfForm({ ...confForm, activeIngredientB: e.target.value })}
                    placeholder="e.g. Glycolic Acid (AHA)"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="conf-sev" className="form-label">Severity</label>
                <select
                  id="conf-sev"
                  className="form-select"
                  value={confForm.severity}
                  onChange={(e) => setConfForm({ ...confForm, severity: e.target.value })}
                >
                  <option value="Contraindication">Contraindication (Do not combine)</option>
                  <option value="High">High Risk (Avoid using together)</option>
                  <option value="Warning">Warning (Separate AM/PM or alternate nights)</option>
                  <option value="Info">Info (General guidance)</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="conf-reason" className="form-label">Mechanism / Reason *</label>
                <textarea
                  id="conf-reason"
                  className="form-input"
                  rows={2}
                  required
                  value={confForm.reason}
                  onChange={(e) => setConfForm({ ...confForm, reason: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="conf-rec" className="form-label">Recommendation *</label>
                <textarea
                  id="conf-rec"
                  className="form-input"
                  rows={2}
                  required
                  value={confForm.recommendation}
                  onChange={(e) => setConfForm({ ...confForm, recommendation: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'ingredient' ? 'Delete Ingredient?' : 'Delete Conflict Rule?'}
        message={
          deleteTarget?.type === 'ingredient'
            ? `Permanently delete "${deleteTarget.item.inciName}" from the INCI dictionary?`
            : deleteTarget
              ? `Permanently delete conflict rule "${deleteTarget.item.activeIngredientA} × ${deleteTarget.item.activeIngredientB}"? Customers will no longer be warned about this pair.`
              : ''
        }
        confirmLabel="Delete"
        tone="danger"
        busy={saving}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}
