# Real share test

Tested on 2026-11-23, with the logging server behind a Cloudflare quick tunnel. The server was a Python script at the time. [`scripts/server.ts`](../scripts/server.ts) replaced it and serves the same pages.

## Setup

- One page per variant at `/t/<variant>`, with `og:image`, `og:image:width`, `og:image:height`, `twitter:card` (`summary_large_image`) and `twitter:image`.
- The images from [`scripts/gen.php`](../scripts/gen.php). Each is 1200x630, a yellow circle with the format name on a blue background:
  - `jpg.jpg` (25,707 bytes), `png.png` (6,687), `webp.webp` (9,166) and `avif.avif` (3,922).
  - Transparent versions with no background: `png-transparent.png`, `webp-transparent.webp` and `avif-transparent.avif`.
- Each share used a new `?v=` value, which the server also adds to the image URL, because the services cache both the page and the image by URL.
- The server logged every request with its User-Agent. Every result below was checked against that log, so no result comes from an old cached preview.
- Email: the `/email` page was sent as an HTML email to a Gmail and an Outlook address, and opened in the Android apps.

## Results

| App | How it was tested | JPEG | PNG | WebP | AVIF | Transparent PNG | Transparent WebP | Transparent AVIF |
|---|---|---|---|---|---|---|---|---|
| Facebook | Sharing Debugger | ✅ | ✅ | ✅ | ✅ | ✅ kept | ✅ kept | ✅ kept |
| WhatsApp | Android, sent | ✅ | ✅ | ✅ | ✅ | ⚠️ white fill | ⚠️ white fill | ⚠️ white fill |
| Signal | Android, sent | ✅ | ✅ | ✅ | ✅ | ⚠️ black fill | ⚠️ black fill | ⚠️ black fill |
| Threads | Android, composer | ✅ | ✅ | ✅ | ✅ | ✅ kept | ✅ kept | ✅ kept |
| Reddit | Android, composer | ✅ | ✅ | ✅ | ✅ | ✅ kept | ✅ kept | ✅ kept |
| Google Messages (RCS) | Android, sent | ✅ | ✅ | ✅ | ✅ | ✅ kept | ✅ kept | ✅ kept |
| Discord | sent | ✅ | ✅ | ✅ | ✅ | ✅ kept | ✅ kept | ✅ kept |
| Telegram | sent | ✅ | ✅ | ✅ | ❌ | ⚠️ white fill | ⚠️ white fill | ❌ |
| Slack | sent | ✅ | ✅ | ✅ | ❌ | ✅ kept | ✅ kept | ❌ |
| LinkedIn | composer | ✅ | ✅ | ✅ | ❌ | ❓ gray | ❓ gray | ❌ |
| Bluesky | composer | ✅ | ✅ | ✅ | ❌ | ⚠️ black fill | ⚠️ black fill | ❌ |
| iMessage | iOS 27.2, sent | ✅ | ✅ | ✅ | ❌ placeholder icon | ✅ kept | ✅ kept | ❌ placeholder icon |
| X | Android and web, posted | ✅ | ✅ | ✅ | ❌ broken image | ✅ kept | ⚠️ white fill | ❌ broken image |
| Gmail | Android app, email | ✅ | ✅ | ✅ | ✅ | ✅ kept | ⚠️ black fill | ✅ kept |
| Outlook | Android app, email | ✅ | ✅ | ✅ | ✅ | ✅ kept | ✅ kept | ✅ kept |

- ✅ the image was shown. ❌ no image was shown.
- **kept:** the transparent area matches the card or page around it.
- **white fill** or **black fill:** the transparent area is solid white or black and does not match the card. The app flattened the image onto that color.
- **❓ gray:** LinkedIn shows the transparent image on a gray tile that is lighter than the composer. The test cannot tell whether this is its thumbnail frame or a flattened background.

Pixel colors sampled from the screenshots, transparent area against the card or page around it:

