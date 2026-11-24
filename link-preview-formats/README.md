# Image formats in link previews

Which apps show a JPEG, PNG, WebP or AVIF image, with and without transparency, in a link preview or an email.

- Test site: https://b1ink0.github.io/research-lab/link-preview-formats/site/
- Issue: [WordPress/performance#2760](https://github.com/WordPress/performance/issues/2760)
- What WordPress shares in the first place: [`wp-image-fallbacks`](../wp-image-fallbacks)

## Results

| Format | Shown by |
| --- | --- |
| JPEG, PNG, WebP | All 15 apps tested |
| AVIF | Facebook, WhatsApp, Signal, Threads, Reddit, Google Messages, Discord, Gmail, Outlook |
| AVIF, no image | Telegram, Slack, LinkedIn, Bluesky, iMessage, X |

Transparent WebP was flattened by WhatsApp, Signal, Telegram, Bluesky, X and Gmail. Every app except Gmail and X treated transparent PNG and transparent WebP the same way. The full table, the pixel colors and the request log evidence are in [`results/shares.md`](results/shares.md).

## Test site

The site has one page per image variant, each with `og:image`, `og:image:width`, `og:image:height`, `twitter:card` and `twitter:image`:

| Page | Image |
| --- | --- |
| [`t/jpg/`](https://b1ink0.github.io/research-lab/link-preview-formats/site/t/jpg/) | `img/jpg.jpg` |
| [`t/png/`](https://b1ink0.github.io/research-lab/link-preview-formats/site/t/png/) | `img/png.png` |
| [`t/webp/`](https://b1ink0.github.io/research-lab/link-preview-formats/site/t/webp/) | `img/webp.webp` |
| [`t/avif/`](https://b1ink0.github.io/research-lab/link-preview-formats/site/t/avif/) | `img/avif.avif` |
| [`t/png-transparent/`](https://b1ink0.github.io/research-lab/link-preview-formats/site/t/png-transparent/) | `img/png-transparent.png` |
| [`t/webp-transparent/`](https://b1ink0.github.io/research-lab/link-preview-formats/site/t/webp-transparent/) | `img/webp-transparent.webp` |
| [`t/avif-transparent/`](https://b1ink0.github.io/research-lab/link-preview-formats/site/t/avif-transparent/) | `img/avif-transparent.avif` |

[`email/`](https://b1ink0.github.io/research-lab/link-preview-formats/site/email/) has every image on a red background, to send as an HTML email.

Share a page link in the app you want to test. Apps cache the preview by URL, so add a new query string each time, for example `t/avif/?v=123`. The static pages cannot add it to the image URL, so the image can still come from an older cache. For a test that rules that out and logs each request, use the logging server below.

## Reproduce

Run these from the repository root, after `npm install`.

Serve the pages and log every request:

```sh
npm run serve -w link-preview-formats
```

It listens on port 8765 and writes `requests.log` in this folder. Put it behind a public tunnel, for example `cloudflared tunnel --url http://localhost:8765`, and share `https://<tunnel host>/t/<variant>?v=<new value>`. The server adds the `?v=` value to the image URL too, so every share fetches the image again, and the log shows which app fetched what.

Rebuild the static pages in `site/`, for the `homepage` in [`package.json`](package.json) or another host:

```sh
npm run pages -w link-preview-formats
npm run pages -w link-preview-formats -- https://<host>/<path>
```

Make the share images again (needs [Docker](https://docs.docker.com/get-docker/)):

```sh
npm run images -w link-preview-formats
```

[`scripts/gen.php`](scripts/gen.php) draws them with PHP GD in the `wordpress:php8.3-apache` image pinned in [`compose.yml`](compose.yml), which made the files that were tested. It writes the same bytes as the files in `site/img/`.

### Files

| Path | Holds |
| --- | --- |
| [`scripts/`](scripts) | [`templates.ts`](scripts/templates.ts) holds the page markup used by [`pages.ts`](scripts/pages.ts) (static pages) and [`server.ts`](scripts/server.ts) (logging server). [`gen.php`](scripts/gen.php) draws the images and [`images.ts`](scripts/images.ts) runs it in Docker |
| [`site/`](site) | The site served by GitHub Pages. `index.html` and `style.css` are written by hand, `t/`, `email/` and `img/` are generated |
| [`results/`](results) | The share test results |
