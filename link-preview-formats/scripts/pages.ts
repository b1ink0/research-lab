/**
 * Writes the share test pages as static files to site/t/ and site/email/, for GitHub Pages.
 *
 * Usage: node scripts/pages.ts [base url]. The base URL defaults to "homepage" in package.json.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { emailPage, sharePage, VARIANTS } from './templates.ts';

const ROOT = join(import.meta.dirname, '..');
const SITE = join(ROOT, 'site');
const { homepage }: { homepage: string } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const base = (process.argv[2] ?? homepage).replace(/\/$/, '');

for (const variant of VARIANTS) {
	mkdirSync(join(SITE, 't', variant), { recursive: true });
	writeFileSync(join(SITE, 't', variant, 'index.html'), sharePage(base, variant, `${base}/t/${variant}/`, '') + '\n');
}
mkdirSync(join(SITE, 'email'), { recursive: true });
writeFileSync(join(SITE, 'email', 'index.html'), emailPage(base) + '\n');
console.log(`Wrote the pages for ${base}`);
