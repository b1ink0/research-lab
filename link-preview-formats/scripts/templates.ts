/**
 * The share test pages, one per image variant, and the email page.
 */
export const VARIANTS = ['jpg', 'png', 'webp', 'avif', 'png-transparent', 'webp-transparent', 'avif-transparent'];
export const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif' };

function escape(text: string): string {
	return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
}

/**
 * The URL of a variant's image, for example `<base>/img/webp-transparent.webp?v=2`.
 */
export function imageUrl(base: string, variant: string, query: string): string {
	return `${base}/img/${variant}.${variant.split('-')[0]}` + (query ? `?${query}` : '');
}

/**
 * A page with the variant's image as og:image and twitter:image.
 */
export function sharePage(base: string, variant: string, pageUrl: string, query: string): string {
	const img = escape(imageUrl(base, variant, query));
	const title = escape(`Image format test: ${variant.toUpperCase()}`);
	return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="og:image is a ${TYPES[variant.split('-')[0]]} file.">
<meta property="og:url" content="${escape(pageUrl)}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:image" content="${img}">
</head><body style="background:#e33"><h1>${title}</h1><img src="${img}" width="600" alt=""></body></html>`;
}

/**
 * A page with every variant on a red background, to send as an HTML email.
 */
export function emailPage(base: string): string {
	const rows = VARIANTS.map(
		(variant) => `<p style="background:#e33;padding:8px">${variant}<br><img src="${escape(imageUrl(base, variant, 'email'))}" width="300" alt="${variant} did not load"></p>`,
	).join('');
	return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Email image test</title></head><body>${rows}</body></html>`;
}
