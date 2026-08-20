import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkToken = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/validate-token', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                localStorage.setItem('userRole', data.user.role);
                localStorage.setItem('green_bond_current_user', JSON.stringify(data.user));
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
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('green_bond_current_user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('green_bond_current_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkToken }}>
            {children}
        </AuthContext.Provider>
    );
};
