import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { apiFetch } from '../utils/apiFetch';

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
        return localStorage.getItem('green_bond_token') || localStorage.getItem('token') || null;
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [authStatus, setAuthStatus] = useState('INITIALIZING'); // Always start as INITIALIZING
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const isLoggingOutRef = React.useRef(false);

    const clearAuthState = useCallback(() => {
        setUser(null);
        setAccessToken(null);
        try {
            const authKeys = [
                'green_bond_token',
                'token',
                'accessToken',
                'refreshToken',
                'green_bond_current_user',
                'userRole',
                'user',
                'authUser',
                'session',
                'isAuthenticated',
                'farmer',
                'deliveryPartner'
            ];
            authKeys.forEach(key => {
                localStorage.removeItem(key);
                try {
                    sessionStorage.removeItem(key);
                } catch {}
            });
        } catch (e) {
            console.warn('Auth state storage cleanup notice:', e);
        }
        setAuthStatus('UNAUTHENTICATED');
    }, []);

    const checkToken = useCallback(async () => {
        // Prevent race condition: do not check/refresh token if user is logging out
        if (isLoggingOutRef.current) {
            return;
        }

        const storedToken = getStoredToken();

        try {
            // 1. First attempt: Cookie-based refresh token verification
            const response = await apiFetch('/api/auth/refresh-token', {
                method: 'GET',
                credentials: 'include'
            });

            if (isLoggingOutRef.current) {
                return;
            }

            if (response.ok) {
                const data = await response.json();
                if (data.user && data.success) {
                    const resolvedUser = data.user;
                    const newToken = data.token || storedToken;

                    setUser(resolvedUser);
                    setAccessToken(newToken);
                    try {
                        localStorage.setItem('green_bond_current_user', JSON.stringify(resolvedUser));
                        if (newToken) {
                            localStorage.setItem('green_bond_token', newToken);
                            localStorage.setItem('token', newToken);
                        }
                    } catch (e) {
                        console.warn('LocalStorage save failed:', e);
                    }
                    setAuthStatus('AUTHENTICATED');
                    return;
                }
            }

            // 2. Fallback: Bearer token validation
            if (storedToken) {
                const validateRes = await apiFetch('/api/auth/validate-token', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${storedToken}`
                    }
                });

                if (isLoggingOutRef.current) {
                    return;
                }

                if (validateRes.ok) {
                    const valData = await validateRes.json();
                    if (valData.user && valData.success) {
                        const validUser = valData.user;
                        setUser(validUser);
                        setAccessToken(storedToken);
                        try {
                            localStorage.setItem('green_bond_current_user', JSON.stringify(validUser));
                            localStorage.setItem('green_bond_token', storedToken);
                            localStorage.setItem('token', storedToken);
                        } catch (e) {
                            console.warn('LocalStorage save failed:', e);
                        }
                        setAuthStatus('AUTHENTICATED');
                        return;
                    }
                }
            }

            // If neither token verification succeeded (user deleted, token expired, invalid session)
            clearAuthState();
        } catch (error) {
            console.warn('Token validation failed:', error.message);
            // Never assume authenticated if backend check fails
            clearAuthState();
        }
    }, [clearAuthState]);

    useEffect(() => {
        // Run initial verification on app mount
        checkToken();

        // Multi-tab sync: detect logout or token clearance across tabs (Rule 18)
        const handleStorageChange = (e) => {
            if (e.key === 'green_bond_logout_timestamp' || e.key === 'green_bond_token' || e.key === 'green_bond_current_user') {
                const token = getStoredToken();
                const storedUser = getStoredUser();
                if (!token || !storedUser) {
                    clearAuthState();
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Periodic refresh check every 14 minutes
        const intervalId = setInterval(() => {
            if (!isLoggingOutRef.current && getStoredToken()) {
                checkToken();
            }
        }, 14 * 60 * 1000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(intervalId);
        };
    }, [checkToken, clearAuthState]);

    const login = (userData, token) => {
        const canonicalRole = userData?.role === 'customer' 
            ? 'user' 
            : (userData?.role === 'farmer' ? 'client' : userData?.role || 'user');

        const canonicalUser = userData ? {
            ...userData,
            role: canonicalRole
        } : null;

        try {
            if (canonicalUser) {
                localStorage.setItem('green_bond_current_user', JSON.stringify(canonicalUser));
            }
            if (token) {
                localStorage.setItem('green_bond_token', token);
                localStorage.setItem('token', token);
            }
        } catch (e) {
            console.warn("AuthContext: Local storage unavailable", e);
        }

        setAccessToken(token);
        setUser(canonicalUser);
        setAuthStatus('AUTHENTICATED');
    };

    const updateUser = useCallback((updatedFields) => {
        setUser(prev => {
            if (!prev) return prev;
            const updated = { ...prev, ...updatedFields };
            try {
                localStorage.setItem('green_bond_current_user', JSON.stringify(updated));
            } catch (e) {
                console.warn('LocalStorage save failed:', e);
            }
            return updated;
        });
    }, []);

    const logout = async () => {
        // Double-click protection (Rule 15)
        if (isLoggingOutRef.current) return;
        isLoggingOutRef.current = true;
        setIsLoggingOut(true);

        try {
            await apiFetch('/api/auth/logout', { 
                method: 'POST', 
                credentials: 'include' 
            });
        } catch (err) {
            // Rule 16: Safe fallback on network failure - frontend session is still cleared
            console.warn("Logout request notice:", err.message);
        } finally {
            clearAuthState();

            try {
                // Broadcast logout event for multi-tab synchronization (Rule 18)
                localStorage.setItem('green_bond_logout_timestamp', Date.now().toString());
            } catch (e) {
                console.warn('Broadcast logout timestamp failed:', e);
            }

            setIsLoggingOut(false);
            isLoggingOutRef.current = false;
        }
    };

    return (
        <AuthContext.Provider value={{ user, authStatus, login, logout, updateUser, checkToken, accessToken, isLoggingOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
