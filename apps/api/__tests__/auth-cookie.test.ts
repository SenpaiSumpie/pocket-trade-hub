import { buildTestApp, cleanDb, closeDb } from './setup';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await closeDb();
});

beforeEach(async () => {
  await cleanDb();
});

async function signupUser(
  email = 'cookie@example.com',
  password = 'password123'
) {
  return app.inject({
    method: 'POST',
    url: '/auth/signup',
    payload: { email, password, confirmPassword: password },
  });
}

function parseCookies(setCookieHeaders: string | string[] | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!setCookieHeaders) return cookies;
  const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  for (const header of headers) {
    const [nameValue] = header.split(';');
    const [name, ...valueParts] = nameValue.split('=');
    cookies[name.trim()] = valueParts.join('=').trim();
  }
  return cookies;
}

describe('Cookie Auth', () => {
  it('POST /auth/login sets accessToken and refreshToken cookies', async () => {
    await signupUser();

    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'cookie@example.com', password: 'password123' },
    });

    expect(res.statusCode).toBe(200);
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const cookies = parseCookies(setCookie);
    expect(cookies.accessToken).toBeDefined();
    expect(cookies.refreshToken).toBeDefined();
  });

  it('POST /auth/signup sets accessToken and refreshToken cookies', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: { email: 'new@example.com', password: 'password123', confirmPassword: 'password123' },
    });

    expect(res.statusCode).toBe(201);
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const cookies = parseCookies(setCookie);
    expect(cookies.accessToken).toBeDefined();
    expect(cookies.refreshToken).toBeDefined();
  });

  it('GET protected route accepts cookie-based auth', async () => {
    const signupRes = await signupUser();
    const setCookie = signupRes.headers['set-cookie'];
    const cookies = parseCookies(setCookie);

    // Access a protected route using cookie instead of Bearer header
    const res = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: {
        cookie: `accessToken=${cookies.accessToken}`,
      },
      payload: {},
    });

    // Should succeed because authenticate reads from cookie
    expect(res.statusCode).toBe(200);
  });

  it('POST /auth/refresh reads refreshToken from cookie', async () => {
    const signupRes = await signupUser();
    const setCookie = signupRes.headers['set-cookie'];
    const cookies = parseCookies(setCookie);

    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: {
        cookie: `refreshToken=${cookies.refreshToken}`,
      },
      payload: {},
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
  });

  it('POST /auth/logout clears cookies', async () => {
    const signupRes = await signupUser();
    const setCookie = signupRes.headers['set-cookie'];
    const cookies = parseCookies(setCookie);

    const res = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: {
        cookie: `accessToken=${cookies.accessToken}; refreshToken=${cookies.refreshToken}`,
      },
      payload: {},
    });

    expect(res.statusCode).toBe(200);

    // Verify cookies are cleared (set to empty with expired maxAge)
    const logoutCookies = res.headers['set-cookie'];
    expect(logoutCookies).toBeDefined();
    const cleared = Array.isArray(logoutCookies) ? logoutCookies : [logoutCookies!];
    const hasAccessClear = cleared.some(c => c.includes('accessToken=') && c.includes('Expires='));
    const hasRefreshClear = cleared.some(c => c.includes('refreshToken=') && c.includes('Expires='));
    expect(hasAccessClear).toBe(true);
    expect(hasRefreshClear).toBe(true);
  });
});
