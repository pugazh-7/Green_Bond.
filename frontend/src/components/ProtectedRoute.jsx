import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const location = useLocation();
    // Default to 'guest' if no userRole is found, or handle it as null
    const userRole = localStorage.getItem('userRole');

    useEffect(() => {
        if (!userRole) {
            toast.error('Please login to access this page.');
        } else if (allowedRoles && !allowedRoles.includes(userRole)) {
            toast.error('You are not authorized to access this page.');
        }
    }, [userRole, allowedRoles]);

    if (!userRole) {
        // Redirect to landing page or specific login based on tried path could be better, 
        // but for now redirecting to landing page is safe.
        // You might want to redirect to a generic login selection or specific login if known.
        // For simplicity, let's go to landing.
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Role mismatch
        // Redirect based on their actual role to their dashboard?
        if (userRole === 'user') return <Navigate to="/user" replace />;
        if (userRole === 'client') return <Navigate to="/client" replace />;
        if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (userRole === 'delivery') return <Navigate to="/delivery" replace />;

        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
