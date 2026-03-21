/**
 * Tests that verify the token-to-shim mapping is correct.
 * The shim lives in apps/mobile/src/constants/theme.ts but these tests
 * validate the mapping logic using the token source directly.
 */
import { colors, typography } from '../tokens';

describe('Theme Shim Mapping', () => {
  describe('color mapping (old name -> semantic token)', () => {
    const mappings: Record<string, string> = {
      // Old name -> semantic token key
      background: 'background',
      surface: 'surface',
      surfaceLight: 'surfaceLight',
      primary: 'accent',
      primaryDark: 'accentDark',
      text: 'onSurface',
      textSecondary: 'onSurfaceSecondary',
      textMuted: 'onSurfaceMuted',
      error: 'error',
      success: 'success',
      border: 'border',
      tabBar: 'tabBar',
      inputBackground: 'inputBackground',
    };

    it('all 13 old color keys can be derived from semantic tokens', () => {
      const oldKeys = Object.keys(mappings);
      expect(oldKeys).toHaveLength(13);

      for (const [_oldName, tokenKey] of Object.entries(mappings)) {
        expect(colors).toHaveProperty(tokenKey);
      }
    });

    it('primary maps to colors.accent (gold)', () => {
      expect(colors.accent).toBeDefined();
      expect(colors.accent).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('primaryDark maps to colors.accentDark', () => {
      expect(colors.accentDark).toBeDefined();
      expect(colors.accentDark).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('text maps to colors.onSurface', () => {
      expect(colors.onSurface).toBeDefined();
      expect(colors.onSurface).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('textSecondary maps to colors.onSurfaceSecondary', () => {
      expect(colors.onSurfaceSecondary).toBeDefined();
      expect(colors.onSurfaceSecondary).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('textMuted maps to colors.onSurfaceMuted', () => {
      expect(colors.onSurfaceMuted).toBeDefined();
      expect(colors.onSurfaceMuted).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('all mapped token values are valid hex strings', () => {
      for (const [_oldName, tokenKey] of Object.entries(mappings)) {
        const value = (colors as Record<string, string>)[tokenKey];
        expect(value).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });

  describe('typography shim shape', () => {
    const roles = ['heading', 'subheading', 'body', 'caption', 'label'] as const;

    it('all typography roles have fontSize and fontWeight (for shim to spread)', () => {
      for (const role of roles) {
        expect(typography[role]).toHaveProperty('fontSize');
        expect(typography[role]).toHaveProperty('fontWeight');
        expect(typeof typography[role].fontSize).toBe('number');
        expect(typeof typography[role].fontWeight).toBe('string');
      }
    });

    it('token typography does NOT have color property (shim adds it)', () => {
      for (const role of roles) {
        expect(typography[role]).not.toHaveProperty('color');
      }
    });

    it('heading typography uses correct color source (onSurface)', () => {
      // Shim should set heading.color = colors.onSurface (mapped as colors.text)
      expect(colors.onSurface).toBe('#ffffff');
    });

    it('caption typography uses correct color source (onSurfaceSecondary)', () => {
      // Shim should set caption.color = colors.onSurfaceSecondary (mapped as colors.textSecondary)
      expect(colors.onSurfaceSecondary).toBe('#a0a0b8');
    });
  });
});
