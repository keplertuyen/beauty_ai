import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Search, Plus, Edit3, Trash2, Tag, FolderTree, X } from 'lucide-react';
import {
  getAdminBrands,
  createAdminBrand,
  updateAdminBrand,
  deleteAdminBrand,
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from '../../services/api';
import ConfirmDialog from './ConfirmDialog';

export default function AdminCatalogMetaSection({ onCatalogChanged }) {
  const [subTab, setSubTab] = useState('brands');

  // Unfiltered totals fetched upfront so segmented tabs stay accurate
  const [totalBrands, setTotalBrands] = useState(null);
  const [totalCategories, setTotalCategories] = useState(null);

  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandSearch, setBrandSearch] = useState('');
  const [brandModal, setBrandModal] = useState(null);
  const [brandForm, setBrandForm] = useState({ name: '', originCountry: '' });

  const [categories, setCategories] = useState([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [catSearch, setCatSearch] = useState('');
  const [catModal, setCatModal] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', parentId: '' });

  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'brand' | 'category', item }
  const [saving, setSaving] = useState(false);

  const refreshTotals = useCallback(async () => {
    try {
      const [bRes, cRes] = await Promise.all([getAdminBrands({}), getAdminCategories({})]);
      setTotalBrands(bRes.data?.total ?? (bRes.data?.brands?.length || 0));
      setTotalCategories(cRes.data?.total ?? (cRes.data?.categories?.length || 0));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshTotals();
  }, [refreshTotals]);

  const loadBrands = useCallback(async () => {
    setBrandsLoading(true);
    try {
      const res = await getAdminBrands({ q: brandSearch.trim() || undefined });
      setBrands(res.data?.brands || []);
      if (!brandSearch.trim()) {
        setTotalBrands(res.data?.total ?? (res.data?.brands?.length || 0));
      }
    } catch (err) {
      if (err?.response?.status !== 401) {
        toast.error('Failed to load brands.');
      }
    } finally {
      setBrandsLoading(false);
    }
  }, [brandSearch]);

  const loadCategories = useCallback(async () => {
    setCatsLoading(true);
    try {
      const res = await getAdminCategories({ q: catSearch.trim() || undefined });
      setCategories(res.data?.categories || []);
      if (!catSearch.trim()) {
        setTotalCategories(res.data?.total ?? (res.data?.categories?.length || 0));
      }
    } catch (err) {
      if (err?.response?.status !== 401) {
        toast.error('Failed to load categories.');
      }
    } finally {
      setCatsLoading(false);
    }
  }, [catSearch]);

  useEffect(() => {
    if (subTab === 'brands') {
      const t = setTimeout(loadBrands, 180);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(loadCategories, 180);
      return () => clearTimeout(t);
    }
  }, [subTab, loadBrands, loadCategories]);

  useEffect(() => {
    if (!brandModal && !catModal) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !saving) {
        setBrandModal(null);
        setCatModal(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [brandModal, catModal, saving]);

  const openCreateBrand = () => {
    setBrandForm({ name: '', originCountry: '' });
    setBrandModal({ mode: 'create' });
  };

  const openEditBrand = (b) => {
    setBrandForm({ name: b.name || '', originCountry: b.originCountry || '' });
    setBrandModal({ mode: 'edit', id: b.id });
  };

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: brandForm.name.trim(),
        originCountry: brandForm.originCountry.trim() || null,
      };
      if (brandModal.mode === 'create') {
        await createAdminBrand(payload);
        toast.success('Brand created.');
      } else {
        await updateAdminBrand(brandModal.id, payload);
        toast.success('Brand updated.');
      }
      setBrandModal(null);
      await Promise.all([loadBrands(), refreshTotals()]);
      onCatalogChanged?.();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save brand.');
    } finally {
      setSaving(false);
    }
  };

  const requestDeleteBrand = (b) => {
    if (b.productsCount > 0) {
      toast.error(`Cannot delete "${b.name}" because it still has ${b.productsCount} linked products.`);
      return;
    }
    setDeleteTarget({ type: 'brand', item: b });
  };

  const openCreateCat = () => {
    setCatForm({ name: '', parentId: '' });
    setCatModal({ mode: 'create' });
  };

  const openEditCat = (c) => {
    setCatForm({ name: c.name || '', parentId: c.parentId != null ? String(c.parentId) : '' });
    setCatModal({ mode: 'edit', id: c.id });
  };

  const handleSaveCat = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: catForm.name.trim(),
        parentId: catForm.parentId ? Number(catForm.parentId) : null,
      };
      if (catModal.mode === 'create') {
        await createAdminCategory(payload);
        toast.success('Category created.');
      } else {
        await updateAdminCategory(catModal.id, payload);
        toast.success('Category updated.');
      }
      setCatModal(null);
      await Promise.all([loadCategories(), refreshTotals()]);
      onCatalogChanged?.();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const requestDeleteCat = (c) => {
    if (c.productsCount > 0 || c.subCategoriesCount > 0) {
      toast.error(
        `Cannot delete "${c.name}" while it has ${c.productsCount} products or ${c.subCategoriesCount} subcategories.`
      );
      return;
    }
    setDeleteTarget({ type: 'category', item: c });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      if (deleteTarget.type === 'brand') {
        await deleteAdminBrand(deleteTarget.item.id);
        toast.success(`Deleted brand "${deleteTarget.item.name}".`);
        await Promise.all([loadBrands(), refreshTotals()]);
      } else {
        await deleteAdminCategory(deleteTarget.item.id);
        toast.success(`Deleted category "${deleteTarget.item.name}".`);
        await Promise.all([loadCategories(), refreshTotals()]);
      }
      setDeleteTarget(null);
      onCatalogChanged?.();
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
            {subTab === 'brands' ? 'Brand Management' : 'Category Management'}
          </h2>
          <p className="ad-section-subtitle">
            Create, edit, and organize brands and categories. Deletion is blocked while products reference an item.
          </p>
        </div>

        <div className="ad-action-group">
          <div className="ad-segmented" role="tablist" aria-label="Catalog metadata tabs">
            <button
              type="button"
              role="tab"
              aria-selected={subTab === 'brands'}
              className={`ad-seg-btn ${subTab === 'brands' ? 'active' : ''}`}
              onClick={() => setSubTab('brands')}
            >
              <Tag size={14} /> Brands{totalBrands != null ? ` (${totalBrands})` : ''}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={subTab === 'categories'}
              className={`ad-seg-btn ${subTab === 'categories' ? 'active' : ''}`}
              onClick={() => setSubTab('categories')}
            >
              <FolderTree size={14} /> Categories{totalCategories != null ? ` (${totalCategories})` : ''}
            </button>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm ad-btn-icon"
            onClick={subTab === 'brands' ? openCreateBrand : openCreateCat}
          >
            <Plus size={15} />
            <span>{subTab === 'brands' ? 'Add Brand' : 'Add Category'}</span>
          </button>
        </div>
      </div>

      {/* ── BRANDS TAB ── */}
      {subTab === 'brands' && (
        <>
          <div className="ad-toolbar glass-card">
            <div className="ad-search-box">
              <Search size={16} className="ad-search-icon" />
              <input
                type="search"
                className="form-input ad-search-input"
                placeholder="Search by brand name, slug, or origin country..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                aria-label="Search brands"
              />
            </div>
          </div>

          <div className="ad-table-card glass-card">
            <div className="ad-table-wrapper">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Brand</th>
                    <th>Slug</th>
                    <th>Origin</th>
                    <th>Products</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className={brandsLoading && brands.length > 0 ? 'ad-tbody-loading' : ''}>
                  {brands.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="ad-table-empty">
                        {brandsLoading ? 'Loading brands...' : 'No brands found.'}
                      </td>
                    </tr>
                  ) : (
                    brands.map((b) => (
                      <tr key={b.id} className="ad-table-row">
                        <th scope="row" className="ad-row-header"><strong>{b.name}</strong></th>
                        <td><span className="ad-code-text">{b.slug}</span></td>
                        <td>{b.originCountry || <span className="ad-cell-meta">—</span>}</td>
                        <td>
                          <span className="ad-meta-tag">
                            {b.productsCount} {b.productsCount === 1 ? 'item' : 'items'}
                          </span>
                        </td>
                        <td>
                          <div className="ad-action-group">
                            <button type="button" className="btn btn-secondary btn-sm ad-btn-icon" onClick={() => openEditBrand(b)}>
                              <Edit3 size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm ad-archive-btn ad-btn-icon"
                              onClick={() => requestDeleteBrand(b)}
                              aria-label={`Delete brand ${b.name}`}
                              title={b.productsCount > 0 ? 'Cannot delete a brand with linked products' : 'Delete brand'}
                              style={{ opacity: b.productsCount > 0 ? 0.45 : 1 }}
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
          </div>
        </>
      )}

      {/* ── CATEGORIES TAB ── */}
      {subTab === 'categories' && (
        <>
          <div className="ad-toolbar glass-card">
            <div className="ad-search-box">
              <Search size={16} className="ad-search-icon" />
              <input
                type="search"
                className="form-input ad-search-input"
                placeholder="Search by category name, slug, or parent..."
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                aria-label="Search categories"
              />
            </div>
          </div>

          <div className="ad-table-card glass-card">
            <div className="ad-table-wrapper">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Slug</th>
                    <th>Parent</th>
                    <th>Products</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className={catsLoading && categories.length > 0 ? 'ad-tbody-loading' : ''}>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="ad-table-empty">
                        {catsLoading ? 'Loading categories...' : 'No categories found.'}
                      </td>
                    </tr>
                  ) : (
                    categories.map((c) => {
                      const locked = c.productsCount > 0 || c.subCategoriesCount > 0;
                      return (
                        <tr key={c.id} className="ad-table-row">
                          <th scope="row" className="ad-row-header">
                            <strong>{c.name}</strong>
                            {c.subCategoriesCount > 0 && (
                              <span className="ad-cell-meta" style={{ marginLeft: 8 }}>
                                ({c.subCategoriesCount} sub)
                              </span>
                            )}
                          </th>
                          <td><span className="ad-code-text">{c.slug}</span></td>
                          <td>
                            {c.parentName ? (
                              <span className="ad-category-chip">{c.parentName}</span>
                            ) : (
                              <span className="ad-cell-meta">Root</span>
                            )}
                          </td>
                          <td>
                            <span className="ad-meta-tag">
                              {c.productsCount} {c.productsCount === 1 ? 'item' : 'items'}
                            </span>
                          </td>
                          <td>
                            <div className="ad-action-group">
                              <button type="button" className="btn btn-secondary btn-sm ad-btn-icon" onClick={() => openEditCat(c)}>
                                <Edit3 size={13} /> Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm ad-archive-btn ad-btn-icon"
                                onClick={() => requestDeleteCat(c)}
                                aria-label={`Delete category ${c.name}`}
                                title={locked ? 'Cannot delete while products or subcategories exist' : 'Delete category'}
                                style={{ opacity: locked ? 0.45 : 1 }}
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

      {/* Brand Modal */}
      {brandModal && (
        <div className="ad-modal-backdrop" role="presentation" onClick={() => !saving && setBrandModal(null)}>
          <div className="ad-modal-card" role="dialog" aria-modal="true" aria-labelledby="brand-modal-title" onClick={(e) => e.stopPropagation()}>
            <div className="ad-drawer-header">
              <h3 id="brand-modal-title" className="ad-drawer-title">
                {brandModal.mode === 'create' ? 'Add Brand' : 'Edit Brand'}
              </h3>
              <button type="button" className="ad-icon-close" onClick={() => setBrandModal(null)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveBrand} className="ad-modal-form">
              <div className="form-group">
                <label htmlFor="br-name" className="form-label">Brand Name *</label>
                <input
                  id="br-name"
                  className="form-input"
                  required
                  value={brandForm.name}
                  onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                  placeholder="e.g. La Roche-Posay"
                />
              </div>
              <div className="form-group">
                <label htmlFor="br-origin" className="form-label">Origin Country</label>
                <input
                  id="br-origin"
                  className="form-input"
                  value={brandForm.originCountry}
                  onChange={(e) => setBrandForm({ ...brandForm, originCountry: e.target.value })}
                  placeholder="e.g. France, South Korea, USA"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setBrandModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {catModal && (
        <div className="ad-modal-backdrop" role="presentation" onClick={() => !saving && setCatModal(null)}>
          <div className="ad-modal-card" role="dialog" aria-modal="true" aria-labelledby="cat-modal-title" onClick={(e) => e.stopPropagation()}>
            <div className="ad-drawer-header">
              <h3 id="cat-modal-title" className="ad-drawer-title">
                {catModal.mode === 'create' ? 'Add Category' : 'Edit Category'}
              </h3>
              <button type="button" className="ad-icon-close" onClick={() => setCatModal(null)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveCat} className="ad-modal-form">
              <div className="form-group">
                <label htmlFor="cat-name" className="form-label">Category Name *</label>
                <input
                  id="cat-name"
                  className="form-input"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="e.g. Serums & Treatments"
                />
              </div>
              <div className="form-group">
                <label htmlFor="cat-parent" className="form-label">Parent Category (optional)</label>
                <select
                  id="cat-parent"
                  className="form-select"
                  value={catForm.parentId}
                  onChange={(e) => setCatForm({ ...catForm, parentId: e.target.value })}
                >
                  <option value="">— None (Root Category) —</option>
                  {categories
                    .filter((c) => c.id !== catModal.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCatModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'brand' ? 'Delete Brand?' : 'Delete Category?'}
        message={
          deleteTarget
            ? `Permanently delete ${deleteTarget.type} "${deleteTarget.item.name}"?`
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
