import { describe, expect, it } from 'vitest';
import { readMobileOAuthCallback } from '../../../student/src/lib/mobileOAuthCallback';

describe('Student OAuth return link', () => {
  const state = 'a'.repeat(64);
  const request = JSON.stringify({ state, provider: 'facebook', expiresAt: 1000 });
  const callback = `vn.vocabflow.student://auth-callback#state=${state}&idToken=fixture`;

  it('matches the pending browser request and carries the original provider through the return', () => {
    expect(readMobileOAuthCallback(callback, request, 900)).toEqual({
      provider: 'facebook',
      idToken: 'fixture',
    });
    expect(readMobileOAuthCallback(callback, request.replace('facebook', 'google'), 900)?.provider).toBe('google');
  });

  it('rejects stale requests, incorrect destinations, missing state and legacy return links', () => {
    expect(readMobileOAuthCallback(callback, null, 900)).toBeNull();
    expect(readMobileOAuthCallback(callback, request, 1000)).toBeNull();
    expect(readMobileOAuthCallback(callback.replace(state, 'b'.repeat(64)), request, 900)).toBeNull();
    expect(readMobileOAuthCallback(callback.replace('auth-callback', 'other'), request, 900)).toBeNull();
    expect(readMobileOAuthCallback('vn.vocabflow.student://auth-callback?access_token=fixture', request, 900)).toBeNull();
  });
});
