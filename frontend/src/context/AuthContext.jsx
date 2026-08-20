import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessToken, setAccessToken] = useState(null);

    const checkToken = async () => {
        try {
            // Using refresh-token endpoint to validate session and get a new access token
            const response = await fetch(`/api/auth/refresh-token`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                setAccessToken(data.token);
                localStorage.setItem('userRole', data.user.role);
                localStorage.setItem('green_bond_current_user', JSON.stringify(data.user));
            } else {
                // Refresh token invalid or missing
                setUser(null);
                setAccessToken(null);
                localStorage.removeItem('userRole');
                localStorage.removeItem('green_bond_current_user');
            }
        } catch (error) {
            console.error('Error refreshing token:', error);
            setUser(null);
            setAccessToken(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkToken();
        // Silent refresh every 14 minutes
        const intervalId = setInterval(checkToken, 14 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, []);

    const login = (userData, token) => {
        setAccessToken(token);
        setUser(userData);
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('green_bond_current_user', JSON.stringify(userData));
    };

    const logout = async () => {
        try {
            await fetch(`/api/auth/logout`, { 
                method: 'POST', 
                credentials: 'include' 
            });
        } catch (err) {
            console.error("Logout error", err);
        }
        setAccessToken(null);
        setUser(null);
        localStorage.removeItem('userRole');
        localStorage.removeItem('green_bond_current_user');
        
        // Clear cached data
        localStorage.removeItem('user_cart');
        localStorage.removeItem('green_bond_orders');
        localStorage.removeItem('green_bond_bulk_orders');
        localStorage.removeItem('green_bond_products');
        localStorage.removeItem('green_bond_projects');
        localStorage.removeItem('green_bond_users');
        localStorage.removeItem('green_bond_farmers');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkToken, accessToken }}>
            {children}
        </AuthContext.Provider>
    );
};
