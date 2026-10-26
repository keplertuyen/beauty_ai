import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT token & Language header
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('beautyai_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  
  const lang = localStorage.getItem('beautyai_lang') || 'vi';
  config.headers['Accept-Language'] = lang;
  
  return config;
});

// Products
export const getProducts = (params) => API.get('/products/', { params });
export const getProduct = (id) => API.get(`/products/${id}`);
export const getProductQrCode = (id) => API.get(`/products/${id}/qrcode`);
export const getCategories = () => API.get('/products/categories');
export const getBrands = () => API.get('/products/brands');
export const getCurrencySettings = () => API.get('/products/settings/currency');
export const updateCurrencySettings = (data) => API.put('/products/settings/currency', data);

// Recommendations
export const getSimilarProducts = (id, top_k = 10) => API.get(`/recommendations/similar/${id}`, { params: { top_k } });
export const getFrequentlyBoughtTogether = (id, top_k = 4) => API.get(`/recommendations/frequently-bought-together/${id}`, { params: { top_k } });
export const getTrending = (top_k = 12) => API.get('/recommendations/trending', { params: { top_k } });
export const getFeatured = (top_k = 8) => API.get('/recommendations/featured', { params: { top_k } });
export const getSkinQuizRecs = (data) => API.post('/recommendations/skinquiz', data);
export const getUserRecs = (user_id) => API.post('/recommendations/user', { user_id });

// Ingredients
export const analyzeIngredients = (data) => API.post('/ingredients/analyze', data);
export const getIngredientDB = () => API.get('/ingredients/database');
export const getSkintypeGuide = () => API.get('/ingredients/skintype-guide');
export const checkProductConflicts = (productIds) => API.post('/ingredients/check-conflicts', { product_ids: productIds });

// Reviews
export const getReviews = (productId, params) => API.get(`/reviews/${productId}`, { params });
export const addReview = (data) => API.post('/reviews/', data);

// Users
export const register = (data) => API.post('/users/register', data);
export const login = (data) => API.post('/users/login', data);
export const getMe = () => API.get('/users/me');
export const updateProfile = (data) => API.put('/users/me', data);
export const getMyOrders = () => API.get('/users/orders');

// Cart
export const getCart = () => API.get('/cart/');
export const addToCart = (data) => API.post('/cart/add', data);
export const updateCart = (productId, quantity) => API.put(`/cart/update/${productId}`, null, { params: { quantity } });
export const removeFromCart = (productId) => API.delete(`/cart/remove/${productId}`);
export const clearCart = () => API.delete('/cart/clear');
export const checkout = (data) => API.post('/cart/checkout', data);

// Wishlist
export const getWishlist = () => API.get('/wishlist/');
export const toggleWishlist = (productId) => API.post(`/wishlist/toggle/${productId}`);
export const checkWishlist = (productId) => API.get(`/wishlist/check/${productId}`);

// Consultation
export const chatWithBot = (data) => API.post('/consultation/chat', data);
export const getFAQ = () => API.get('/consultation/faq');
export const submitContact = (data) => API.post('/consultation/contact', data);

// Admin
export const getDashboard = () => API.get('/admin/dashboard');

export default API;
