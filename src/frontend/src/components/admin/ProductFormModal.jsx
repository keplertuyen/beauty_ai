import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { uploadAdminProductImage } from '../../services/api';
import { DEFAULT_PRODUCT_IMAGE } from '../../utils/productImages';
import { DEPARTMENTS } from './adminConstants';

const ALLOWED_SKIN_TYPES = ['All', 'Oily', 'Dry', 'Combination', 'Sensitive', 'Normal'];
const ALLOWED_STATUSES = [
  { value: 'Active', label: 'Active (On Sale)' },
  { value: 'Draft', label: 'Draft (Hidden)' },
  { value: 'Discontinued', label: 'Discontinued (Archived)' },
];

const EMPTY_FORM = {
  name: '',
  brandName: '',
  categoryName: '',
  department: 'Skincare',
  priceUsd: '',
  stockQuantity: '100',
  volumeMl: '',
  sizeDisplay: '',
  sellingStatus: 'Active',
  targetSkinTypes: ['All'],
  ingredientListRaw: '',
  description: '',
  imageUrl: '',
};

export default function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialProduct = null,
  brands = [],
  categories = [],
  submitting = false,
}) {
  const isEdit = Boolean(initialProduct?.id);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef(null);
  const fieldRefs = useRef({});

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});

    if (initialProduct) {
      setForm({
        name: initialProduct.name || '',
        brandName: initialProduct.brandName || brands[0]?.name || '',
        categoryName: initialProduct.categoryName || categories[0]?.name || '',
        department: initialProduct.department || 'Skincare',
        priceUsd: initialProduct.priceUsd != null ? String(initialProduct.priceUsd) : '',
        stockQuantity: initialProduct.stockQuantity != null ? String(initialProduct.stockQuantity) : '100',
        volumeMl: initialProduct.volumeMl != null ? String(initialProduct.volumeMl) : '',
        sizeDisplay: initialProduct.sizeDisplay || '',
        sellingStatus: initialProduct.sellingStatus || 'Active',
        targetSkinTypes:
          Array.isArray(initialProduct.targetSkinTypes) && initialProduct.targetSkinTypes.length > 0
            ? initialProduct.targetSkinTypes
            : ['All'],
        ingredientListRaw:
          initialProduct.ingredientListRaw === 'No ingredients listed'
            ? ''
            : initialProduct.ingredientListRaw || '',
        description: initialProduct.description || '',
        imageUrl: initialProduct.imageUrl || '',
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        brandName: brands[0]?.name || '',
        categoryName: categories[0]?.name || '',
      });
    }
  }, [isOpen, initialProduct, brands, categories]);

  // Esc key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !submitting) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const isToolDepartment = form.department === 'Tools & Brushes';

  // Mutually exclusive "All" skin type selection
  const toggleSkinType = (skinType) => {
    setForm((prev) => {
      if (skinType === 'All') {
        return { ...prev, targetSkinTypes: ['All'] };
      }
      const withoutAll = prev.targetSkinTypes.filter((s) => s !== 'All');
      const exists = withoutAll.includes(skinType);
      const next = exists
        ? withoutAll.filter((s) => s !== skinType)
        : [...withoutAll, skinType];
      return { ...prev, targetSkinTypes: next.length > 0 ? next : ['All'] };
    });
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await uploadAdminProductImage(file);
      const uploadedUrl = res.data?.url;
      if (uploadedUrl) {
        setForm((prev) => ({ ...prev, imageUrl: uploadedUrl }));
        toast.success('Product image uploaded successfully.');
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Image upload failed (max 5MB, JPG/PNG/WEBP).');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) {
      nextErrors.name = 'Product name is required.';
    } else if (form.name.trim().length > 255) {
      nextErrors.name = 'Product name must be 255 characters or fewer.';
    }

    const matchedBrand = brands.find(
      (b) => b.name?.toLowerCase() === form.brandName.trim().toLowerCase()
    );
    if (!form.brandName.trim()) {
      nextErrors.brandName = 'Please select a brand.';
    } else if (brands.length > 0 && !matchedBrand) {
      nextErrors.brandName = 'Brand not found. Select an existing brand or add it under Brands & Categories first.';
    }

    const matchedCategory = categories.find(
      (c) => c.name?.toLowerCase() === form.categoryName.trim().toLowerCase()
    );
    if (!form.categoryName.trim()) {
      nextErrors.categoryName = 'Please select a category.';
    } else if (categories.length > 0 && !matchedCategory) {
      nextErrors.categoryName = 'Category not found. Select an existing category or add it under Brands & Categories first.';
    }

    const price = parseFloat(form.priceUsd);
    if (Number.isNaN(price) || price <= 0 || price > 10000) {
      nextErrors.priceUsd = 'Price must be greater than $0 and at most $10,000.';
    }

    const stock = parseInt(form.stockQuantity, 10);
    if (Number.isNaN(stock) || stock < 0) {
      nextErrors.stockQuantity = 'Stock quantity must be 0 or greater.';
    }

    if (form.volumeMl !== '') {
      const vol = parseFloat(form.volumeMl);
      if (Number.isNaN(vol) || vol <= 0) {
        nextErrors.volumeMl = 'Volume (mL) must be greater than 0.';
      }
    }

    if (!isToolDepartment && (!form.ingredientListRaw.trim() || form.ingredientListRaw.trim().length < 3)) {
      nextErrors.ingredientListRaw = 'INCI ingredient list is required for cosmetic formulations.';
    }

    setErrors(nextErrors);

    const firstErrorKey = Object.keys(nextErrors)[0];
    if (firstErrorKey && fieldRefs.current[firstErrorKey]) {
      const el = fieldRefs.current[firstErrorKey];
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
    }

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const matchedBrand = brands.find(
      (b) => b.name?.toLowerCase() === form.brandName.trim().toLowerCase()
    );
    const matchedCategory = categories.find(
      (c) => c.name?.toLowerCase() === form.categoryName.trim().toLowerCase()
    );
    const rawVol = form.volumeMl !== '' ? parseFloat(form.volumeMl) : null;
    const parsedVolume = rawVol != null && !Number.isNaN(rawVol) ? Math.max(1, Math.round(rawVol)) : null;
    // Auto-populate Size Display from Volume if left blank so storefront always displays exact size (e.g. 7.5 mL)
    const resolvedSizeDisplay =
      form.sizeDisplay.trim() || (rawVol != null && !Number.isNaN(rawVol) ? `${rawVol} mL` : null);

    const payload = {
      name: form.name.trim(),
      brandName: matchedBrand ? matchedBrand.name : form.brandName.trim(),
      categoryName: matchedCategory ? matchedCategory.name : form.categoryName.trim(),
      department: form.department,
      priceUsd: parseFloat(form.priceUsd),
      stockQuantity: parseInt(form.stockQuantity, 10),
      volumeMl: parsedVolume,
      sizeDisplay: resolvedSizeDisplay,
      sellingStatus: form.sellingStatus,
      targetSkinTypes: form.targetSkinTypes,
      ingredientListRaw: form.ingredientListRaw.trim(),
      description: form.description.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
    };

    onSubmit(payload);
  };

  const departmentOptions = DEPARTMENTS.includes(form.department)
    ? DEPARTMENTS
    : [...DEPARTMENTS, form.department];

  return (
    <div
      className="ad-modal-backdrop"
      role="presentation"
      onClick={() => !submitting && onClose?.()}
    >
      <div
        className="ad-modal-card ad-modal-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="ad-drawer-header">
          <div>
            <h3 id="product-modal-title" className="ad-drawer-title">
              {isEdit ? `Edit Product — ${initialProduct.code}` : 'Create New Product'}
            </h3>
            <p className="ad-cell-meta" style={{ margin: '2px 0 0' }}>
              {isEdit
                ? 'Update product attributes, pricing, imagery, and INCI formulation.'
                : 'Add a new product to the BeautyAI catalog.'}
            </p>
          </div>
          <button
            type="button"
            className="ad-icon-close"
            onClick={() => !submitting && onClose?.()}
            aria-label="Close product form"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body + Sticky Footer (noValidate ensures custom scroll-to-error validation always runs) */}
        <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="ad-modal-scroll">
            <div>
              <label htmlFor="pf-name" className="form-label" style={{ fontWeight: 600 }}>
                Product Name *
              </label>
              <input
                ref={(el) => { fieldRefs.current.name = el; }}
                id="pf-name"
                type="text"
                className="form-input"
                placeholder="e.g. Gentle Hydrating Ceramide Cleanser"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <p className="ad-field-error">{errors.name}</p>}
            </div>

            <div className="ad-form-grid-3">
              <div>
                <label htmlFor="pf-brand" className="form-label" style={{ fontWeight: 600 }}>
                  Brand *
                </label>
                <input
                  ref={(el) => { fieldRefs.current.brandName = el; }}
                  id="pf-brand"
                  type="text"
                  list="pf-brands-datalist"
                  className="form-input"
                  placeholder="Search or select brand..."
                  value={form.brandName}
                  onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                />
                <datalist id="pf-brands-datalist">
                  {brands.map((b) => (
                    <option key={b.id || b.name} value={b.name} />
                  ))}
                </datalist>
                {errors.brandName && <p className="ad-field-error">{errors.brandName}</p>}
              </div>

              <div>
                <label htmlFor="pf-category" className="form-label" style={{ fontWeight: 600 }}>
                  Category *
                </label>
                <input
                  ref={(el) => { fieldRefs.current.categoryName = el; }}
                  id="pf-category"
                  type="text"
                  list="pf-categories-datalist"
                  className="form-input"
                  placeholder="Search or select category..."
                  value={form.categoryName}
                  onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
                />
                <datalist id="pf-categories-datalist">
                  {categories.map((c) => (
                    <option key={c.id || c.name} value={c.name} />
                  ))}
                </datalist>
                {errors.categoryName && <p className="ad-field-error">{errors.categoryName}</p>}
              </div>

              <div>
                <label htmlFor="pf-department" className="form-label" style={{ fontWeight: 600 }}>
                  Department *
                </label>
                <select
                  id="pf-department"
                  className="form-select"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                >
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ad-form-grid-3">
              <div>
                <label htmlFor="pf-price" className="form-label" style={{ fontWeight: 600 }}>
                  Price (USD) *
                </label>
                <input
                  ref={(el) => { fieldRefs.current.priceUsd = el; }}
                  id="pf-price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="10000"
                  className="form-input"
                  placeholder="32.00"
                  value={form.priceUsd}
                  onChange={(e) => setForm({ ...form, priceUsd: e.target.value })}
                />
                {errors.priceUsd && <p className="ad-field-error">{errors.priceUsd}</p>}
              </div>

              <div>
                <label htmlFor="pf-stock" className="form-label" style={{ fontWeight: 600 }}>
                  Stock Quantity *
                </label>
                <input
                  ref={(el) => { fieldRefs.current.stockQuantity = el; }}
                  id="pf-stock"
                  type="number"
                  step="1"
                  min="0"
                  className="form-input"
                  value={form.stockQuantity}
                  onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                />
                {errors.stockQuantity && <p className="ad-field-error">{errors.stockQuantity}</p>}
              </div>

              <div>
                <label htmlFor="pf-status" className="form-label" style={{ fontWeight: 600 }}>
                  Selling Status
                </label>
                <select
                  id="pf-status"
                  className="form-select"
                  value={form.sellingStatus}
                  onChange={(e) => setForm({ ...form, sellingStatus: e.target.value })}
                >
                  {ALLOWED_STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>{st.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ad-form-grid-2">
              <div>
                <label htmlFor="pf-size-display" className="form-label" style={{ fontWeight: 600 }}>
                  Size Display Label
                </label>
                <input
                  id="pf-size-display"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 1.7 oz / 50 mL"
                  value={form.sizeDisplay}
                  onChange={(e) => setForm({ ...form, sizeDisplay: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="pf-volume" className="form-label" style={{ fontWeight: 600 }}>
                  Volume (mL)
                </label>
                <input
                  ref={(el) => { fieldRefs.current.volumeMl = el; }}
                  id="pf-volume"
                  type="number"
                  step="any"
                  min="0.1"
                  className="form-input"
                  placeholder="e.g. 50"
                  value={form.volumeMl}
                  onChange={(e) => setForm({ ...form, volumeMl: e.target.value })}
                />
                {errors.volumeMl && <p className="ad-field-error">{errors.volumeMl}</p>}
              </div>
            </div>

            <div>
              <span className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Target Skin Types
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ALLOWED_SKIN_TYPES.map((st) => {
                  const active = form.targetSkinTypes.includes(st);
                  return (
                    <button
                      key={st}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleSkinType(st)}
                      className={`ad-filter-pill ${active ? 'active' : ''}`}
                      style={{ height: 32, padding: '0 12px' }}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="ad-form-grid-2" style={{ alignItems: 'start' }}>
              <div>
                <label htmlFor="pf-image-url" className="form-label" style={{ fontWeight: 600 }}>
                  Product Image (Upload or URL)
                </label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 10,
                      border: '1px solid rgba(74, 55, 40, 0.16)',
                      background: '#FFFFFF',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      padding: 3,
                    }}
                  >
                    {form.imageUrl ? (
                      <img
                        src={form.imageUrl}
                        alt="Product preview"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                        }}
                      />
                    ) : (
                      <ImageIcon size={22} color="#887A70" />
                    )}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input
                      id="pf-image-url"
                      type="text"
                      className="form-input"
                      placeholder="https://... or /images/products/P466123.webp"
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    />
                    {(!import.meta.env.PROD || import.meta.env.VITE_ENABLE_IMAGE_UPLOAD === 'true') ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          style={{ display: 'none' }}
                          onChange={handleImageFileChange}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm ad-btn-icon"
                          disabled={uploadingImage}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload size={13} />
                          <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                        </button>
                        <span className="ad-cell-meta">JPG, PNG, WEBP ≤ 5MB</span>
                      </div>
                    ) : (
                      <span className="ad-cell-meta">
                        Phase 1 production: enter an external HTTPS image URL or local asset path (e.g. /images/products/P466123.webp).
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="pf-desc" className="form-label" style={{ fontWeight: 600 }}>
                  Short Description
                </label>
                <textarea
                  id="pf-desc"
                  className="form-textarea"
                  rows={3}
                  placeholder="Barrier repair daily moisturizer formulated with ceramides..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="pf-inci" className="form-label" style={{ fontWeight: 600, color: isToolDepartment ? 'var(--text-primary)' : '#B91C1C' }}>
                {isToolDepartment
                  ? 'Raw Packaging INCI String (Optional for Tools & Brushes)'
                  : 'Raw Packaging INCI String *'}
              </label>
              <p className="ad-cell-meta" style={{ margin: '0 0 6px' }}>
                {isToolDepartment
                  ? 'Tools and brushes do not require an INCI list.'
                  : 'Saving changes automatically re-syncs linked ingredients for INCI & suitability analysis.'}
              </p>
              <textarea
                ref={(el) => { fieldRefs.current.ingredientListRaw = el; }}
                id="pf-inci"
                className="form-textarea"
                rows={4}
                placeholder="Water/Aqua/Eau, Glycerin, Niacinamide, Salicylic Acid, Ceramide NP..."
                value={form.ingredientListRaw}
                onChange={(e) => setForm({ ...form, ingredientListRaw: e.target.value })}
              />
              {errors.ingredientListRaw && <p className="ad-field-error">{errors.ingredientListRaw}</p>}
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="ad-modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
