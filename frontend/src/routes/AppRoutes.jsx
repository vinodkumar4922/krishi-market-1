import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import LoadingSpinner from '../components/LoadingSpinner';

// Core entry pages
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Signup from '../pages/Signup';

// Code-split lazy loaded secondary pages for sub-second page performance
const Marketplace = lazy(() => import('../pages/Marketplace'));
const ProductDetails = lazy(() => import('../pages/ProductDetails'));
const FarmerProfile = lazy(() => import('../pages/FarmerProfile'));
const Cart = lazy(() => import('../pages/Cart'));
const Wishlist = lazy(() => import('../pages/Wishlist'));
const FarmerDashboard = lazy(() => import('../pages/FarmerDashboard'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const ConsumerOrders = lazy(() => import('../pages/ConsumerOrders'));
const OrderTracking = lazy(() => import('../pages/OrderTracking'));
const About = lazy(() => import('../pages/About'));
const FAQ = lazy(() => import('../pages/FAQ'));
const Contact = lazy(() => import('../pages/Contact'));

const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <LoadingSpinner text="Loading produce..." />
  </div>
);

const AppRoutes = () => {
  return (
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/farmers/:id" element={<FarmerProfile />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute allowedRoles={['CONSUMER', 'FARMER', 'ADMIN']}>
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={['CONSUMER', 'FARMER', 'ADMIN']}>
                <ConsumerOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute allowedRoles={['CONSUMER', 'FARMER', 'ADMIN']}>
                <OrderTracking />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Role Protected Routes */}
          <Route
            path="/farmer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* 404 Fallback */}
          <Route
            path="*"
            element={
              <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
                <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Page Not Found</h2>
                <p className="text-slate-500 mb-6">The page you requested does not exist or has been moved.</p>
                <a
                  href="/"
                  className="px-5 py-2.5 bg-krishi-600 hover:bg-krishi-700 text-white font-semibold rounded-xl shadow-sm transition"
                >
                  Return to Marketplace
                </a>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </MainLayout>
  );
};

export default AppRoutes;
