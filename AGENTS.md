# Research lab

Reproducible experiments. See [README.md](README.md) for the list.

## Layout

- Each top-level folder is one experiment and one npm workspace, with its own `package.json`, `README.md`, `scripts/` and `results/`. A new experiment is a new folder added to `workspaces` in the root `package.json`.
- An experiment with a site keeps it in `site/`. GitHub Pages serves the repository root (`.nojekyll` is at the root), so the site is at `https://b1ink0.github.io/research-lab/<experiment>/site/`.
- An experiment that needs Docker has its own `compose.yml` with its own project name.
- `notes/` holds local drafts. Git-ignored.

## Commands

- `npm install` at the root installs every workspace.
- `npm run <script> -w <experiment>` runs an experiment's script. The scripts are listed in its README.
- `npm run typecheck` checks the TypeScript of every experiment.

## Conventions

- Scripts are TypeScript run directly by Node 22.18+ (type stripping). No build step. Use only erasable syntax, and import local files with the `.ts` extension.
- No Python or shell scripts. PHP only where code has to run inside WordPress or a pinned PHP image.
- Pin everything that can change a result: Docker images by digest, plugin versions in the scripts. Encoder builds and plugin versions change the output.
- Commit test inputs as files instead of generating them, so every run uses the same bytes.
- Do not edit generated results or generated site files by hand. Change the script and run it again. Files written by hand are named as such in the experiment README.
- Every claim in a README is backed by a file in `results/` or a source link to the tested version. Prefer GitHub links at a release tag over Trac when the code is on GitHub.

## wp-image-fallbacks

- `npm run audit -w wp-image-fallbacks` runs every step. Run `npm run down -w wp-image-fallbacks` before a run with changed versions.
- Modern Image Formats is kept out of `PLUGINS` in `scripts/run.ts`, because the plugin switch deactivates every entry of `PLUGINS`.

## link-preview-formats

- `results/shares.md` is the manual share test and is written by hand.
- The images in `site/img/` are the exact files that were tested. Only make them with `npm run images -w link-preview-formats`, which uses the GD of the pinned image in `compose.yml`. Another image or encoder writes different bytes.
