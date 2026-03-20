import { describe, test, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../src/middleware';

function buildRequest(pathname: string, hasToken: boolean) {
  const url = `http://localhost:3001${pathname}`;
  const req = new NextRequest(url);
  if (hasToken) {
    req.cookies.set('accessToken', 'fake-token');
  }
  return req;
}

describe('Auth middleware', () => {
  test('redirects unauthenticated user to /login', () => {
    const req = buildRequest('/cards', false);
    const res = middleware(req);

    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/login');
  });

  test('allows authenticated user to access /cards', () => {
    const req = buildRequest('/cards', true);
    const res = middleware(req);

    // NextResponse.next() returns 200
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  test('redirects authenticated user from /login to /cards', () => {
    const req = buildRequest('/login', true);
    const res = middleware(req);

    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/cards');
  });

  test('allows unauthenticated user to access /login', () => {
    const req = buildRequest('/login', false);
    const res = middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  test('allows unauthenticated user to access /signup', () => {
    const req = buildRequest('/signup', false);
    const res = middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });
});
