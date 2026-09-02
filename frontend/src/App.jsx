import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './Layout';
import LandingPage from './pages/LandingPage';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './context/AuthContext';

// Keep auth routes eagerly loaded for fast navigation
import MainMarketplace from './pages/user/MainMarketplace';
import UserOrders from './pages/user/UserOrders';
import DeliveryLogin from './pages/auth/DeliveryLogin';
import DeliverySignup from './pages/auth/DeliverySignup';
import ShopLogin from './pages/auth/ShopLogin';
import ShopSignup from './pages/auth/ShopSignup';
import UserLogin from './pages/auth/UserLogin';
import ClientLogin from './pages/auth/ClientLogin';
import UserSignup from './pages/auth/UserSignup';
import ClientSignup from './pages/auth/ClientSignup';

// Lazy load heavy components
const UserLayout = React.lazy(() => import('./pages/user/UserLayout'));
const Marketplace = React.lazy(() => import('./pages/user/Marketplace'));
const Portfolio = React.lazy(() => import('./pages/user/Portfolio'));
const Cart = React.lazy(() => import('./pages/user/Cart'));
const BulkOrders = React.lazy(() => import('./pages/user/BulkOrders'));
const Wishlist = React.lazy(() => import('./pages/user/Wishlist'));
const ProductDetails = React.lazy(() => import('./pages/user/ProductDetails'));
const Profile = React.lazy(() => import('./pages/user/Profile'));
const InvoiceView = React.lazy(() => import('./pages/user/views/InvoiceView'));

const ClientLayout = React.lazy(() => import('./pages/client/ClientLayout'));
const ClientDashboard = React.lazy(() => import('./pages/client/ClientDashboard'));
const CustomerOrders = React.lazy(() => import('./pages/client/CustomerOrders'));
const LocationTracking = React.lazy(() => import('./pages/client/LocationTracking'));
const ClientBulkInquiries = React.lazy(() => import('./pages/client/ClientBulkInquiries'));
const AddProduct = React.lazy(() => import('./pages/client/AddProduct'));

const DeliveryLayout = React.lazy(() => import('./pages/delivery/DeliveryLayout'));
const DeliveryDashboard = React.lazy(() => import('./pages/delivery/DeliveryDashboard'));
const DeliveryOrders = React.lazy(() => import('./pages/delivery/DeliveryOrders'));
const DeliveryHistory = React.lazy(() => import('./pages/delivery/DeliveryHistory'));
const DeliveryTracking = React.lazy(() => import('./pages/delivery/DeliveryTracking'));

const ShopLayout = React.lazy(() => import('./pages/shop/ShopLayout'));
const ShopDashboard = React.lazy(() => import('./pages/shop/ShopDashboard'));
const ShopOrders = React.lazy(() => import('./pages/shop/ShopOrders'));
const ShopProducts = React.lazy(() => import('./pages/shop/ShopProducts'));

const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F4F9F4]">
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
      <p className="text-green-700 font-medium">Loading component...</p>
    </div>
  </div>
);

const SplashScreen = () => (
  <div className="fixed inset-0 bg-green-600 flex flex-col items-center justify-center z-[100] animate-in fade-in duration-300">
    <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center mb-6 animate-pulse">
        <span className="text-4xl">🌱</span>
    </div>
    <h1 className="text-3xl font-black text-white font-heading tracking-tight mb-2">GreenBond</h1>
    <p className="text-green-100 text-sm font-medium animate-pulse">Establishing secure connection...</p>
  </div>
);

function App() {
  const { user, authStatus } = useAuth();
  const location = useLocation();

  if (authStatus === 'INITIALIZING') {
    return <SplashScreen />;
  }

  const isAuthRoute = location.pathname.startsWith('/login') || location.pathname.startsWith('/signup');
  if (authStatus === 'AUTHENTICATED' && user && (location.pathname === '/' || isAuthRoute)) {
      if (user.role === 'user' || user.role === 'customer') return <Navigate to="/user" replace />;
      if (user.role === 'client' || user.role === 'farmer') return <Navigate to="/client" replace />;
      if (user.role === 'shop') return <Navigate to="/shop" replace />;
      if (user.role === 'delivery') return <Navigate to="/delivery" replace />;
      if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <ErrorBoundary>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingPage />} />
          </Route>

          {/* User / Investor Routes - Only for 'user' role */}
          <Route path="/user" element={
            <ProtectedRoute allowedRoles={['user']}>
              <UserLayout />
            </ProtectedRoute>
          }>
            <Route index element={<MainMarketplace />} />
            <Route path="orders" element={<UserOrders />} />
            <Route path="bulk-orders" element={<BulkOrders />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="invoice/:id" element={<InvoiceView />} />
            <Route path="cart" element={<Cart />} />
            <Route path="product/:id" element={<ProductDetails />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Client / Kyle / Farmer Routes - Only for 'client' role */}
          <Route path="/client" element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ClientDashboard />} />
            <Route path="orders" element={<CustomerOrders />} />
            <Route path="tracking" element={<LocationTracking />} />
            <Route path="bulk-orders" element={<ClientBulkInquiries />} />
            <Route path="add-product" element={<AddProduct />} />
          </Route>

          {/* Auth Routes */}
          <Route path="/login/user" element={<UserLogin />} />
          <Route path="/login/farmer" element={<ClientLogin />} />
          <Route path="/signup/user" element={<UserSignup />} />
          <Route path="/signup/farmer" element={<ClientSignup />} />
          <Route path="/signup/delivery" element={<DeliverySignup />} />
          <Route path="/login/delivery" element={<DeliveryLogin />} />
          <Route path="/signup/shop" element={<ShopSignup />} />
          <Route path="/login/shop" element={<ShopLogin />} />

          {/* Delivery Partner Routes - Only for 'delivery' role */}
          <Route path="/delivery" element={
            <ProtectedRoute allowedRoles={['delivery']}>
              <DeliveryLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DeliveryDashboard />} />
            <Route path="orders" element={<DeliveryOrders />} />
            <Route path="history" element={<DeliveryHistory />} />
            <Route path="tracking" element={<DeliveryTracking />} />
          </Route>

          {/* Shop Owner Routes - Only for 'shop' role */}
          <Route path="/shop" element={
            <ProtectedRoute allowedRoles={['shop']}>
              <ShopLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ShopDashboard />} />
            <Route path="orders" element={<ShopOrders />} />
            <Route path="products" element={<ShopProducts />} />
          </Route>

          {/* Admin Routes - Only for 'admin' role */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
