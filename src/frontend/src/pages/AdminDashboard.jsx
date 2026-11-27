import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Star,
  Users,
  MessageSquare,
  FlaskConical,
  AlertTriangle,
  Tag,
  Store,
  LogOut,
  Menu,
  X,
  RefreshCw,
  DollarSign,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { getDashboard } from '../services/api';
import { useApp } from '../context/AppContext';
import { getProductImage, DEFAULT_PRODUCT_IMAGE } from '../utils/productImages';
import AdminProductSection from '../components/admin/AdminProductSection';
import AdminOrderSection from '../components/admin/AdminOrderSection';
import AdminReviewSection from '../components/admin/AdminReviewSection';
import AdminUserSection from '../components/admin/AdminUserSection';
import AdminSupportSection from '../components/admin/AdminSupportSection';
import AdminIntelligenceSection from '../components/admin/AdminIntelligenceSection';
import AdminCatalogMetaSection from '../components/admin/AdminCatalogMetaSection';
import {
  LOW_STOCK_THRESHOLD,
  formatStatusLabel,
  formatCompactUsd,
} from '../components/admin/adminConstants';
import './AdminDashboard.css';

const PIE_COLORS = [
  '#4A3728', '#7D634E', '#A39182', '#C39B75',
  '#2E6F4E', '#D97706', '#C46D4E', '#B09B8A',
];

const RANK_BAR_COLOR = '#4A3728';

// Correct sentiment gradient: 5★ green → 1★ darkest red
const ratingColor = (rating) => {
  if (rating >= 5) return '#059669';
  if (rating >= 4) return '#65A30D';
  if (rating >= 3) return '#D97706';
  if (rating >= 2) return '#EA580C';
  return '#DC2626';
};

const renderPieLabel = ({ percent }) =>
  percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : '';

const shortenPriceTick = (label) => {
  const s = String(label || '');
  if (s.includes('<$25') || s.toLowerCase().includes('budget')) return '<$25';
  if (s.includes('$25') || s.toLowerCase().includes('mid')) return '$25–50';
  if (s.includes('$50') || s.toLowerCase().includes('premium')) return '$50–100';
  if (s.includes('>$100') || s.toLowerCase().includes('luxury')) return '>$100';
  return s.length > 12 ? `${s.slice(0, 11)}…` : s;
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="ad-tooltip">
      {label && <p className="ad-tooltip-label">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || entry.fill || '#4A3728' }}>
          {entry.name}: <strong>{entry.value?.toLocaleString('en-US')}</strong>
        </p>
      ))}
    </div>
  );
}

const VALID_TABS = new Set([
  'overview',
  'products',
  'catalog-meta',
  'orders',
  'reviews',
  'users',
  'support',
  'ingredients',
  'conflicts',
]);

