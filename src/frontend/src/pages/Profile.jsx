import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShoppingBag, Save, Camera, Clock, CheckCircle, XCircle, Truck, ShieldAlert, Plus, Trash2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { updateProfile, getMyOrders, getSkinProfile, updateSkinProfile, addAllergy, removeAllergy } from '../services/api';
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

  const [skinProfile, setSkinProfile] = useState({
    skinType: 'Combination',
    allergies: [],
    skinConcerns: [],
    primaryGoal: 'Maintain Healthy Skin',
    budgetLevel: 'Medium'
  });
  const [newAllergy, setNewAllergy] = useState('');
  const [newAllergyNote, setNewAllergyNote] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/');
      return;
    }
    setForm({
      name: user.fullName || user.name || '',
      phone: user.phone || '',
      shippingAddress: user.shippingAddress || '',
      gender: user.gender || '',
      avatar_url: user.avatar_url || '',
    });

    // Fetch Digital Skin ID from backend
    getSkinProfile()
      .then(res => {
        if (res.data) {
          setSkinProfile({
            skinType: res.data.skinType || 'Combination',
            allergies: res.data.allergies || [],
            skinConcerns: res.data.skinConcerns || [],
            primaryGoal: res.data.primaryGoal || 'Maintain Healthy Skin',
            budgetLevel: res.data.budgetLevel || 'Medium'
          });
        }
      })
      .catch(() => {});
  }, [user, navigate, authLoading]);

  const handleAddAllergyItem = async () => {
    if (!newAllergy.trim()) return;
    try {
      const res = await addAllergy({ ingredientName: newAllergy.trim(), note: newAllergyNote.trim() || null });
      setSkinProfile(prev => ({
        ...prev,
        allergies: [...prev.allergies, res.data]
      }));
      setNewAllergy('');
      setNewAllergyNote('');
      toast.success(t('allergy_added', `Đã thêm ${newAllergy.trim()} vào Blacklist`));
    } catch {
      toast.error(t('allergy_add_failed', 'Không thể thêm chất dị ứng'));
    }
  };

  const handleRemoveAllergyItem = async (id) => {
    try {
      await removeAllergy(id);
      setSkinProfile(prev => ({
        ...prev,
        allergies: prev.allergies.filter(a => a.id !== id)
      }));
      toast.success(t('allergy_removed', 'Đã gỡ bỏ khỏi Blacklist'));
    } catch {
      toast.error(t('allergy_remove_failed', 'Không thể gỡ bỏ chất dị ứng'));
    }
  };

  const toggleSkinConcern = (concern) => {
    setSkinProfile(prev => {
      const exists = prev.skinConcerns.includes(concern);
      const updated = exists 
        ? prev.skinConcerns.filter(c => c !== concern)
        : [...prev.skinConcerns, concern];
      return { ...prev, skinConcerns: updated };
    });
  };

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
      // 1. Update basic profile
      const resUser = await updateProfile({
        fullName: form.name,
        phone: form.phone || null,
        shippingAddress: form.shippingAddress || null
      });
      if (setUser) {
        setUser(prev => ({ ...prev, ...resUser.data, name: resUser.data.fullName || form.name }));
      }

      // 2. Update Unified Digital Skin ID in 1 transaction
      await updateSkinProfile({
        skinType: skinProfile.skinType,
        allergyNames: skinProfile.allergies.map(a => a.ingredientName),
        skinConcerns: skinProfile.skinConcerns,
        primaryGoal: skinProfile.primaryGoal,
        budgetLevel: skinProfile.budgetLevel
      });

      toast.success(t('profile_update_success', 'Cập nhật Digital Skin ID & Hồ sơ thành công! ✨'));
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.detail || t('profile_update_fail', 'Cập nhật thất bại'));
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
                    <label className="form-label">{t('profile_phone') || 'Số điện thoại'}</label>
                    <input
                      className="form-input"
                      type="tel"
                      value={form.phone || ''}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="0901234567"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('profile_shipping_address') || 'Địa chỉ nhận hàng mặc định'}</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.shippingAddress || ''}
                    onChange={e => setForm(f => ({ ...f, shippingAddress: e.target.value }))}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành"
                  />
                </div>

                {/* ==================================================== */}
                {/* UNIFIED DIGITAL SKIN ID (M04 / M05)                */}
                {/* ==================================================== */}
                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(143,117,95,0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <Sparkles size={20} color="#C48B71" />
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#2D2520' }}>
                      {t('skin_id_title') || 'Hồ Sơ Digital Skin ID Thống Nhất'}
                    </h3>
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    {t('skin_id_desc') || 'Được đồng bộ hóa để lọc sản phẩm An Toàn Tuyệt Đối, tự động sinh Routine và Chat AI tư vấn.'}
                  </p>

                  {/* BƯỚC 1: CƠ ĐỊA NỀN TẢNG (LOẠI DA) */}
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      1. {t('profile_skin_type') || 'Cơ địa nền tảng (Loại da)'}
                    </label>
                    <div className="skin-type-grid">
                      {['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'].map(type => (
                        <button
                          key={type}
                          type="button"
                          className={`skin-type-btn ${skinProfile.skinType === type ? 'active' : ''}`}
                          onClick={() => setSkinProfile(s => ({ ...s, skinType: type }))}
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

                  {/* BƯỚC 2: VÙNG CẤM KỴ AN TOÀN (ALLERGY BLACKLIST) */}
                  <div className="form-group" style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#FFF8F6', borderRadius: '12px', border: '1px solid #FCDAD7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <ShieldAlert size={18} color="#D25E5E" />
                      <label className="form-label" style={{ margin: 0, color: '#B3261E', fontWeight: 600 }}>
                        2. {t('allergy_blacklist_title') || 'Vùng cấm kỵ an toàn (Blacklist Dị ứng)'}
                      </label>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#7D5260', margin: '0 0 12px 0' }}>
                      Hệ thống tự động loại trừ mọi sản phẩm chứa hoạt chất này khi bạn bật bộ lọc "An toàn cho da tôi".
                    </p>

                    {/* Danh sách dị ứng hiện tại */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                      {skinProfile.allergies.length === 0 ? (
                        <span style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic' }}>Chưa có chất dị ứng nào trong danh sách cấm kỵ.</span>
                      ) : (
                        skinProfile.allergies.map(item => (
                          <span
                            key={item.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              background: '#FFF',
                              border: '1px solid #D25E5E',
                              borderRadius: '20px',
                              fontSize: '0.85rem',
                              color: '#B3261E'
                            }}
                          >
                            <strong>{item.ingredientName}</strong>
                            {item.note && <small style={{ color: '#666' }}>({item.note})</small>}
                            <button
                              type="button"
                              onClick={() => handleRemoveAllergyItem(item.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#D25E5E' }}
                            >
                              <XCircle size={14} />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Form thêm nhanh dị ứng */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Tên chất dị ứng (vd: Alcohol Denat, Fragrance...)"
                        value={newAllergy}
                        onChange={e => setNewAllergy(e.target.value)}
                        style={{ flex: '1 1 200px' }}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ghi chú triệu chứng (tùy chọn)"
                        value={newAllergyNote}
                        onChange={e => setNewAllergyNote(e.target.value)}
                        style={{ flex: '1 1 180px' }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleAddAllergyItem}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={16} /> Thêm
                      </button>
                    </div>
                  </div>

                  {/* BƯỚC 3: NHU CẦU CẢI THIỆN (VẤN ĐỀ DA, MỤC TIÊU & NGÂN SÁCH) */}
                  <div className="form-group" style={{ marginTop: '1.5rem' }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      3. {t('skin_concerns_title') || 'Nhu cầu cải thiện: Vấn đề da cần giải quyết'}
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                      {[
                        { key: 'Acne', label: '🔴 Mụn & Bít tắc' },
                        { key: 'Aging', label: '⏳ Lão hóa & Nếp nhăn' },
                        { key: 'DarkSpots', label: '✨ Thâm nám & Không đều màu' },
                        { key: 'Pores', label: '🔍 Lỗ chân lông to' },
                        { key: 'Sensitivity', label: '🌸 Da nhạy cảm & Dễ đỏ' },
                        { key: 'Dehydration', label: '💧 Thiếu ẩm & Bong tróc' }
                      ].map(item => {
                        const isSelected = skinProfile.skinConcerns.includes(item.key);
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => toggleSkinConcern(item.key)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '20px',
                              border: isSelected ? '2px solid #C48B71' : '1px solid rgba(143,117,95,0.2)',
                              background: isSelected ? 'rgba(196,139,113,0.12)' : '#FFF',
                              color: isSelected ? '#A06148' : '#2D2520',
                              fontWeight: isSelected ? 600 : 400,
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-row-2" style={{ marginTop: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Mục tiêu dưỡng da chính</label>
                      <input
                        className="form-input"
                        type="text"
                        value={skinProfile.primaryGoal || ''}
                        onChange={e => setSkinProfile(s => ({ ...s, primaryGoal: e.target.value }))}
                        placeholder="Vd: Phục hồi màng ẩm, Sáng mịn da..."
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Mức ngân sách mong muốn</label>
                      <select
                        className="form-select"
                        value={skinProfile.budgetLevel || 'Medium'}
                        onChange={e => setSkinProfile(s => ({ ...s, budgetLevel: e.target.value }))}
                      >
                        <option value="Low">Tiết kiệm / Học sinh - Sinh viên ($)</option>
                        <option value="Medium">Vừa phải / Phổ thông ($$)</option>
                        <option value="High">Cao cấp / Treatment chuyên sâu ($$$)</option>
                      </select>
                    </div>
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
