import { useAuth } from '../context/AuthContext';
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { accessToken, loading, user } = useAuth();
    const location = useLocation();

    // Use user.role from AuthContext, fallback to localStorage if needed during fast refresh
    const userRole = user?.role || localStorage.getItem('userRole');
    const token = accessToken;

    useEffect(() => {
        if (!loading) {
            if (!userRole || !token) {
                console.error("[ProtectedRoute DEBUG] Kicking user! userRole:", userRole, "token:", token, "loading:", loading, "user:", user);
                toast.error('Please login to access this page.', { id: 'login-error' });
            } else if (allowedRoles && !allowedRoles.includes(userRole)) {
                toast.error('You are not authorized to access this page.', { id: 'unauthorized-error' });
            }
        }
    }, [loading, userRole, token, allowedRoles ? allowedRoles.join(',') : '']);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">Securing session...</p>
                </div>
            </div>
        );
    }

    if (!userRole || !token) {
        // Redirect to login (assuming Landing Page handles the login modal)
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Role mismatch - Redirect to their dashboard
        if (userRole === 'user') return <Navigate to="/user" replace />;
        if (userRole === 'client' || userRole === 'farmer') return <Navigate to="/client" replace />;
        if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (userRole === 'delivery') return <Navigate to="/delivery" replace />;
        if (userRole === 'shop') return <Navigate to="/shop" replace />;

        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
