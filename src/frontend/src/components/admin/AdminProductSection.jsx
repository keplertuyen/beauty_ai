import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, Plus, RefreshCw } from 'lucide-react';
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  restoreAdminProduct,
  getBrands,
  getCategories,
} from '../../services/api';
import { getProductImage, DEFAULT_PRODUCT_IMAGE } from '../../utils/productImages';
import ProductFormModal from './ProductFormModal';
import ConfirmDialog from './ConfirmDialog';
import { LOW_STOCK_THRESHOLD } from './adminConstants';

export default function AdminProductSection({ formatPrice, onCatalogChanged }) {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [pages, setPages] = useState(1);
  const [jumpInput, setJumpInput] = useState('1');
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
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
    async (targetPage = page, pageSize = perPage) => {
      // Only send brand/category to API when cleared or matched to an existing entry (prevents empty table mid-typing)
      const trimmedBrand = brandFilter.trim();
      const matchedBrand = trimmedBrand
        ? brands.find((b) => b.name?.toLowerCase() === trimmedBrand.toLowerCase())
        : null;
      if (trimmedBrand && brands.length > 0 && !matchedBrand) {
        return;
      }

      const trimmedCat = categoryFilter.trim();
      const matchedCat = trimmedCat
        ? categories.find((c) => c.name?.toLowerCase() === trimmedCat.toLowerCase())
        : null;
      if (trimmedCat && categories.length > 0 && !matchedCat) {
        return;
      }

      setLoading(true);
      try {
        const res = await getAdminProducts({
          query: query.trim() || undefined,
          brand: matchedBrand ? matchedBrand.name : trimmedBrand || undefined,
          category: matchedCat ? matchedCat.name : trimmedCat || undefined,
          status: statusFilter !== 'All' ? statusFilter : undefined,
          page: targetPage,
          per_page: pageSize,
        });
        setProducts(res.data?.products || []);
        setTotal(res.data?.total || 0);
        const resolvedPage = res.data?.page || targetPage;
        setPage(resolvedPage);
        setJumpInput(String(resolvedPage));
        setPages(Math.max(1, res.data?.pages || 1));
      } catch (err) {
        if (err?.response?.status !== 401) {
          toast.error(err.response?.data?.detail || 'Failed to load admin products.');
        }
      } finally {
        setLoading(false);
      }
    },
    [query, brandFilter, categoryFilter, statusFilter, page, perPage]
  );

  // Auto-debounced search & filter reload
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts(1, perPage);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, brandFilter, categoryFilter, statusFilter, perPage]); // eslint-disable-line react-hooks/exhaustive-deps

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
        toast.success(`Updated product "${payload.name}".`);
      } else {
        await createAdminProduct(payload);
        toast.success(`Created product "${payload.name}".`);
      }
      setModalOpen(false);
      setEditingProduct(null);
      await loadProducts(editingProduct?.id ? page : 1, perPage);
      onCatalogChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDiscontinue = async () => {
    if (!confirmTarget) return;
    setProcessingId(confirmTarget.id);
    try {
      await deleteAdminProduct(confirmTarget.id);
      toast.success(`Archived "${confirmTarget.name}". You can restore it anytime.`);
      setConfirmTarget(null);
      await loadProducts(page, perPage);
      onCatalogChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to archive product.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRestore = async (product) => {
    setProcessingId(product.id);
    try {
      await restoreAdminProduct(product.id);
      toast.success(`Restored "${product.name}" to Active status.`);
      await loadProducts(page, perPage);
      onCatalogChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to restore product.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleJumpPage = (e) => {
    e.preventDefault();
    const num = parseInt(jumpInput, 10);
    if (!Number.isNaN(num)) {
      const clamped = Math.min(Math.max(1, num), pages);
      loadProducts(clamped, perPage);
    }
  };

  const renderStatusBadge = (status) => {
    const isDiscontinued = status === 'Discontinued';
    const isDraft = status === 'Draft';
    const color = isDiscontinued ? '#B91C1C' : isDraft ? '#B45309' : '#047857';
    const bg = isDiscontinued ? '#FEE2E2' : isDraft ? '#FEF3C7' : '#D1FAE5';
    return (
      <span className="ad-status-pill" style={{ color, background: bg, borderColor: `${color}30` }}>
        {status || 'Active'}
      </span>
    );
  };

  const renderStock = (qty) => {
    if (qty <= 0) {
      return <span className="ad-status-pill" style={{ color: '#B91C1C', background: '#FEE2E2' }}>Out of stock</span>;
    }
    if (qty <= LOW_STOCK_THRESHOLD) {
      return <strong style={{ color: '#B45309' }}>{qty} (Low)</strong>;
    }
    return <strong style={{ color: 'var(--text-primary)' }}>{qty}</strong>;
  };

  return (
    <section className="ad-section">
      <div className="ad-section-header">
        <div>
          <h2 className="ad-section-title">
            Product Catalog ({total.toLocaleString('en-US')})
          </h2>
          <p className="ad-section-subtitle">
            Search, create, edit INCI formulations, upload imagery, archive, or restore products
          </p>
        </div>

        <div className="ad-action-group">
          <button
            type="button"
            className="btn btn-secondary btn-sm ad-btn-icon"
            onClick={() => loadProducts(page, perPage)}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'ad-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm ad-btn-icon"
            onClick={openCreateModal}
          >
            <Plus size={15} />
            <span>New Product</span>
          </button>
        </div>
      </div>

      {/* Unified Single-Row Toolbar with Searchable Brand & Category */}
      <div className="ad-toolbar glass-card">
        <div className="ad-search-box">
          <Search size={16} className="ad-search-icon" />
          <input
            type="search"
            className="form-input ad-search-input"
            placeholder="Search by product name, code, or brand..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
          />
        </div>

        <div className="ad-toolbar-selects">
          <input
            type="search"
            list="admin-filter-brands"
            className="form-input ad-combo-input"
            placeholder="All Brands..."
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            aria-label="Filter by brand"
          />
          <datalist id="admin-filter-brands">
            {brands.map((b) => (
              <option key={b.id || b.name} value={b.name} />
            ))}
          </datalist>

          <input
            type="search"
            list="admin-filter-categories"
            className="form-input ad-combo-input"
            placeholder="All Categories..."
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
          />
          <datalist id="admin-filter-categories">
            {categories.map((c) => (
              <option key={c.id || c.name} value={c.name} />
            ))}
          </datalist>

          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Discontinued">Discontinued</option>
          </select>
        </div>
      </div>

      {/* Product Table */}
      <div className="ad-table-card glass-card">
        <div className="ad-table-wrapper">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className={loading && products.length > 0 ? 'ad-tbody-loading' : ''}>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="ad-table-empty">
                    {loading ? 'Loading products...' : 'No products match the current filters.'}
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isDiscontinued = p.sellingStatus === 'Discontinued';
                  return (
                    <tr
                      key={p.id}
                      className={`ad-table-row ${isDiscontinued ? 'ad-row-muted' : ''}`}
                    >
                      <td>
                        <div className="ad-product-name-cell">
                          <img
                            src={getProductImage(p)}
                            alt={p.name}
                            className="ad-product-thumb"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                            }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <span className="ad-product-name" title={p.name}>
                              {p.name}
                            </span>
                            <div className="ad-cell-meta">
                              <code className="ad-code-text" style={{ fontSize: '0.72rem' }}>{p.code}</code>
                              {' · '}
                              {p.department || 'Skincare'}
                              {p.sizeDisplay ? ` · ${p.sizeDisplay}` : p.volumeMl ? ` · ${p.volumeMl} mL` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="ad-brand-text" title={p.brandName}>{p.brandName}</span>
                      </td>
                      <td>
                        <span className="ad-category-chip" title={p.categoryName}>{p.categoryName}</span>
                      </td>
                      <td className="ad-price">
                        {formatPrice ? formatPrice(p.priceUsd) : `$${Number(p.priceUsd).toFixed(2)}`}
                      </td>
                      <td>{renderStock(p.stockQuantity)}</td>
                      <td>{renderStatusBadge(p.sellingStatus)}</td>
                      <td>
                        <div className="ad-action-group">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm ad-action-btn"
                            onClick={() => openEditModal(p)}
                            disabled={processingId === p.id}
                          >
                            Edit
                          </button>

                          {isDiscontinued ? (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm ad-action-btn"
                              onClick={() => handleRestore(p)}
                              disabled={processingId === p.id}
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm ad-action-btn ad-archive-btn"
                              onClick={() => setConfirmTarget(p)}
                              disabled={processingId === p.id}
                            >
                              Archive
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

        {/* Enhanced Pagination: Page size + Jump to page */}
        <div className="ad-pagination-bar">
          <div className="ad-pagination-controls">
            <span className="ad-pagination-info">
              Page {page} of {pages} ({total.toLocaleString('en-US')} products)
            </span>
            <select
              className="form-select ad-page-size-select"
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              aria-label="Rows per page"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>

          <div className="ad-pagination-controls">
            <form onSubmit={handleJumpPage} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="ad-pagination-info">Go to</span>
              <input
                type="number"
                min={1}
                max={pages}
                className="form-input ad-page-jump-input"
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                aria-label="Jump to page number"
              />
            </form>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page <= 1 || loading}
              onClick={() => loadProducts(page - 1, perPage)}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page >= pages || loading}
              onClick={() => loadProducts(page + 1, perPage)}
            >
              Next
            </button>
          </div>
        </div>
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
      />

      {/* Shared Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmTarget)}
        title="Archive Product?"
        message={
          confirmTarget
            ? `"${confirmTarget.name}" will be hidden from the customer storefront while preserving all reviews and order history. You can restore it at any time.`
            : ''
        }
        confirmLabel="Archive Product"
        tone="danger"
        busy={Boolean(confirmTarget && processingId === confirmTarget.id)}
        onConfirm={handleConfirmDiscontinue}
        onCancel={() => setConfirmTarget(null)}
      />
    </section>
  );
}
