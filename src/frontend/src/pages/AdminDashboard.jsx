import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import {
  getDashboard,
  getAdminOrders,
  updateAdminOrderStatus,
} from '../services/api';
import { useApp } from '../context/AppContext';
import { getProductImage, DEFAULT_PRODUCT_IMAGE } from '../utils/productImages';
import AdminProductSection from '../components/admin/AdminProductSection';
import './AdminDashboard.css';

/* ── Palette ── */
const COLORS = [
  '#8F755F', '#C39B75', '#A39182', '#C5B9AE',
  '#5CC8A0', '#F0A86B', '#E86B6B', '#B09B8A',
];

/* ── Rating bar color by score ── */
const ratingColor = (rating) => {
  if (rating >= 5) return '#5CC8A0';
  if (rating >= 4) return '#C39B75';
  if (rating >= 3) return '#F0A86B';
  if (rating >= 2) return '#E86B6B';
  return '#A39182';
};

/* ── Pie custom label ── */
const renderPieLabel = ({ percent }) =>
  percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : '';

/* ── Stat Card (Pure Typographic Metric Card — Zero Icons) ── */
function StatCard({ label, value, accent, sub }) {
  return (
    <div className="ad-stat-card glass-card" style={{ borderTop: `3px solid ${accent}` }}>
      <div className="ad-stat-body">
        <p className="ad-stat-label">{label}</p>
        <p className="ad-stat-value">{value ?? '—'}</p>
        {sub && <p className="ad-stat-sub">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Section Header (Clean typography) ── */
function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="ad-section-header">
      <div>
        <h2 className="ad-section-title">{title}</h2>
        {subtitle && <p className="ad-section-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="ad-section-action">{action}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t, lang, formatPrice, login, logout } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('products');

  // Orders management state
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [authErrorStatus, setAuthErrorStatus] = useState(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  const handleAdminSignIn = async (e) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword) return;
    setSigningIn(true);
    const ok = await login(adminEmail.trim(), adminPassword);
    setSigningIn(false);
    if (ok) {
      setLoading(true);
      loadDashboard();
      loadOrders();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const loadDashboard = () => {
    getDashboard()
      .then((res) => {
        setData(res.data);
        setAuthErrorStatus(null);
        setError(false);
      })
      .catch((err) => {
        console.error(err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setAuthErrorStatus(err.response.status);
        }
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  const loadOrders = () => {
    setLoadingOrders(true);
    getAdminOrders(50)
      .then((res) => setOrders(res.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  };

  useEffect(() => {
    loadDashboard();
    loadOrders();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await updateAdminOrderStatus(orderId, newStatus);
      toast.success(
        lang === 'vi'
          ? `Đã cập nhật trạng thái đơn #${orderId} sang ${newStatus}`
          : `Order #${orderId} status updated to ${newStatus}`
      );
      loadOrders();
      loadDashboard();
    } catch {
      toast.error(
        lang === 'vi' ? 'Không thể cập nhật trạng thái đơn' : 'Failed to update order status'
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  /* ── Custom Tooltip ── */
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="ad-tooltip">
        {label && <p className="ad-tooltip-label">{label}</p>}
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color || entry.fill || '#8F755F' }}>
            {entry.name}: <strong>{entry.value?.toLocaleString()}</strong>
          </p>
        ))}
      </div>
    );
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="ad-loading">
        <div className="loading-spinner" />
        <p>{t('admin_loading')}</p>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="ad-error">
        <h2>
          {authErrorStatus
            ? lang === 'vi'
              ? 'Đăng Nhập Quản Trị Viên (Admin Console)'
              : 'Admin Console Sign In'
            : t('admin_error_title')}
        </h2>
        <p>
          {authErrorStatus === 401
            ? lang === 'vi'
              ? 'Vui lòng đăng nhập bằng tài khoản Admin để truy cập bảng điều khiển quản trị.'
              : 'Please sign in with an Admin account to access the Admin Console.'
            : authErrorStatus === 403
              ? lang === 'vi'
                ? 'Tài khoản hiện tại không có quyền Admin (403 Forbidden). Vui lòng đăng nhập tài khoản Admin.'
                : 'Your current account does not have Admin privileges (403 Forbidden). Please sign in as Admin.'
              : t('admin_error_loading')}
        </p>

        {authErrorStatus && (
          <form
            onSubmit={handleAdminSignIn}
            className="glass-card"
            style={{
              maxWidth: '380px',
              width: '100%',
              margin: '16px auto',
              padding: '22px',
              borderRadius: '16px',
              background: '#FFF',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              textAlign: 'left',
              boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
            }}
          >
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                Admin Email
              </label>
              <input
                type="email"
                className="form-input"
                required
                autoComplete="username"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="you@domain.com"
              />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                {lang === 'vi' ? 'Mật khẩu' : 'Password'}
              </label>
              <input
                type="password"
                className="form-input"
                required
                autoComplete="current-password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={signingIn} style={{ marginTop: '4px' }}>
              {signingIn
                ? lang === 'vi'
                  ? 'Đang đăng nhập...'
                  : 'Signing in...'
                : lang === 'vi'
                  ? 'Đăng nhập vào Admin Console'
                  : 'Sign In to Admin Console'}
            </button>
          </form>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link to="/" className="btn btn-secondary">
            {lang === 'vi' ? 'Về Trang Chủ' : 'Back to Home'}
          </Link>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            {t('admin_try_again')}
          </button>
        </div>
      </div>
    );
  }

  // Map backend stats correctly to overview fields
  const overview = {
    total_products: data?.products?.total,
    total_brands: data?.products?.total_brands,
    avg_rating: data?.products?.avg_rating,
    total_reviews: data?.reviews?.total_reviews,
  };

  // Group category distribution: top 6 + "Other" to keep donut chart clean & legible
  const rawCats = data?.category_distribution
    ? Object.entries(data.category_distribution)
        .map(([category, count]) => {
          const transKey = 'cat_' + category;
          const transVal = t(transKey);
          return {
            category: transVal === transKey ? category : transVal,
            count,
          };
        })
        .sort((a, b) => b.count - a.count)
    : [];

  const catDist =
    rawCats.length > 6
      ? [
          ...rawCats.slice(0, 6),
          {
            category: lang === 'vi' ? 'Danh mục khác' : 'Other Categories',
            count: rawCats.slice(6).reduce((acc, item) => acc + item.count, 0),
          },
        ]
      : rawCats;

  // Price range helper
  const getPriceRangeTranslation = (range) => {
    if (range.includes('Budget')) return t('admin_price_budget');
    if (range.includes('Mid')) return t('admin_price_mid');
    if (range.includes('Premium')) return t('admin_price_premium');
    if (range.includes('Luxury')) return t('admin_price_luxury');
    return range;
  };

  const priceRangeDist = data?.price_range_distribution
    ? Object.entries(data.price_range_distribution).map(([range, count]) => ({
        range: getPriceRangeTranslation(range),
        count,
      }))
    : [];

  const ratingDist = data?.rating_distribution ?? {};
  const ratingData = Object.entries(ratingDist).map(([rating, count]) => ({
    rating: Number(rating),
    count,
  }));

  const brandDist = data?.brand_distribution
    ? Object.entries(data.brand_distribution)
        .map(([brand, count]) => ({ brand, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    : [];

  const topProducts = (data?.top_products ?? []).map((p) => ({
    product_id: p.product_id,
    code: p.code,
    name: p.product_name,
    brand: p.brand_name,
    primary_category: p.primary_category,
    rating: p.rating,
    reviews_count: p.reviews_count,
    price: p.price_usd,
    image_url: p.image_url,
  }));

  const cleanTitle = (t('admin_title') || 'Admin Dashboard').replace(/^[^\p{L}\p{N}]+/u, '').trim();

  return (
    <div className="admin-dashboard">
      {/* ══ ADMIN NAVBAR (Pure Typographic Header) ════════ */}
      <nav className="admin-nav">
        <div className="admin-nav-inner">
          <Link to="/" className="admin-nav-logo">
            <span className="logo-text">
              Beauty<span className="logo-accent">AI</span>
              <span className="admin-badge">Admin</span>
            </span>
          </Link>

          <div className="admin-nav-tabs" role="tablist" aria-label="Admin workspace navigation">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'products'}
              className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              {lang === 'vi' ? 'Danh Mục Sản Phẩm (CRUD)' : 'Product Catalog (CRUD)'}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'orders'}
              className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              {lang === 'vi' ? `Đơn Hàng COD (${orders.length})` : `COD Orders (${orders.length})`}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'analytics'}
              className={`admin-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              {lang === 'vi' ? 'Phân Tích & Biểu Đồ' : 'Analytics & Charts'}
            </button>
          </div>

          <div className="admin-nav-actions">
            <Link to="/" className="btn btn-secondary btn-sm admin-nav-btn">
              <span>{t('nav_home') || 'Home'}</span>
            </Link>
            <button className="btn btn-outline btn-sm admin-nav-btn danger" onClick={handleLogout}>
              <span>{t('nav_logout')}</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        {/* ══ PAGE HEADER ══════════════════════════════════ */}
        <div className="ad-page-header">
          <div>
            <h1 className="ad-page-title display-font">{cleanTitle}</h1>
            <p className="ad-page-subtitle">{t('admin_subtitle')}</p>
          </div>
          <div className="ad-header-actions">
            <div className="ad-header-badge">
              <span className="ad-live-dot" />
              {t('admin_live')}
            </div>
          </div>
        </div>

        {/* ══ STATS CARDS (4 OFFICIAL KPIS — NO ICONS) ═════ */}
        <section className="ad-section">
          <div className="ad-stats-grid">
            <StatCard
              label={lang === 'vi' ? 'Tổng Sản Phẩm' : 'Total Products'}
              value={(data?.kpis?.total_products ?? overview.total_products)?.toLocaleString()}
              accent="#8F755F"
            />
            <StatCard
              label={lang === 'vi' ? 'Tổng Đơn Hàng' : 'Total Orders'}
              value={(data?.kpis?.total_orders ?? orders.length)?.toLocaleString()}
              accent="#C39B75"
            />
            <StatCard
              label={lang === 'vi' ? 'Doanh Thu (USD)' : 'Revenue (USD)'}
              value={
                data?.kpis?.total_revenue_usd
                  ? `$${data.kpis.total_revenue_usd.toFixed(2)}`
                  : '$0.00'
              }
              accent="#5CC8A0"
              sub="100% Cash on Delivery"
            />
            <StatCard
              label={lang === 'vi' ? 'Đơn Chờ Xử Lý' : 'Pending Orders'}
              value={(
                data?.kpis?.pending_orders ??
                orders.filter((o) => o.order_status === 'Pending').length
              )?.toLocaleString()}
              accent="#F0A86B"
              sub="Requires fulfillment"
            />
          </div>
        </section>

        {/* ══ TAB 1: PRODUCT CATALOG CRUD ══════════════════ */}
        {activeTab === 'products' && (
          <AdminProductSection
            lang={lang}
            formatPrice={formatPrice}
            onCatalogChanged={loadDashboard}
          />
        )}

        {/* ══ TAB 2: ORDERS MANAGEMENT (COD WORKFLOW) ══════ */}
        {activeTab === 'orders' && (
          <section className="ad-section">
            <SectionHeader
              title={
                lang === 'vi'
                  ? 'Quản Lý Đơn Hàng COD & Cập Nhật Trạng Thái'
                  : 'COD Orders Fulfillment & Status Management'
              }
              subtitle={
                lang === 'vi'
                  ? 'Theo dõi và cập nhật tiến độ giao hàng theo thời gian thực'
                  : 'Track and update order fulfillment status in real time'
              }
              action={
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={loadOrders}
                  disabled={loadingOrders}
                >
                  {loadingOrders
                    ? 'Loading...'
                    : lang === 'vi'
                      ? 'Làm mới đơn'
                      : 'Refresh Orders'}
                </button>
              }
            />
            <div className="ad-table-card glass-card">
              <div className="ad-table-wrapper">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>{lang === 'vi' ? 'Khách Hàng' : 'Customer'}</th>
                      <th>{lang === 'vi' ? 'Liên Hệ & Địa Chỉ' : 'Contact & Address'}</th>
                      <th>{lang === 'vi' ? 'Số Lượng' : 'Items'}</th>
                      <th>{lang === 'vi' ? 'Tổng Tiền' : 'Total'}</th>
                      <th>{lang === 'vi' ? 'Trạng Thái' : 'Status'}</th>
                      <th>{lang === 'vi' ? 'Cập Nhật' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="ad-table-empty">
                          {loadingOrders
                            ? lang === 'vi'
                              ? 'Đang tải danh sách đơn...'
                              : 'Loading orders...'
                            : lang === 'vi'
                              ? 'Chưa có đơn hàng COD nào.'
                              : 'No orders recorded yet.'}
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => {
                        const isDelivering = order.order_status === 'Delivering';
                        const isCompleted = order.order_status === 'Completed';
                        const isCancelled = order.order_status === 'Cancelled';

                        const statusColor = isCompleted
                          ? '#059669'
                          : isDelivering
                            ? '#2563EB'
                            : isCancelled
                              ? '#DC2626'
                              : '#D97706';

                        const statusBg = isCompleted
                          ? '#ECFDF5'
                          : isDelivering
                            ? '#EFF6FF'
                            : isCancelled
                              ? '#FEF2F2'
                              : '#FFFBEB';

                        return (
                          <tr key={order.id} className="ad-table-row">
                            <th scope="row" className="ad-row-header">
                              <strong>#{order.id}</strong>
                              <div className="ad-cell-meta">
                                {new Date(order.created_at).toLocaleDateString(
                                  lang === 'vi' ? 'vi-VN' : 'en-US'
                                )}
                              </div>
                            </th>
                            <td>
                              <span style={{ fontWeight: 600, color: '#2D2520' }}>
                                {order.recipient_name}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                {order.phone_number}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.78rem',
                                  color: '#666',
                                  maxWidth: '260px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {order.shipping_address}
                              </div>
                            </td>
                            <td>
                              <span className="ad-meta-tag">
                                {order.items_count || order.items?.length || 1} items
                              </span>
                            </td>
                            <td>
                              <strong style={{ color: '#8F755F' }}>
                                ${order.total_amount_usd?.toFixed(2)}
                              </strong>
                            </td>
                            <td>
                              <span
                                className="ad-status-pill"
                                style={{
                                  color: statusColor,
                                  background: statusBg,
                                  borderColor: `${statusColor}33`,
                                }}
                              >
                                {order.order_status}
                              </span>
                            </td>
                            <td>
                              <select
                                className="form-select"
                                style={{ padding: '5px 10px', fontSize: '0.8rem', borderRadius: '8px' }}
                                value={order.order_status}
                                disabled={updatingOrderId === order.id}
                                onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Delivering">Delivering</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ══ TAB 3: ANALYTICS & CHARTS ════════════════════ */}
        {activeTab === 'analytics' && (
          <>
            <section className="ad-section">
              <SectionHeader title={t('admin_cat_price_title')} />
              <div className="ad-charts-row">
                {/* Category Distribution – Pie */}
                <div className="ad-chart-card glass-card">
                  <h3 className="ad-chart-title">{t('admin_cat_dist')}</h3>
                  <ResponsiveContainer width="100%" height={330}>
                    <PieChart margin={{ top: 24, right: 24, bottom: 8, left: 24 }}>
                      <Pie
                        data={catDist}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="46%"
                        outerRadius={80}
                        innerRadius={44}
                        paddingAngle={2}
                        label={renderPieLabel}
                        labelLine={false}
                      >
                        {catDist.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={48}
                        wrapperStyle={{ paddingTop: '12px', lineHeight: '22px' }}
                        formatter={(value) => (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginRight: '8px' }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Price Range Distribution – Bar */}
                <div className="ad-chart-card glass-card">
                  <h3 className="ad-chart-title">{t('admin_price_dist')}</h3>
                  <ResponsiveContainer width="100%" height={330}>
                    <BarChart data={priceRangeDist} margin={{ top: 18, right: 16, left: 4, bottom: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis
                        dataKey="range"
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                        interval={0}
                      />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(143, 117, 95, 0.06)' }} />
                      <Bar dataKey="count" name={t('home_stat_products')} radius={[6, 6, 0, 0]}>
                        {priceRangeDist.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section className="ad-section">
              <SectionHeader title={t('admin_rating_brand_title')} />
              <div className="ad-charts-row">
                {/* Rating Distribution */}
                <div className="ad-chart-card glass-card">
                  <h3 className="ad-chart-title">{t('admin_rating_dist')}</h3>
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={ratingData} margin={{ top: 18, right: 16, left: 8, bottom: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis
                        dataKey="rating"
                        tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                        tickFormatter={(v) => `${v}/5`}
                      />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(143, 117, 95, 0.06)' }}
                      />
                      <Bar dataKey="count" name={t('home_stat_products')} radius={[6, 6, 0, 0]}>
                        {ratingData.map((entry, i) => (
                          <Cell key={i} fill={ratingColor(entry.rating)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Brands */}
                <div className="ad-chart-card glass-card">
                  <h3 className="ad-chart-title">{t('admin_brand_dist')}</h3>
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart
                      data={brandDist}
                      layout="vertical"
                      barCategoryGap="26%"
                      margin={{ top: 10, right: 24, left: 12, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <YAxis
                        dataKey="brand"
                        type="category"
                        interval={0}
                        width={145}
                        tick={{ fill: 'var(--text-secondary)', fontSize: 11.5 }}
                        tickFormatter={(val) =>
                          val && val.length > 18 ? `${val.slice(0, 17)}…` : val
                        }
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(143, 117, 95, 0.06)' }} />
                      <Bar dataKey="count" name={t('home_stat_products')} barSize={18} radius={[0, 6, 6, 0]}>
                        {brandDist.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* Top Products Table */}
            <section className="ad-section">
              <SectionHeader title={t('admin_top_products')} />
              <div className="ad-table-card glass-card">
                <div className="ad-table-wrapper">
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>{t('admin_table_product')}</th>
                        <th>{t('admin_table_brand')}</th>
                        <th>{t('admin_table_rating')}</th>
                        <th>Reviews</th>
                        <th>{t('admin_table_price')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="ad-table-empty">
                            {t('admin_no_data')}
                          </td>
                        </tr>
                      ) : (
                        topProducts.map((p, i) => (
                          <tr key={p.product_id ?? i} className="ad-table-row">
                            <th scope="row" className="ad-row-header">
                              <span className={`ad-rank-badge ${i < 3 ? 'top' : ''}`}>
                                {String(i + 1).padStart(2, '0')}
                              </span>
                            </th>
                            <td className="ad-product-name-cell">
                              <img
                                src={getProductImage(p)}
                                alt={p.name}
                                className="ad-product-thumb"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                                }}
                              />
                              <span className="ad-product-name" title={p.name}>
                                {p.name}
                              </span>
                            </td>
                            <td>
                              <span className="ad-brand-text">{p.brand}</span>
                            </td>
                            <td>
                              <span className="ad-rating">
                                {p.rating != null ? `${Number(p.rating).toFixed(1)} / 5.0` : '—'}
                              </span>
                            </td>
                            <td>
                              {p.reviews_count != null
                                ? Number(p.reviews_count).toLocaleString()
                                : '—'}
                            </td>
                            <td className="ad-price">
                              {p.price != null ? formatPrice(p.price) : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
