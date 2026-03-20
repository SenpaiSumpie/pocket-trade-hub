import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch } from '../../src/lib/api';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiFetch', () => {
  test('sends credentials: include', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'test' }),
    });

    await apiFetch('/test');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/test',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  test('retries on 401 after refresh', async () => {
    // First call returns 401
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    });

    // Refresh call succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    // Retry call succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ retried: true }),
    });

    const result = await apiFetch('/protected');

    expect(mockFetch).toHaveBeenCalledTimes(3);
    // Second call should be the refresh
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000/auth/refresh',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );
    expect(result).toEqual({ retried: true });
  });

  test('redirects to /login on refresh failure', async () => {
    const mockLocation = { href: '' };
    vi.stubGlobal('window', { location: mockLocation });

    // First call returns 401
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({}),
    });

    // Refresh call fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({}),
    });

    await expect(apiFetch('/protected')).rejects.toThrow();
    expect(mockLocation.href).toBe('/login');
  });
});
