/**
 * GreenBond API Fetch Client
 * Provides centralized network request handling, automatic Bearer token injection,
 * credentials inclusion, and Rule 22 compliant error categorization.
 */

const DEFAULT_TIMEOUT = 15000;

export const getApiBaseUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
        return envUrl.trim().replace(/\/+$/, '');
    }
    return '';
};

export const getAuthToken = () => {
    try {
        return localStorage.getItem('green_bond_token') || localStorage.getItem('token') || null;
    } catch {
        return null;
    }
};

/**
 * Enhanced fetch wrapper with timeout, token injection, and structured error responses.
 */
export const apiFetch = async (endpoint, options = {}) => {
    const config = { ...options };
    const headers = { ...(config.headers || {}) };

    // Determine target URL
    const baseUrl = getApiBaseUrl();
    let url = endpoint;
    if (typeof endpoint === 'string' && endpoint.startsWith('/api')) {
        url = `${baseUrl}${endpoint}`;
    }

    // Attach Authorization header if available
    const token = getAuthToken();
    if (token && !headers['Authorization'] && !headers['authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (!headers['Content-Type'] && !(config.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    config.headers = headers;

    if (!config.credentials) {
        config.credentials = 'include';
    }

    // Setup Timeout Signal
    const timeoutMs = config.timeout || DEFAULT_TIMEOUT;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // If caller provided their own signal, respect both
    if (config.signal) {
        config.signal.addEventListener('abort', () => controller.abort());
    }
    config.signal = controller.signal;

    try {
        const response = await window.fetch(url, config);
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            const timeoutError = new Error('GreenBond is taking too long to respond. Please try again.');
            timeoutError.name = 'TimeoutError';
            timeoutError.code = 'TIMEOUT';
            throw timeoutError;
        }
        if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
            const networkError = new Error('Unable to connect to GreenBond. Please try again.');
            networkError.name = 'NetworkError';
            networkError.code = 'NETWORK_ERROR';
            throw networkError;
        }
        throw error;
    }
};

/**
 * Rule 22 Standardized error message extractor based on HTTP status or Network error
 */
export const getErrorMessage = (error, response = null, defaultMsg = 'An unexpected error occurred.') => {
    if (error) {
        if (error.name === 'TimeoutError' || error.code === 'TIMEOUT' || error.name === 'AbortError') {
            return 'GreenBond is taking too long to respond. Please try again.';
        }
        if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR' || error.message?.includes('Failed to fetch')) {
            return 'Unable to connect to GreenBond. Please try again.';
        }
    }

    if (response) {
        const status = response.status;
        if (status === 400) return 'Please enter a valid email and password.';
        if (status === 401) return 'Invalid email or password.';
        if (status === 403) return 'You are not authorized to continue.';
        if (status === 404) return 'Resource not found.';
        if (status === 429) return 'Too many attempts. Please try again later.';
        if (status >= 500) return 'GreenBond is temporarily unavailable. Please try again.';
    }

    return error?.message || defaultMsg;
};

export default apiFetch;
