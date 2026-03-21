import {
  buildColorLookup,
  scanLine,
  formatMarkdownTable,
  AuditEntry,
} from '../../scripts/audit-hardcoded-values';

describe('buildColorLookup', () => {
  it('maps #f0c040 to colors.accent', () => {
    const lookup = buildColorLookup();
    expect(lookup.get('#f0c040')).toBe('colors.accent');
  });

  it('maps #7ec8e3 to colors.rarityDiamond', () => {
    const lookup = buildColorLookup();
    expect(lookup.get('#7ec8e3')).toBe('colors.rarityDiamond');
  });

  it('maps #e67e22 to colors.warning', () => {
    const lookup = buildColorLookup();
    expect(lookup.get('#e67e22')).toBe('colors.warning');
  });

  it('maps #ffffff to colors.onSurface', () => {
    const lookup = buildColorLookup();
    expect(lookup.get('#ffffff')).toBe('colors.onSurface');
  });

  it('maps #0c0c18 to colors.background', () => {
    const lookup = buildColorLookup();
    expect(lookup.get('#0c0c18')).toBe('colors.background');
  });
});

describe('scanLine', () => {
  it('returns AuditEntry for a line with a known hex value', () => {
    const results = scanLine('const bg = "#f0c040";', 5, 'src/screen.tsx');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      value: '#f0c040',
      line: 5,
      file: 'src/screen.tsx',
      suggestedToken: 'colors.accent',
      category: 'color',
    });
  });

  it('returns empty array for a line with no hex values', () => {
    const results = scanLine('const x = 42;', 1, 'src/utils.ts');
    expect(results).toHaveLength(0);
  });

  it('returns entry with suggestedToken for #ffffff', () => {
    const results = scanLine('color: "#ffffff"', 3, 'src/comp.tsx');
    expect(results).toHaveLength(1);
    expect(results[0].suggestedToken).toBe('colors.onSurface');
  });

  it('finds multiple hex values on one line', () => {
    const results = scanLine(
      'const a = "#e74c3c"; const b = "#2ecc71";',
      10,
      'src/file.tsx',
    );
    expect(results).toHaveLength(2);
    expect(results[0].value).toBe('#e74c3c');
    expect(results[1].value).toBe('#2ecc71');
  });

  it('returns UNKNOWN for unrecognized hex values', () => {
    const results = scanLine('color: "#abcdef"', 7, 'src/file.tsx');
    expect(results).toHaveLength(1);
    expect(results[0].suggestedToken).toBe(
      'UNKNOWN -- add to token package',
    );
  });
});

describe('formatMarkdownTable', () => {
  it('returns a markdown table with header, separator, and data rows', () => {
    const entry: AuditEntry = {
      file: 'src/screen.tsx',
      line: 5,
      value: '#f0c040',
      context: 'const bg = "#f0c040"',
      suggestedToken: 'colors.accent',
      category: 'color',
    };
    const table = formatMarkdownTable([entry]);
    const lines = table.split('\n');
    expect(lines).toHaveLength(3); // header + separator + 1 row
    expect(lines[0]).toContain('File');
    expect(lines[0]).toContain('Suggested Token');
    expect(lines[1]).toContain('---');
    expect(lines[2]).toContain('src/screen.tsx');
    expect(lines[2]).toContain('`#f0c040`');
    expect(lines[2]).toContain('`colors.accent`');
    expect(lines[2]).toContain('color');
  });

  it('returns only header and separator for empty array', () => {
    const table = formatMarkdownTable([]);
    const lines = table.split('\n');
    expect(lines).toHaveLength(2);
  });
});
