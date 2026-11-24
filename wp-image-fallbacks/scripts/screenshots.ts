/**
 * Screenshots the transparent WebP upload on a red page background, with "WebP, fallback off" and "WebP, fallback on".
 *
 * Usage: node scripts/screenshots.ts, after the upload step.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = join(import.meta.dirname, '..');
const { uploads }: { uploads: { setting: string; file: string; slug: string }[] } = JSON.parse(readFileSync(join(ROOT, '.cache/uploads.json'), 'utf8'));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
for (const { setting, slug } of uploads.filter((upload) => upload.file === 'dice-alpha.webp' && upload.setting.startsWith('webp-'))) {
	await page.goto(`http://localhost:8899/${slug}/`);
	await page.addStyleTag({ content: 'body,main,.wp-site-blocks,figure{background:#e33 !important}' });
	const img = page.locator('figure.wp-block-image img').first();
	await img.scrollIntoViewIfNeeded();
	console.log(setting, 'currentSrc', await img.evaluate((el: { currentSrc: string }) => el.currentSrc.split('/').pop()));
	await img.screenshot({ path: join(ROOT, 'results', `${slug}.png`) });
}
await browser.close();
