/**
 * Runs the WordPress side of the test in Docker and writes the results to results/.
 *
 * Usage: node scripts/run.ts [setup|upload|plugins|core|sizes]. With no step, runs every step in order.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { feedImages, fileName, imgSources, ogImages } from './parse.ts';

const ROOT = join(import.meta.dirname, '..');
const CACHE = join(ROOT, '.cache');
const RESULTS = join(ROOT, 'results');
const SITE = 'http://localhost:8899';
// Modern Image Formats stays active through every run, so it is kept out of PLUGINS.
const MIF_VERSION = '2.7.1';
const PLUGINS = {
	'wordpress-seo': '28.9',
	'seo-by-rank-math': '1.0.282',
	'all-in-one-seo-pack': '5.0.5.1',
	'wp-seopress': '10.4',
	autodescription: '5.2.1',
	'slim-seo': '4.11.6',
	jetpack: '16.4',
};
// All in One SEO outputs no og:image with its default image source, so it is tested with both sources.
const CONSUMERS = ['none', 'wordpress-seo', 'seo-by-rank-math', 'aioseo-default', 'aioseo-featured', 'wp-seopress', 'autodescription', 'slim-seo', 'jetpack'];
const SETTINGS = ['webp-fb0', 'webp-fb1', 'avif-fb0', 'avif-fb1'];
const UPLOADS = ['leaves.jpg', 'dice.png', 'balloons.webp', 'dice-alpha.webp', 'leaves.avif', 'dice.avif'];
const LARGE_UPLOADS = ['big.jpg', 'mid.jpg', 'huge.jpg'];

type Upload = { setting: string; file: string; id: string; slug: string };
type Source = { file: string; filesize: number };
type Size = { file: string; width: number; height: number; filesize?: number; sources?: Record<string, Source> };
type Metadata = Size & { sizes: Record<string, Size> };

function wp(...args: string[]): string {
	return execFileSync('docker', ['compose', 'exec', '-T', 'cli', 'wp', ...args], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

async function get(path: string): Promise<string> {
	return (await fetch(SITE + path)).text();
}

async function oembedThumbnail(slug: string): Promise<string> {
	const query = new URLSearchParams({ rest_route: '/oembed/1.0/embed', url: `${SITE}/${slug}/` });
	return fileName(JSON.parse(await get(`/?${query}`)).thumbnail_url ?? '-');
}

function readUploads(): { uploads: Upload[]; large: Upload[] } {
	return JSON.parse(readFileSync(join(CACHE, 'uploads.json'), 'utf8'));
}

function write(file: string, rows: string[][]) {
	writeFileSync(join(RESULTS, file), rows.map((row) => row.join('\t') + '\n').join(''));
}

/**
 * Sets "Modern image format" and "Output fallback images" from a label like avif-fb1.
 */
function useSetting(setting: string) {
	const [format, fallback] = setting.split('-fb');
	wp('option', 'update', 'perflab_modern_image_format', format, '--quiet');
	wp('option', 'update', 'perflab_generate_webp_and_jpeg', fallback, '--quiet');
}

/**
 * Activates one SEO plugin, or none.
 */
function useConsumer(consumer: string) {
	wp('plugin', 'deactivate', ...Object.keys(PLUGINS), '--quiet');
	if (consumer === 'none') {
		return;
	}
	if (!consumer.startsWith('aioseo-')) {
		wp('plugin', 'activate', consumer, '--quiet');
		return;
	}
	wp('plugin', 'activate', 'all-in-one-seo-pack', '--quiet');
	const options = JSON.parse(wp('option', 'get', 'aioseo_options'));
	options.social.facebook.general.defaultImageSourcePosts = consumer.replace('aioseo-', '');
	options.social.twitter.general.defaultImageSourcePosts = consumer.replace('aioseo-', '');
	wp('option', 'update', 'aioseo_options', JSON.stringify(options), '--quiet');
}

/**
 * Prints the attached file, sub-sizes and sources of an attachment.
 */
function describe({ id }: Upload): string {
	const meta: Metadata = JSON.parse(wp('post', 'meta', 'get', id, '_wp_attachment_metadata', '--format=json'));
	const lines = [`== ${id} ${basename(meta.file)} ${meta.width}x${meta.height} post_mime_type=${wp('post', 'get', id, '--field=post_mime_type').trim()} filesize=${meta.filesize ?? '-'}`];
	for (const [mime, source] of Object.entries(meta.sources ?? {})) {
		lines.push(`  full source ${mime} ${source.file} ${source.filesize}`);
	}
	for (const [name, size] of Object.entries(meta.sizes)) {
		lines.push(`  ${name} ${size.file} ${size.width}x${size.height} ${size.filesize ?? '-'}`);
		for (const [mime, source] of Object.entries(size.sources ?? {})) {
			lines.push(`    source ${mime} ${source.file} ${source.filesize}`);
		}
	}
	return lines.join('\n') + '\n';
}

/**
 * Starts and installs WordPress with Modern Image Formats and the SEO plugins.
 */