| App | Transparent area | Card or page |
|---|---|---|
| Facebook | `rgb(242,243,245)` | `rgb(242,243,245)` |
| Threads | `rgb(16,16,16)` | `rgb(16,16,16)` |
| Discord | `rgb(36,36,41)` | `rgb(36,36,41)` |
| Slack | `rgb(26,29,33)` | `rgb(26,29,33)` (message background) |
| Reddit | `rgb(14,17,19)` | `rgb(14,17,19)` (page background) |
| Google Messages | `rgb(36,23,0)` | `rgb(43,29,0)` (the card is tinted from the image colors) |
| Outlook | `rgb(0,0,0)` | `rgb(0,0,0)` (email background) |
| Gmail, transparent PNG | `rgb(238,51,51)` | `rgb(238,51,51)` (the red email background) |
| Gmail, transparent WebP | `rgb(0,0,0)` | `rgb(238,51,51)` |
| WhatsApp | `rgb(255,255,255)` | `rgb(19,67,51)` (dark mode card) |
| Telegram | `rgb(255,255,255)` | `rgb(51,41,47)` (dark mode card) |
| Signal | `rgb(1,1,1)` | `rgb(64,65,67)` |
| Bluesky | `rgb(0,0,0)` | `rgb(21,29,40)` |
| LinkedIn | `rgb(66,66,66)` | `rgb(27,31,35)` |

- Colors were sampled from the transparent PNG screenshot of each app. The transparent WebP was also sampled for Slack, LinkedIn, Bluesky and Gmail. The other transparent columns were checked by eye against the same screenshots.
- X colors come from a phone in dark mode, checked by eye, not from a screenshot.

## From the request log

- **AVIF fails after the download, except on Slack.** LinkedIn, Telegram, Bluesky, iMessage and X each downloaded the `.avif` file and then showed no image.
  - X (`Twitterbot/1.0`) requested `avif-transparent.avif?v=10` 14 times in 31 seconds and showed a broken image.
  - Slack (`Slack-ImgProxy`) never requested either `.avif` file.
- **Apps that fetch from the phone itself:**
  - Signal fetched with the User-Agent `WhatsApp/2`.
  - Reddit fetched the page with `redditbot/1.0` and the image with the Reddit Android app.
  - iMessage fetched with `NetworkingExtension ... iOS/27.2`.
- **Threads** fetched with `facebookexternalhit/1.1`, the same crawler as Facebook.
- **Gmail** loaded the images through `GoogleImageProxy` (ggpht.com). Through this proxy the transparent WebP was flattened onto black with jagged edges, while the transparent PNG and AVIF kept their transparency. [caniemail](https://www.caniemail.com/features/image-webp/) notes that Gmail "Converts file to jpg" for WebP.
- **Outlook** loaded the images directly from an Android WebView, with no proxy.

## Notes on the method

- **The X composer preview is not reliable.** In the composer, only the JPEG card appeared, because `jpg.jpg` was the only image X had already fetched. For new PNG and WebP URLs, `Twitterbot` fetched the page in the composer but did not request the image. It requested the image only after the post was published, and the card then appeared.
- **Threads, Reddit, LinkedIn and Bluesky were tested in the composer.** Reddit shows "A copy of the linked media will be posted to Reddit". That copy was not tested, because nothing was posted.
- **The Outlook app removed the red background** of the email and showed its own black background. Transparency there is judged from the area around the circle matching that background.
- **Earlier reports of AVIF failing on WhatsApp and Discord were not reproduced.** Both showed AVIF images.
- **Not tested:** classic Outlook for Windows, Pinterest, Mastodon, Microsoft Teams, Google Discover, the Slack RSS app and newsletter tools.

## Official format support

From each service's documentation, checked 2026-11-20:

- **Facebook:** `og:image:type` is "One of `image/jpeg`, `image/gif` or `image/png`" ([docs](https://developers.facebook.com/docs/sharing/webmasters)). WebP and AVIF still worked in the Sharing Debugger.
- **LinkedIn:** "File types: JPG, PNG, or GIF" ([help](https://www.linkedin.com/help/linkedin/answer/a521928)). WebP still worked.
- **Google Search:** "BMP, GIF, JPEG, PNG, WebP, SVG, and AVIF" ([docs](https://developers.google.com/search/docs/appearance/google-images)).
- **Slack, WhatsApp, iMessage:** no format is documented.
