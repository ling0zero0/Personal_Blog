# 花辞树 Digital Space



An immersive bilingual personal site built with Astro, native TypeScript interactions, CSS/WAAPI animation, and Markdown content collections.

## Local development

```powershell
npm install
npm run dev
```

The development server defaults to `http://localhost:4321`. Chinese pages use `/zh/`; English pages use `/en/`.

On Windows, double-click `start.bat` to start Astro in its built-in background mode on port `4321` and open the site. Double-click `stop.bat` to stop the background server registered for this project.

## Commands

```powershell
npm run check       # Astro and TypeScript diagnostics
npm run build       # Type-check and static production build
npm run preview     # Preview the production build
npm run project:add # Validate and add a project from an intake JSON file
npm run project:check # Validate all project manifests and images
npm run test:e2e    # Chromium desktop/mobile plus core WebKit and axe coverage
```

## Content

Blog posts live in `src/content/blog/zh` and `src/content/blog/en`. Translations share a `translationKey`; their slugs may differ, and language links/hreflang metadata are generated from the validated translation index in `src/data/blog.ts`.

Projects live in `src/content/projects`, with one folder containing the manifest and optimized images for each project. See [docs/adding-projects.md](docs/adding-projects.md) for the repeatable addition workflow.

Locale, route, site, and project validation rules live in `src/config`. Profile copy remains in `src/data`. The command navigator is local and deterministic; its adapter is in `src/scripts/intent.ts`, so a server-side model provider can replace it later without changing the command palette UI.

## Interaction and fallbacks

- Press `Ctrl+K` or `Cmd+K` to open the AI navigator.
- Ambient audio is off by default. A remembered preference still requires a fresh click after reload because browsers do not permit automatic playback.
- The home portal keeps visual, keyboard, ARIA, and dialog focus states synchronized.
- `prefers-reduced-motion` presents the portal's final open state while keeping both archives and all navigation available.