async function setup() {
	mkdirSync(RESULTS, { recursive: true });
	execFileSync('docker', ['compose', 'up', '-d'], { cwd: ROOT, stdio: 'inherit' });
	const tryWp = (...args: string[]) => {
		try {
			wp(...args);
			return true;
		} catch {
			return false;
		}
	};
	// The database and wp-config.php take a few seconds to be ready.
	while (!tryWp('core', 'is-installed') && !tryWp('core', 'install', `--url=${SITE}`, '--title=Test', '--admin_user=admin', '--admin_password=admin', '--admin_email=admin@example.com', '--skip-email')) {
		await sleep(5000);
	}
	wp('rewrite', 'structure', '/%postname%/', '--quiet');
	wp('option', 'update', 'posts_per_rss', '100', '--quiet');
	wp('plugin', 'install', 'webp-uploads', `--version=${MIF_VERSION}`, '--activate', '--quiet');
	for (const [slug, version] of Object.entries(PLUGINS)) {
		wp('plugin', 'install', slug, `--version=${version}`, '--quiet');
	}
	// The same as Rank Math's "Skip" button on its account connection step. Without it Rank Math outputs nothing.
	wp('option', 'update', 'rank_math_registration_skip', '1', '--quiet');

	writeFileSync(
		join(RESULTS, 'environment.txt'),
		`WordPress ${wp('core', 'version')}` +
			// Uploads run through WP-CLI, so the image editors of the cli container are the ones that matter.
			wp('eval', 'echo "PHP ", PHP_VERSION, "\\nImageMagick ", Imagick::getVersion()["versionString"], "\\n"; foreach ( array( "image/jpeg", "image/png", "image/webp", "image/avif" ) as $mime ) { echo "Editor for $mime: ", _wp_image_editor_choose( array( "mime_type" => $mime ) ), "\\n"; }') +
			wp('plugin', 'list', '--fields=name,version', '--format=csv'),
	);
}

/**
 * Uploads every test image under every setting. Each upload is made under the setting it is read with.
 */
async function upload() {
	const create = (setting: string, label: string, file: string): Upload => {
		const [id, slug] = wp('eval-file', '/wordpress/create.php', label, `/images/${file}`).trim().split(' ');
		return { setting, file, id, slug };
	};
	const uploads = SETTINGS.flatMap((setting) => {
		useSetting(setting);
		return UPLOADS.map((file) => create(setting, setting, file));
	});
	useSetting('webp-fb1');
	const large = LARGE_UPLOADS.map((file) => create('webp-fb1', 'sz', file));
	mkdirSync(CACHE, { recursive: true });
	writeFileSync(join(CACHE, 'uploads.json'), JSON.stringify({ uploads, large }, null, '\t'));
	writeFileSync(join(RESULTS, 'metadata.txt'), uploads.map(describe).join(''));
	writeFileSync(join(RESULTS, 'sizes-metadata.txt'), large.map(describe).join(''));
}

/**
 * The image tags each SEO plugin outputs for every upload and setting.
 */
async function plugins() {
	const { uploads } = readUploads();
	const rows = [['setting', 'upload', 'plugin', 'tag', 'file']];
	for (const setting of SETTINGS) {
		useSetting(setting);
		for (const consumer of CONSUMERS) {
			useConsumer(consumer);
			for (const { file, slug } of uploads.filter((upload) => upload.setting === setting)) {
				for (const [tag, files] of ogImages(await get(`/${slug}/`))) {
					rows.push([setting, file, consumer, tag, files.join(' ')]);
				}
			}
		}
	}
	useConsumer('none');
	write('plugins.tsv', rows);
}

/**
 * What core gives for every upload and setting: the REST API, oEmbed, the post page and the RSS feed.
 */
async function core() {
	const { uploads } = readUploads();
	useConsumer('none');
	const rows = [['setting', 'upload', 'rest source_url', 'oembed thumbnail_url', 'page img src', 'feed img src']];
	for (const { setting, file, id, slug } of uploads) {
		useSetting(setting);
		rows.push([
			setting,
			file,
			fileName(JSON.parse(await get(`/?rest_route=/wp/v2/media/${id}`)).source_url ?? '-'),
			await oembedThumbnail(slug),
			imgSources(await get(`/${slug}/`), id).join(' '),
			feedImages(await get('/feed/'), `${setting}-${file}`).join(' '),
		]);
	}
	write('core.tsv', rows);
}

/**
 * Which size of a large upload each SEO plugin and core oEmbed share.
 */
async function sizes() {
	const { large } = readUploads();
	useSetting('webp-fb1');
	const rows = [['upload', 'consumer', 'og:image']];
	for (const consumer of CONSUMERS.filter((consumer) => consumer !== 'none')) {
		useConsumer(consumer);
		for (const { file, slug } of large) {
			rows.push([file, consumer, (ogImages(await get(`/${slug}/`)).get('og:image') ?? []).join(' ')]);
		}
	}
	useConsumer('none');
	for (const { file, slug } of large) {
		rows.push([file, 'core oembed', await oembedThumbnail(slug)]);
	}
	write('sizes.tsv', rows);
}

const steps = { setup, upload, plugins, core, sizes };
const step = process.argv[2];
const selected = Object.entries(steps).filter(([name]) => !step || name === step);
if (!selected.length) {
	throw new Error(`Unknown step "${step}". Use one of: ${Object.keys(steps).join(', ')}.`);
}
for (const [name, run] of selected) {
	console.log(`== ${name}`);
	await run();
}
