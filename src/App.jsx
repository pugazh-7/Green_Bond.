import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import LandingPage from './pages/LandingPage';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';

// Keep auth routes eagerly loaded for fast navigation
import UserLogin from './pages/auth/UserLogin';
import ClientLogin from './pages/auth/ClientLogin';
import UserSignup from './pages/auth/UserSignup';
import ClientSignup from './pages/auth/ClientSignup';
import DeliveryLogin from './pages/auth/DeliveryLogin';
import DeliverySignup from './pages/auth/DeliverySignup';

// Lazy load heavy components
const UserLayout = React.lazy(() => import('./pages/user/UserLayout'));
const UserDashboard = React.lazy(() => import('./pages/user/UserDashboard'));
const Marketplace = React.lazy(() => import('./pages/user/Marketplace'));
const Portfolio = React.lazy(() => import('./pages/user/Portfolio'));
const Cart = React.lazy(() => import('./pages/user/Cart'));
const BulkOrders = React.lazy(() => import('./pages/user/BulkOrders'));

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

const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F4F9F4]">
    <div className="flex flex-col items-center">
      <svg className="animate-spin h-10 w-10 text-green-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-green-700 font-medium">Loading component...</p>
    </div>
  </div>
);

function App() {
  return (
    <>
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
            <Route index element={<UserDashboard />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="cart" element={<Cart />} />
            <Route path="bulk-orders" element={<BulkOrders />} />
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

          {/* Admin Routes - Only for 'admin' role */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
