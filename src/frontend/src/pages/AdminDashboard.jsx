import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Package, Tag, Star, MessageSquare,
  TrendingUp, Award, ShoppingBag, BarChart2,
  Droplets, LogOut, Plus, Truck, CheckCircle, Clock, AlertTriangle, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getDashboard,
  getAdminOrders,
  updateAdminOrderStatus,
} from '../services/api';
import { useApp } from '../context/AppContext';
import AdminProductSection from '../components/admin/AdminProductSection';
import './AdminDashboard.css';

/* ── Palette ── */
const COLORS = [
  '#8F755F', '#C39B75', '#A39182', '#C5B9AE',
  '#5CC8A0', '#F0A86B', '#E86B6B', '#B09B8A',
];

/* ── Rating bar color by score ── */
const ratingColor = (rating) => {
  if (rating >= 5)   return '#5CC8A0';
  if (rating >= 4)   return '#C39B75';
  if (rating >= 3)   return '#F0A86B';
  if (rating >= 2)   return '#E86B6B';
  return '#A39182';
};

/* ── Pie custom label ── */
const renderPieLabel = ({ name, percent }) =>
  percent > 0.04 ? `${(percent * 100).toFixed(0)}%` : '';

/* ── Stat Card ── */
function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="ad-stat-card glass-card">
      <div className="ad-stat-icon" style={{ background: `${color}22`, color }}>
        <Icon size={22} />
      </div>
      <div className="ad-stat-body">
        <p className="ad-stat-label">{label}</p>
        <p className="ad-stat-value">{value ?? '—'}</p>
        {sub && <p className="ad-stat-sub">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Section Header ── */
function SectionHeader({ icon, title }) {
  return (
    <div className="ad-section-header">
      <span className="ad-section-icon">{icon}</span>
      <h2 className="ad-section-title">{title}</h2>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t, lang, changeLanguage, formatPrice, logout } = useApp();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Orders management state
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [authErrorStatus, setAuthErrorStatus] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const loadDashboard = () => {
    getDashboard()
      .then(res => {
        setData(res.data);
        setAuthErrorStatus(null);
        setError(false);
      })
      .catch(err => {
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
      .then(res => setOrders(res.data || []))
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
      toast.success(lang === 'vi' ? `Đã cập nhật trạng thái đơn #${orderId} sang ${newStatus}` : `Order #${orderId} status updated to ${newStatus}`);
      loadOrders();
      loadDashboard();
    } catch {
      toast.error(lang === 'vi' ? 'Không thể cập nhật trạng thái đơn' : 'Failed to update order status');
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
        <BarChart2 size={48} />
        <h2>
          {authErrorStatus
            ? lang === 'vi'
              ? 'Yêu Cầu Quyền Quản Trị (Admin)'
              : 'Admin Authorization Required'
            : t('admin_error_title')}
        </h2>
        <p>
          {authErrorStatus === 401
            ? lang === 'vi'
              ? 'Vui lòng đăng nhập bằng tài khoản Admin để truy cập bảng điều khiển quản trị.'
              : 'Please sign in with an Admin account to access the Admin Console.'
            : authErrorStatus === 403
              ? lang === 'vi'
                ? 'Tài khoản hiện tại không có quyền Admin (403 Forbidden).'
                : 'Your current account does not have Admin privileges (403 Forbidden).'
              : t('admin_error_loading')}
        </p>
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

  // Convert categories dict to localized list
  const catDist = data?.category_distribution
    ? Object.entries(data.category_distribution).map(([category, count]) => {
        const transKey = 'cat_' + category;
        const transVal = t(transKey);
        return {
          category: transVal === transKey ? category : transVal,
          count,
        };
      })
    : [];

  // Price range helper
  const getPriceRangeTranslation = (range) => {
    if (range.includes('Budget')) return t('admin_price_budget');
    if (range.includes('Mid')) return t('admin_price_mid');
    if (range.includes('Premium')) return t('admin_price_premium');
    if (range.includes('Luxury')) return t('admin_price_luxury');
    return range;
  };

  // Convert price ranges dict to list
  const priceRangeDist = data?.price_range_distribution
    ? Object.entries(data.price_range_distribution).map(([range, count]) => ({
        range: getPriceRangeTranslation(range),
        count,
      }))
    : [];

  // Convert ratings dict to list
  const ratingDist = data?.rating_distribution ?? {};
  const ratingData = Object.entries(ratingDist).map(([rating, count]) => ({
    rating: Number(rating),
    count,
  }));

  // Convert brands dict to list, sort by count descending, and slice top 10
  const brandDist = data?.brand_distribution
    ? Object.entries(data.brand_distribution)
        .map(([brand, count]) => ({ brand, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    : [];

  // Map products keys for table compliance
  const topProducts = (data?.top_products ?? []).map(p => ({
    product_id: p.product_id,
    name: p.product_name,
    brand: p.brand_name,
    rating: p.rating,
    loves_count: p.loves_count,
    price: p.price_usd,
    image_url: p.image_url,
  }));

  // Skin type helper
  const getSkinTypeTranslation = (name) => {
    if (!name) return '—';
    const lowerName = name.toLowerCase();
    if (lowerName === 'unknown') return t('safety_unknown');
    const key = `skin_type_${lowerName}`;
    const trans = t(key);
    return trans === key ? name : trans;
  };

  const skinTypeDist = data?.reviews?.skin_type_distribution ?? {};
  const skinTypeData = Object.entries(skinTypeDist)
    .map(([name, count]) => ({
      name: getSkinTypeTranslation(name),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const skinTypeMax = skinTypeData.length > 0 ? skinTypeData[0].count : 1;

  return (
    <div className="admin-dashboard">
      {/* ══ ADMIN NAVBAR ══════════════════════════════════ */}
      <nav className="admin-nav animate-fadeIn">
        <div className="admin-nav-inner">
          <Link to="/" className="admin-nav-logo">
            <div className="logo-icon">
              <Droplets size={16} />
            </div>
            <span className="logo-text">
              Beauty<span className="logo-accent">AI</span> <span className="admin-badge">Admin</span>
            </span>
          </Link>
          <div className="admin-nav-actions">
            <Link to="/" className="btn btn-secondary btn-sm admin-nav-btn">
              🏠 {t('nav_home') || 'Về Trang Chủ'}
            </Link>
            <button className="btn btn-outline btn-sm admin-nav-btn danger" onClick={handleLogout}>
              <LogOut size={14} /> {t('nav_logout')}
            </button>
          </div>
        </div>
      </nav>

      <div className="container">

        {/* ══ PAGE HEADER ══════════════════════════════════ */}
        <div className="ad-page-header animate-fadeIn">
          <div>
            <h1 className="ad-page-title display-font">
              {t('admin_title')}
            </h1>
            <p className="ad-page-subtitle">{t('admin_subtitle')}</p>
          </div>
          <div className="ad-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="ad-header-badge">
              <span className="ad-live-dot" />
              {t('admin_live')}
            </div>
          </div>
        </div>

        {/* ══ STATS CARDS (4 OFFICIAL KPIS) ════════════════ */}
        <section className="ad-section animate-fadeIn">
          <div className="ad-stats-grid">
            <StatCard
              icon={Package}
              label={lang === 'vi' ? 'Tổng Sản Phẩm' : 'Total Products'}
              value={(data?.kpis?.total_products ?? overview.total_products)?.toLocaleString()}
              color="#8F755F"
            />
            <StatCard
              icon={ShoppingBag}
              label={lang === 'vi' ? 'Tổng Đơn Hàng' : 'Total Orders'}
              value={(data?.kpis?.total_orders ?? orders.length)?.toLocaleString()}
              color="#C39B75"
            />
            <StatCard
              icon={TrendingUp}
              label={lang === 'vi' ? 'Doanh Thu (USD)' : 'Revenue (USD)'}
              value={data?.kpis?.total_revenue_usd ? `$${data.kpis.total_revenue_usd.toFixed(2)}` : '$0.00'}
              color="#5CC8A0"
              sub="100% Cash on Delivery"
            />
            <StatCard
              icon={Clock}
              label={lang === 'vi' ? 'Đơn Đang Chờ Xử Lý' : 'Pending Orders'}
              value={(data?.kpis?.pending_orders ?? orders.filter(o => o.order_status === 'Pending').length)?.toLocaleString()}
              color="#F0A86B"
              sub="Requires fulfillment"
            />
          </div>
        </section>

        {/* ══ CHARTS ROW 1 ═════════════════════════════════ */}
        <section className="ad-section">
          <SectionHeader icon="🗂️" title={t('admin_cat_price_title')} />
          <div className="ad-charts-row">

            {/* Category Distribution – Pie */}
            <div className="ad-chart-card glass-card">
              <h3 className="ad-chart-title">{t('admin_cat_dist')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={catDist}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    innerRadius={50}
                    paddingAngle={3}
                    label={renderPieLabel}
                    labelLine={false}
                  >
                    {catDist.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
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
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priceRangeDist} margin={{ top: 10, right: 16, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis
                    dataKey="range"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
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

        {/* ══ CHARTS ROW 2 ═════════════════════════════════ */}
        <section className="ad-section">
          <SectionHeader icon="⭐" title={t('admin_rating_brand_title')} />
          <div className="ad-charts-row">

            {/* Rating Distribution – Bar colored by score */}
            <div className="ad-chart-card glass-card">
              <h3 className="ad-chart-title">{t('admin_rating_dist')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ratingData} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis
                    dataKey="rating"
                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                    tickFormatter={(v) => `${v}★`}
                  />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip
                    content={<CustomTooltip />}
                    formatter={(v, n, { payload }) => [v, `${t('admin_table_rating')} ${payload.rating}★`]}
                  />
                  <Bar dataKey="count" name={t('home_stat_products')} radius={[6, 6, 0, 0]}>
                    {ratingData.map((entry, i) => (
                      <Cell key={i} fill={ratingColor(entry.rating)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Brands – Bar */}
            <div className="ad-chart-card glass-card">
              <h3 className="ad-chart-title">{t('admin_brand_dist')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={brandDist}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis
                    dataKey="brand"
                    type="category"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                    width={90}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name={t('home_stat_products')} radius={[0, 6, 6, 0]}>
                    {brandDist.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* ══ TOP PRODUCTS TABLE ═══════════════════════════ */}
        <section className="ad-section">
          <SectionHeader icon="🏆" title={t('admin_top_products')} />
          <div className="ad-table-card glass-card">
            <div className="ad-table-wrapper">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t('admin_table_product')}</th>
                    <th>{t('admin_table_brand')}</th>
                    <th>{t('admin_table_rating')}</th>
                    <th>{t('admin_table_loves')}</th>
                    <th>{t('admin_table_price')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="ad-table-empty">{t('admin_no_data')}</td>
                    </tr>
                  ) : (
                    topProducts.map((p, i) => (
                      <tr key={p.product_id ?? i} className="ad-table-row">
                        <td>
                          <span className={`ad-rank ad-rank-${i < 3 ? i + 1 : 'default'}`}>
                            {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                          </span>
                        </td>
                        <td className="ad-product-name-cell">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="ad-product-thumb"
                            />
                          ) : (
                            <div className="ad-product-thumb-placeholder">💄</div>
                          )}
                          <span className="ad-product-name" title={p.name}>{p.name}</span>
                        </td>
                        <td>
                          <span className="badge badge-secondary">{p.brand}</span>
                        </td>
                        <td>
                          <span className="ad-rating">
                            <Star size={13} fill="#F0A86B" color="#F0A86B" />
                            {p.rating != null ? Number(p.rating).toFixed(1) : '—'}
                          </span>
                        </td>
                        <td className="ad-loves">
                          ❤️ {p.loves_count != null ? Number(p.loves_count).toLocaleString() : '—'}
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

        {/* ══ ORDERS MANAGEMENT (COD WORKFLOW) ════════════ */}
        <section className="ad-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <SectionHeader icon="📦" title={lang === 'vi' ? 'Quản Lý Đơn Hàng COD & Cập Nhật Trạng Thái' : 'COD Orders Fulfillment & Status Management'} />
            <button className="btn btn-secondary btn-sm" onClick={loadOrders} disabled={loadingOrders}>
              {loadingOrders ? 'Loading...' : (lang === 'vi' ? 'Làm mới đơn' : 'Refresh Orders')}
            </button>
          </div>
          <div className="ad-table-card glass-card">
            <div className="ad-table-wrapper">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th># Order</th>
                    <th>{lang === 'vi' ? 'Khách Hàng' : 'Customer'}</th>
                    <th>{lang === 'vi' ? 'Số Điện Thoại & Địa Chỉ' : 'Contact & Address'}</th>
                    <th>{lang === 'vi' ? 'Số Lượng SP' : 'Items'}</th>
                    <th>{lang === 'vi' ? 'Tổng Tiền' : 'Total'}</th>
                    <th>{lang === 'vi' ? 'Trạng Thái' : 'Status'}</th>
                    <th>{lang === 'vi' ? 'Cập Nhật Trạng Thái' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="ad-table-empty">
                        {loadingOrders ? (lang === 'vi' ? 'Đang tải danh sách đơn...' : 'Loading orders...') : (lang === 'vi' ? 'Chưa có đơn hàng COD nào.' : 'No orders recorded yet.')}
                      </td>
                    </tr>
                  ) : (
                    orders.map(order => {
                      const isPending = order.order_status === 'Pending';
                      const isDelivering = order.order_status === 'Delivering';
                      const isCompleted = order.order_status === 'Completed';
                      const isCancelled = order.order_status === 'Cancelled';

                      const statusColor = isCompleted ? '#059669' :
                                          isDelivering ? '#2563EB' :
                                          isCancelled ? '#DC2626' : '#D97706';

                      const statusBg = isCompleted ? '#ECFDF5' :
                                       isDelivering ? '#EFF6FF' :
                                       isCancelled ? '#FEF2F2' : '#FFFBEB';

                      return (
                        <tr key={order.id} className="ad-table-row">
                          <td>
                            <strong>#{order.id}</strong>
                            <div style={{ fontSize: '0.72rem', color: '#888' }}>
                              {new Date(order.created_at).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: '#2D2520' }}>{order.recipient_name}</span>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{order.phone_number}</div>
                            <div style={{ fontSize: '0.78rem', color: '#666', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {order.shipping_address}
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-secondary">{order.items_count || order.items?.length || 1} items</span>
                          </td>
                          <td>
                            <strong style={{ color: '#C48B71' }}>${order.total_amount_usd?.toFixed(2)}</strong>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: statusColor,
                                background: statusBg,
                                border: `1px solid ${statusColor}44`
                              }}
                            >
                              {order.order_status}
                            </span>
                          </td>
                          <td>
                            <select
                              className="form-select"
                              style={{ padding: '4px 8px', fontSize: '0.8rem', borderRadius: '8px' }}
                              value={order.order_status}
                              disabled={updatingOrderId === order.id}
                              onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                            >
                              <option value="Pending">Pending (Chờ duyệt)</option>
                              <option value="Delivering">Delivering (Đang giao)</option>
                              <option value="Completed">Completed (Đã giao)</option>
                              <option value="Cancelled">Cancelled (Hủy đơn)</option>
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

        {/* ══ PRODUCT CATALOG CRUD SECTION ════════════════ */}
        <AdminProductSection
          lang={lang}
          formatPrice={formatPrice}
          onCatalogChanged={loadDashboard}
        />

      </div>
    </div>
  );
}
