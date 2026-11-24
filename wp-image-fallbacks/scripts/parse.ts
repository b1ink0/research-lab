/**
 * Reads the image file names from pages and feeds of the test site.
 */
import * as cheerio from 'cheerio';

/**
 * Strips the uploads path, so `http://localhost:8899/wp-content/uploads/2026/11/a.jpg` becomes `a.jpg`.
 */
export function fileName(url: string): string {
	return url.replace(/^.*\/uploads\/\d{4}\/\d{2}\//, '');
}

/**
 * The Open Graph, X and JSON-LD image files of a page, by tag, in page order.
 */
export function ogImages(html: string): Map<string, string[]> {
	const $ = cheerio.load(html);
	const tags = new Map<string, string[]>();
	const add = (tag: string, url: string) => {
		const files = tags.get(tag) ?? [];
		if (!files.includes(fileName(url))) {
			files.push(fileName(url));
		}
		tags.set(tag, files);
	};
	$('meta').each((_, meta) => {
		const tag = ($(meta).attr('property') ?? $(meta).attr('name') ?? '').toLowerCase();
		const content = $(meta).attr('content');
		if (/^(og|twitter):image(:type)?$/.test(tag) && content !== undefined) {
			add(tag, content);
		}
	});
	$('script[type="application/ld+json"]').each((_, script) => {
		const json = $(script).text().replaceAll('\\/', '/');
		for (const [url] of json.matchAll(/https?:\/\/[^"\s]*?\/uploads\/[^"\s]*?\.(?:jpe?g|png|webp|avif|gif)/gi)) {
			add('json-ld', url);
		}
	});
	return tags;
}

/**
 * The src of the featured image and of the Image block of attachment `id`.
 */
export function imgSources(html: string, id: string): string[] {
	const $ = cheerio.load(html);
	return $(`img.wp-post-image, img.wp-image-${id}`)
		.map((_, img) => fileName($(img).attr('src') ?? '-'))
		.get();
}

/**
 * The img src values in the content of the feed item titled `title`.
 */
export function feedImages(xml: string, title: string): string[] {
	const $ = cheerio.load(xml, { xml: true });
	const item = $('item').filter((_, el) => $(el).children('title').text() === title);
	const content = cheerio.load(item.find('content\\:encoded').text());
	return content('img')
		.map((_, img) => fileName(content(img).attr('src') ?? '-'))
		.get();
}
