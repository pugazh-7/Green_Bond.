import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const getStoredUser = () => {
    try {
        const raw = localStorage.getItem('green_bond_current_user');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const getStoredToken = () => {
    try {
        return localStorage.getItem('token') || localStorage.getItem('green_bond_token') || null;
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getStoredUser);
    const [accessToken, setAccessToken] = useState(getStoredToken);
    const [authStatus, setAuthStatus] = useState(() => {
        const u = getStoredUser();
        const t = getStoredToken();
        return u && t ? 'AUTHENTICATED' : 'INITIALIZING';
    });

    const checkToken = async () => {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const storedToken = getStoredToken();

        try {
            // 1. First attempt: Cookie-based refresh token verification
            const response = await fetch(`${apiUrl}/api/auth/refresh-token`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                const resolvedUser = data.user;
                const newToken = data.token || storedToken;

                setUser(resolvedUser);
                setAccessToken(newToken);
                try {
                    localStorage.setItem('userRole', resolvedUser.role);
                    localStorage.setItem('green_bond_current_user', JSON.stringify(resolvedUser));
                    if (newToken) {
                        localStorage.setItem('token', newToken);
                        localStorage.setItem('green_bond_token', newToken);
                    }
                } catch (e) {
                    console.warn('LocalStorage save failed:', e);
                }
                setAuthStatus('AUTHENTICATED');
                return;
            }

            // 2. Fallback: If refresh cookie failed (e.g. mobile Safari cross-site cookie restrictions)
            // check stored Bearer token validity
            if (storedToken) {
                const validateRes = await fetch(`${apiUrl}/api/auth/validate-token`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${storedToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (validateRes.ok) {
                    const valData = await validateRes.json();
                    const validUser = valData.user || getStoredUser();
                    setUser(validUser);
                    setAccessToken(storedToken);
                    try {
                        if (validUser) {
                            localStorage.setItem('userRole', validUser.role);
                            localStorage.setItem('green_bond_current_user', JSON.stringify(validUser));
                        }
                        localStorage.setItem('token', storedToken);
                        localStorage.setItem('green_bond_token', storedToken);
                    } catch (e) {
                        console.warn('LocalStorage save failed:', e);
                    }
                    setAuthStatus('AUTHENTICATED');
                    return;
                }
            }

            // If neither cookie nor token is valid, session has ended
            setUser(null);
            setAccessToken(null);
            try {
                localStorage.removeItem('userRole');
                localStorage.removeItem('green_bond_current_user');
                localStorage.removeItem('token');
                localStorage.removeItem('green_bond_token');
            } catch (e) {
                console.warn('LocalStorage cleanup failed:', e);
            }
            setAuthStatus('UNAUTHENTICATED');
        } catch (error) {
            console.error('Error refreshing/validating token:', error);
            // On transient network failure, preserve existing state if credentials exist
            if (storedToken && getStoredUser()) {
                setAuthStatus('AUTHENTICATED');
            } else {
                setUser(null);
                setAccessToken(null);
                setAuthStatus('UNAUTHENTICATED');
            }
        }
    };

    useEffect(() => {
        checkToken();
        // Periodic refresh check every 14 minutes
        const intervalId = setInterval(checkToken, 14 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, []);

    const login = (userData, token) => {
        const canonicalUser = userData ? {
            ...userData,
            role: userData.role === 'customer' ? 'user' : (userData.role === 'farmer' ? 'client' : userData.role)
        } : userData;

        setAccessToken(token);
        setUser(canonicalUser);
        setAuthStatus('AUTHENTICATED');
        try {
            if (canonicalUser) {
                localStorage.setItem('userRole', canonicalUser.role);
                localStorage.setItem('green_bond_current_user', JSON.stringify(canonicalUser));
            }
            if (token) {
                localStorage.setItem('token', token);
                localStorage.setItem('green_bond_token', token);
            }
        } catch (e) {
            console.warn("AuthContext: Local storage unavailable", e);
        }
    };

    const logout = async () => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/logout`, { 
                method: 'POST', 
                credentials: 'include' 
            });
        } catch (err) {
            console.error("Logout error", err);
        }
        setAccessToken(null);
        setUser(null);
        try {
            localStorage.removeItem('userRole');
            localStorage.removeItem('green_bond_current_user');
            localStorage.removeItem('token');
            localStorage.removeItem('green_bond_token');
            
            // Clear cached user data
            localStorage.removeItem('user_cart');
            localStorage.removeItem('green_bond_orders');
            localStorage.removeItem('green_bond_bulk_orders');
            localStorage.removeItem('green_bond_products');
            localStorage.removeItem('green_bond_projects');
            localStorage.removeItem('green_bond_users');
            localStorage.removeItem('green_bond_farmers');
        } catch (e) {
            console.warn('LocalStorage cleanup on logout failed:', e);
        }
        
        setAuthStatus('UNAUTHENTICATED');
    };

    return (
        <AuthContext.Provider value={{ user, authStatus, login, logout, checkToken, accessToken }}>
            {children}
        </AuthContext.Provider>
    );
};
