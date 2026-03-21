import { generateCSS, camelToKebab } from '../../scripts/generate-css-tokens';

describe('camelToKebab', () => {
  it('converts onSurface to on-surface', () => {
    expect(camelToKebab('onSurface')).toBe('on-surface');
  });

  it('converts surfaceHover to surface-hover', () => {
    expect(camelToKebab('surfaceHover')).toBe('surface-hover');
  });

  it('converts rarityDiamond to rarity-diamond', () => {
    expect(camelToKebab('rarityDiamond')).toBe('rarity-diamond');
  });
});

describe('generateCSS', () => {
  const css = generateCSS();

  it('starts with AUTO-GENERATED comment', () => {
    expect(css).toMatch(/^\/\* AUTO-GENERATED/);
  });

  it('contains @theme block', () => {
    expect(css).toContain('@theme {');
  });

  // Colors
  it('contains --color-background: #0c0c18', () => {
    expect(css).toContain('--color-background: #0c0c18;');
  });

  it('contains --color-accent: #f0c040', () => {
    expect(css).toContain('--color-accent: #f0c040;');
  });

  it('contains --color-on-surface: #ffffff (camelCase converted)', () => {
    expect(css).toContain('--color-on-surface: #ffffff;');
  });

  it('contains --color-warning: #e67e22', () => {
    expect(css).toContain('--color-warning: #e67e22;');
  });

  // Spacing (px to rem)
  it('contains --spacing-xs: 0.25rem (4/16)', () => {
    expect(css).toContain('--spacing-xs: 0.25rem;');
  });

  it('contains --spacing-md: 1rem (16/16)', () => {
    expect(css).toContain('--spacing-md: 1rem;');
  });

  // Motion
  it('contains --motion-easing-standard', () => {
    expect(css).toContain('--motion-easing-standard: cubic-bezier(0.2, 0, 0, 1);');
  });

  it('contains --motion-duration-fast: 200ms', () => {
    expect(css).toContain('--motion-duration-fast: 200ms;');
  });

  // Border radius
  it('contains --border-radius-md: 0.75rem (12/16)', () => {
    expect(css).toContain('--border-radius-md: 0.75rem;');
  });
});
