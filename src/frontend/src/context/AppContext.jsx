import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  login as loginAPI,
  register as registerAPI,
  getMe,
  getProduct,
  checkProductConflicts,
} from '../services/api';
import toast from 'react-hot-toast';
import { translations } from './translations';

const AppContext = createContext();

function getRoleFromToken(jwt) {
  if (!jwt || typeof jwt !== 'string') return null;
  try {
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return (
      payload.role ||
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      null
    );
  } catch {
    return null;
  }
}

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('beautyai_token'));
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartConflicts, setCartConflicts] = useState({ has_conflict: false, has_conflicts: false, conflicts: [] });
  const [conflictAcknowledged, setConflictAcknowledged] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // English & USD Only
  const [lang, setLang] = useState('en');
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [authLoading, setAuthLoading] = useState(!!token);
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    const handleAuthExpired = () => {
      if (!userRef.current) return;
      setToken(null);
      setUser(null);
      setCart([]);
      setCartCount(0);
      setWishlist([]);
      if (!window.location.pathname.startsWith('/admin')) {
        toast.error(
          translations.en?.toast_session_expired ||
            'Your session has expired. Please log in again.'
        );
        window.dispatchEvent(new CustomEvent('open-auth-modal'));
      }
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const changeLanguage = (_newLang) => {
    // Locked to English
    setLang('en');
    localStorage.setItem('beautyai_lang', 'en');
    document.documentElement.lang = 'en';
  };

  const changeCurrency = (_newCurr) => {
    // Phase 1 is locked to USD
    setCurrency('USD');
    localStorage.setItem('beautyai_currency', 'USD');
  };

  const formatPrice = useCallback((priceUsd) => {
    const usd = parseFloat(priceUsd) || 0;
    return `$${usd.toFixed(2)}`;
  }, []);

  const formatDualPrice = useCallback((priceUsd) => {
    const usd = parseFloat(priceUsd) || 0;
    return `$${usd.toFixed(2)}`;
  }, []);

  useEffect(() => {
    document.documentElement.lang = 'en';
    localStorage.setItem('beautyai_lang', 'en');
    localStorage.setItem('beautyai_currency', 'USD');
  }, []);

  const t = (key, fallback) => {
    if (translations.en && translations.en[key] !== undefined) {
      return translations.en[key];
    }
    return fallback || key;
  };

  // Load user on mount
  useEffect(() => {
    if (token) {
      setAuthLoading(true);
      getMe()
        .then(res => {
          const d = res.data;
          const resolvedRole = d.role || getRoleFromToken(token) || userRef.current?.role || 'Customer';
          const u = {
            ...d,
            role: resolvedRole,
            name: d.fullName || d.name || d.email?.split('@')[0],
            fullName: d.fullName || d.name,
            skin_type: d.skinProfile?.skinType || d.skin_type
          };
          setUser(u);
          loadCart(u);
          loadWishlist(u);
        })
        .catch(() => {
          localStorage.removeItem('beautyai_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setAuthLoading(false);
        });
    } else {
      setAuthLoading(false);
    }
  }, [token]);

  const getCartStorageKey = useCallback((u) => {
    const activeUser = u || user;
    const keySuffix = activeUser?.id || activeUser?.email || 'default';
    return `beautyai_cart_${keySuffix}`;
  }, [user]);

  const refreshCartConflicts = useCallback(async (items) => {
    if (!items || items.length < 2) {
      setCartConflicts({ has_conflict: false, has_conflicts: false, conflicts: [] });
      setConflictAcknowledged(false);
      return;
    }
    try {
      const pids = items.map((item) => Number(item.product_id ?? item.id)).filter((n) => !Number.isNaN(n) && n > 0);
      const res = await checkProductConflicts(pids);
      const data = res.data || {};
      const conflicts = data.conflicts || [];
      const hasConflict = Boolean(data.has_conflict ?? data.has_conflicts ?? conflicts.length > 0);
      setCartConflicts({
        has_conflict: hasConflict,
        has_conflicts: hasConflict,
        conflict_count: conflicts.length,
        conflicts,
      });
    } catch {
      setCartConflicts({ has_conflict: false, has_conflicts: false, conflicts: [] });
    }
  }, []);

  const syncCartState = useCallback((items, u) => {
    const key = getCartStorageKey(u);
    const normalized = (items || []).map((item) => {
      const priceUsd = parseFloat(item.price_usd ?? item.priceUsd ?? item.price) || 0;
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      return {
        ...item,
        product_id: Number(item.product_id ?? item.id),
        id: Number(item.id ?? item.product_id),
        product_name: item.product_name ?? item.name ?? 'Beauty Product',
        brand_name: item.brand_name ?? item.brandName ?? 'BeautyAI',
        price_usd: priceUsd,
        quantity: qty,
        subtotal: priceUsd * qty,
      };
    });

    setCart(normalized);
    const totalCount = normalized.reduce((sum, i) => sum + i.quantity, 0);
    setCartCount(totalCount);

    try {
      localStorage.setItem(key, JSON.stringify(normalized));
    } catch {
      // ignore storage quota errors
    }

    refreshCartConflicts(normalized);
  }, [getCartStorageKey, refreshCartConflicts]);

  const loadCart = useCallback(async (u) => {
    const activeUser = u || user;
    if (String(activeUser?.role || '').toLowerCase() === 'admin') {
      setCart([]);
      setCartCount(0);
      setCartConflicts({ has_conflict: false, has_conflicts: false, conflicts: [] });
      return;
    }
    const key = getCartStorageKey(u);
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          syncCartState(parsed, u);
          return;
        }
      }
    } catch {
      // ignore parse error
    }
    setCart([]);
    setCartCount(0);
    setCartConflicts({ has_conflict: false, has_conflicts: false, conflicts: [] });
  }, [getCartStorageKey, syncCartState]);

  const getWishlistStorageKey = useCallback((u) => {
    const activeUser = u || user;
    const keySuffix = activeUser?.id || activeUser?.email || 'default';
    return `beautyai_wishlist_${keySuffix}`;
  }, [user]);

  const loadWishlist = useCallback(async (u) => {
    const key = getWishlistStorageKey(u);
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setWishlist(parsed.map(String));
          return;
        }
      }
    } catch {
      // ignore storage parse error
    }
    setWishlist([]);
  }, [getWishlistStorageKey]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await loginAPI({ email, password });
      const t_val = res.data.token;
      const u = res.data.user || {
        name: res.data.fullName || res.data.name || email.split('@')[0],
        fullName: res.data.fullName || res.data.name,
        email: res.data.email,
        role: res.data.role || 'Customer'
      };
      localStorage.setItem('beautyai_token', t_val);
      setToken(t_val);
      setUser(u);
      toast.success(t('toast_welcome').replace('{name}', u.fullName || u.name));
      loadCart(u);
      loadWishlist(u);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.detail || t('toast_login_failed'));
      return false;
    } finally { setLoading(false); }
  };

  const register = async (data) => {
    setLoading(true);
    try {
      // Map to .NET 10 RegisterRequest: { email, password, fullName, phone }
      const payload = {
        email: data.email,
        password: data.password,
        fullName: data.fullName || data.name || data.email.split('@')[0],
        phone: data.phone || null
      };
      const res = await registerAPI(payload);
      const t_val = res.data.token;
      const u = res.data.user || {
        name: res.data.fullName || payload.fullName,
        fullName: res.data.fullName || payload.fullName,
        email: res.data.email,
        role: res.data.role || 'Customer'
      };
      localStorage.setItem('beautyai_token', t_val);
      setToken(t_val);
      setUser(u);
      toast.success(t('toast_register_success'));
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.detail || t('toast_register_failed'));
      return false;
    } finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem('beautyai_token');
    setToken(null);
    setUser(null);
    setCart([]);
    setCartCount(0);
    setWishlist([]);
    toast.success(t('toast_logout_success'));
  };

  const addItemToCart = async (productIdOrObj, quantity = 1) => {
    if (!user) {
      toast.error(t('toast_login_required_cart'));
      window.dispatchEvent(new CustomEvent('open-auth-modal'));
      return;
    }
    if (isAdmin) {
      toast.error(t('toast_admin_cannot_shop', 'Admin accounts are for management only and cannot place orders.'));
      return;
    }

    const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);
    const pid = typeof productIdOrObj === 'object'
      ? Number(productIdOrObj.id ?? productIdOrObj.product_id)
      : Number(productIdOrObj);

    try {
      const existingIndex = cart.findIndex((item) => Number(item.product_id ?? item.id) === pid);
      if (existingIndex >= 0) {
        const nextCart = cart.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        );
        syncCartState(nextCart, user);
        setConflictAcknowledged(false);
        toast.success(t('toast_cart_added'));
        return;
      }

      let prodData = typeof productIdOrObj === 'object' && (productIdOrObj.name || productIdOrObj.product_name) ? productIdOrObj : null;
      if (!prodData) {
        const res = await getProduct(pid);
        prodData = res.data;
      }

      const newItem = {
        id: Number(prodData.id ?? prodData.product_id ?? pid),
        product_id: Number(prodData.id ?? prodData.product_id ?? pid),
        code: prodData.code || '',
        product_name: prodData.name ?? prodData.product_name ?? 'Beauty Product',
        brand_name: prodData.brandName ?? prodData.brand_name ?? (typeof prodData.brand === 'string' ? prodData.brand : prodData.brand?.name) ?? 'BeautyAI',
        category_name: prodData.categoryName ?? prodData.primary_category ?? (typeof prodData.category === 'string' ? prodData.category : prodData.category?.name) ?? 'Skincare',
        department: prodData.department ?? 'Skincare',
        price_usd: parseFloat(prodData.priceUsd ?? prodData.price_usd ?? prodData.price) || 0,
        image_url: prodData.imageUrl ?? prodData.image_url,
        quantity: qtyToAdd,
      };

      syncCartState([...cart, newItem], user);
      setConflictAcknowledged(false);
      toast.success(t('toast_cart_added'));
    } catch (err) {
      console.error('Add to cart error:', err);
      toast.error(err.response?.data?.detail || err.message || t('toast_cart_add_failed'));
    }
  };

  const removeItemFromCart = async (productId) => {
    const pid = Number(productId);
    const nextCart = cart.filter((item) => Number(item.product_id ?? item.id) !== pid);
    syncCartState(nextCart, user);
    setConflictAcknowledged(false);
  };

  const updateItemQuantity = async (productId, quantity) => {
    const pid = Number(productId);
    const nextQty = parseInt(quantity, 10);
    if (nextQty <= 0) {
      await removeItemFromCart(pid);
      return;
    }
    const nextCart = cart.map((item) =>
      Number(item.product_id ?? item.id) === pid
        ? { ...item, quantity: nextQty }
        : item
    );
    syncCartState(nextCart, user);
  };

  const clearCart = useCallback(() => {
    const key = getCartStorageKey(user);
    setCart([]);
    setCartCount(0);
    setCartConflicts({ has_conflict: false, has_conflicts: false, conflicts: [] });
    setConflictAcknowledged(false);
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, [getCartStorageKey, user]);

  const toggleWishlistItem = async (productId) => {
    if (!user) {
      toast.error(t('toast_login_required_wishlist'));
      window.dispatchEvent(new CustomEvent('open-auth-modal'));
      return;
    }
    const pid = String(productId);
    const key = getWishlistStorageKey(user);
    const alreadySaved = wishlist.map(String).includes(pid);
    const updated = alreadySaved
      ? wishlist.filter(id => String(id) !== pid)
      : [...wishlist.map(String), pid];

    setWishlist(updated);
    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      // ignore storage quota errors
    }

    if (alreadySaved) {
      toast.success(t('toast_wishlist_removed'));
    } else {
      toast.success(t('toast_wishlist_added'));
    }
  };

  const clearWishlist = () => {
    if (!user) return;
    const key = getWishlistStorageKey(user);
    setWishlist([]);
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    toast.success('Cleared your wishlist');
  };

  const isInWishlist = (productId) => wishlist.map(String).includes(String(productId));

  return (
    <AppContext.Provider value={{
      user, setUser, token, isAdmin, cart, cartCount, cartConflicts,
      conflictAcknowledged, setConflictAcknowledged,
      wishlist,
      cartOpen, setCartOpen,
      loading, authLoading,
      login, register, logout,
      loadCart, addItemToCart, removeItemFromCart, updateItemQuantity, clearCart,
      toggleWishlistItem, clearWishlist, isInWishlist,
      lang, changeLanguage, t,
      currency, changeCurrency, exchangeRate, formatPrice, formatDualPrice,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
