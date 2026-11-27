import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const API = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT token & Language header (Strictly English in Phase 1)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('beautyai_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  
  config.headers['Accept-Language'] = 'en';
  
  return config;
});

// Response interceptor for handling 401s
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/')) {
      localStorage.removeItem('beautyai_token');
      window.dispatchEvent(new CustomEvent('auth-expired'));
    }
    return Promise.reject(error);
  }
);

// ==========================================
// 1. AUTHENTICATION & USER PROFILE
// ==========================================
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);
export const getMyOrders = () => API.get('/orders/my-orders');

// ==========================================
// 2. UNIFIED DIGITAL SKIN ID (M04 / M05)
// ==========================================
export const getSkinProfile = () => API.get('/skin-profile');
export const updateSkinProfile = (data) => API.put('/skin-profile', data);
export const addAllergy = (data) => API.post('/skin-profile/allergies', data);
export const removeAllergy = (id) => API.delete(`/skin-profile/allergies/${id}`);

// ==========================================
// 3. PRODUCTS & CATALOG
// ==========================================
export const getProducts = (params) => API.get('/products', { params });
export const getProduct = (id) => API.get(`/products/${id}`);
export const getProductQrCode = (id) => API.get(`/products/${id}/qrcode`);
export const getCategories = () => API.get('/products/categories');
export const getBrands = () => API.get('/products/brands');
export const getCurrencySettings = () => API.get('/products/settings/currency');
export const updateCurrencySettings = (data) => API.put('/products/settings/currency', data);

// ==========================================
// 4. RECOMMENDATIONS & ROUTINE
// ==========================================
export const getSimilarProducts = (id, limit = 6) => API.get(`/products/${id}/similar`, { params: { limit } });
export const getFrequentlyBoughtTogether = (id, top_k = 4) => API.get(`/recommendations/frequently-bought-together/${id}`, { params: { top_k } });
export const getTrending = (top_k = 12) => API.get('/recommendations/trending', { params: { top_k } });
export const getFeatured = (top_k = 8) => API.get('/recommendations/featured', { params: { top_k } });
export const getSkinQuizRecs = (data) => API.post('/recommendations/skinquiz', data);
export const getUserRecs = (user_id) => API.post('/recommendations/user', { user_id });
export const generateRoutine = (data) => API.post('/routines/generate', data);
export const saveRoutine = (data) => API.post('/routines/save', data);
export const getMyRoutines = () => API.get('/routines/my-routines');
export const deleteRoutine = (id) => API.delete(`/routines/${id}`);

// ==========================================
// 5. INGREDIENTS & CONFLICT ANALYSIS
// ==========================================
export const analyzeIngredients = (data) => API.post('/tools/analyze-inci', data);
export const getIngredientDB = () => API.get('/ingredients/database');
export const getSkintypeGuide = (area = 'face') => API.get('/tools/skintype-guide', { params: { area } });
export const checkProductConflicts = (productIds) =>
  API.post('/tools/check-conflict', {
    product_ids: (productIds || []).map((id) => Number(id)).filter((n) => !Number.isNaN(n) && n > 0),
  });

// ==========================================
// 6. REVIEWS
// ==========================================
export const getReviews = (productId, params) => API.get(`/products/${productId}/reviews`, { params });
export const addReview = (data) => API.post('/reviews', data);

// ==========================================
// 7. CART & ORDERS
// ==========================================
export const getCart = () => API.get('/cart');
export const addToCart = (data) => API.post('/cart/add', data);
export const updateCart = (productId, quantity) => API.put(`/cart/update/${productId}`, null, { params: { quantity } });
export const removeFromCart = (productId) => API.delete(`/cart/remove/${productId}`);
export const clearCart = () => API.delete('/cart/clear');
export const checkout = (data) => API.post('/orders', data);
export const createOrder = (data) => API.post('/orders', data);

// ==========================================
// 8. WISHLIST
// ==========================================
export const getWishlist = () => API.get('/wishlist');
export const toggleWishlist = (productId) => API.post(`/wishlist/toggle/${productId}`);
export const checkWishlist = (productId) => API.get(`/wishlist/check/${productId}`);

// ==========================================
// 9. AI CONSULTATION & SUPPORT
// ==========================================
export const chatWithBot = (data) => API.post('/ai/consult', data);
export const chatWithAiAdvisor = (data) => API.post('/ai/consult', data);
export const getFAQ = () => API.get('/consultation/faq');
export const submitContact = (data) => API.post('/consultation/contact', data);

// ==========================================
// 10. ADMIN
// ==========================================
export const getDashboard = () => API.get('/admin/dashboard');
export const getAdminOrders = (params = { limit: 100 }) =>
  API.get('/admin/orders', { params: typeof params === 'number' ? { limit: params } : params });
export const updateAdminOrderStatus = (id, status, extra = {}) =>
  API.patch(`/admin/orders/${id}/status`, { status, ...extra });

export const getAdminProducts = (params) => API.get('/admin/products', { params });
export const getAdminProduct = (id) => API.get(`/admin/products/${id}`);
export const createAdminProduct = (data) => API.post('/admin/products', data);
export const updateAdminProduct = (id, data) => API.put(`/admin/products/${id}`, data);
export const deleteAdminProduct = (id) => API.delete(`/admin/products/${id}`);
export const restoreAdminProduct = (id) => API.patch(`/admin/products/${id}/restore`);
export const uploadAdminProductImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/admin/upload/product-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getAdminReviews = (params) => API.get('/admin/reviews', { params });
export const updateAdminReviewVisibility = (id, isHidden, moderationReason = '') =>
  API.patch(`/admin/reviews/${id}/visibility`, { isHidden, moderationReason });
export const deleteAdminReview = (id) => API.delete(`/admin/reviews/${id}`);

export const getAdminUsers = (params) => API.get('/admin/users', { params });
export const updateAdminUserStatus = (id, isActive) =>
  API.patch(`/admin/users/${id}/status`, { isActive });
export const updateAdminUserRole = (id, role) =>
  API.patch(`/admin/users/${id}/role`, { role });

export const getAdminSupportTickets = (params) => API.get('/admin/support', { params });
export const updateAdminSupportTicket = (id, data) => API.patch(`/admin/support/${id}`, data);

export const getAdminIngredients = (params) => API.get('/admin/ingredients', { params });
export const createAdminIngredient = (data) => API.post('/admin/ingredients', data);
export const updateAdminIngredient = (id, data) => API.put(`/admin/ingredients/${id}`, data);
export const deleteAdminIngredient = (id) => API.delete(`/admin/ingredients/${id}`);

export const getAdminConflictRules = (params) => API.get('/admin/conflicts', { params });
export const createAdminConflictRule = (data) => API.post('/admin/conflicts', data);
export const updateAdminConflictRule = (id, data) => API.put(`/admin/conflicts/${id}`, data);
export const deleteAdminConflictRule = (id) => API.delete(`/admin/conflicts/${id}`);

export const getAdminBrands = (params) => API.get('/admin/brands', { params });
export const createAdminBrand = (data) => API.post('/admin/brands', data);
export const updateAdminBrand = (id, data) => API.put(`/admin/brands/${id}`, data);
export const deleteAdminBrand = (id) => API.delete(`/admin/brands/${id}`);

export const getAdminCategories = (params) => API.get('/admin/categories', { params });
export const createAdminCategory = (data) => API.post('/admin/categories', data);
export const updateAdminCategory = (id, data) => API.put(`/admin/categories/${id}`, data);
export const deleteAdminCategory = (id) => API.delete(`/admin/categories/${id}`);

export default API;