function StatCard({ label, value, valueTitle, sub, icon: Icon, accent, onClick }) {
  return (
    <button
      type="button"
      className={`ad-stat-card glass-card ${onClick ? 'ad-stat-clickable' : ''}`}
      onClick={onClick}
      style={{ '--stat-accent': accent }}
    >
      <div className="ad-stat-top">
        <span className="ad-stat-label">{label}</span>
        {Icon && (
          <span className="ad-stat-icon" style={{ background: `${accent}18`, color: accent }}>
            <Icon size={16} />
          </span>
        )}
      </div>
      <p className="ad-stat-value" title={valueTitle || String(value ?? '')}>
        {value ?? '—'}
      </p>
      {sub && <p className="ad-stat-sub" title={sub}>{sub}</p>}
    </button>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { formatPrice, user, login, logout } = useApp();

  const initialTab = searchParams.get('tab');
  const activeTab = VALID_TABS.has(initialTab) ? initialTab : 'overview';

  const setActiveTab = useCallback(
    (tabId) => {
      const next = VALID_TABS.has(tabId) ? tabId : 'overview';
      setSearchParams(next === 'overview' ? {} : { tab: next });
    },
    [setSearchParams]
  );

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState('syncing'); // 'online' | 'syncing' | 'offline'
  const [error, setError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Admin inline sign-in state
  const [authErrorStatus, setAuthErrorStatus] = useState(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  const loadDashboard = useCallback((silent = false) => {
    setSyncState('syncing');
    if (!silent) setLoading(true);

    getDashboard()
      .then((res) => {
        setData(res.data);
        setAuthErrorStatus(null);
        setError(false);
        setSyncState('online');
      })
      .catch((err) => {
        console.error(err);
        setSyncState('offline');
        if (err.response?.status === 401 || err.response?.status === 403) {
          setAuthErrorStatus(err.response.status);
          setError(true);
        } else if (!silent) {
          setError(true);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadDashboard(false);
  }, [loadDashboard]);

  // Redirect back to Admin Sign-In immediately if JWT expires mid-session
  useEffect(() => {
    const handleAuthExpired = () => {
      setAuthErrorStatus(401);
      setError(true);
      setSyncState('offline');
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const handleAdminSignIn = async (e) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword) return;
    setSigningIn(true);
    const ok = await login(adminEmail.trim(), adminPassword);
    setSigningIn(false);
    if (ok) {
      loadDashboard(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="ad-loading">
        <div className="loading-spinner" />
        <p>Loading Admin Console...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ad-error">
        <h2>{authErrorStatus ? 'Admin Console Sign In' : 'Unable to Load Admin Console'}</h2>
        <p>
          {authErrorStatus === 401
            ? 'Please sign in with an Admin account to access the Admin Console.'
            : authErrorStatus === 403
              ? 'Your current account does not have Admin privileges (403 Forbidden).'
              : 'Could not connect to the backend API. Please verify the server is running.'}
        </p>

        {authErrorStatus && (
          <form onSubmit={handleAdminSignIn} className="glass-card ad-login-card">
            <div>
              <label htmlFor="admin-login-email" className="form-label" style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                Admin Email
              </label>
              <input
                id="admin-login-email"
                type="email"
                className="form-input"
                required
                autoComplete="username"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@beautyai.com"
              />
            </div>
            <div>
              <label htmlFor="admin-login-password" className="form-label" style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                Password
              </label>
              <input
                id="admin-login-password"
                type="password"
                className="form-input"
                required
                autoComplete="current-password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={signingIn} style={{ marginTop: 4 }}>
              {signingIn ? 'Signing in...' : 'Sign In to Admin Console'}
            </button>
          </form>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-secondary">
            Back to Storefront
          </Link>
          {authErrorStatus === 403 && user && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                logout();
                setAuthErrorStatus(401);
              }}
            >
              Sign Out
            </button>
          )}
          {!authErrorStatus && (
            <button type="button" className="btn btn-primary" onClick={() => loadDashboard(false)}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const displayName = user?.fullName || user?.name || 'Administrator';
  const displayEmail = user?.email || 'admin@beautyai.com';

  const kpis = data?.kpis || {};
  const pendingOrders = kpis.pending_orders ?? 0;
  const openTickets = kpis.open_tickets ?? 0;
  const totalRevenueUsd = kpis.total_revenue_usd ?? 0;

  const navGroups = [
    {
      label: 'Overview',
      items: [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Commerce',
      items: [
        { id: 'products', label: 'Products', icon: Package },
        { id: 'catalog-meta', label: 'Brands & Categories', icon: Tag },
        {
          id: 'orders',
          label: 'Orders & Shipping',
          icon: ShoppingBag,
          badge: pendingOrders > 0 ? pendingOrders : null,
          badgeTone: 'warn',
        },
        { id: 'reviews', label: 'Reviews & Ratings', icon: Star },
      ],
    },
    {
      label: 'Customers',
      items: [
        { id: 'users', label: 'Users', icon: Users },
        {
          id: 'support',
          label: 'Support & Feedback',
          icon: MessageSquare,
          badge: openTickets > 0 ? openTickets : null,
          badgeTone: 'alert',
        },
      ],
    },
    {
      label: 'Cosmetic Intelligence',
      items: [
        { id: 'ingredients', label: 'INCI Dictionary', icon: FlaskConical },
        { id: 'conflicts', label: 'Conflict Rules', icon: AlertTriangle },
      ],
    },
  ];

  const activeNavLabel =
    navGroups.flatMap((g) => g.items).find((item) => item.id === activeTab)?.label || 'Dashboard';

  // Charts transformations
  const rawCats = data?.category_distribution
    ? Object.entries(data.category_distribution)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
    : [];

  const catDist =
    rawCats.length > 6
      ? [
          ...rawCats.slice(0, 6),
          {
            category: 'Other Categories',
            count: rawCats.slice(6).reduce((acc, item) => acc + item.count, 0),
          },
        ]
      : rawCats;

  const priceRangeDist = data?.price_range_distribution
    ? Object.entries(data.price_range_distribution).map(([range, count]) => ({ range, count }))
    : [];

  const ratingData = Object.entries(data?.rating_distribution ?? {})
    .map(([rating, count]) => ({ rating: Number(rating), count }))
    .sort((a, b) => a.rating - b.rating);

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

  const recentOrders = data?.recent_orders ?? [];
  const recentTickets = data?.recent_tickets ?? [];

  const renderMoney = (usd) =>
    typeof formatPrice === 'function' ? formatPrice(usd || 0) : `$${Number(usd || 0).toFixed(2)}`;

  const statusBadgeText =
    syncState === 'online' ? 'API Online' : syncState === 'syncing' ? 'Syncing...' : 'API Offline';

  return (
    <div className="ad-shell">
      {sidebarOpen && (
        <div className="ad-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ══ LEFT SIDEBAR ════════════════════════════════════════════ */}
      <aside className={`ad-sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Admin navigation">
        <div className="ad-sidebar-brand">
          <Link to="/" className="admin-nav-logo">
            <span className="logo-text">
              Beauty<span className="logo-accent">AI</span>
              <span className="admin-badge">Admin</span>
            </span>
          </Link>
          <button
            type="button"
            className="ad-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="ad-sidebar-profile">
          <div className="ad-avatar-circle ad-avatar-lg">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="ad-profile-meta">
            <div className="ad-profile-name" title={displayName}>{displayName}</div>
            <div className="ad-profile-email" title={displayEmail}>{displayEmail}</div>
          </div>
        </div>

        <nav className="ad-sidebar-nav">
          {navGroups.map((group) => (
            <div key={group.label} className="ad-nav-group">
              <div className="ad-nav-group-label">{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={isActive ? 'page' : undefined}
                    className={`ad-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectTab(item.id)}
                  >
                    <Icon size={17} className="ad-nav-item-icon" />
                    <span className="ad-nav-item-label">{item.label}</span>
                    {item.badge != null && (
                      <span className={`ad-nav-badge ${item.badgeTone || ''}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="ad-sidebar-footer">
          <Link to="/" className="ad-sidebar-foot-btn">
            <Store size={16} />
            <span>View Storefront</span>
          </Link>
          <button type="button" className="ad-sidebar-foot-btn danger" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ══ MAIN WORKSPACE ══════════════════════════════════════════ */}
      <div className="ad-main">
        <header className="ad-topbar">
          <div className="ad-topbar-left">
            <button
              type="button"
              className="ad-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="ad-topbar-title">{activeNavLabel}</h1>
              <p className="ad-topbar-sub">
                BeautyAI Admin Console · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: '2-digit', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="ad-topbar-right">
            <div className={`ad-header-badge ${syncState}`}>
              <span className="ad-live-dot" />
              {statusBadgeText}
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm ad-btn-icon"
              onClick={() => loadDashboard(true)}
              disabled={syncState === 'syncing'}
            >
              <RefreshCw size={14} className={syncState === 'syncing' ? 'ad-spin' : ''} />
              <span>Sync</span>
            </button>
          </div>
        </header>

        <main className="ad-content">
          {/* ══ TAB: OVERVIEW DASHBOARD ══ */}
          {activeTab === 'overview' && (
            <>
              <div className="ad-welcome-banner glass-card">
                <div>
                  <h2 className="ad-welcome-title display-font">
                    Welcome back, {displayName}
                  </h2>
                  <p className="ad-welcome-sub">
                    You have {pendingOrders} pending {pendingOrders === 1 ? 'order' : 'orders'} and {openTickets} open support {openTickets === 1 ? 'ticket' : 'tickets'}.
                  </p>
                </div>
                <div className="ad-welcome-actions">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setActiveTab('products')}>
                    Manage Products
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveTab('orders')}>
                    Process Orders
                  </button>
                </div>
              </div>

              <section className="ad-section">
                <div className="ad-stats-grid ad-stats-5">
                  <StatCard
                    label="Revenue"
                    value={formatCompactUsd(totalRevenueUsd)}
                    valueTitle={renderMoney(totalRevenueUsd)}
                    sub={`${kpis.total_orders ?? 0} total orders`}
                    icon={DollarSign}
                    accent="#059669"
                    onClick={() => setActiveTab('orders')}
                  />
                  <StatCard
                    label="Pending"
                    value={pendingOrders.toLocaleString('en-US')}
                    sub="Orders to ship"
                    icon={Clock}
                    accent="#D97706"
                    onClick={() => setActiveTab('orders')}
                  />
                  <StatCard
                    label="Products"
                    value={(kpis.total_products ?? data?.products?.total ?? 0).toLocaleString('en-US')}
                    sub={
                      kpis.low_stock_products > 0
                        ? `${kpis.low_stock_products} low stock (≤${LOW_STOCK_THRESHOLD})`
                        : `${data?.products?.total_brands ?? 0} brands`
                    }
                    icon={Package}
                    accent="#4A3728"
                    onClick={() => setActiveTab('products')}
                  />
                  <StatCard
                    label="Users"
                    value={(kpis.total_users ?? kpis.active_users ?? 0).toLocaleString('en-US')}
                    sub={`${kpis.active_users ?? 0} active`}
                    icon={Users}
                    accent="#2563EB"
                    onClick={() => setActiveTab('users')}
                  />
                  <StatCard
                    label="Tickets"
                    value={openTickets.toLocaleString('en-US')}
                    sub="Open support"
                    icon={MessageSquare}
                    accent="#DC2626"
                    onClick={() => setActiveTab('support')}
                  />
                </div>
              </section>

              {/* Action Needed Row */}
              <section className="ad-section">
                <div className="ad-charts-row">
                  <div className="ad-chart-card glass-card">
                    <div className="ad-card-head">
                      <h3 className="ad-chart-title">Recent Orders</h3>
                      <button type="button" className="ad-link-btn" onClick={() => setActiveTab('orders')}>
                        View all <ArrowRight size={13} />
                      </button>
                    </div>
                    {recentOrders.length === 0 ? (
                      <p className="ad-empty-mini">No orders recorded yet.</p>
                    ) : (
                      <div className="ad-mini-list">
                        {recentOrders.map((o) => (
                          <div
                            key={o.id}
                            role="button"
                            tabIndex={0}
                            className="ad-mini-row"
                            onClick={() => setActiveTab('orders')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setActiveTab('orders');
                              }
                            }}
                          >
                            <div>
                              <strong>#{o.id} · {o.recipient_name}</strong>
                              <div className="ad-cell-meta">
                                {o.items_count} {o.items_count === 1 ? 'item' : 'items'} · {new Date(o.created_at).toLocaleDateString('en-US')}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <strong className="ad-price">{renderMoney(o.total_amount_usd)}</strong>
                              <div className="ad-cell-meta">{formatStatusLabel(o.order_status)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="ad-chart-card glass-card">
                    <div className="ad-card-head">
                      <h3 className="ad-chart-title">Latest Support & Feedback</h3>
                      <button type="button" className="ad-link-btn" onClick={() => setActiveTab('support')}>
                        Open inbox <ArrowRight size={13} />
                      </button>
                    </div>
                    {recentTickets.length === 0 ? (
                      <p className="ad-empty-mini">No support tickets yet.</p>
                    ) : (
                      <div className="ad-mini-list">
                        {recentTickets.map((tk) => (
                          <div
                            key={tk.id}
                            role="button"
                            tabIndex={0}
                            className="ad-mini-row"
                            onClick={() => setActiveTab('support')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setActiveTab('support');
                              }
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <strong className="ad-truncate-cell" style={{ display: 'block' }}>
                                {tk.ticketCode} — {tk.subject}
                              </strong>
                              <div className="ad-cell-meta">{tk.name} · {tk.email}</div>
                            </div>
                            <span className="ad-meta-tag">{formatStatusLabel(tk.status)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Charts Row 1 */}
              <section className="ad-section">
                <div className="ad-charts-row">
                  <div className="ad-chart-card glass-card">
                    <h3 className="ad-chart-title">Category Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={catDist}
                          dataKey="count"
                          nameKey="category"
                          cx="50%"
                          cy="45%"
                          outerRadius={78}
                          innerRadius={44}
                          paddingAngle={2}
                          label={renderPieLabel}
                          labelLine={false}
                        >
                          {catDist.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                        <Legend verticalAlign="bottom" height={44} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="ad-chart-card glass-card">
                    <h3 className="ad-chart-title">Price Tier Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={priceRangeDist} margin={{ top: 16, right: 16, left: 4, bottom: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                        <XAxis
                          dataKey="range"
                          tickFormatter={shortenPriceTick}
                          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                          interval={0}
                        />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="count" name="Products" fill={RANK_BAR_COLOR} radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              {/* Charts Row 2 */}
              <section className="ad-section">
                <div className="ad-charts-row">
                  <div className="ad-chart-card glass-card">
                    <h3 className="ad-chart-title">Star Rating Distribution</h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={ratingData} margin={{ top: 16, right: 16, left: 8, bottom: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                        <XAxis dataKey="rating" tickFormatter={(v) => `${v}★`} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="count" name="Reviews" radius={[6, 6, 0, 0]}>
                          {ratingData.map((entry, i) => (
                            <Cell key={i} fill={ratingColor(entry.rating)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="ad-chart-card glass-card">
                    <h3 className="ad-chart-title">Top 10 Brands by Product Count</h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={brandDist} layout="vertical" margin={{ top: 8, right: 20, left: 10, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                        <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                        <YAxis
                          dataKey="brand"
                          type="category"
                          interval={0}
                          width={130}
                          tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                          tickFormatter={(val) => (val && val.length > 16 ? `${val.slice(0, 15)}…` : val)}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="count" name="Products" fill={RANK_BAR_COLOR} barSize={16} radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              {/* Top Products Table */}
              <section className="ad-section">
                <div className="ad-section-header">
                  <div>
                    <h2 className="ad-section-title">Top Rated Products</h2>
                  </div>
                </div>
                <div className="ad-table-card glass-card">
                  <div className="ad-table-wrapper">
                    <table className="ad-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Product</th>
                          <th>Brand</th>
                          <th>Rating</th>
                          <th>Reviews</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.length === 0 ? (
                          <tr><td colSpan={6} className="ad-table-empty">No product data available.</td></tr>
                        ) : (
                          topProducts.map((p, i) => (
                            <tr key={p.product_id ?? i} className="ad-table-row">
                              <th scope="row" className="ad-row-header">
                                <span className={`ad-rank-badge ${i < 3 ? 'top' : ''}`}>
                                  {String(i + 1).padStart(2, '0')}
                                </span>
                              </th>
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
                                  <span className="ad-product-name" title={p.name}>{p.name}</span>
                                </div>
                              </td>
                              <td><span className="ad-brand-text">{p.brand}</span></td>
                              <td>
                                <span className="ad-rating">
                                  {p.rating != null ? `${Number(p.rating).toFixed(1)} ★` : '—'}
                                </span>
                              </td>
                              <td>{p.reviews_count != null ? Number(p.reviews_count).toLocaleString('en-US') : '—'}</td>
                              <td className="ad-price">{renderMoney(p.price)}</td>
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

          {activeTab === 'products' && (
            <AdminProductSection
              formatPrice={formatPrice}
              onCatalogChanged={() => loadDashboard(true)}
            />
          )}

          {activeTab === 'catalog-meta' && (
            <AdminCatalogMetaSection
              onCatalogChanged={() => loadDashboard(true)}
            />
          )}

          {activeTab === 'orders' && (
            <AdminOrderSection
              formatPrice={formatPrice}
              onOrdersChanged={() => loadDashboard(true)}
            />
          )}

          {activeTab === 'reviews' && (
            <AdminReviewSection
              onReviewsChanged={() => loadDashboard(true)}
            />
          )}

          {activeTab === 'users' && (
            <AdminUserSection
              currentUser={user}
              formatPrice={formatPrice}
              onUsersChanged={() => loadDashboard(true)}
            />
          )}

          {activeTab === 'support' && (
            <AdminSupportSection
              onTicketsChanged={() => loadDashboard(true)}
            />
          )}

          {(activeTab === 'ingredients' || activeTab === 'conflicts') && (
            <AdminIntelligenceSection
              defaultSubTab={activeTab === 'conflicts' ? 'conflicts' : 'ingredients'}
              onSubTabChange={(sub) => setActiveTab(sub === 'conflicts' ? 'conflicts' : 'ingredients')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
