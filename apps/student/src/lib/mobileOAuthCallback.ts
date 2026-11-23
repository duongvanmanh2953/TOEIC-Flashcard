export interface PendingMobileOAuth {
  state: string;
  provider: 'google' | 'facebook';
  expiresAt: number;
}

export function readMobileOAuthCallback(rawUrl: string, storedRequest: string | null, now = Date.now()) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'vn.vocabflow.student:' || url.hostname !== 'auth-callback' ||
        url.pathname || url.username || url.password || url.port || url.search) return null;

    const pending: PendingMobileOAuth | null = JSON.parse(storedRequest ?? 'null');
    if (!pending || !Number.isFinite(pending.expiresAt) || now >= pending.expiresAt ||
        !/^[a-f0-9]{64}$/.test(pending.state) ||
        (pending.provider !== 'google' && pending.provider !== 'facebook')) return null;

    const fragment = new URLSearchParams(url.hash.slice(1));
    const idToken = fragment.get('idToken');
    if (!idToken || fragment.get('state') !== pending.state) return null;
    return { idToken, provider: pending.provider };
  } catch {
    return null;
  }
}
