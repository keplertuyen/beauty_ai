import React, { useEffect, useState } from 'react';

const ALLOWED_SKIN_TYPES = ['All', 'Oily', 'Dry', 'Combination', 'Sensitive', 'Normal'];
const ALLOWED_STATUSES = [
  { value: 'Active', labelVi: 'Đang bán (Active)', labelEn: 'Active (On Sale)' },
  { value: 'Draft', labelVi: 'Bản nháp (Draft)', labelEn: 'Draft (Hidden)' },
  { value: 'Discontinued', labelVi: 'Ngừng bán (Discontinued)', labelEn: 'Discontinued (Archived)' },
];

const EMPTY_FORM = {
  name: '',
  brandName: '',
  categoryName: '',
  priceUsd: '',
  stockQuantity: '100',
  volumeMl: '',
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
  lang = 'vi',
}) {
  const isEdit = Boolean(initialProduct?.id);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});

    if (initialProduct) {
      setForm({
        name: initialProduct.name || '',
        brandName: initialProduct.brandName || brands[0]?.name || '',
        categoryName: initialProduct.categoryName || categories[0]?.name || '',
        priceUsd: initialProduct.priceUsd != null ? String(initialProduct.priceUsd) : '',
        stockQuantity: initialProduct.stockQuantity != null ? String(initialProduct.stockQuantity) : '100',
        volumeMl: initialProduct.volumeMl != null ? String(initialProduct.volumeMl) : '',
        sellingStatus: initialProduct.sellingStatus || 'Active',
        targetSkinTypes:
          Array.isArray(initialProduct.targetSkinTypes) && initialProduct.targetSkinTypes.length > 0
            ? initialProduct.targetSkinTypes
            : ['All'],
        ingredientListRaw: initialProduct.ingredientListRaw || '',
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

  if (!isOpen) return null;

  const toggleSkinType = (skinType) => {
    setForm((prev) => {
      const exists = prev.targetSkinTypes.includes(skinType);
      const next = exists
        ? prev.targetSkinTypes.filter((s) => s !== skinType)
        : [...prev.targetSkinTypes, skinType];
      return { ...prev, targetSkinTypes: next.length > 0 ? next : ['All'] };
    });
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) {
      nextErrors.name = lang === 'vi' ? 'Tên sản phẩm là bắt buộc.' : 'Product name is required.';
    } else if (form.name.trim().length > 255) {
      nextErrors.name = lang === 'vi' ? 'Tên tối đa 255 ký tự.' : 'Max 255 characters.';
    }

    if (!form.brandName.trim()) {
      nextErrors.brandName = lang === 'vi' ? 'Vui lòng chọn thương hiệu.' : 'Please select a brand.';
    }

    if (!form.categoryName.trim()) {
      nextErrors.categoryName = lang === 'vi' ? 'Vui lòng chọn danh mục.' : 'Please select a category.';
    }

    const price = parseFloat(form.priceUsd);
    if (Number.isNaN(price) || price <= 0 || price > 10000) {
      nextErrors.priceUsd = lang === 'vi' ? 'Giá bán phải lớn hơn 0 và ≤ $10,000.' : 'Price must be > 0 and <= $10,000.';
    }

    const stock = parseInt(form.stockQuantity, 10);
    if (Number.isNaN(stock) || stock < 0) {
      nextErrors.stockQuantity = lang === 'vi' ? 'Tồn kho phải ≥ 0.' : 'Stock quantity must be >= 0.';
    }

    if (form.volumeMl !== '') {
      const vol = parseInt(form.volumeMl, 10);
      if (Number.isNaN(vol) || vol <= 0) {
        nextErrors.volumeMl = lang === 'vi' ? 'Dung tích (ml) phải > 0.' : 'Volume (ml) must be > 0.';
      }
    }

    if (!form.ingredientListRaw.trim() || form.ingredientListRaw.trim().length < 3) {
      nextErrors.ingredientListRaw =
        lang === 'vi' ? 'Chuỗi thành phần INCI là bắt buộc.' : 'INCI ingredient list is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      brandName: form.brandName.trim(),
      categoryName: form.categoryName.trim(),
      priceUsd: parseFloat(form.priceUsd),
      stockQuantity: parseInt(form.stockQuantity, 10),
      volumeMl: form.volumeMl !== '' ? parseInt(form.volumeMl, 10) : null,
      sellingStatus: form.sellingStatus,
      targetSkinTypes: form.targetSkinTypes,
      ingredientListRaw: form.ingredientListRaw.trim(),
      description: form.description.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
    };

    onSubmit(payload);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
    >
      <div
        className="glass-card animate-scaleIn"
        style={{
          background: '#FFF',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            borderBottom: '1px solid #EEE',
            paddingBottom: '12px',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#2D2520' }}>
              {isEdit
                ? lang === 'vi'
                  ? `Chỉnh Sửa Sản Phẩm #${initialProduct.code || initialProduct.id}`
                  : `Edit Product #${initialProduct.code || initialProduct.id}`
                : lang === 'vi'
                  ? 'Thêm Mỹ Phẩm Mới & Bảng Thành Phần INCI'
                  : 'Create New Cosmetic Product & INCI'}
            </h3>
            {isEdit && initialProduct.updatedAtUtc && (
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#888' }}>
                {lang === 'vi' ? 'Cập nhật lần cuối: ' : 'Last updated: '}
                {new Date(initialProduct.updatedAtUtc).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            aria-label="Close modal"
          >
            {lang === 'vi' ? 'Đóng' : 'Close'}
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {lang === 'vi' ? 'Tên Sản Phẩm *' : 'Product Name *'}
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Ceramide Barrier Rescue Moisturizer"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && <p style={{ color: '#DC2626', fontSize: '0.78rem', margin: '4px 0 0' }}>{errors.name}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                {lang === 'vi' ? 'Thương Hiệu *' : 'Brand *'}
              </label>
              <select
                className="form-select"
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
              >
                <option value="">{lang === 'vi' ? '-- Chọn thương hiệu --' : '-- Select brand --'}</option>
                {brands.map((b) => (
                  <option key={b.id || b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
              {errors.brandName && (
                <p style={{ color: '#DC2626', fontSize: '0.78rem', margin: '4px 0 0' }}>{errors.brandName}</p>
              )}
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                {lang === 'vi' ? 'Danh Mục *' : 'Category *'}
              </label>
              <select
                className="form-select"
                value={form.categoryName}
                onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
              >
                <option value="">{lang === 'vi' ? '-- Chọn danh mục --' : '-- Select category --'}</option>
                {categories.map((c) => (
                  <option key={c.id || c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryName && (
                <p style={{ color: '#DC2626', fontSize: '0.78rem', margin: '4px 0 0' }}>{errors.categoryName}</p>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                {lang === 'vi' ? 'Giá (USD) *' : 'Price (USD) *'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="35.00"
                value={form.priceUsd}
                onChange={(e) => setForm({ ...form, priceUsd: e.target.value })}
              />
              {errors.priceUsd && (
                <p style={{ color: '#DC2626', fontSize: '0.78rem', margin: '4px 0 0' }}>{errors.priceUsd}</p>
              )}
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                {lang === 'vi' ? 'Tồn Kho *' : 'Stock *'}
              </label>
              <input
                type="number"
                step="1"
                min="0"
                className="form-input"
                value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
              />
              {errors.stockQuantity && (
                <p style={{ color: '#DC2626', fontSize: '0.78rem', margin: '4px 0 0' }}>{errors.stockQuantity}</p>
              )}
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                {lang === 'vi' ? 'Dung Tích (ml)' : 'Volume (ml)'}
              </label>
              <input
                type="number"
                step="1"
                min="1"
                className="form-input"
                placeholder="50"
                value={form.volumeMl}
                onChange={(e) => setForm({ ...form, volumeMl: e.target.value })}
              />
              {errors.volumeMl && (
                <p style={{ color: '#DC2626', fontSize: '0.78rem', margin: '4px 0 0' }}>{errors.volumeMl}</p>
              )}
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                {lang === 'vi' ? 'Trạng Thái Bán' : 'Selling Status'}
              </label>
              <select
                className="form-select"
                value={form.sellingStatus}
                onChange={(e) => setForm({ ...form, sellingStatus: e.target.value })}
              >
                {ALLOWED_STATUSES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {lang === 'vi' ? st.labelVi : st.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {lang === 'vi' ? 'Loại Da Phù Hợp' : 'Target Skin Types'}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
              {ALLOWED_SKIN_TYPES.map((st) => {
                const active = form.targetSkinTypes.includes(st);
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => toggleSkinType(st)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '16px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: active ? '1px solid #8F755F' : '1px solid #DDD',
                      background: active ? '#8F755F' : '#FAF8F6',
                      color: active ? '#FFF' : '#4A3F38',
                    }}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                {lang === 'vi' ? 'Đường Dẫn Ảnh (URL)' : 'Image URL'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="/images/products/P12345.webp"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                {lang === 'vi' ? 'Mô Tả Ngắn' : 'Short Description'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={lang === 'vi' ? 'Công thức phục hồi hàng rào bảo vệ da...' : 'Barrier repair formulation...'}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', color: '#B3261E' }}>
              {lang === 'vi'
                ? 'Chuỗi Thành Phần INCI Bao Bì (Raw Ingredients Text) *'
                : 'Raw Packaging INCI String *'}
            </label>
            <p style={{ margin: '0 0 6px 0', fontSize: '0.78rem', color: '#666' }}>
              {lang === 'vi'
                ? 'Khi thêm mới hoặc chỉnh sửa chuỗi INCI, hệ thống sẽ tự động đồng bộ lại liên kết thành phần để AI phân tích chính xác.'
                : 'When creating or updating the INCI string, BeautyAI automatically re-syncs ingredient links for accurate suitability analysis.'}
            </p>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Water/Aqua/Eau, Glycerin, Niacinamide, Salicylic Acid, Ceramide NP, Sodium Hyaluronate..."
              value={form.ingredientListRaw}
              onChange={(e) => setForm({ ...form, ingredientListRaw: e.target.value })}
            />
            {errors.ingredientListRaw && (
              <p style={{ color: '#DC2626', fontSize: '0.78rem', margin: '4px 0 0' }}>{errors.ingredientListRaw}</p>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {lang === 'vi' ? 'Hủy' : 'Cancel'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting
                ? lang === 'vi'
                  ? 'Đang lưu...'
                  : 'Saving...'
                : isEdit
                  ? lang === 'vi'
                    ? 'Lưu Thay Đổi'
                    : 'Update Product'
                  : lang === 'vi'
                    ? 'Tạo Sản Phẩm'
                    : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
