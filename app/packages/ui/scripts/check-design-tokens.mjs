import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url);
const files = [
  'src/components/actions/button.tsx',
  'src/components/forms/native-select.tsx',
  'src/components/forms/select.tsx',
  'src/components/forms/date-time-picker.tsx',
  'src/components/layout/sidebar/sidebar-trigger.tsx',
  'src/components/layout/sidebar/sidebar-panel.tsx',
  'src/components/layout/sidebar/sidebar-backdrop.tsx',
  'src/components/overlay/popup-menu.tsx',
  'src/components/pricing/pricing-grid.tsx'
];

const bannedPatterns = [
  /bg-white/g,
  /text-neutral-/g,
  /bg-neutral-/g,
  /border-neutral-/g,
  /#[0-9a-fA-F]{3,8}/g,
  /style=\{\{/g,
  /font-family/g,
  /shadow-\[/g
];

const violations = [];

for (const file of files) {
  const content = readFileSync(join(root.pathname, file), 'utf8');
  for (const pattern of bannedPatterns) {
    if (pattern.test(content)) {
      violations.push(`${file}: matched ${pattern}`);
    }
  }
}

if (violations.length > 0) {
  console.error('Design token guard failed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}
