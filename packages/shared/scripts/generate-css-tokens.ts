import { colors } from '../src/tokens/colors';
import { spacing } from '../src/tokens/spacing';
import { motion } from '../src/tokens/motion';
import { elevation } from '../src/tokens/elevation';
import { borderRadius } from '../src/tokens/borderRadius';
import { typography } from '../src/tokens/typography';

export function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export function generateCSS(): string {
  const lines: string[] = [
    '/* AUTO-GENERATED from shared token package -- do not edit manually */',
    '/* Regenerate: pnpm run generate-tokens */',
    '@theme {',
  ];

  // Colors
  for (const [key, value] of Object.entries(colors)) {
    lines.push(`  --color-${camelToKebab(key)}: ${value};`);
  }

  // Spacing (px to rem for web)
  for (const [key, value] of Object.entries(spacing)) {
    lines.push(`  --spacing-${key}: ${(value as number) / 16}rem;`);
  }

  // Border radius (px to rem for web)
  for (const [key, value] of Object.entries(borderRadius)) {
    if (key === 'full') {
      lines.push(`  --border-radius-${key}: 9999px;`);
    } else {
      lines.push(`  --border-radius-${key}: ${(value as number) / 16}rem;`);
    }
  }

  // Typography (font sizes to rem)
  for (const [key, style] of Object.entries(typography)) {
    lines.push(`  --font-size-${key}: ${(style as any).fontSize / 16}rem;`);
    lines.push(`  --line-height-${key}: ${(style as any).lineHeight / 16}rem;`);
    lines.push(`  --font-weight-${key}: ${(style as any).fontWeight};`);
  }

  // Motion easing
  for (const [key, value] of Object.entries(motion.easing)) {
    lines.push(`  --motion-easing-${key}: ${value};`);
  }

  // Motion duration (ms)
  for (const [key, value] of Object.entries(motion.duration)) {
    lines.push(`  --motion-duration-${key}: ${value}ms;`);
  }

  // Elevation (box-shadow for web)
  for (const [key, value] of Object.entries(elevation)) {
    const v = value as any;
    if (v.shadowOpacity === 0) {
      lines.push(`  --elevation-${key}: none;`);
    } else {
      lines.push(`  --elevation-${key}: ${v.shadowOffset.width}px ${v.shadowOffset.height}px ${v.shadowRadius}px rgba(0, 0, 0, ${v.shadowOpacity});`);
    }
  }

  lines.push('}');
  return lines.join('\n') + '\n';
}

// CLI entry point
if (require.main === module) {
  const { writeFileSync, mkdirSync } = require('fs');
  const { resolve, dirname } = require('path');
  const outPath = resolve(__dirname, '../../apps/web/src/app/tokens.css');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, generateCSS());
  console.log(`Generated ${outPath}`);
}
