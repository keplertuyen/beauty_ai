import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Search,
  RefreshCw,
  Eye,
  X,
  Truck,
  Package,
  MapPin,
  Phone,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { getAdminOrders, updateAdminOrderStatus } from '../../services/api';
import { getProductImage, DEFAULT_PRODUCT_IMAGE } from '../../utils/productImages';
import ConfirmDialog from './ConfirmDialog';

const ORDER_LIMIT = 150;

const ORDER_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Delivering', label: 'Delivering' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const STATUS_STYLE = {
  Pending: { color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' },
  Delivering: { color: '#1D4ED8', bg: '#DBEAFE', border: '#BFDBFE' },
  Completed: { color: '#047857', bg: '#D1FAE5', border: '#A7F3D0' },
  Cancelled: { color: '#B91C1C', bg: '#FEE2E2', border: '#FECACA' },
};

export default function AdminOrderSection({ formatPrice, onOrdersChanged }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [pendingCancel, setPendingCancel] = useState(null); // { order, source: 'table' | 'drawer' }

  // Detail Drawer
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [drawerStatus, setDrawerStatus] = useState('Pending');
  const [drawerTracking, setDrawerTracking] = useState('');
  const [drawerNotes, setDrawerNotes] = useState('');
  const [savingDrawer, setSavingDrawer] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminOrders({
        q: search.trim() || undefined,
        status: statusFilter || undefined,
        limit: ORDER_LIMIT,
      });
      setOrders(res.data || []);
    } catch (err) {
      if (err?.response?.status !== 401) {
        toast.error('Failed to load orders.');
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(loadOrders, 220);
    return () => clearTimeout(timer);
  }, [loadOrders]);

  useEffect(() => {
    if (!selectedOrder) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setSelectedOrder(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedOrder]);

  const openDetail = (order) => {
    setSelectedOrder(order);
    setDrawerStatus(order.order_status || 'Pending');
    setDrawerTracking(order.tracking_number || '');
    setDrawerNotes(order.admin_notes || '');
  };

  const applyStatusUpdate = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await updateAdminOrderStatus(orderId, newStatus);
      toast.success(`Order #${orderId} updated to ${newStatus}.`);
      await loadOrders();
      onOrdersChanged?.();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleQuickStatusChange = (order, newStatus) => {
    if (newStatus === 'Cancelled' && order.order_status !== 'Cancelled') {
      setPendingCancel({ order, source: 'table' });
      return;
    }
    applyStatusUpdate(order.id, newStatus);
  };

  const commitDrawerSave = async () => {
    if (!selectedOrder) return;
    setSavingDrawer(true);
    try {
      await updateAdminOrderStatus(selectedOrder.id, drawerStatus, {
        trackingNumber: drawerTracking,
        adminNotes: drawerNotes,
      });
      toast.success(`Saved shipping details for Order #${selectedOrder.id}.`);
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              order_status: drawerStatus,
              tracking_number: drawerTracking,
              admin_notes: drawerNotes,
            }
          : null
      );
      await loadOrders();
      onOrdersChanged?.();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save order update.');
    } finally {
      setSavingDrawer(false);
    }
  };

  const handleSaveDrawer = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (drawerStatus === 'Cancelled' && selectedOrder.order_status !== 'Cancelled') {
      setPendingCancel({ order: selectedOrder, source: 'drawer' });
      return;
    }
    await commitDrawerSave();
  };

  const renderMoney = (usd) =>
    typeof formatPrice === 'function' ? formatPrice(usd || 0) : `$${Number(usd || 0).toFixed(2)}`;

  return (
    <section className="ad-section">
      <div className="ad-section-header">
        <div>
          <h2 className="ad-section-title">Orders & Fulfillment</h2>
          <p className="ad-section-subtitle">
            Track fulfillment status, update tracking numbers, and inspect order line items
          </p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm ad-btn-icon" onClick={loadOrders} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'ad-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="ad-toolbar glass-card">
        <div className="ad-search-box">
          <Search size={16} className="ad-search-icon" />
          <input
            type="search"
            className="form-input ad-search-input"
            placeholder="Search by order ID, recipient, phone, address, or tracking..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search orders"
          />
        </div>

        <div className="ad-pill-filters" role="group" aria-label="Filter orders by status">
          {ORDER_STATUSES.map((st) => (
            <button
              key={st.value || 'all'}
              type="button"
              aria-pressed={statusFilter === st.value}
              className={`ad-filter-pill ${statusFilter === st.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(st.value)}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {orders.length >= ORDER_LIMIT && (
        <div className="ad-warning-banner" style={{ marginBottom: 14 }}>
          <span>
            Showing the most recent {ORDER_LIMIT} orders. Use the search or status filters to narrow results.
          </span>
        </div>
      )}

      {/* Orders Table */}
      <div className="ad-table-card glass-card">
        <div className="ad-table-wrapper">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Shipping & Tracking</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className={loading && orders.length > 0 ? 'ad-tbody-loading' : ''}>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="ad-table-empty">
                    {loading ? 'Loading orders...' : 'No orders found.'}
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const st = STATUS_STYLE[order.order_status] || STATUS_STYLE.Pending;
                  const itemCount = order.items_count || order.items?.length || 1;
                  return (
                    <tr key={order.id} className="ad-table-row">
                      <th scope="row" className="ad-row-header">
                        <strong>#{order.id}</strong>
                        <div className="ad-cell-meta">
                          {new Date(order.created_at).toLocaleDateString('en-US')}
                        </div>
                      </th>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {order.recipient_name}
                        </div>
                        <div className="ad-cell-meta">{order.phone_number}</div>
                      </td>
                      <td>
                        <div className="ad-truncate-cell" title={order.shipping_address}>
                          {order.shipping_address}
                        </div>
                        {order.tracking_number && (
                          <div className="ad-tracking-chip">
                            <Truck size={12} /> {order.tracking_number}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="ad-meta-tag">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </span>
                        {order.conflict_acknowledged && (
                          <span
                            className="ad-meta-tag"
                            style={{ marginLeft: 6, background: '#FEF3C7', color: '#B45309' }}
                            title="Customer acknowledged active ingredient conflict warning"
                          >
                            Conflict Ack
                          </span>
                        )}
                      </td>
                      <td className="ad-price">
                        <div>{renderMoney(order.total_amount_usd)}</div>
                        <div className="ad-cell-meta">{order.payment_method || 'COD'}</div>
                      </td>
                      <td>
                        <span
                          className="ad-status-pill"
                          style={{ color: st.color, background: st.bg, borderColor: st.border }}
                        >
                          {order.order_status}
                        </span>
                      </td>
                      <td>
                        <div className="ad-action-group">
                          <select
                            className="form-select ad-inline-select"
                            value={order.order_status}
                            disabled={updatingId === order.id}
                            onChange={(e) => handleQuickStatusChange(order, e.target.value)}
                            aria-label={`Order #${order.id} status`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Delivering">Delivering</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm ad-btn-icon"
                            onClick={() => openDetail(order)}
                          >
                            <Eye size={14} />
                            <span>Details</span>
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

      {/* Order Detail Slide-Over Drawer */}
      {selectedOrder && (
        <div className="ad-drawer-backdrop" role="presentation" onClick={() => setSelectedOrder(null)}>
          <aside
            className="ad-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-drawer-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ad-drawer-header">
              <div>
                <h3 id="order-drawer-title" className="ad-drawer-title">
                  Order #{selectedOrder.id}
                </h3>
                <p className="ad-cell-meta">
                  {new Date(selectedOrder.created_at).toLocaleString('en-US')}
                </p>
              </div>
              <button
                type="button"
                className="ad-icon-close"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="ad-drawer-body">
              <div className="ad-detail-card">
                <h4>Shipping Information</h4>
                <div className="ad-detail-row">
                  <Package size={15} />
                  <span><strong>{selectedOrder.recipient_name}</strong></span>
                </div>
                <div className="ad-detail-row">
                  <Phone size={15} />
                  <span>{selectedOrder.phone_number}</span>
                </div>
                <div className="ad-detail-row">
                  <MapPin size={15} />
                  <span>{selectedOrder.shipping_address}</span>
                </div>
                {selectedOrder.conflict_acknowledged && (
                  <div className="ad-warning-banner">
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                    <span>Customer acknowledged an active ingredient conflict warning at checkout.</span>
                  </div>
                )}
              </div>

              <div className="ad-detail-card">
                <h4>Order Items ({selectedOrder.items?.length || 0})</h4>
                <div className="ad-order-items-list">
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div key={`${item.product_id}-${idx}`} className="ad-order-item-row">
                      <img
                        src={getProductImage({ code: item.product_code, imageUrl: item.image_url, name: item.product_name })}
                        alt={item.product_name}
                        className="ad-product-thumb"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                        }}
                      />
                      <div className="ad-order-item-info">
                        <div className="ad-order-item-name">{item.product_name}</div>
                        <div className="ad-cell-meta">
                          {renderMoney(item.unit_price_usd)} × {item.quantity}
                        </div>
                      </div>
                      <strong className="ad-price">{renderMoney(item.total_price_usd)}</strong>
                    </div>
                  ))}
                </div>
                <div className="ad-order-total-row">
                  <span>Order Total ({selectedOrder.payment_method || 'COD'})</span>
                  <strong>{renderMoney(selectedOrder.total_amount_usd)}</strong>
                </div>
              </div>

              <form className="ad-detail-card" onSubmit={handleSaveDrawer}>
                <h4>Fulfillment & Tracking</h4>
                <div className="form-group">
                  <label htmlFor="ord-status" className="form-label">Order Status</label>
                  <select
                    id="ord-status"
                    className="form-select"
                    value={drawerStatus}
                    onChange={(e) => setDrawerStatus(e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Delivering">Delivering</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="ord-tracking" className="form-label">Tracking Number</label>
                  <input
                    id="ord-tracking"
                    type="text"
                    className="form-input"
                    placeholder="e.g. TRK-20261127-8891"
                    value={drawerTracking}
                    onChange={(e) => setDrawerTracking(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="ord-notes" className="form-label">Internal Fulfillment Notes</label>
                  <textarea
                    id="ord-notes"
                    className="form-input"
                    rows={3}
                    placeholder="Delivery notes or cancellation reason..."
                    value={drawerNotes}
                    onChange={(e) => setDrawerNotes(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary ad-btn-icon"
                  disabled={savingDrawer}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <CheckCircle2 size={15} />
                  <span>{savingDrawer ? 'Saving...' : 'Save Fulfillment'}</span>
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* Confirm Order Cancellation (applies to both quick dropdown and drawer save) */}
      <ConfirmDialog
        isOpen={Boolean(pendingCancel)}
        title={`Cancel Order #${pendingCancel?.order?.id}?`}
        message={
          pendingCancel
            ? `Are you sure you want to mark Order #${pendingCancel.order.id} (${pendingCancel.order.recipient_name}) as Cancelled?`
            : ''
        }
        confirmLabel="Confirm Cancel"
        tone="danger"
        busy={Boolean(pendingCancel && (updatingId === pendingCancel.order.id || savingDrawer))}
        onConfirm={async () => {
          const target = pendingCancel;
          setPendingCancel(null);
          if (target.source === 'drawer') {
            await commitDrawerSave();
          } else {
            await applyStatusUpdate(target.order.id, 'Cancelled');
          }
        }}
        onCancel={() => setPendingCancel(null)}
      />
    </section>
  );
}
