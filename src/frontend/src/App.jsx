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
const RoutineView = lazy(() => import('./pages/RoutineView'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Profile = lazy(() => import('./pages/Profile'));
const ExpertConsult = lazy(() => import('./pages/ExpertConsult'));
const SupportCenter = lazy(() => import('./pages/SupportCenter'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));

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
        border: '3px solid var(--primary-glow)',
        borderTop: '3px solid var(--accent)',
        borderRadius: '50%',
        animation: 'beautyaiSpin 0.8s linear infinite',
      }} />
      <p style={{ color: 'var(--primary-light)', fontSize: '14px', margin: 0 }}>{t('prod_loading', 'Loading...')}</p>
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
        containerStyle={{ zIndex: 'var(--z-toast)' }}
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
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
            <Route path="/routines" element={<RoutineView />} />
            <Route path="/routine" element={<RoutineView />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/expert-consult" element={<ExpertConsult />} />
            <Route path="/support" element={<SupportCenter />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
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
