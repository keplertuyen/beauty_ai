import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Search, Star, Eye, EyeOff, Trash2, RefreshCw } from 'lucide-react';
import {
  getAdminReviews,
  updateAdminReviewVisibility,
  deleteAdminReview,
} from '../../services/api';
import { getProductImage, DEFAULT_PRODUCT_IMAGE } from '../../utils/productImages';
import ConfirmDialog from './ConfirmDialog';

export default function AdminReviewSection({ onReviewsChanged }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [busyId, setBusyId] = useState(null);

  const [hideTarget, setHideTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminReviews({
        q: search.trim() || undefined,
        rating: ratingFilter ? Number(ratingFilter) : undefined,
        status: statusFilter || undefined,
        page,
        per_page: 15,
      });
      setReviews(res.data?.reviews || []);
      setMeta({ total: res.data?.total || 0, pages: res.data?.pages || 1 });
    } catch (err) {
      if (err?.response?.status !== 401) {
        toast.error('Failed to load reviews.');
      }
    } finally {
      setLoading(false);
    }
  }, [search, ratingFilter, statusFilter, page]);

  useEffect(() => {
    const t = setTimeout(loadReviews, 220);
    return () => clearTimeout(t);
  }, [loadReviews]);

  const handleToggleClick = (review) => {
    if (!review.isHidden) {
      setHideTarget(review);
    } else {
      applyVisibility(review.id, false, '');
    }
  };

  const applyVisibility = async (reviewId, isHidden, reason) => {
    setBusyId(reviewId);
    try {
      await updateAdminReviewVisibility(reviewId, isHidden, reason);
      toast.success(
        isHidden
          ? 'Review hidden and product rating recalculated.'
          : 'Review restored and product rating recalculated.'
      );
      setHideTarget(null);
      await loadReviews();
      onReviewsChanged?.();
    } catch {
      toast.error('Failed to update review visibility.');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await deleteAdminReview(deleteTarget.id);
      toast.success('Review permanently deleted and product rating recalculated.');
      setDeleteTarget(null);
      await loadReviews();
      onReviewsChanged?.();
    } catch {
      toast.error('Failed to delete review.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="ad-section">
      <div className="ad-section-header">
        <div>
          <h2 className="ad-section-title">Reviews & Ratings Moderation</h2>
          <p className="ad-section-subtitle">
            {meta.total.toLocaleString('en-US')} total reviews. Hiding or deleting automatically recalculates product ratings.
          </p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm ad-btn-icon" onClick={loadReviews} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'ad-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="ad-toolbar glass-card">
        <div className="ad-search-box">
          <Search size={16} className="ad-search-icon" />
          <input
            type="search"
            className="form-input ad-search-input"
            placeholder="Search by product, author, or review content..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            aria-label="Search reviews"
          />
        </div>
        <div className="ad-toolbar-selects">
          <select
            className="form-select"
            value={ratingFilter}
            onChange={(e) => {
              setPage(1);
              setRatingFilter(e.target.value);
            }}
            aria-label="Filter by star rating"
          >
            <option value="">All Stars</option>
            {[5, 4, 3, 2, 1].map((s) => (
              <option key={s} value={s}>{`${s} ★`}</option>
            ))}
          </select>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            aria-label="Filter by moderation status"
          >
            <option value="">All Statuses</option>
            <option value="Visible">Visible</option>
            <option value="Hidden">Hidden</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="ad-table-card glass-card">
        <div className="ad-table-wrapper">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Author</th>
                <th>Rating</th>
                <th>Content</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className={loading && reviews.length > 0 ? 'ad-tbody-loading' : ''}>
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="ad-table-empty">
                    {loading ? 'Loading reviews...' : 'No reviews match the current filters.'}
                  </td>
                </tr>
              ) : (
                reviews.map((r) => (
                  <tr key={r.id} className={`ad-table-row ${r.isHidden ? 'ad-row-muted' : ''}`}>
                    <td>
                      <div className="ad-product-name-cell">
                        <img
                          src={getProductImage({ code: r.productCode, imageUrl: r.productImageUrl, name: r.productName })}
                          alt={r.productName}
                          className="ad-product-thumb"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                          }}
                        />
                        <div>
                          <div className="ad-product-name" title={r.productName}>{r.productName}</div>
                          <div className="ad-cell-meta">{r.productCode}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.authorName}</div>
                      <div className="ad-cell-meta">
                        {r.skinType} · {new Date(r.createdAtUtc).toLocaleDateString('en-US')}
                      </div>
                    </td>
                    <td>
                      <span className="ad-star-pill">
                        <Star size={13} fill="#D97706" color="#D97706" />
                        <span>{r.rating}.0</span>
                      </span>
                    </td>
                    <td>
                      <div className="ad-review-content" title={r.content || ''}>
                        {r.content || <em className="ad-cell-meta">(No comment)</em>}
                      </div>
                      {r.isHidden && r.moderationReason && (
                        <div className="ad-cell-meta" style={{ color: '#B91C1C', marginTop: 4 }}>
                          Hidden reason: {r.moderationReason}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className="ad-status-pill"
                        style={
                          r.isHidden
                            ? { color: '#B91C1C', background: '#FEE2E2', borderColor: '#FECACA' }
                            : { color: '#047857', background: '#D1FAE5', borderColor: '#A7F3D0' }
                        }
                      >
                        {r.isHidden ? 'Hidden' : 'Visible'}
                      </span>
                    </td>
                    <td>
                      <div className="ad-action-group">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm ad-btn-icon"
                          disabled={busyId === r.id}
                          onClick={() => handleToggleClick(r)}
                        >
                          {r.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                          <span>{r.isHidden ? 'Show' : 'Hide'}</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm ad-archive-btn ad-btn-icon"
                          disabled={busyId === r.id}
                          onClick={() => setDeleteTarget(r)}
                          aria-label={`Delete review by ${r.authorName}`}
                          title="Delete permanently"
                        >
                          <Trash2 size={14} />
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
            Page {page} of {meta.pages} ({meta.total.toLocaleString('en-US')} reviews)
          </span>
          <div className="ad-action-group">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page >= meta.pages || loading}
              onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Hide Review Dialog with Reason Input */}
      <ConfirmDialog
        isOpen={Boolean(hideTarget)}
        title="Hide Review?"
        message={
          hideTarget
            ? `Hide review by "${hideTarget.authorName}" from the storefront and recalculate the product's star rating?`
            : ''
        }
        inputLabel="Moderation Reason (optional)"
        inputPlaceholder="e.g. Spam or off-topic content"
        defaultInputValue={hideTarget?.moderationReason || 'Inappropriate or spam content'}
        confirmLabel="Hide Review"
        tone="primary"
        busy={Boolean(hideTarget && busyId === hideTarget.id)}
        onConfirm={(reason) => applyVisibility(hideTarget.id, true, reason || '')}
        onCancel={() => setHideTarget(null)}
      />

      {/* Delete Review Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Review Permanently?"
        message={
          deleteTarget
            ? `Permanently delete the review by "${deleteTarget.authorName}"? The product's average rating and review count will be recalculated immediately.`
            : ''
        }
        confirmLabel="Delete Review"
        tone="danger"
        busy={Boolean(deleteTarget && busyId === deleteTarget.id)}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}
