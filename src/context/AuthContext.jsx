import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiFetch } from '../utils/apiFetch';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authStatus, setAuthStatus] = useState('loading'); // 'loading', 'authenticated', 'unauthenticated'

    const checkToken = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            setAuthStatus('unauthenticated');
            return;
        }

        try {
            const response = await apiFetch('/api/auth/validate-token');

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                localStorage.setItem('userRole', data.user.role);
                localStorage.setItem('green_bond_current_user', JSON.stringify(data.user));
                setAuthStatus('authenticated');
            } else {
                // Token is invalid or expired
                logout();
            }
        } catch (error) {
            console.error('Error validating token:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkToken();
        
        const handleForceLogout = () => {
            setUser(null);
            setAuthStatus('unauthenticated');
        };
        
        const handleStorageChange = (e) => {
            if (e.key === 'token' && !e.newValue) {
                handleForceLogout();
            }
        };

        window.addEventListener('auth-logout-event', handleForceLogout);
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('auth-logout-event', handleForceLogout);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('green_bond_current_user', JSON.stringify(userData));
        setUser(userData);
        setAuthStatus('authenticated');
    };

    const logout = async () => {
        try {
            await apiFetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout failed on backend:', error);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('green_bond_current_user');
        setUser(null);
        setAuthStatus('unauthenticated');
    };

    return (
        <AuthContext.Provider value={{ user, loading, authStatus, login, logout, checkToken }}>
            {children}
        </AuthContext.Provider>
    );
};
