import { palette, colors, typography, spacing, elevation, motion, borderRadius } from '../tokens';

describe('Design Token Package', () => {
  describe('palette (primitives)', () => {
    it('exports palette with gray, gold, red, green, orange, diamond, crown, white keys', () => {
      expect(palette).toBeDefined();
      expect(palette.gray).toBeDefined();
      expect(palette.gold).toBeDefined();
      expect(palette.red).toBeDefined();
      expect(palette.green).toBeDefined();
      expect(palette.orange).toBeDefined();
      expect(palette.diamond).toBeDefined();
      expect(palette.crown).toBeDefined();
      expect(palette.white).toBe('#ffffff');
    });

    it('includes energy type primitives', () => {
      expect(palette.energy).toBeDefined();
      expect(palette.energy.fire).toBe('#e6573f');
      expect(palette.energy.water).toBe('#5eb0d6');
      expect(palette.energy.grass).toBe('#5dbd4e');
      expect(palette.energy.lightning).toBe('#f8d030');
      expect(palette.energy.psychic).toBe('#a65ea6');
      expect(palette.energy.fighting).toBe('#c47035');
      expect(palette.energy.darkness).toBe('#545669');
      expect(palette.energy.metal).toBe('#a6a6c4');
      expect(palette.energy.fairy).toBe('#d669a0');
      expect(palette.energy.dragon).toBe('#7a63a0');
    });
  });

  describe('colors (semantic)', () => {
    const expectedKeys = [
      'background', 'surface', 'surfaceLight', 'surfaceHover',
      'onSurface', 'onSurfaceSecondary', 'onSurfaceMuted',
      'accent', 'accentDark', 'error', 'success', 'warning',
      'border', 'inputBackground', 'tabBar',
      'rarityDiamond', 'rarityStar', 'rarityCrown',
      'tierS', 'tierA', 'tierB', 'tierC', 'tierD',
    ];

    it('exports colors with all semantic keys', () => {
      for (const key of expectedKeys) {
        expect(colors).toHaveProperty(key);
      }
    });

    it('each semantic color is a valid hex string', () => {
      for (const key of expectedKeys) {
        const value = (colors as Record<string, string>)[key];
        expect(value).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });

    it('accent references palette.gold[500]', () => {
      expect(colors.accent).toBe(palette.gold[500]);
    });

    it('warning references palette.orange[500] (not gold)', () => {
      expect(colors.warning).toBe(palette.orange[500]);
      expect(colors.warning).not.toBe(colors.accent);
    });

    it('rarity colors reference correct primitives', () => {
      expect(colors.rarityDiamond).toBe(palette.diamond[500]);
      expect(colors.rarityStar).toBe(palette.gold[500]);
      expect(colors.rarityCrown).toBe(palette.crown[500]);
    });
  });

  describe('typography', () => {
    const roles = ['heading', 'subheading', 'body', 'caption', 'label'] as const;

    it('exports typography with all roles', () => {
      for (const role of roles) {
        expect(typography).toHaveProperty(role);
      }
    });

    it('each role has fontSize, fontWeight, lineHeight', () => {
      for (const role of roles) {
        const style = typography[role];
        expect(style).toHaveProperty('fontSize');
        expect(style).toHaveProperty('fontWeight');
        expect(style).toHaveProperty('lineHeight');
        expect(typeof style.fontSize).toBe('number');
        expect(typeof style.fontWeight).toBe('string');
        expect(typeof style.lineHeight).toBe('number');
      }
    });

    it('heading has correct values', () => {
      expect(typography.heading.fontSize).toBe(28);
      expect(typography.heading.fontWeight).toBe('700');
      expect(typography.heading.lineHeight).toBe(34);
    });
  });

  describe('spacing', () => {
    it('exports spacing with all size keys', () => {
      expect(spacing).toHaveProperty('2xs');
      expect(spacing).toHaveProperty('xs');
      expect(spacing).toHaveProperty('sm');
      expect(spacing).toHaveProperty('md');
      expect(spacing).toHaveProperty('lg');
      expect(spacing).toHaveProperty('xl');
      expect(spacing).toHaveProperty('xxl');
      expect(spacing).toHaveProperty('3xl');
    });

    it('xs equals 4, md equals 16', () => {
      expect(spacing.xs).toBe(4);
      expect(spacing.md).toBe(16);
    });

    it('2xs equals 2, 3xl equals 64', () => {
      expect(spacing['2xs']).toBe(2);
      expect(spacing['3xl']).toBe(64);
    });
  });

  describe('elevation', () => {
    const levels = ['none', 'low', 'medium', 'high'] as const;

    it('exports elevation with 4 levels', () => {
      for (const level of levels) {
        expect(elevation).toHaveProperty(level);
      }
    });

    it('each level has shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation', () => {
      for (const level of levels) {
        const el = elevation[level];
        expect(el).toHaveProperty('shadowColor');
        expect(el).toHaveProperty('shadowOffset');
        expect(el).toHaveProperty('shadowOpacity');
        expect(el).toHaveProperty('shadowRadius');
        expect(el).toHaveProperty('elevation');
      }
    });

    it('high level has shadowRadius 8', () => {
      expect(elevation.high.shadowRadius).toBe(8);
    });
  });

  describe('motion', () => {
    it('exports easing curves', () => {
      expect(motion.easing).toHaveProperty('standard');
      expect(motion.easing).toHaveProperty('accelerate');
      expect(motion.easing).toHaveProperty('decelerate');
      expect(motion.easing).toHaveProperty('spring');
    });

    it('standard easing is correct cubic-bezier', () => {
      expect(motion.easing.standard).toBe('cubic-bezier(0.2, 0, 0, 1)');
    });

    it('exports duration values', () => {
      expect(motion.duration).toHaveProperty('instant');
      expect(motion.duration).toHaveProperty('fast');
      expect(motion.duration).toHaveProperty('normal');
      expect(motion.duration).toHaveProperty('slow');
      expect(motion.duration).toHaveProperty('glacial');
      expect(motion.duration.glacial).toBe(800);
    });
  });

  describe('borderRadius', () => {
    it('exports borderRadius with all size keys', () => {
      expect(borderRadius).toHaveProperty('sm');
      expect(borderRadius).toHaveProperty('md');
      expect(borderRadius).toHaveProperty('lg');
      expect(borderRadius).toHaveProperty('xl');
      expect(borderRadius).toHaveProperty('full');
    });

    it('has correct values', () => {
      expect(borderRadius.sm).toBe(6);
      expect(borderRadius.md).toBe(12);
      expect(borderRadius.lg).toBe(16);
      expect(borderRadius.xl).toBe(24);
      expect(borderRadius.full).toBe(9999);
    });
  });
});
