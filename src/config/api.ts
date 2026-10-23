/**
 * PrintEase Centralized Frontend API Configuration & Client
 * 
 * Architecture:
 * - Frontend: React/Vite hosted on GitHub Pages (https://vinayd-v10.github.io/PrintEase/)
 * - Backend: Node.js + Express hosted on Vercel Serverless Functions
 * - Environment variable: VITE_API_BASE_URL
 * - Localhost development: uses relative '/api' or same-origin proxy
 * - GitHub Pages production: strictly uses configured Vercel backend URL
 * - Cross-origin Bearer token and credentials management
 * - Safe response validation (prevents "Unexpected token '<'" from HTML 404 pages)
 */

const STORAGE_KEY_BACKEND_URL = 'printease_backend_url';
const STORAGE_KEY_TOKEN = 'printease_token';

/**
 * Standard API route path constants
 */
export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  SEND_OTP: '/api/auth/send-otp',
  VERIFY_OTP: '/api/auth/verify-otp',
  SIGNUP: '/api/auth/signup',
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  SHOP_STATUS: '/api/shop-status',
  PRICING: '/api/pricing',
  UPLOAD: '/api/upload',
  ORDERS: '/api/orders',
  NOTIFICATIONS: '/api/notifications',
  WALLET: '/api/wallet',
} as const;

/**
 * Detects whether the current frontend is running on GitHub Pages
 */
export function isGitHubPages(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.endsWith('github.io');
}

/**
 * Retrieves the configured backend API Base URL.
 * Order of precedence:
 * 1. Runtime override stored in localStorage ('printease_backend_url')
 * 2. Vite environment variable: VITE_API_BASE_URL or VITE_API_URL
 * 3. Default empty string '' for local dev / same-domain serving
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = window.localStorage.getItem(STORAGE_KEY_BACKEND_URL);
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/$/, '');
    }
  }

  const envUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  return '';
}

/**
 * Persists a custom backend API URL at runtime
 */
export function setApiBaseUrl(url: string | null): void {
  if (typeof window === 'undefined') return;
  if (!url || !url.trim()) {
    window.localStorage.removeItem(STORAGE_KEY_BACKEND_URL);
  } else {
    window.localStorage.setItem(STORAGE_KEY_BACKEND_URL, url.trim().replace(/\/$/, ''));
  }
}

/**
 * Checks if the backend URL is properly configured for the current environment
 */
export function isBackendConfigured(): boolean {
  if (!isGitHubPages()) return true;
  const base = getApiBaseUrl();
  return Boolean(base && (base.startsWith('http://') || base.startsWith('https://')));
}

/**
 * Constructs a fully qualified API URL from a relative route path
 * Example: apiUrl("/api/auth/send-otp") -> "https://YOUR-VERCEL-BACKEND.vercel.app/api/auth/send-otp"
 */
export function apiUrl(endpoint: string): string {
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const base = getApiBaseUrl();
  if (!base) {
    return cleanPath;
  }
  return `${base}${cleanPath}`;
}

/**
 * Bearer Token Management for Cross-Origin Authentication
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_KEY_TOKEN) || null;
}

export function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (!token) {
    window.localStorage.removeItem(STORAGE_KEY_TOKEN);
  } else {
    window.localStorage.setItem(STORAGE_KEY_TOKEN, token);
  }
}

export function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY_TOKEN);
}

/**
 * Safe JSON extractor for API responses.
 * Prevents "Unexpected token '<', "<!doctype " is not valid JSON" parsing crashes.
 */
export async function parseApiResponse<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  // If the server returned an HTML error page (e.g. GitHub Pages 404 or Vercel edge error)
  if (text.trim().startsWith('<') || text.includes('<!DOCTYPE') || contentType.includes('text/html')) {
    if (response.status === 404) {
      throw new Error(
        'Backend route returned 404 HTML. Verify VITE_API_BASE_URL points to the deployed Vercel backend.'
      );
    }
    const cleanSnippet = text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);
    throw new Error(
      cleanSnippet
        ? `Backend Server Error (${response.status}): ${cleanSnippet}`
        : `Backend Server Error (HTTP ${response.status}). Check Vercel function logs.`
    );
  }

  if (!text.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    console.error('[API JSON Parse Error] Raw response was not valid JSON:', text.slice(0, 150));
    throw new Error('PrintEase server connection error: Invalid response from server. Please try again.');
  }
}

/**
 * Centralized fetch client for all PrintEase frontend API requests.
 * 
 * Safety & Architecture Guarantees:
 * 1. Blocks relative '/api' calls on GitHub Pages when VITE_API_BASE_URL is missing.
 * 2. Prepends Vercel API Base URL.
 * 3. Injects Authorization: Bearer <token>.
 * 4. Includes credentials: 'include' for cross-domain HttpOnly cookies.
 * 5. Automatically validates response content-type to reject HTML errors safely.
 */
export async function apiFetch(endpoint: string, init: RequestInit = {}): Promise<Response> {
  // Guard against making relative calls on GitHub Pages
  if (isGitHubPages() && !getApiBaseUrl()) {
    const errorMsg =
      'PrintEase backend is not configured for GitHub Pages. Please set VITE_API_BASE_URL to your Vercel backend URL (e.g., https://your-backend.vercel.app) or configure the API Server in settings.';
    console.error(`[PrintEase Configuration Error] Relative request to "${endpoint}" blocked on GitHub Pages.`);
    throw new Error(errorMsg);
  }

  const url = apiUrl(endpoint);
  const headers = new Headers(init.headers || {});

  // Add JSON content type if body is present and not FormData
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach stored token if not already present
  if (!headers.has('Authorization')) {
    const token = getStoredToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  try {
    const isCrossOrigin =
      Boolean(url.startsWith('http://') || url.startsWith('https://')) &&
      typeof window !== 'undefined' &&
      !url.startsWith(window.location.origin);
    const credentialsMode = init.credentials || (isCrossOrigin ? 'include' : 'same-origin');

    const response = await fetch(url, {
      ...init,
      headers,
      credentials: credentialsMode,
    });

    return response;
  } catch (netErr: any) {
    if (netErr?.name === 'TypeError' && netErr?.message?.includes('Failed to fetch')) {
      console.warn(`[API Connection Notice] Server connection check at: ${url}`);
      throw new Error(
        `Unable to reach PrintEase backend at ${getApiBaseUrl() || (typeof window !== 'undefined' ? window.location.origin : '')}. Please verify your connection.`
      );
    }
    throw netErr;
  }
}
