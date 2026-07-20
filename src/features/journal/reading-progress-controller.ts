const progressCleanups = new Map<HTMLElement, () => void>();
let lifecycleBound = false;

function initializeProgress(progressRoot: HTMLElement) {
  if (progressCleanups.has(progressRoot)) return;
  const article = document.querySelector<HTMLElement>('.article-shell');
  const progress = progressRoot.querySelector<HTMLElement>('span');
  if (!article || !progress) return;

  const controller = new AbortController();
  const { signal } = controller;
  let frame = 0;

  const update = () => {
    frame = 0;
    const start = article.offsetTop;
    const total = Math.max(1, article.offsetHeight - innerHeight);
    const value = Math.max(0, Math.min(1, (scrollY - start) / total));
    progress.style.transform = `scaleX(${value})`;
    progressRoot.setAttribute('aria-valuenow', String(Math.round(value * 100)));
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  addEventListener('scroll', schedule, { passive: true, signal });
  addEventListener('resize', schedule, { passive: true, signal });
  update();

  const cleanup = () => {
    controller.abort();
    if (frame) cancelAnimationFrame(frame);
    progressCleanups.delete(progressRoot);
  };
  progressCleanups.set(progressRoot, cleanup);
}

function cleanupProgress() {
  progressCleanups.forEach((cleanup) => cleanup());
}

export function initializeReadingProgress() {
  document.querySelectorAll<HTMLElement>('[data-reading-progress]').forEach(initializeProgress);
  if (lifecycleBound) return;
  document.addEventListener('astro:page-load', () => {
    document.querySelectorAll<HTMLElement>('[data-reading-progress]').forEach(initializeProgress);
  });
  document.addEventListener('astro:before-swap', cleanupProgress);
  window.addEventListener('pagehide', cleanupProgress);
  window.addEventListener('pageshow', () => {
    document.querySelectorAll<HTMLElement>('[data-reading-progress]').forEach(initializeProgress);
  });
  lifecycleBound = true;
}
