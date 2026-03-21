import { colors } from '../src/tokens/colors';
import { palette } from '../src/tokens/primitives';
import * as fs from 'fs';
import * as path from 'path';

export interface AuditEntry {
  file: string;
  line: number;
  value: string;
  context: string;
  suggestedToken: string;
  category: 'color' | 'spacing' | 'typography';
}

/**
 * Build a reverse lookup map: hex value (lowercase) -> token name.
 * Semantic colors are preferred over primitive palette names.
 */
export function buildColorLookup(): Map<string, string> {
  const lookup = new Map<string, string>();

  // First resolve all colors to their actual hex values
  // colors.ts references palette values, so we need to resolve them
  for (const [key, value] of Object.entries(colors)) {
    const hex = (value as string).toLowerCase();
    if (!lookup.has(hex)) {
      lookup.set(hex, `colors.${key}`);
    }
  }

  // Primitive palette (fallback suggestions)
  for (const [group, shades] of Object.entries(palette)) {
    if (typeof shades === 'string') {
      const hex = shades.toLowerCase();
      if (!lookup.has(hex)) {
        lookup.set(hex, `palette.${group}`);
      }
    } else if (typeof shades === 'object') {
      for (const [shade, value] of Object.entries(
        shades as Record<string, string>,
      )) {
        const hex = value.toLowerCase();
        if (!lookup.has(hex)) {
          lookup.set(hex, `palette.${group}[${shade}]`);
        }
      }
    }
  }

  return lookup;
}

const HEX_PATTERN = /#[0-9a-fA-F]{6}\b/g;

/**
 * Scan a single line of source code for hardcoded hex color values.
 */
export function scanLine(
  lineText: string,
  lineNumber: number,
  filePath: string,
): AuditEntry[] {
  const lookup = buildColorLookup();
  const entries: AuditEntry[] = [];

  let match;
  // Reset lastIndex for global regex
  HEX_PATTERN.lastIndex = 0;
  while ((match = HEX_PATTERN.exec(lineText)) !== null) {
    const hex = match[0].toLowerCase();
    entries.push({
      file: filePath,
      line: lineNumber,
      value: match[0],
      context: lineText.trim().substring(0, 80),
      suggestedToken: lookup.get(hex) || 'UNKNOWN -- add to token package',
      category: 'color',
    });
  }

  return entries;
}

/**
 * Format audit entries as a markdown table.
 */
export function formatMarkdownTable(entries: AuditEntry[]): string {
  const header =
    '| File | Line | Value | Context | Suggested Token | Category |';
  const separator =
    '|------|------|-------|---------|-----------------|----------|';
  const rows = entries.map(
    (e) =>
      `| ${e.file} | ${e.line} | \`${e.value}\` | \`${e.context}\` | \`${e.suggestedToken}\` | ${e.category} |`,
  );
  return [header, separator, ...rows].join('\n');
}

// --- CLI entry point ---

// Resolve monorepo root (two levels up from packages/shared/)
const MONOREPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const SCAN_DIRS = [
  path.join(MONOREPO_ROOT, 'apps/mobile/src'),
  path.join(MONOREPO_ROOT, 'apps/web/src'),
];
const EXTENSIONS = ['.ts', '.tsx'];
const EXCLUDE_PATTERNS = [
  'constants/theme.ts',
  'node_modules',
  '__tests__',
  '.test.',
  '.spec.',
  '.d.ts',
];

function shouldExclude(filePath: string): boolean {
  return EXCLUDE_PATTERNS.some((pat) => filePath.includes(pat));
}

function isTokenImportLine(line: string): boolean {
  return /import\s+.*from\s+['"].*tokens/.test(line);
}

function collectFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else if (
      EXTENSIONS.includes(path.extname(entry.name)) &&
      !shouldExclude(fullPath)
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

function runAudit(): AuditEntry[] {
  const allEntries: AuditEntry[] = [];

  for (const dir of SCAN_DIRS) {
    const files = collectFiles(dir);
    for (const filePath of files) {
      const relativePath = path.relative(MONOREPO_ROOT, filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip import lines that reference tokens
        if (isTokenImportLine(line)) continue;
        const entries = scanLine(line, i + 1, relativePath);
        allEntries.push(...entries);
      }
    }
  }

  return allEntries;
}

// Only run CLI when executed directly (not imported in tests)
if (require.main === module) {
  const entries = runAudit();

  // Summary stats
  const fileSet = new Set(entries.map((e) => e.file));
  const knownCount = entries.filter(
    (e) => !e.suggestedToken.startsWith('UNKNOWN'),
  ).length;
  const unknownCount = entries.length - knownCount;

  const output = [
    `# Hardcoded Value Audit`,
    '',
    `Total: ${entries.length} | Files: ${fileSet.size} | Known: ${knownCount} | Unknown: ${unknownCount}`,
    '',
    formatMarkdownTable(entries),
  ].join('\n');

  console.log(output);

  // Write to file if argument provided
  const outFile = process.argv[2];
  if (outFile) {
    fs.writeFileSync(outFile, output, 'utf-8');
    console.error(`\nWritten to ${outFile}`);
  }
}
