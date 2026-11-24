/**
 * Serves the share test pages and logs every request with its User-Agent to requests.log.
 *
 * Usage: node scripts/server.ts, then share https://<public host>/t/<variant>?v=<anything new>. The ?v= value is also
 * added to the og:image URL, so each share fetches the page and the image again.
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { createServer, type ServerResponse } from 'node:http';
import { basename, extname, join } from 'node:path';
import { emailPage, sharePage, TYPES, VARIANTS } from './templates.ts';

const ROOT = join(import.meta.dirname, '..');
const PORT = 8765;

function send(res: ServerResponse, status: number, type: string, body: string | Buffer, head: boolean) {
	res.writeHead(status, { 'Content-Type': type, 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store' });
	res.end(head ? undefined : body);
}

createServer((req, res) => {
	const path = req.url ?? '/';
	const url = new URL(path, 'http://localhost');
	const head = req.method === 'HEAD';
	appendFileSync(join(ROOT, 'requests.log'), `${new Date().toTimeString().slice(0, 8)}\t${req.method}\t${path}\t${req.headers['user-agent'] ?? '-'}\n`);

	// Behind a tunnel, the public host comes from the forwarded headers.
	const host = String(req.headers['x-forwarded-host'] ?? req.headers.host ?? `localhost:${PORT}`);
	const proto = String(req.headers['x-forwarded-proto'] ?? (host.startsWith('localhost') ? 'http' : 'https'));
	const base = `${proto}://${host}`;
	const query = url.search.slice(1);

	if (url.pathname.startsWith('/img/')) {
		const file = join(ROOT, 'site/img', basename(url.pathname));
		const type = TYPES[extname(file).slice(1)];
		if (!type || !existsSync(file)) {
			return send(res, 404, 'text/plain', 'not found', head);
		}
		return send(res, 200, type, readFileSync(file), head);
	}
	if (url.pathname.startsWith('/t/')) {
		const variant = url.pathname.slice(3).replaceAll('/', '');
		if (!VARIANTS.includes(variant)) {
			return send(res, 404, 'text/plain', 'not found', head);
		}
		return send(res, 200, 'text/html; charset=utf-8', sharePage(base, variant, base + path, query), head);
	}
	if (url.pathname.replace(/\/$/, '') === '/email') {
		return send(res, 200, 'text/html; charset=utf-8', emailPage(base), head);
	}
	const links = VARIANTS.map((variant) => `<li><a href="/t/${variant}?v=1">${variant}</a></li>`).join('');
	send(res, 200, 'text/html; charset=utf-8', `<!doctype html><title>Image format test</title><ul>${links}<li><a href="/email">email</a></li></ul>`, head);
}).listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
