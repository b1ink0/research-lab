# Image fallbacks outside the page

What SEO plugins and WordPress core output when the [Modern Image Formats](https://github.com/WordPress/performance/tree/trunk/plugins/webp-uploads) plugin converts uploads to WebP or AVIF.

- Issue: [WordPress/performance#2760](https://github.com/WordPress/performance/issues/2760)
- Which apps can show those formats: [`link-preview-formats`](../link-preview-formats)

## Why

Modern Image Formats saves each upload in a modern format. With "Output fallback images" off, the modern file becomes the attached file. With it on, the original JPEG or PNG stays the attached file, and the modern files go into the `sources` metadata of the full size and each sub-size. The plugin then swaps the `<img>` tags in the page body to the modern files.

Link previews, feeds, the REST API, oEmbed and email tools never see those `<img>` tags. They get whatever file the SEO plugin or core picks from the attachment. This experiment records which file that is for 7 SEO plugins and core, under every combination of output format and fallback setting.

## Results

### What the SEO plugins share

WordPress 7.1.4 in Docker, Modern Image Formats 2.7.1 from WordPress.org, all uploads made through WP-CLI with GD. The upload is the featured image of a post. Each cell is the format of the `og:image` file.

| Setting | JPEG upload | PNG upload | WebP upload | Transparent WebP upload | AVIF upload |
| --- | --- | --- | --- | --- | --- |
| WebP, fallback off | WebP | WebP | WebP | WebP | AVIF |
| WebP, fallback on | JPEG | PNG | WebP | WebP | AVIF |
| AVIF, fallback off | AVIF | AVIF | AVIF | AVIF | AVIF |
| AVIF, fallback on | JPEG | PNG | WebP | WebP | AVIF |

All 7 plugins share the attached file, so a fallback only reaches a share when it is the attached file. The fallback made for WebP and AVIF uploads is never shared, because it only exists in `sources`.

The defaults are AVIF ([settings.php#L33](https://github.com/WordPress/performance/blob/2026-07-03/plugins/webp-uploads/settings.php#L33)) with fallback off unless the theme declares `html5` `picture` support ([settings.php#L43](https://github.com/WordPress/performance/blob/2026-07-03/plugins/webp-uploads/settings.php#L43)), which is the "AVIF, fallback off" row.

Exceptions:

- **Yoast SEO** outputs no `og:image` for AVIF uploads. AVIF is not in its list of valid types. The image is still in its JSON-LD.
- **All in One SEO** outputs no `og:image` with its default image source. It was also tested with the source set to the featured image (`aioseo-featured` in the data).
- **Yoast SEO and Rank Math** take `og:image:type` from the attachment's `post_mime_type`, which is the uploaded type. With fallback off, a JPEG upload is shared as an `.avif` file with `og:image:type` `image/jpeg`.
- **Jetpack** adds `?w=640` to `twitter:image`.

Full data: [`results/plugins.tsv`](results/plugins.tsv), one row per setting, upload, plugin and tag.

### Which size is shared

Three large JPEG uploads with "WebP, fallback on". The file name shows the size each plugin shared.

| Plugin | big.jpg, 4000x3000, 4.4 MB (scaled to 2560x1920, 680 KB) | mid.jpg, 2000x1500, 2.4 MB | huge.jpg, 2400x1800, 5.9 MB |
| --- | --- | --- | --- |
| Yoast SEO | full | large (1024x768) | large (1024x768) |
| Rank Math | large (1024x768) | full | large (1024x768) |
| The SEO Framework | full | full | 2048x1536 |
| All in One SEO (featured image source) | full | full | full |
| SEOPress | full | full | full |
| Slim SEO | full | full | full |
| Jetpack | full | full | full |
| Core oEmbed `thumbnail_url` | 768x576 | 768x576 | 768x576 |

Yoast skips files over 2 MB, Rank Math skips images wider than 2000 pixels, and The SEO Framework skips files over 5 MB or 4096 pixels. Each then falls back to a sub-size. So the sub-sizes are shared too, not only the full size. Data: [`results/sizes.tsv`](results/sizes.tsv) and [`results/sizes-metadata.txt`](results/sizes-metadata.txt).

### What core gives

| Output | What it uses | Source |
| --- | --- | --- |
| REST API `source_url` | The attached file | [class-wp-rest-attachments-controller.php#L1512-L1513](https://github.com/WordPress/wordpress-develop/blob/7.1.4/src/wp-includes/rest-api/endpoints/class-wp-rest-attachments-controller.php#L1512-L1513) |
| oEmbed `thumbnail_url` | A sub-size picked for a 600 pixel width, in the attached format | [embed.php#L743-L746](https://github.com/WordPress/wordpress-develop/blob/7.1.4/src/wp-includes/embed.php#L743-L746) |
| RSS feed `<img>` | The attached format, because the plugin skips feeds | [helper.php#L294-L308](https://github.com/WordPress/performance/blob/2026-07-03/plugins/webp-uploads/helper.php#L294-L308) |
| Post page `<img>` | The modern file from `sources` | [hooks.php#L908-L917](https://github.com/WordPress/performance/blob/2026-07-03/plugins/webp-uploads/hooks.php#L908-L917) |

Data: [`results/core.tsv`](results/core.tsv).

## How the plugins pick the image

The links point at the exact versions that were tested. Modern Image Formats 2.7.1 is the [`2026-07-03`](https://github.com/WordPress/performance/releases/tag/2026-07-03) release of the performance repository. Trac blocks automated requests, so the SEO plugin links were built from the downloaded zip files and were not opened.

| Plugin | Picks | Format and type | Source |
| --- | --- | --- | --- |
| Yoast SEO 28.9 | The best of `full`, `large`, `medium_large` (the `wpseo_image_sizes` filter) under 2 MB | Only JPEG, GIF, PNG and WebP. `og:image:type` from `post_mime_type` | [class-wpseo-image-utils.php#L399-L405](https://plugins.trac.wordpress.org/browser/wordpress-seo/tags/28.9/inc/class-wpseo-image-utils.php#L399), [#L178-L189](https://plugins.trac.wordpress.org/browser/wordpress-seo/tags/28.9/inc/class-wpseo-image-utils.php#L178), [#L140-L141](https://plugins.trac.wordpress.org/browser/wordpress-seo/tags/28.9/inc/class-wpseo-image-utils.php#L140), [image-helper.php#L20](https://plugins.trac.wordpress.org/browser/wordpress-seo/tags/28.9/src/helpers/image-helper.php#L20), [#L115](https://plugins.trac.wordpress.org/browser/wordpress-seo/tags/28.9/src/helpers/image-helper.php#L115), [#L284](https://plugins.trac.wordpress.org/browser/wordpress-seo/tags/28.9/src/helpers/image-helper.php#L284) |
| Rank Math 1.0.282 | The largest size between 200 and 2000 pixels wide (the `opengraph/image_sizes` filter) | `og:image:type` from `post_mime_type` | [class-image.php#L59-L62](https://plugins.trac.wordpress.org/browser/seo-by-rank-math/tags/1.0.282/includes/opengraph/class-image.php#L59), [#L640-L648](https://plugins.trac.wordpress.org/browser/seo-by-rank-math/tags/1.0.282/includes/opengraph/class-image.php#L640), [#L702-L703](https://plugins.trac.wordpress.org/browser/seo-by-rank-math/tags/1.0.282/includes/opengraph/class-image.php#L702), [#L717](https://plugins.trac.wordpress.org/browser/seo-by-rank-math/tags/1.0.282/includes/opengraph/class-image.php#L717) |
| The SEO Framework 5.2.1 | Full, or the largest sub-size read from the `sizes` metadata when the file is over 4096 pixels or 5 MB | Attached format | [sanitize.class.php#L521-L522](https://plugins.trac.wordpress.org/browser/autodescription/tags/5.2.1/inc/classes/data/filter/sanitize.class.php#L521), [utils.class.php#L128-L131](https://plugins.trac.wordpress.org/browser/autodescription/tags/5.2.1/inc/classes/meta/image/utils.class.php#L128) |
| All in One SEO 5.0.5.1 | `fullsize` (the `aioseo_thumbnail_size` filter) | Attached format | [Image.php#L66](https://plugins.trac.wordpress.org/browser/all-in-one-seo-pack/tags/5.0.5.1/app/Common/Social/Image.php#L66), [#L137-L145](https://plugins.trac.wordpress.org/browser/all-in-one-seo-pack/tags/5.0.5.1/app/Common/Social/Image.php#L137) |
| SEOPress 10.4 | Full | Attached format | [options-social.php#L809-L811](https://plugins.trac.wordpress.org/browser/wp-seopress/tags/10.4/inc/functions/options-social.php#L809), [#L866-L867](https://plugins.trac.wordpress.org/browser/wp-seopress/tags/10.4/inc/functions/options-social.php#L866), [#L1348-L1349](https://plugins.trac.wordpress.org/browser/wp-seopress/tags/10.4/inc/functions/options-social.php#L1348) |
| Slim SEO 4.11.6 | Full | Attached format | [Image.php#L80](https://plugins.trac.wordpress.org/browser/slim-seo/tags/4.11.6/src/MetaTags/Image.php#L80) |
| Jetpack 16.4 | Full, or `wp_get_attachment_url()` when Photon is on | Attached format | [class-images.php#L336](https://plugins.trac.wordpress.org/browser/jetpack/tags/16.4/jetpack_vendor/automattic/jetpack-post-media/src/class-images.php#L336), [#L370-L380](https://plugins.trac.wordpress.org/browser/jetpack/tags/16.4/jetpack_vendor/automattic/jetpack-post-media/src/class-images.php#L370), [functions.opengraph.php#L412](https://plugins.trac.wordpress.org/browser/jetpack/tags/16.4/functions.opengraph.php#L412) |

### What Modern Image Formats does

- [`webp_uploads_get_upload_image_mime_transforms()`](https://github.com/WordPress/performance/blob/2026-07-03/plugins/webp-uploads/helper.php#L28-L77) decides which formats each upload type is saved in. With fallback on, JPEG and PNG uploads keep the original as the attached file. WebP and AVIF uploads keep their own format as the attached file.
- [`webp_uploads_in_frontend_body()`](https://github.com/WordPress/performance/blob/2026-07-03/plugins/webp-uploads/helper.php#L294-L308) returns false for REST, XML-RPC, feeds, anything before `template_redirect` and anything inside `wp_head`. The content filters check it ([hooks.php#L563](https://github.com/WordPress/performance/blob/2026-07-03/plugins/webp-uploads/hooks.php#L563), [#L603](https://github.com/WordPress/performance/blob/2026-07-03/plugins/webp-uploads/hooks.php#L603), [#L840](https://github.com/WordPress/performance/blob/2026-07-03/plugins/webp-uploads/hooks.php#L840)), so everything outside the page body already gets the attached file.
- [`webp_uploads_should_discard_additional_image_file()`](https://github.com/WordPress/performance/blob/2026-07-03/plugins/webp-uploads/helper.php#L321-L342) drops a generated file that is not smaller than the original, unless the `webp_uploads_discard_larger_generated_images` filter returns false.
- [`webp_uploads_opt_in_extra_image_sizes()`](https://github.com/WordPress/performance/blob/2026-07-03/plugins/webp-uploads/hooks.php#L928-L944) adds the 1536 and 2048 sizes when fallback is on.

## Bugs seen along the way

- **Transparent WebP served as JPEG.** With "WebP, fallback on", the post page shows `dice-alpha-webp.jpg` instead of the uploaded transparent WebP, so the transparency is lost. See [`results/webp-fb0-dice-alpha-webp.png`](results/webp-fb0-dice-alpha-webp.png) (fallback off) and [`results/webp-fb1-dice-alpha-webp.png`](results/webp-fb1-dice-alpha-webp.png) (fallback on), both on a red page background.
- **AVIF served as JPEG.** With "AVIF, fallback on", the large size of an AVIF upload is shown as `leaves-1024x683-avif.jpg` on the post page, while the full size stays AVIF.
- **Wrong `og:image:type`.** With fallback off, Yoast SEO and Rank Math send the uploaded type with a modern file (see [What the SEO plugins share](#what-the-seo-plugins-share)).

## Reproduce

Needs [Docker](https://docs.docker.com/get-docker/) with Compose, and `npm install` at the repository root. Then, from the repository root:

```sh
npm run audit -w wp-image-fallbacks
```

WordPress runs at http://localhost:8899 (user `admin`, password `admin`). The steps can also run one at a time, with `npm run <step> -w wp-image-fallbacks`:

| Step | Does | Writes |
| --- | --- | --- |
| `setup` | Starts the containers and installs WordPress, Modern Image Formats and the SEO plugins | `results/environment.txt` |
| `upload` | Uploads each image under each setting, as the featured image and an Image block of a new post | `results/metadata.txt`, `results/sizes-metadata.txt` |
| `plugins` | Reads the image tags of every post with each SEO plugin active | `results/plugins.tsv` |
| `core` | Reads the REST API, oEmbed, the post page and the feed | `results/core.tsv` |
| `sizes` | Reads which size of the large uploads each plugin and oEmbed share | `results/sizes.tsv` |
| `screenshots` | Screenshots the transparent WebP upload on a red background, with fallback off and on | `results/*.png` |
| `down` | Stops the containers and removes the site | |

### What runs where

| Part | Version |
| --- | --- |
| WordPress | `wordpress:php8.3-apache`, WordPress 7.1.4 |
| WP-CLI | `wordpress:cli-php8.3`, PHP 8.3.37, ImageMagick 7.1.2-35, GD for every format |
| Database | `mariadb:lts` |
| Modern Image Formats | 2.7.1 |
| SEO plugins | Yoast SEO 28.9, Rank Math 1.0.282, All in One SEO 5.0.5.1, SEOPress 10.4, The SEO Framework 5.2.1, Slim SEO 4.11.6, Jetpack 16.4 |

The Docker images are pinned by digest in [`compose.yml`](compose.yml), so a later run uses the same PHP, GD and ImageMagick builds. The plugin versions are pinned in [`scripts/run.ts`](scripts/run.ts) and installed from WordPress.org with `wp plugin install`. To test another version, change it there and run the `down` step before the next run. The exact versions of a run are written to [`results/environment.txt`](results/environment.txt).

### Files

| Path | Holds |
| --- | --- |
| [`scripts/`](scripts) | [`run.ts`](scripts/run.ts) runs the steps, [`parse.ts`](scripts/parse.ts) reads the image tags from the HTML and the feed, [`screenshots.ts`](scripts/screenshots.ts) takes the screenshots |
| [`images/`](images) | The uploaded test images: `leaves.jpg`, `dice.png` and `balloons.webp` (see [Credits](#credits)), a transparent WebP and two AVIF files made from them, and three noise JPEGs for the size test |
| [`wordpress/`](wordpress) | [`create.php`](wordpress/create.php) uploads an image through WP-CLI and creates its post. The [mu-plugin](wordpress/mu-plugins/audit.php) lets Jetpack output its Open Graph tags without a WordPress.com connection |
| [`results/`](results) | The output of the steps |
| `.cache/` | The list of uploads of the last run. Not committed |

## Credits

- `leaves.jpg` and `balloons.webp`: from the [Modern Image Formats test images](https://github.com/WordPress/performance/tree/trunk/plugins/webp-uploads/tests/data/images), [GPL-2.0-or-later](https://github.com/WordPress/performance/blob/trunk/LICENSE).
- `dice.png`: from the same folder. It is a smaller copy of [PNG transparency demonstration 1](https://commons.wikimedia.org/wiki/File:PNG_transparency_demonstration_1.png) by Ed g2s, Wikimedia Commons, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).

These images and the files made from them keep those licenses.
