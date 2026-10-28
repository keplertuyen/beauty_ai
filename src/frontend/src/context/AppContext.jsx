import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  login as loginAPI,
  register as registerAPI,
  getMe,
  getCart,
  addToCart,
  removeFromCart,
  updateCart as updateCartAPI,
  clearCart as clearCartAPI,
  toggleWishlist,
  getWishlist,
  getCurrencySettings,
} from '../services/api';
import toast from 'react-hot-toast';
import { translations } from './translations';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('beautyai_token'));
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartConflicts, setCartConflicts] = useState({ has_conflicts: false, conflicts: [], product_actives: [] });
  const [wishlist, setWishlist] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState(localStorage.getItem('beautyai_lang') || 'vi');
  const [currency, setCurrency] = useState(localStorage.getItem('beautyai_currency') || 'VND');
  const [exchangeRate, setExchangeRate] = useState(Number(localStorage.getItem('beautyai_exchange_rate')) || 25400);
  const [authLoading, setAuthLoading] = useState(!!token);

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('beautyai_lang', newLang);
    document.documentElement.lang = newLang;
  };

  const changeCurrency = (newCurr) => {
    const normalized = newCurr === 'USD' ? 'USD' : 'VND';
    setCurrency(normalized);
    localStorage.setItem('beautyai_currency', normalized);
  };

  const formatPrice = useCallback((priceUsd, customRate = null) => {
    const usd = parseFloat(priceUsd) || 0;
    if (currency === 'VND') {
      const rate = customRate || exchangeRate || 25400;
      const vnd = Math.round((usd * rate) / 1000) * 1000;
      return `${new Intl.NumberFormat('vi-VN').format(vnd)}₫`;
    }
    return `$${usd.toFixed(2)}`;
  }, [currency, exchangeRate]);

  const formatDualPrice = useCallback((priceUsd, customRate = null) => {
    const usd = parseFloat(priceUsd) || 0;
    const rate = customRate || exchangeRate || 25400;
    const vnd = Math.round((usd * rate) / 1000) * 1000;
    const vndStr = `${new Intl.NumberFormat('vi-VN').format(vnd)}₫`;
    const usdStr = `$${usd.toFixed(2)}`;
    return currency === 'VND' ? `${vndStr} (${usdStr})` : `${usdStr} (${vndStr})`;
  }, [currency, exchangeRate]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    getCurrencySettings()
      .then((res) => {
        if (res.data?.usd_vnd_rate) {
          setExchangeRate(Number(res.data.usd_vnd_rate));
          localStorage.setItem('beautyai_exchange_rate', String(res.data.usd_vnd_rate));
        }
      })
      .catch(() => {});
  }, []);

  const t = (key, fallback) => {
    if (translations[lang] && translations[lang][key] !== undefined) {
      return translations[lang][key];
    }
    const other = lang === 'vi' ? 'en' : 'vi';
    if (translations[other] && translations[other][key] !== undefined) {
      return translations[other][key];
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
          setUser({
            ...d,
            name: d.fullName || d.name || d.email?.split('@')[0],
            fullName: d.fullName || d.name,
            skin_type: d.skinProfile?.skinType || d.skin_type
          });
        })
        .catch(() => {
          localStorage.removeItem('beautyai_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setAuthLoading(false);
        });
      loadCart();
      loadWishlist();
    } else {
      setAuthLoading(false);
    }
  }, [token]);

  const loadCart = useCallback(async () => {
    try {
      const res = await getCart();
      setCart(res.data.cart || []);
      setCartCount(res.data.item_count || 0);
      if (res.data.conflict_report) {
        setCartConflicts(res.data.conflict_report);
      } else {
        setCartConflicts({ has_conflicts: false, conflicts: [], product_actives: [] });
      }
    } catch {
      setCart([]);
      setCartCount(0);
      setCartConflicts({ has_conflicts: false, conflicts: [], product_actives: [] });
    }
  }, []);

  const loadWishlist = useCallback(async () => {
    try {
      const res = await getWishlist();
      setWishlist(res.data.wishlist?.map(p => p.product_id) || []);
    } catch { setWishlist([]); }
  }, []);

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
      loadCart();
      loadWishlist();
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

  const addItemToCart = async (productId, quantity = 1) => {
    if (!user) { toast.error(t('toast_login_required_cart')); return; }
    try {
      await addToCart({ product_id: String(productId), quantity });
      toast.success(t('toast_cart_added'));
      loadCart();
    } catch (err) {
      console.error("Add to cart error:", err);
      toast.error(err.response?.data?.detail || err.message || t('toast_cart_add_failed'));
    }
  };

  const removeItemFromCart = async (productId) => {
    try {
      await removeFromCart(String(productId));
      loadCart();
    } catch { toast.error(t('toast_cart_remove_failed')); }
  };

  const updateItemQuantity = async (productId, quantity) => {
    try {
      await updateCartAPI(String(productId), quantity);
      loadCart();
    } catch { toast.error(t('toast_cart_update_failed')); }
  };

  const toggleWishlistItem = async (productId) => {
    if (!user) { toast.error(t('toast_login_required_wishlist')); return; }
    const pid = String(productId);
    try {
      const res = await toggleWishlist(pid);
      const added = res.data.added;
      if (added) {
        setWishlist(prev => [...prev, pid]);
        toast.success(t('toast_wishlist_added'));
      } else {
        setWishlist(prev => prev.filter(id => String(id) !== pid));
        toast.success(t('toast_wishlist_removed'));
      }
    } catch { toast.error(t('toast_wishlist_failed')); }
  };

  const isInWishlist = (productId) => wishlist.map(String).includes(String(productId));

  return (
    <AppContext.Provider value={{
      user, setUser, token, cart, cartCount, cartConflicts, wishlist,
      cartOpen, setCartOpen,
      loading, authLoading,
      login, register, logout,
      loadCart, addItemToCart, removeItemFromCart, updateItemQuantity,
      toggleWishlistItem, isInWishlist,
      lang, changeLanguage, t,
      currency, changeCurrency, exchangeRate, formatPrice, formatDualPrice,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
