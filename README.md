# Shen Ye Digital Space

An immersive bilingual personal site built with Astro, Three.js, GSAP, and Markdown content collections.

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
npm run test:e2e    # Desktop and mobile Playwright coverage
```

## Content

Blog posts live in `src/content/blog/zh` and `src/content/blog/en`. Each translation uses the same `translationKey` and provides title, description, date, tags, language, and draft metadata.

Profile and project copy is maintained in `src/data`. The initial AI navigator is local and deterministic; its adapter is in `src/scripts/intent.ts`, so a server-side model provider can replace it later without changing the command palette UI.

## Interaction and fallbacks

- Press `Ctrl+K` or `Cmd+K` to open the AI navigator.
- Ambient audio is off by default and its opt-in state is stored locally.
- The Three.js scene lowers pixel ratio and geometry density on mobile, pauses in hidden tabs, responds to pointer/touch/scroll, and provides a static fallback when WebGL is unavailable.
- `prefers-reduced-motion` removes nonessential animation and slows the ambient scene.
