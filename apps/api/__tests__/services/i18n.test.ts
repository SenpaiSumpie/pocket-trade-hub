import { t, initServerI18n } from '../../src/i18n';

beforeAll(async () => {
  await initServerI18n();
});

describe('Server i18n t() function', () => {
  it('returns a non-empty English string for errors.userNotFound', () => {
    const result = t('errors.userNotFound', 'en');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns a non-empty string for errors.userNotFound with de locale (falls back to English)', () => {
    const result = t('errors.userNotFound', 'de');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns a non-empty string for notifications.newSetTitle', () => {
    const result = t('notifications.newSetTitle', 'en');
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });

  it('supports interpolation in translations', () => {
    const result = t('notifications.newSetBody', 'en', { setName: 'Test', cardCount: 5 });
    expect(result).toContain('Test');
  });

  it('returns the key itself for unknown translation keys', () => {
    const result = t('nonexistent.key.that.does.not.exist', 'en');
    expect(result).toBe('nonexistent.key.that.does.not.exist');
  });

  // These tests will pass once non-English translations are added in Plan 03
  it.todo('returns German translation for errors.userNotFound when de translations are loaded');
  it.todo('returns Japanese translation for notifications.newSetTitle when ja translations are loaded');
});
