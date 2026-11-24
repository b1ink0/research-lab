# Research lab

Reproducible experiments. Each folder is one experiment with its own README, scripts and results.

| Experiment | Question | Related |
| --- | --- | --- |
| [`wp-image-fallbacks`](wp-image-fallbacks) | What do SEO plugins and WordPress core output when Modern Image Formats converts uploads to WebP or AVIF? | [WordPress/performance#2760](https://github.com/WordPress/performance/issues/2760) |
| [`link-preview-formats`](link-preview-formats) | Which apps show JPEG, PNG, WebP and AVIF images in link previews and emails? | [WordPress/performance#2760](https://github.com/WordPress/performance/issues/2760) |

## Setup

Needs [Node.js](https://nodejs.org) 22.18 or later. The scripts are TypeScript and run directly with Node, with no build step. Some experiments also need [Docker](https://docs.docker.com/get-docker/) with Compose.

```sh
npm install
```

Each experiment is an npm workspace. Run its scripts from the root with `npm run <script> -w <experiment>`, as listed in its README.

GitHub Pages serves the repository root, so an experiment's site is at `https://b1ink0.github.io/research-lab/<experiment>/site/`.

## License

The scripts and pages are released under the MIT license, see [LICENSE](LICENSE). Third-party files keep the licenses listed in the README of their experiment.

🤖 Made with [Claude Code](https://claude.com/claude-code)
