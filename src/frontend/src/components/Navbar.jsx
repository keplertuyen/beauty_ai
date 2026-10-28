import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Heart, Search, Menu, X, Sparkles,
  FlaskConical, ChevronDown, User, Settings, LogOut,
  BarChart2, MessageCircle, LayoutDashboard,
  Package, Layers, GitCompare, MessageSquare, LifeBuoy
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Navbar.css';

export default function Navbar() {
  const { user, cartCount, wishlist, logout, setCartOpen, lang, changeLanguage, currency, changeCurrency, t } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { path: '/products', label: t('nav_products'), icon: <Package size={15} /> },
    {
      label: t('nav_explore'),
      children: [
        { path: '/skin-quiz',            icon: <FlaskConical size={15} />, label: t('nav_skin_quiz'),       desc: t('nav_skin_quiz_desc') },
        { path: '/ingredient-analyzer',  icon: <Layers size={15} />,       label: t('nav_ingredient'),      desc: t('nav_ingredient_desc') },
        { path: '/compare',              icon: <GitCompare size={15} />,    label: t('nav_compare'),         desc: t('nav_compare_desc') },
      ],
    },
    {
      label: t('nav_support'),
      children: [
        { path: '/expert-consult', icon: <MessageSquare size={15} />, label: t('nav_consult'),        desc: t('nav_consult_desc') },
        { path: '/support',        icon: <LifeBuoy size={15} />,      label: t('nav_support_center'), desc: t('nav_support_center_desc') },
      ],
    },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?query=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const openAuth = () => {
    window.dispatchEvent(new CustomEvent('open-auth-modal'));
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <div className="logo-icon">
              <Sparkles size={18} />
            </div>
            <span className="logo-text">
              Beauty<span className="logo-accent">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="navbar-links">
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.label} className="nav-dropdown-wrapper">
                  <button className="nav-link nav-link-dropdown">
                    {link.label}
                    <ChevronDown size={14} />
                  </button>
                  <div className="nav-dropdown">
                    {link.children.map((child) => (
                      <Link key={child.path} to={child.path} className="nav-dropdown-item">
                        <span className="dropdown-label">{child.icon}{child.label}</span>
                        <span className="dropdown-desc">{child.desc}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                >
                  {link.icon && <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '5px', verticalAlign: 'middle' }}>{link.icon}</span>}
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* Actions */}
          <div className="navbar-actions">
            {/* Currency Switcher (VND / USD) */}
            <button
              className="lang-toggle-btn"
              onClick={() => changeCurrency(currency === 'VND' ? 'USD' : 'VND')}
              title={currency === 'VND' ? 'Switch to USD ($)' : 'Chuyển sang VND (₫)'}
              style={{ minWidth: '58px', justifyContent: 'center' }}
            >
              <span className="lang-text">{currency === 'VND' ? '₫ VND' : '$ USD'}</span>
            </button>

            {/* Language Switcher */}
            <button
              className="lang-toggle-btn"
              onClick={() => changeLanguage(lang === 'vi' ? 'en' : 'vi')}
              title={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
            >
              <span className="lang-flag">{lang === 'vi' ? '🇻🇳' : '🇬🇧'}</span>
              <span className="lang-text">{lang === 'vi' ? 'VI' : 'EN'}</span>
            </button>

            {/* Search */}
            <button className="nav-icon-btn" onClick={() => setSearchOpen(!searchOpen)} aria-label={t('nav_search_btn')}>
              <Search size={18} />
            </button>

            {/* Wishlist */}
            <Link to="/wishlist" className="nav-icon-btn" aria-label={t('nav_wishlist')}>
              <Heart size={18} />
              {wishlist.length > 0 && (
                <span className="nav-badge">{wishlist.length}</span>
              )}
            </Link>

            {/* Cart */}
            <button className="nav-icon-btn" onClick={() => setCartOpen(true)} aria-label={t('nav_cart')}>
              <ShoppingBag size={18} />
              {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
            </button>

            {/* User */}
            {user ? (
              <div className="user-menu-wrapper">
                <button className="user-avatar-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} />
                  ) : (
                    <span>{user.name?.charAt(0)?.toUpperCase()}</span>
                  )}
                </button>
                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <div className="user-name">{user.name}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                    <div className="user-dropdown-body">
                      <Link to="/profile" className="user-menu-item">
                        <Settings size={15} /> {t('nav_settings')}
                      </Link>
                      <Link to="/wishlist" className="user-menu-item">
                        <Heart size={15} /> {t('nav_wishlist')}
                      </Link>
                      <Link to="/profile" className="user-menu-item">
                        <ShoppingBag size={15} /> {t('nav_my_orders')}
                      </Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" className="user-menu-item">
                          <LayoutDashboard size={15} /> {t('nav_admin')}
                        </Link>
                      )}
                      <div className="dropdown-divider" />
                      <button className="user-menu-item danger" onClick={logout}>
                        <LogOut size={15} /> {t('nav_logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={openAuth}>
                {t('nav_login')}
              </button>
            )}

            {/* Mobile Menu */}
            <button
              className="nav-icon-btn mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Search Bar Dropdown */}
        {searchOpen && (
          <div className="navbar-search">
            <form onSubmit={handleSearch} className="search-bar">
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder={t('nav_search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-primary btn-sm">{t('nav_search_btn')}</button>
            </form>
          </div>
        )}

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="mobile-nav">
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.label}>
                  <div className="mobile-nav-section">{link.label}</div>
                  {link.children.map((child) => (
                    <Link key={child.path} to={child.path} className="mobile-nav-link">
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link key={link.path} to={link.path} className="mobile-nav-link">
                  {link.label}
                </Link>
              )
            )}
            {!user && (
              <button className="btn btn-primary" style={{ width: '100%', marginBottom: '12px' }} onClick={openAuth}>
                {t('nav_login')} / {t('nav_register')}
              </button>
            )}
            <div className="mobile-lang-row" style={{ marginTop: '8px', borderTop: '1px solid var(--glass-border)', paddingTop: '12px', display: 'flex', gap: '8px' }}>
              <button
                className="lang-toggle-btn"
                style={{ flex: 1, justifyContent: 'center', margin: 0 }}
                onClick={() => changeCurrency(currency === 'VND' ? 'USD' : 'VND')}
              >
                <span className="lang-text">{currency === 'VND' ? '₫ VND' : '$ USD'}</span>
              </button>
              <button
                className="lang-toggle-btn"
                style={{ flex: 1, justifyContent: 'center', margin: 0 }}
                onClick={() => changeLanguage(lang === 'vi' ? 'en' : 'vi')}
              >
                <span className="lang-flag">{lang === 'vi' ? '🇻🇳' : '🇬🇧'}</span>
                <span className="lang-text" style={{ marginLeft: '8px' }}>{lang === 'vi' ? 'VI - Tiếng Việt' : 'EN - English'}</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
