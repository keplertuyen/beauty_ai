import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';

import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';

// Code-splitting via React.lazy for dynamic chunk loading
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const SkinQuiz = lazy(() => import('./pages/SkinQuiz'));
const IngredientAnalyzer = lazy(() => import('./pages/IngredientAnalyzer'));
const Compare = lazy(() => import('./pages/Compare'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Profile = lazy(() => import('./pages/Profile'));
const ExpertConsult = lazy(() => import('./pages/ExpertConsult'));
const SupportCenter = lazy(() => import('./pages/SupportCenter'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function PageLoader() {
  const { t } = useApp();
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '16px',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(143, 117, 95, 0.2)',
        borderTop: '3px solid #C48B71',
        borderRadius: '50%',
        animation: 'beautyaiSpin 0.8s linear infinite',
      }} />
      <p style={{ color: '#8F755F', fontSize: '14px', margin: 0 }}>{t('prod_loading', 'Đang tải...')}</p>
      <style>{`
        @keyframes beautyaiSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function AppContentLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname, location.search]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            border: '1px solid rgba(143, 117, 95, 0.12)',
            color: '#2D2520',
            borderRadius: '12px',
          },
          duration: 3000,
        }}
      />
      {!isAdmin && <Navbar />}
      {!isAdmin && <CartDrawer />}
      {!isAdmin && <AuthModal />}
      <main className={isAdmin ? "" : "page-content"}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/skin-quiz" element={<SkinQuiz />} />
            <Route path="/ingredient-analyzer" element={<IngredientAnalyzer />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/expert-consult" element={<ExpertConsult />} />
            <Route path="/support" element={<SupportCenter />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </Suspense>
      </main>
      {!isAdmin && <Footer />}
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppContentLayout />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
