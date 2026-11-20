import React, { useCallback, useEffect, useState } from 'react';
import { Edit2, Archive, RotateCcw, Plus, Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  restoreAdminProduct,
  getBrands,
  getCategories,
} from '../../services/api';
import ProductFormModal from './ProductFormModal';

export default function AdminProductSection({ lang = 'vi', formatPrice, onCatalogChanged }) {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDiscontinueProduct, setConfirmDiscontinueProduct] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    getBrands()
      .then((res) => setBrands(res.data?.brands || []))
      .catch(() => setBrands([]));
    getCategories()
      .then((res) => setCategories(res.data?.categories || []))
      .catch(() => setCategories([]));
  }, []);

  const loadProducts = useCallback(
    async (targetPage = page) => {
      setLoading(true);
      try {
        const res = await getAdminProducts({
          query: query.trim() || undefined,
          brand: brandFilter !== 'All' ? brandFilter : undefined,
          category: categoryFilter !== 'All' ? categoryFilter : undefined,
          status: statusFilter !== 'All' ? statusFilter : undefined,
          page: targetPage,
          per_page: 10,
        });
        setProducts(res.data?.products || []);
        setTotal(res.data?.total || 0);
        setPage(res.data?.page || targetPage);
        setPages(Math.max(1, res.data?.pages || 1));
      } catch (err) {
        toast.error(
          err.response?.data?.detail ||
            (lang === 'vi' ? 'Không thể tải danh sách sản phẩm quản trị' : 'Failed to load admin products')
        );
      } finally {
        setLoading(false);
      }
    },
    [query, brandFilter, categoryFilter, statusFilter, page, lang]
  );

  useEffect(() => {
    loadProducts(1);
  }, [brandFilter, categoryFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadProducts(1);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleFormSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editingProduct?.id) {
        await updateAdminProduct(editingProduct.id, payload);
        toast.success(
          lang === 'vi'
            ? `Đã cập nhật sản phẩm "${payload.name}"`
            : `Updated product "${payload.name}"`
        );
      } else {
        await createAdminProduct(payload);
        toast.success(
          lang === 'vi'
            ? `Đã tạo sản phẩm "${payload.name}"`
            : `Created product "${payload.name}"`
        );
      }
      setModalOpen(false);
      setEditingProduct(null);
      await loadProducts(editingProduct?.id ? page : 1);
      if (onCatalogChanged) onCatalogChanged();
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          (lang === 'vi' ? 'Không thể lưu sản phẩm' : 'Failed to save product')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDiscontinue = async () => {
    if (!confirmDiscontinueProduct) return;
    const target = confirmDiscontinueProduct;
    setProcessingId(target.id);
    try {
      await deleteAdminProduct(target.id);
      toast.success(
        lang === 'vi'
          ? `Đã ngừng bán "${target.name}". Bạn có thể khôi phục bất kỳ lúc nào.`
          : `Discontinued "${target.name}". You can restore it anytime.`
      );
      setConfirmDiscontinueProduct(null);
      await loadProducts(page);
      if (onCatalogChanged) onCatalogChanged();
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          (lang === 'vi' ? 'Không thể ngừng bán sản phẩm' : 'Failed to discontinue product')
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleRestore = async (product) => {
    setProcessingId(product.id);
    try {
      await restoreAdminProduct(product.id);
      toast.success(
        lang === 'vi'
          ? `Đã khôi phục sản phẩm "${product.name}" sang trạng thái Đang bán`
          : `Restored "${product.name}" to Active status`
      );
      await loadProducts(page);
      if (onCatalogChanged) onCatalogChanged();
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          (lang === 'vi' ? 'Không thể khôi phục sản phẩm' : 'Failed to restore product')
      );
    } finally {
      setProcessingId(null);
    }
  };

  const renderStatusBadge = (status) => {
    const isDiscontinued = status === 'Discontinued';
    const isDraft = status === 'Draft';
    const color = isDiscontinued ? '#DC2626' : isDraft ? '#D97706' : '#059669';
    const bg = isDiscontinued ? '#FEF2F2' : isDraft ? '#FFFBEB' : '#ECFDF5';
    const label =
      lang === 'vi'
        ? isDiscontinued
          ? 'Ngừng bán'
          : isDraft
            ? 'Bản nháp'
            : 'Đang bán'
        : status || 'Active';

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '0.76rem',
          fontWeight: 700,
          color,
          background: bg,
          border: `1px solid ${color}44`,
        }}
      >
        {label}
      </span>
    );
  };

  return (
    <section className="ad-section">
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div className="ad-section-header" style={{ marginBottom: 0 }}>
          <span className="ad-section-icon">🧴</span>
          <h2 className="ad-section-title">
            {lang === 'vi'
              ? `Quản Lý Danh Mục Sản Phẩm (${total.toLocaleString()})`
              : `Product Catalog CRUD (${total.toLocaleString()})`}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => loadProducts(page)}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} />
            {lang === 'vi' ? 'Làm mới' : 'Refresh'}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={openCreateModal}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} />
            {lang === 'vi' ? 'Thêm Sản Phẩm Mới' : 'New Product'}
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div
        className="glass-card"
        style={{
          padding: '14px 18px',
          marginBottom: '16px',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="form-input"
            placeholder={lang === 'vi' ? 'Tìm theo tên, mã SP, thương hiệu...' : 'Search by name, code, brand...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
            <Search size={14} /> {lang === 'vi' ? 'Tìm' : 'Search'}
          </button>
        </form>

        <select
          className="form-select"
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          aria-label="Filter by brand"
        >
          <option value="All">{lang === 'vi' ? 'Tất cả thương hiệu' : 'All Brands'}</option>
          {brands.map((b) => (
            <option key={b.id || b.name} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          className="form-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="All">{lang === 'vi' ? 'Tất cả danh mục' : 'All Categories'}</option>
          {categories.map((c) => (
            <option key={c.id || c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="All">{lang === 'vi' ? 'Mọi trạng thái' : 'All Statuses'}</option>
          <option value="Active">{lang === 'vi' ? 'Đang bán (Active)' : 'Active'}</option>
          <option value="Draft">{lang === 'vi' ? 'Bản nháp (Draft)' : 'Draft'}</option>
          <option value="Discontinued">{lang === 'vi' ? 'Ngừng bán (Discontinued)' : 'Discontinued'}</option>
        </select>
      </div>

      {/* Product table */}
      <div className="ad-table-card glass-card">
        <div className="ad-table-wrapper">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>{lang === 'vi' ? 'Sản Phẩm' : 'Product'}</th>
                <th>{lang === 'vi' ? 'Thương Hiệu / Danh Mục' : 'Brand / Category'}</th>
                <th>{lang === 'vi' ? 'Giá Bán' : 'Price'}</th>
                <th>{lang === 'vi' ? 'Tồn Kho' : 'Stock'}</th>
                <th>{lang === 'vi' ? 'Trạng Thái' : 'Status'}</th>
                <th>{lang === 'vi' ? 'Thao Tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="ad-table-empty">
                    {loading
                      ? lang === 'vi'
                        ? 'Đang tải danh sách sản phẩm...'
                        : 'Loading products...'
                      : lang === 'vi'
                        ? 'Không tìm thấy sản phẩm nào khớp bộ lọc.'
                        : 'No products match the current filters.'}
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isDiscontinued = p.sellingStatus === 'Discontinued';
                  return (
                    <tr
                      key={p.id}
                      className="ad-table-row"
                      style={{ opacity: isDiscontinued ? 0.68 : 1 }}
                    >
                      <td>
                        <code style={{ fontSize: '0.78rem', color: '#8F755F', fontWeight: 600 }}>{p.code}</code>
                      </td>
                      <td className="ad-product-name-cell">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="ad-product-thumb" />
                        ) : (
                          <div className="ad-product-thumb-placeholder">💄</div>
                        )}
                        <div>
                          <span className="ad-product-name" title={p.name}>
                            {p.name}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: '#888' }}>
                            {(p.targetSkinTypes || []).join(', ')}
                            {p.volumeMl ? ` · ${p.volumeMl}ml` : ''}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-secondary">{p.brandName}</span>
                        <div style={{ fontSize: '0.76rem', color: '#666', marginTop: '3px' }}>{p.categoryName}</div>
                      </td>
                      <td className="ad-price">
                        {formatPrice ? formatPrice(p.priceUsd) : `$${Number(p.priceUsd).toFixed(2)}`}
                      </td>
                      <td>
                        <strong style={{ color: p.stockQuantity <= 5 ? '#DC2626' : '#2D2520' }}>
                          {p.stockQuantity}
                        </strong>
                      </td>
                      <td>{renderStatusBadge(p.sellingStatus)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditModal(p)}
                            disabled={processingId === p.id}
                            title={lang === 'vi' ? 'Chỉnh sửa sản phẩm' : 'Edit product'}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px' }}
                          >
                            <Edit2 size={13} />
                            {lang === 'vi' ? 'Sửa' : 'Edit'}
                          </button>

                          {isDiscontinued ? (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleRestore(p)}
                              disabled={processingId === p.id}
                              title={lang === 'vi' ? 'Khôi phục bán lại' : 'Restore product'}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px' }}
                            >
                              <RotateCcw size={13} />
                              {lang === 'vi' ? 'Khôi phục' : 'Restore'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm danger"
                              onClick={() => setConfirmDiscontinueProduct(p)}
                              disabled={processingId === p.id}
                              title={lang === 'vi' ? 'Ngừng bán (ẩn khỏi cửa hàng)' : 'Discontinue product'}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                color: '#DC2626',
                                borderColor: '#FCA5A5',
                              }}
                            >
                              <Archive size={13} />
                              {lang === 'vi' ? 'Ngừng bán' : 'Archive'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderTop: '1px solid #EEE',
            }}
          >
            <span style={{ fontSize: '0.82rem', color: '#666' }}>
              {lang === 'vi' ? `Trang ${page} / ${pages}` : `Page ${page} of ${pages}`}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page <= 1 || loading}
                onClick={() => loadProducts(page - 1)}
              >
                {lang === 'vi' ? '← Trước' : '← Prev'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page >= pages || loading}
                onClick={() => loadProducts(page + 1)}
              >
                {lang === 'vi' ? 'Sau →' : 'Next →'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <ProductFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleFormSubmit}
        initialProduct={editingProduct}
        brands={brands}
        categories={categories}
        submitting={submitting}
        lang={lang}
      />

      {/* Discontinue Confirmation Dialog */}
      {confirmDiscontinueProduct && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
          }}
        >
          <div
            className="glass-card"
            style={{
              background: '#FFF',
              maxWidth: '460px',
              width: '100%',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 10px', fontSize: '1.15rem', color: '#2D2520' }}>
              {lang === 'vi' ? 'Xác nhận ngừng bán sản phẩm?' : 'Discontinue this product?'}
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: '0.88rem', color: '#555', lineHeight: 1.5 }}>
              {lang === 'vi'
                ? `Sản phẩm "${confirmDiscontinueProduct.name}" sẽ được ẩn khỏi danh mục khách hàng nhưng toàn bộ đánh giá (reviews) và lịch sử đơn hàng vẫn được bảo toàn. Bạn có thể bấm "Khôi phục" bất cứ lúc nào.`
                : `"${confirmDiscontinueProduct.name}" will be hidden from the customer store while preserving all reviews and order history. You can restore it at any time.`}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setConfirmDiscontinueProduct(null)}
              >
                {lang === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ background: '#DC2626', borderColor: '#DC2626' }}
                disabled={processingId === confirmDiscontinueProduct.id}
                onClick={handleConfirmDiscontinue}
              >
                {lang === 'vi' ? 'Xác Nhận Ngừng Bán' : 'Confirm Discontinue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
