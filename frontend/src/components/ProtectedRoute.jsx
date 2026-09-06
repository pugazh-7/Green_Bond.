import { useAuth } from '../context/AuthContext';
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const ProtectedRoute = ({ children, allowedRoles, requireApprovedFarmer = false }) => {
    const { authStatus, user } = useAuth();
    const location = useLocation();

    useEffect(() => {
        if (authStatus === 'UNAUTHENTICATED') {
            toast.error('Please login to access this page.', { id: 'login-error' });
        } else if (authStatus === 'AUTHENTICATED' && user?.role && allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'admin') {
            toast.error('You are not authorized to access this page.', { id: 'unauthorized-error' });
        }
    }, [authStatus, user?.role, allowedRoles ? allowedRoles.join(',') : '']);

    // Display explicit verification state during initial token validation
    if (authStatus === 'INITIALIZING') {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">Verifying authentication...</p>
                </div>
            </div>
        );
    }

    // Require verified database authentication
    if (authStatus !== 'AUTHENTICATED' || !user) {
        let loginTarget = '/login/user';
        if (allowedRoles && allowedRoles.includes('delivery')) loginTarget = '/login/delivery';
        else if (allowedRoles && (allowedRoles.includes('client') || allowedRoles.includes('farmer'))) loginTarget = '/login/farmer';
        else if (allowedRoles && allowedRoles.includes('shop')) loginTarget = '/login/shop';
        else if (allowedRoles && allowedRoles.includes('admin')) loginTarget = '/login/user';
        return <Navigate to={loginTarget} state={{ from: location }} replace />;
    }

    const userRole = user.role;

    // Role check strictly using verified MongoDB user record with mutual isolation
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (userRole === 'delivery') return <Navigate to="/delivery" replace />;
        if (userRole === 'shop') return <Navigate to="/shop" replace />;
        if (userRole === 'client' || userRole === 'farmer') {
            if (user?.verificationStatus === 'APPROVED' || user?.farmerStatus === 'ACTIVE') return <Navigate to="/client" replace />;
            if (user?.verificationStatus === 'REJECTED') return <Navigate to="/farmer/reupload-proof" replace />;
            return <Navigate to="/farmer/verification-pending" replace />;
        }
        if (userRole === 'user' || userRole === 'customer') return <Navigate to="/user" replace />;

        return <Navigate to="/" replace />;
    }

    // Farmer land proof approval check
    if (requireApprovedFarmer && (userRole === 'client' || userRole === 'farmer')) {
        const isApproved = user?.verificationStatus === 'APPROVED' || user?.farmerStatus === 'ACTIVE';
        if (!isApproved) {
            if (user?.verificationStatus === 'REJECTED') {
                return <Navigate to="/farmer/reupload-proof" replace />;
            }
            return <Navigate to="/farmer/verification-pending" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
