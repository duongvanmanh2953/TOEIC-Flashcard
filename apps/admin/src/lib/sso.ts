/**
 * LetStuN Cross-App Unified Single Sign-On (SSO) Helper
 * Ensures seamless token sharing between Student, Admin, and Kid sub-apps.
 * Works seamlessly in both Local Development (port-based) and Production (.letstun.site).
 */

export type SubApp = 'student' | 'admin' | 'kid' | 'landing';

/**
 * Resolves the absolute base URL for any target sub-application.
 * Automatically adapts between local development (ports 3000, 3100, 3200, 3080)
 * and production domains (*.letstun.site).
 */
export function getAppBaseUrl(app: SubApp): string {
  if (typeof window === 'undefined') {
    switch (app) {
      case 'admin':
        return 'https://admin.letstun.site';
      case 'kid':
        return 'https://kid.letstun.site';
      case 'student':
        return 'https://app.letstun.site';
      case 'landing':
        return 'https://letstun.site';
    }
  }

  const hostname = window.location.hostname;
  const isLocal =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.endsWith('.local');

  if (isLocal) {
    const protocol = window.location.protocol;
    switch (app) {
      case 'admin':
        return `${protocol}//${hostname}:3200`;
      case 'kid':
        return `${protocol}//${hostname}:3100`;
      case 'student':
        return `${protocol}//${hostname}:3000`;
      case 'landing':
        return `${protocol}//${hostname}:3080`;
    }
  }

  // Production domain mapping
  switch (app) {
    case 'admin':
      return 'https://admin.letstun.site';
    case 'kid':
      return 'https://kid.letstun.site';
    case 'student':
      return 'https://app.letstun.site';
    case 'landing':
      return 'https://letstun.site';
  }
}

/**
 * Builds an absolute cross-app URL carrying the authenticated session tokens
 * (access token and refresh token) in the URL query string for instantaneous handoff.
 */
export function buildSsoUrl(app: SubApp, path = '/'): string {
  const baseUrl = getAppBaseUrl(app);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const target = new URL(cleanPath, baseUrl);

  if (typeof window !== 'undefined') {
    const token =
      localStorage.getItem('letstun_access_token') ||
      sessionStorage.getItem('letstun_access_token');
    const refresh =
      localStorage.getItem('letstun_refresh_token') ||
      sessionStorage.getItem('letstun_refresh_token');

    const deviceId =
      localStorage.getItem('letstun_device_id') ||
      sessionStorage.getItem('letstun_device_id');

    if (token) {
      target.searchParams.set('sso_token', token);
      if (refresh) {
        target.searchParams.set('sso_refresh', refresh);
      }
      if (deviceId) {
        target.searchParams.set('sso_device_id', deviceId);
      }
    }
  }

  return target.toString();
}

/**
 * Seamlessly navigates to another LetStuN sub-app with SSO token handoff.
 */
export function navigateToApp(app: SubApp, path = '/'): void {
  const url = buildSsoUrl(app, path);
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
}

/**
 * Ingests SSO tokens from URL query parameters (if present) into localStorage,
 * and immediately cleans the URL without triggering a page reload.
 * Returns true if SSO tokens were successfully ingested.
 */
export function ingestSsoTokens(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const ssoToken = urlParams.get('sso_token');
    const ssoRefresh = urlParams.get('sso_refresh');
    const ssoDeviceId = urlParams.get('sso_device_id');

    if (ssoDeviceId) {
      localStorage.setItem('letstun_device_id', ssoDeviceId);
    }

    if (ssoToken) {
      localStorage.setItem('letstun_access_token', ssoToken);
      if (ssoRefresh) {
        localStorage.setItem('letstun_refresh_token', ssoRefresh);
      }

      // Clean query parameters from address bar and history
      urlParams.delete('sso_token');
      urlParams.delete('sso_refresh');
      urlParams.delete('sso_device_id');
      const newSearch = urlParams.toString();
      const cleanUrl =
        window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);

      // Broadcast auth change across tabs
      broadcastAuthChange({ type: 'SSO_INGESTED', token: ssoToken });
      return true;
    }
  } catch (err) {
    console.warn('Failed to parse SSO tokens:', err);
  }

  return false;
}

// Immediately ingest tokens on module evaluation before React mounts
if (typeof window !== 'undefined') {
  try {
    ingestSsoTokens();
  } catch {}
}

// Multi-tab sync via BroadcastChannel
let authChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    authChannel = new BroadcastChannel('letstun_auth_channel');
  }
} catch {
  // BroadcastChannel unavailable
}

export function broadcastAuthChange(payload: any) {
  try {
    authChannel?.postMessage(payload);
  } catch {}
}

export function subscribeAuthChange(callback: (payload: any) => void): () => void {
  if (!authChannel) return () => {};
  const handler = (event: MessageEvent) => callback(event.data);
  authChannel.addEventListener('message', handler);
  return () => authChannel?.removeEventListener('message', handler);
}
