import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

test('renderer has an offline-first CSP', () => {
  const html = readFileSync(resolve(process.cwd(), 'apps/desktop/src/renderer/index.html'), 'utf8');
  expect(html).toContain("default-src 'self'");
  expect(html).not.toContain('https://');
});
