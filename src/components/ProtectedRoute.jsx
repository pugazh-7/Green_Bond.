import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const location = useLocation();
    const { user, authStatus } = useAuth();
    
    const userRole = user?.role;
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (authStatus === 'unauthenticated') {
            toast.error('Please login to access this page.', { id: 'login-error' });
        } else if (authStatus === 'authenticated' && allowedRoles && !allowedRoles.includes(userRole)) {
            toast.error('You are not authorized to access this page.', { id: 'unauthorized-error' });
        }
    }, [userRole, authStatus, allowedRoles ? allowedRoles.join(',') : '']);

    if (authStatus === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F4F9F4]">
                <div className="flex flex-col items-center">
                    <svg className="animate-spin h-10 w-10 text-green-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-green-700 font-medium">Verifying authentication...</p>
                </div>
            </div>
        );
    }

    if (authStatus === 'unauthenticated' || !token) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        if (userRole === 'user') return <Navigate to="/user" replace />;
        if (userRole === 'client') return <Navigate to="/client" replace />;
        if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (userRole === 'delivery') return <Navigate to="/delivery" replace />;
        if (userRole === 'shop') return <Navigate to="/shop" replace />;

        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
