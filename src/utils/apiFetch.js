const originalFetch = window.fetch;

export const setupGlobalFetch = () => {
    window.fetch = async (url, options = {}) => {
        // Prevent recursive calls if url is somehow an object (e.g., Request object)
        if (typeof url !== 'string') {
            return originalFetch(url, options);
        }

        const isApiRequest = url.startsWith('/api') || (import.meta.env.VITE_API_URL && url.includes(import.meta.env.VITE_API_URL));
        
        let finalUrl = url;
        if (url.startsWith('/api')) {
            finalUrl = `${import.meta.env.VITE_API_URL || ''}${url}`;
        }

        const token = localStorage.getItem('token');
        
        // Copy options and headers to avoid mutating original objects
        const config = { ...options };
        const headers = { ...(config.headers || {}) };

        if (token && isApiRequest && !headers['Authorization']) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        config.headers = headers;
        
        if (isApiRequest && !config.credentials) {
            config.credentials = 'include';
        }

        let response = await originalFetch(finalUrl, config);

        const isAuthEndpoint = finalUrl.includes('/api/auth/refresh-token') || finalUrl.includes('/api/auth/login');

        if (response.status === 401 && isApiRequest && token && !isAuthEndpoint) {
            try {
                const refreshUrl = `${import.meta.env.VITE_API_URL || ''}/api/auth/refresh-token`;
                const refreshResponse = await originalFetch(refreshUrl, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    const newToken = data.token;
                    
                    if (newToken) {
                        localStorage.setItem('token', newToken);
                        if (data.user) {
                            localStorage.setItem('userRole', data.user.role);
                            localStorage.setItem('green_bond_current_user', JSON.stringify(data.user));
                        }
                        
                        // Retry original request with new token
                        headers['Authorization'] = `Bearer ${newToken}`;
                        config.headers = headers;
                        response = await originalFetch(finalUrl, config);
                    }
                } else {
                    handleLogout();
                }
            } catch (error) {
                console.error('Error during token refresh:', error);
                handleLogout();
            }
        }

        return response;
    };
};

export const apiFetch = (url, options) => window.fetch(url, options);

const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('green_bond_current_user');
    window.dispatchEvent(new Event('auth-logout-event'));
};
