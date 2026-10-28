import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './AuthModal.css';

export default function AuthModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, loading, t } = useApp();

  const [form, setForm] = useState({
    email: '', password: '', name: '', gender: '', skin_type: '',
  });

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-auth-modal', handler);
    return () => window.removeEventListener('open-auth-modal', handler);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let ok;
    if (mode === 'login') {
      ok = await login(form.email, form.password);
    } else {
      ok = await register(form);
    }
    if (ok) setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="modal-content auth-modal" style={{ maxWidth: 440 }}>
        <button className="auth-close" onClick={() => setOpen(false)}>
          <X size={18} />
        </button>

        {/* Header */}
        <div className="auth-header">
          <h2 className="auth-title">
            {mode === 'login' ? t('auth_welcome_title') : t('auth_register_title')}
          </h2>
          <p className="auth-subtitle">
            {mode === 'login'
              ? t('auth_welcome_subtitle')
              : t('auth_register_subtitle')}
          </p>
        </div>

        {/* Tabs - 50/50 Balanced Toggle */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            {t('auth_login_tab')}
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            {t('auth_register_tab')}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label">{t('auth_fullname')}</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder={t('auth_fullname_placeholder')}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label className="form-label">{t('auth_gender')}</label>
                  <select className="form-select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="">{t('auth_select_placeholder')}</option>
                    <option value="female">{t('profile_female')}</option>
                    <option value="male">{t('profile_male')}</option>
                    <option value="other">{t('profile_gender_other')}</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">{t('auth_skin_type')}</label>
                  <select className="form-select" value={form.skin_type} onChange={(e) => setForm({ ...form, skin_type: e.target.value })}>
                    <option value="">{t('auth_select_placeholder')}</option>
                    <option value="dry">{t('skin_type_dry')}</option>
                    <option value="oily">{t('skin_type_oily')}</option>
                    <option value="combination">{t('skin_type_combination')}</option>
                    <option value="normal">{t('skin_type_normal')}</option>
                    <option value="sensitive">{t('skin_type_sensitive')}</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">{t('auth_email')}</label>
            <input
              className="form-input"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth_password')}</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? (
              <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            ) : (
              mode === 'login' ? t('auth_login_tab') : t('auth_register_title')
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {mode === 'login' ? t('auth_no_account') : t('auth_has_account')}
          <button
            style={{ background: 'none', border: 'none', color: 'var(--primary-light)', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? t('auth_register_now') : t('auth_login_tab')}
          </button>
        </p>
      </div>
    </div>
  );
}
