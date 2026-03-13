import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import LandingPage from './pages/LandingPage';
import UserDashboard from './pages/user/UserDashboard';
import UserLayout from './pages/user/UserLayout';
import Marketplace from './pages/user/Marketplace';
import Portfolio from './pages/user/Portfolio';
import Cart from './pages/user/Cart';
import BulkOrders from './pages/user/BulkOrders';


import ClientDashboard from './pages/client/ClientDashboard';
import ClientLayout from './pages/client/ClientLayout';
import CustomerOrders from './pages/client/CustomerOrders';
import LocationTracking from './pages/client/LocationTracking';
import ClientBulkInquiries from './pages/client/ClientBulkInquiries';
import AddProduct from './pages/client/AddProduct';
import UserLogin from './pages/auth/UserLogin';
import ClientLogin from './pages/auth/ClientLogin';
import UserSignup from './pages/auth/UserSignup';
import ClientSignup from './pages/auth/ClientSignup';
import DeliveryLayout from './pages/delivery/DeliveryLayout';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import DeliveryOrders from './pages/delivery/DeliveryOrders';
import DeliveryHistory from './pages/delivery/DeliveryHistory';
import DeliveryTracking from './pages/delivery/DeliveryTracking';
import DeliveryLogin from './pages/auth/DeliveryLogin';
import DeliverySignup from './pages/auth/DeliverySignup';
import AdminDashboard from './pages/admin/AdminDashboard';

import { Toaster } from 'react-hot-toast';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
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
    </>
  );
}

export default App;
