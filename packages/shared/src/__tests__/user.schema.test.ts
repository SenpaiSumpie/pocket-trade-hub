import { friendCodeSchema, updateProfileSchema } from '../index';

describe('friendCodeSchema', () => {
  it('accepts valid friend code format', () => {
    const result = friendCodeSchema.safeParse('1234-5678-9012-3456');
    expect(result.success).toBe(true);
  });

  it('rejects too-short code', () => {
    const result = friendCodeSchema.safeParse('1234');
    expect(result.success).toBe(false);
  });

  it('rejects alphabetic characters', () => {
    const result = friendCodeSchema.safeParse('ABCD-1234-5678-9012');
    expect(result.success).toBe(false);
  });

  it('rejects code without dashes', () => {
    const result = friendCodeSchema.safeParse('1234567890123456');
    expect(result.success).toBe(false);
  });

  it('rejects empty string', () => {
    const result = friendCodeSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});

describe('updateProfileSchema', () => {
  it('accepts valid profile update with all fields', () => {
    const result = updateProfileSchema.safeParse({
      displayName: 'TrainerRed',
      avatarId: 'fire-type',
      friendCode: '1234-5678-9012-3456',
    });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only displayName', () => {
    const result = updateProfileSchema.safeParse({
      displayName: 'TrainerRed',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no fields required)', () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects displayName longer than 30 characters', () => {
    const result = updateProfileSchema.safeParse({
      displayName: 'A'.repeat(31),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid friend code format in profile update', () => {
    const result = updateProfileSchema.safeParse({
      friendCode: 'not-a-valid-code',
    });
    expect(result.success).toBe(false);
  });
});
