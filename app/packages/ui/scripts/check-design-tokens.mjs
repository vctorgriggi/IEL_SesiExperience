import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// `URL.pathname` devolve `/C:/...` no Windows, e o `join` com essa barra à
// frente produzia `C:\C:\...`. `fileURLToPath` é quem converte a URL para o
// caminho do sistema — nos dois sistemas.
const root = fileURLToPath(new URL('..', import.meta.url));
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

/*
 * Sem a flag `g`: `RegExp.test` guarda `lastIndex` entre chamadas quando ela
 * está ligada, e como os mesmos objetos são reusados a cada arquivo, o
 * segundo arquivo começava a busca no meio e deixava passar violação. Aqui
 * só interessa "casou ou não", que é o que `test` sem `g` responde.
 */
const bannedPatterns = [
  /bg-white/,
  /text-neutral-/,
  /bg-neutral-/,
  /border-neutral-/,
  /#[0-9a-fA-F]{3,8}/,
  /style=\{\{/,
  /font-family/,
  /shadow-\[/
];

const violations = [];

for (const file of files) {
  const content = readFileSync(join(root, file), 'utf8');
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
