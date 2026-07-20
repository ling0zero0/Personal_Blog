const introCleanups = new Map<HTMLElement, () => void>();
let lifecycleBound = false;

function initializeIntro(hero: HTMLElement) {
  if (introCleanups.has(hero)) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const controller = new AbortController();
  const { signal } = controller;
  let observer: IntersectionObserver | undefined;

  const observe = () => {
    observer?.disconnect();
    if (reducedMotion.matches) {
      hero.classList.add('is-intro-visible');
      return;
    }
    observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        hero.classList.add('is-intro-visible');
        return;
      }
      const bounds = entry.boundingClientRect;
      if (bounds.bottom < 0 || bounds.top > innerHeight) hero.classList.remove('is-intro-visible');
    }, { threshold: 0.12 });
    observer.observe(hero);
  };

  reducedMotion.addEventListener('change', observe, { signal });
  observe();

  const cleanup = () => {
    controller.abort();
    observer?.disconnect();
    introCleanups.delete(hero);
  };
  introCleanups.set(hero, cleanup);
}

function cleanupIntros() {
  introCleanups.forEach((cleanup) => cleanup());
}

export function initializeProjectIntros() {
  document.querySelectorAll<HTMLElement>('[data-project-intro]').forEach(initializeIntro);
  if (lifecycleBound) return;
  document.addEventListener('astro:page-load', () => {
    document.querySelectorAll<HTMLElement>('[data-project-intro]').forEach(initializeIntro);
  });
  document.addEventListener('astro:before-swap', cleanupIntros);
  window.addEventListener('pagehide', cleanupIntros);
  window.addEventListener('pageshow', () => {
    document.querySelectorAll<HTMLElement>('[data-project-intro]').forEach(initializeIntro);
  });
  lifecycleBound = true;
}
