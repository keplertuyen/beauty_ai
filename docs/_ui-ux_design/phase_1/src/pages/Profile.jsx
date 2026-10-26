import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShoppingBag, Save, Camera, Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { updateProfile, getMyOrders } from '../services/api';
import { getProductImage } from '../utils/productImages';
import './Profile.css';

const STATUS_MAP = {
  pending:    { labelKey: 'order_status_pending', defaultLabel: 'Chờ xác nhận', color: 'badge-warning',   icon: Clock },
  confirmed:  { labelKey: 'order_status_confirmed', defaultLabel: 'Đã xác nhận',  color: 'badge-secondary', icon: CheckCircle },
  shipped:    { labelKey: 'order_status_shipped', defaultLabel: 'Đang giao',     color: 'badge-primary',   icon: Truck },
  delivered:  { labelKey: 'order_status_delivered', defaultLabel: 'Đã giao',       color: 'badge-success',   icon: CheckCircle },
  cancelled:  { labelKey: 'order_status_cancelled', defaultLabel: 'Đã hủy',        color: 'badge-danger',    icon: XCircle },
};

export default function Profile() {
  const { user, setUser, authLoading, formatPrice, formatDualPrice, t } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('info');
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    gender: '',
    skin_type: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/');
      return;
    }
    setForm({
      name: user.name || '',
      gender: user.gender || '',
      skin_type: user.skin_type || '',
      avatar_url: user.avatar_url || '',
    });
  }, [user, navigate, authLoading]);

  useEffect(() => {
    if (activeTab === 'orders' && orders.length === 0) {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await getMyOrders();
      setOrders(res.data.orders || res.data || []);
    } catch {
      toast.error(t('profile_error_orders', 'Không thể tải đơn hàng'));
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfile(form);
      if (setUser) setUser(res.data);
      toast.success(t('profile_update_success', 'Cập nhật thành công! ✨'));
    } catch (err) {
      toast.error(err.response?.data?.detail || t('profile_update_fail', 'Cập nhật thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  const formatCurrency = (amount, rate = null) => {
    return formatPrice(amount || 0, rate);
  };

  if (authLoading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div className="loading-spinner"></div>
        <p>{t('profile_loading_info', 'Đang tải thông tin tài khoản...')}</p>
      </div>
    );
  }

  if (!user) return null;

  const avatarInitial = (form.name || user.email || 'U')[0].toUpperCase();

  return (
    <div className="profile-page">
      <div className="container">
        {/* Hero header */}
        <div className="profile-hero glass-card animate-fadeIn">
          <div className="profile-avatar-wrap">
            {form.avatar_url ? (
              <img src={form.avatar_url} alt={form.name} className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-placeholder">{avatarInitial}</div>
            )}
            <div className="profile-avatar-badge">
              <Camera size={14} />
            </div>
          </div>
          <div className="profile-hero-info">
            <h1 className="profile-name display-font">{form.name || t('profile_user_fallback', 'Người dùng')}</h1>
            <p className="profile-email">{user.email}</p>
            {form.skin_type && (
              <span className="badge badge-primary" style={{ marginTop: 8 }}>
                🌿 {t('pd_skin_type') || 'Da'} {t(`skin_type_${form.skin_type.toLowerCase()}`) || form.skin_type}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs profile-tabs animate-fadeIn">
          <button
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <User size={15} />
            {t('profile_form_title') || 'Thông tin cá nhân'}
          </button>
          <button
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag size={15} />
            {t('profile_orders_tab') || 'Đơn hàng của tôi'}
          </button>
        </div>

        {/* Tab Content */}
        <div className="profile-content animate-fadeIn">
          {/* ── Personal Info Tab ── */}
          {activeTab === 'info' && (
            <div className="card profile-form-card">
              <div className="profile-form-header">
                <h2>{t('profile_form_title') || 'Thông tin cá nhân'}</h2>
                <p className="text-muted">{t('profile_form_desc') || 'Cập nhật hồ sơ của bạn để nhận tư vấn chính xác hơn'}</p>
              </div>
              <form onSubmit={handleSave} className="profile-form">
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">{t('profile_fullname') || 'Họ và tên'}</label>
                    <input
                      className="form-input"
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder={t('profile_fullname_placeholder', 'Nhập họ tên của bạn')}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('profile_gender') || 'Giới tính'}</label>
                    <select
                      className="form-select"
                      value={form.gender}
                      onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                    >
                      <option value="">{t('profile_select_gender') || 'Chọn giới tính'}</option>
                      <option value="female">{t('profile_female') || 'Nữ'}</option>
                      <option value="male">{t('profile_male') || 'Nam'}</option>
                      <option value="other">{t('profile_gender_other') || 'Khác'}</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('profile_skin_type') || 'Loại da'}</label>
                  <div className="skin-type-grid">
                    {['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'].map(type => (
                      <button
                        key={type}
                        type="button"
                        className={`skin-type-btn ${form.skin_type === type ? 'active' : ''}`}
                        onClick={() => setForm(f => ({ ...f, skin_type: type }))}
                      >
                        {type === 'Normal' && `✨ ${t('skin_type_normal') || 'Normal'}`}
                        {type === 'Dry' && `🌵 ${t('skin_type_dry') || 'Dry'}`}
                        {type === 'Oily' && `💧 ${t('skin_type_oily') || 'Oily'}`}
                        {type === 'Combination' && `🌗 ${t('skin_type_combination') || 'Combination'}`}
                        {type === 'Sensitive' && `🌸 ${t('skin_type_sensitive') || 'Sensitive'}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('profile_avatar_url') || 'URL ảnh đại diện'}</label>
                  <input
                    className="form-input"
                    type="url"
                    value={form.avatar_url}
                    onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <div className="profile-email-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Email</label>
                    <input
                      className="form-input"
                      type="email"
                      value={user.email}
                      disabled
                      style={{ opacity: 0.5, cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary profile-save-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                      {t('profile_saving') || 'Đang lưu...'}
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {t('profile_save_btn') || 'Lưu thay đổi'}
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ── Orders Tab ── */}
          {activeTab === 'orders' && (
            <div className="orders-section">
              {ordersLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner" />
                  <p>{t('profile_orders_loading', 'Đang tải đơn hàng...')}</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="empty-state card" style={{ padding: '3rem' }}>
                  <div className="empty-state-icon">📦</div>
                  <h3>{t('profile_no_orders') || 'Chưa có đơn hàng nào'}</h3>
                  <p>{t('profile_no_orders_desc', 'Hãy khám phá sản phẩm và đặt hàng ngay!')}</p>
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: 24 }}
                    onClick={() => navigate('/products')}
                  >
                    <ShoppingBag size={16} />
                    {t('cart_shop_now') || 'Mua sắm ngay'}
                  </button>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map((order) => {
                    const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
                    const StatusIcon = status.icon;
                    return (
                      <div key={order.order_id} className="card order-card animate-fadeIn">
                        <div className="order-header">
                          <div className="order-meta">
                            <span className="order-id">#{order.order_id}</span>
                            <span className="order-date">{formatDate(order.created_at)}</span>
                          </div>
                          <span className={`badge ${status.color}`}>
                            <StatusIcon size={12} />
                            {t(status.labelKey) || status.defaultLabel}
                          </span>
                        </div>

                        <div className="order-items">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="order-item">
                              <div className="order-item-emoji" style={{ overflow: 'hidden', padding: 2, background: '#FFF' }}>
                                <img
                                  src={getProductImage(item, 80)}
                                  alt={item.product_name || item.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = 'inline';
                                  }}
                                />
                                <span style={{ display: 'none' }}>💄</span>
                              </div>
                              <div className="order-item-info">
                                <span className="order-item-name">{item.product_name || item.name}</span>
                                <span className="order-item-qty">x{item.quantity}</span>
                              </div>
                              <span className="order-item-price">
                                {formatCurrency((item.price_usd ?? item.price ?? 0) * item.quantity, order.exchange_rate)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="order-footer">
                          <span className="order-total-label">{t('profile_order_total') || 'Tổng cộng'}</span>
                          <span className="order-total">{formatDualPrice(order.total_usd ?? order.total_amount ?? order.total, order.exchange_rate)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
