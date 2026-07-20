const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobileViewport = matchMedia('(max-width: 720px)');
const carouselCleanups = new Map<HTMLElement, () => void>();
let lifecycleBound = false;

function initializeCarousel(carousel: HTMLElement) {
  if (carouselCleanups.has(carousel)) return;

  const controller = new AbortController();
  const { signal } = controller;
  const slides = Array.from(carousel.querySelectorAll<HTMLElement>('[data-carousel-slide]'));
  const previous = carousel.querySelector<HTMLButtonElement>('[data-carousel-previous]');
  const next = carousel.querySelector<HTMLButtonElement>('[data-carousel-next]');
  const toggle = carousel.querySelector<HTMLButtonElement>('[data-carousel-toggle]');
  const current = carousel.querySelector<HTMLElement>('[data-carousel-current]');
  const wantsAutoplay = carousel.dataset.autoplay === 'true';
  const connection = (navigator as Navigator & {
    connection?: EventTarget & { saveData?: boolean; effectiveType?: string };
  }).connection;
  const constrainedNetwork = Boolean(
    connection?.saveData || connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g',
  );
  const conserveResources = constrainedNetwork || mobileViewport.matches;
  let activeIndex = 0;
  let userPaused = reducedMotion.matches || conserveResources || !wantsAutoplay;
  let hovering = false;
  let focused = false;
  let inViewport = false;
  let prefetched = false;
  let backgroundLoadingReady = false;
  let pointerStartX: number | null = null;
  let timer: number | undefined;
  let idleHandle: number | undefined;
  let idleTimeoutHandle: ReturnType<typeof setTimeout> | undefined;
  let lcpTimer: number | undefined;
  let lcpObserver: PerformanceObserver | undefined;
  let transitionToken = 0;

  const loadSlide = (requestedIndex: number) => {
    const slide = slides[(requestedIndex + slides.length) % slides.length];
    const existing = slide.querySelector<HTMLImageElement>('img');
    if (existing) return existing;
    const template = slide.querySelector<HTMLTemplateElement>('[data-carousel-image]');
    if (!template) return null;
    template.replaceWith(template.content.cloneNode(true));
    return slide.querySelector<HTMLImageElement>('img');
  };

  const prepareSlide = async (requestedIndex: number) => {
    const image = loadSlide(requestedIndex);
    if (!image || (image.complete && image.naturalWidth > 0)) return;
    try {
      await image.decode();
    } catch {
      if (image.complete) return;
      await new Promise<void>((resolve) => {
        image.addEventListener('load', () => resolve(), { once: true, signal });
        image.addEventListener('error', () => resolve(), { once: true, signal });
      });
    }
  };

  const updatePauseState = () => {
    carousel.dataset.paused = String(userPaused);
    if (!toggle) return;
    const label = userPaused ? carousel.dataset.playLabel : carousel.dataset.pauseLabel;
    if (label) {
      toggle.setAttribute('aria-label', label);
      toggle.title = label;
    }
  };

  const schedule = () => {
    window.clearTimeout(timer);
    if (!wantsAutoplay || userPaused || hovering || focused || document.hidden || !inViewport || !backgroundLoadingReady) return;
    timer = window.setTimeout(() => {
      void showSlide(activeIndex + 1);
    }, 4000);
  };

  const showSlide = async (requestedIndex: number, fromUser = false) => {
    const nextIndex = (requestedIndex + slides.length) % slides.length;
    const token = ++transitionToken;
    await prepareSlide(nextIndex);
    if (token !== transitionToken || !carousel.isConnected) return;

    activeIndex = nextIndex;
    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeIndex;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
    });
    if (current) current.textContent = String(activeIndex + 1).padStart(2, '0');
    if (fromUser) userPaused = true;
    updatePauseState();
    schedule();

    // Keep the next poster ready while the current decoded image remains visible.
    void prepareSlide(activeIndex + 1);
  };

  const queuePrefetch = () => {
    if (prefetched || conserveResources || !inViewport) return;
    prefetched = true;
    if (backgroundLoadingReady) {
      void prepareSlide(1).then(schedule);
      return;
    }

    const loadWhenIdle = () => {
      lcpObserver?.disconnect();
      window.clearTimeout(lcpTimer);
      const load = () => {
        idleHandle = undefined;
        idleTimeoutHandle = undefined;
        if (!carousel.isConnected) return;
        backgroundLoadingReady = true;
        if (inViewport) void prepareSlide(1).then(schedule);
        else prefetched = false;
      };
      if ('requestIdleCallback' in window) {
        idleHandle = window.requestIdleCallback(load, { timeout: 2000 });
      } else {
        idleTimeoutHandle = setTimeout(load, 200);
      }
    };

    const waitForLcp = () => {
      if (!('PerformanceObserver' in window)) {
        loadWhenIdle();
        return;
      }
      try {
        lcpObserver = new PerformanceObserver((list) => {
          if (list.getEntries().length) loadWhenIdle();
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        lcpTimer = window.setTimeout(loadWhenIdle, 1500);
      } catch {
        loadWhenIdle();
      }
    };

    if (document.readyState === 'complete') waitForLcp();
    else window.addEventListener('load', waitForLcp, { once: true, signal });
  };

  const intersectionObserver = new IntersectionObserver(([entry]) => {
    inViewport = entry.isIntersecting;
    if (inViewport) queuePrefetch();
    schedule();
  }, { rootMargin: '120px 0px' });
  intersectionObserver.observe(carousel);

  previous?.addEventListener('click', () => void showSlide(activeIndex - 1, true), { signal });
  next?.addEventListener('click', () => void showSlide(activeIndex + 1, true), { signal });
  toggle?.addEventListener('click', () => {
    userPaused = !userPaused;
    if (!userPaused) backgroundLoadingReady = true;
    updatePauseState();
    schedule();
  }, { signal });
  carousel.addEventListener('pointerenter', () => {
    hovering = true;
    schedule();
  }, { signal });
  carousel.addEventListener('pointerleave', () => {
    hovering = false;
    pointerStartX = null;
    schedule();
  }, { signal });
  carousel.addEventListener('focusin', () => {
    focused = true;
    schedule();
  }, { signal });
  carousel.addEventListener('focusout', (event) => {
    focused = carousel.contains(event.relatedTarget as Node | null);
    schedule();
  }, { signal });
  carousel.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse') pointerStartX = event.clientX;
  }, { signal });
  carousel.addEventListener('pointerup', (event) => {
    if (pointerStartX === null) return;
    const distance = event.clientX - pointerStartX;
    pointerStartX = null;
    if (Math.abs(distance) < 48) return;
    void showSlide(activeIndex + (distance < 0 ? 1 : -1), true);
  }, { signal });
  carousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      void showSlide(activeIndex - 1, true);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      void showSlide(activeIndex + 1, true);
    }
  }, { signal });
  document.addEventListener('visibilitychange', schedule, { signal });
  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) userPaused = true;
    updatePauseState();
    schedule();
  }, { signal });

  updatePauseState();
  schedule();

  const cleanup = () => {
    transitionToken += 1;
    window.clearTimeout(timer);
    window.clearTimeout(lcpTimer);
    if (idleHandle !== undefined && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleHandle);
    if (idleTimeoutHandle !== undefined) clearTimeout(idleTimeoutHandle);
    lcpObserver?.disconnect();
    intersectionObserver.disconnect();
    controller.abort();
    carouselCleanups.delete(carousel);
  };
  carouselCleanups.set(carousel, cleanup);
}

function cleanupCarousels() {
  carouselCleanups.forEach((cleanup) => cleanup());
}

export function initializeProjectCarousels() {
  document.querySelectorAll<HTMLElement>('[data-project-carousel]').forEach(initializeCarousel);
  if (lifecycleBound) return;
  document.addEventListener('astro:page-load', () => {
    document.querySelectorAll<HTMLElement>('[data-project-carousel]').forEach(initializeCarousel);
  });
  document.addEventListener('astro:before-swap', cleanupCarousels);
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) cleanupCarousels();
  });
  window.addEventListener('pageshow', () => {
    document.querySelectorAll<HTMLElement>('[data-project-carousel]').forEach(initializeCarousel);
  });
  lifecycleBound = true;
}
