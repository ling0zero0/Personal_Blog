export type PortalState = 'closed' | 'opening' | 'open' | 'closing';

const focusableSelector = 'a[href], button, input, select, textarea, [tabindex]';
const portalCleanups = new Map<HTMLElement, () => void>();
let lifecycleBound = false;

function setAvailable(root: HTMLElement, available: boolean) {
  root.setAttribute('aria-hidden', String(!available));
  root.toggleAttribute('inert', !available);

  const focusable = root.matches(focusableSelector)
    ? [root, ...root.querySelectorAll<HTMLElement>(focusableSelector)]
    : [...root.querySelectorAll<HTMLElement>(focusableSelector)];

  focusable.forEach((element) => {
    if (!available) {
      if (element.dataset.portalTabindex === undefined) {
        element.dataset.portalTabindex = element.getAttribute('tabindex') ?? '';
      }
      element.setAttribute('tabindex', '-1');
      return;
    }

    const previous = element.dataset.portalTabindex;
    if (previous === undefined) return;
    if (previous) element.setAttribute('tabindex', previous);
    else element.removeAttribute('tabindex');
    delete element.dataset.portalTabindex;
  });
}

function initializePortal(feature: HTMLElement) {
  if (portalCleanups.has(feature)) return;

  const portal = feature.querySelector<HTMLElement>('[data-home-portal]');
  const stage = portal?.querySelector<HTMLElement>('.portal-stage');
  const innerContent = portal?.querySelector<HTMLElement>('[data-portal-content]');
  const doorButtons = [...(portal?.querySelectorAll<HTMLElement>('[data-portal-door]') ?? [])];
  const openDoorsButton = portal?.querySelector<HTMLButtonElement>('[data-open-doors]');
  const archiveDialogs = [...feature.querySelectorAll<HTMLDialogElement>('[data-archive]')];
  if (!portal || !stage || !innerContent) return;

  const controller = new AbortController();
  const { signal } = controller;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const dialogTriggers = new WeakMap<HTMLDialogElement, HTMLElement>();
  let frame = 0;
  let progress = 0;
  let state: PortalState | undefined;
  let autoOpenAnimation: Animation | null = null;
  let autoTargetScroll = 0;
  let isAutoOpening = false;
  let focusInnerOnOpen = false;
  let bodyWasLocked = false;
  let suppressDialogFocusRestore = false;

  const firstInnerControl = () => [...innerContent.querySelectorAll<HTMLElement>(focusableSelector)]
    .find((element) => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden');

  const applyState = (nextState: PortalState) => {
    if (state === nextState && portal.dataset.state === nextState) return;
    state = nextState;
    portal.dataset.state = nextState;
    stage.dataset.state = nextState;

    const doorsAvailable = nextState === 'closed' && !reducedMotion.matches;
    const contentAvailable = nextState === 'open';
    doorButtons.forEach((door) => setAvailable(door, doorsAvailable));
    if (openDoorsButton) setAvailable(openDoorsButton, doorsAvailable);
    setAvailable(innerContent, contentAvailable);
    openDoorsButton?.classList.toggle('is-hidden', !doorsAvailable);

    const active = document.activeElement as HTMLElement | null;
    const activeBecameUnavailable = active && (
      doorButtons.some((door) => door.contains(active))
      || openDoorsButton?.contains(active)
      || (!contentAvailable && innerContent.contains(active))
    );
    if (activeBecameUnavailable) stage.focus({ preventScroll: true });

    if (contentAvailable && focusInnerOnOpen) {
      focusInnerOnOpen = false;
      requestAnimationFrame(() => firstInnerControl()?.focus({ preventScroll: true }));
    }
  };

  const deriveState = (nextProgress: number): PortalState => {
    if (nextProgress <= 0.02) return 'closed';
    if (nextProgress >= 0.98) return 'open';
    return nextProgress >= progress ? 'opening' : 'closing';
  };

  const applyProgress = (nextProgress: number, forcedState?: PortalState) => {
    const normalized = Math.min(1, Math.max(0, nextProgress));
    const nextState = forcedState ?? deriveState(normalized);
    progress = normalized;
    stage.style.setProperty('--open', normalized.toFixed(4));
    applyState(nextState);
  };

  const getScrollProgress = () => {
    const bounds = portal.getBoundingClientRect();
    const distance = Math.max(1, portal.offsetHeight - innerHeight);
    const rawProgress = Math.min(1, Math.max(0, -bounds.top / distance));
    const openStart = 0.18;
    const openEnd = 0.60;
    return Math.min(1, Math.max(0, (rawProgress - openStart) / (openEnd - openStart)));
  };

  const jumpTo = (top: number) => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    scrollTo(0, top);
    root.style.scrollBehavior = previousBehavior;
  };

  const updatePortal = () => {
    frame = 0;
    if (reducedMotion.matches || isAutoOpening) return;
    applyProgress(getScrollProgress());
  };

  const completeAutoOpen = () => {
    stage.style.setProperty('--open', '1');
    autoOpenAnimation?.cancel();
    autoOpenAnimation = null;
    isAutoOpening = false;
    portal.classList.remove('is-auto-opening');
    applyProgress(1, 'open');
  };

  const cancelAutoOpenToScroll = () => {
    autoOpenAnimation?.cancel();
    autoOpenAnimation = null;
    isAutoOpening = false;
    focusInnerOnOpen = false;
    portal.classList.remove('is-auto-opening');
    updatePortal();
  };

  addEventListener('scroll', () => {
    if (isAutoOpening) {
      if (Math.abs(scrollY - autoTargetScroll) > 4) cancelAutoOpenToScroll();
      return;
    }
    if (!frame) frame = requestAnimationFrame(updatePortal);
  }, { passive: true, signal });
  addEventListener('resize', updatePortal, { passive: true, signal });
  addEventListener('wheel', () => {
    if (isAutoOpening) cancelAutoOpenToScroll();
  }, { passive: true, signal });
  addEventListener('touchstart', () => {
    if (isAutoOpening) cancelAutoOpenToScroll();
  }, { passive: true, signal });

  openDoorsButton?.addEventListener('click', () => {
    if (autoOpenAnimation) return;
    if (reducedMotion.matches) {
      focusInnerOnOpen = true;
      applyProgress(1, 'open');
      return;
    }

    const distance = Math.max(1, portal.offsetHeight - innerHeight);
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const target = Math.min(maxScroll, portal.offsetTop + distance * 0.74);
    const current = getComputedStyle(stage).getPropertyValue('--open').trim() || '0';
    progress = Number.parseFloat(current) || 0;
    isAutoOpening = true;
    focusInnerOnOpen = true;
    autoTargetScroll = target;
    portal.classList.add('is-auto-opening');
    applyState('opening');
    jumpTo(target);
    autoOpenAnimation = stage.animate(
      [{ '--open': current }, { '--open': '1' }],
      { duration: 2400, easing: 'cubic-bezier(.16,.76,.18,1)', fill: 'forwards' },
    );
    autoOpenAnimation.addEventListener('finish', completeAutoOpen, { once: true, signal });
  }, { signal });

  const openArchive = (trigger: HTMLElement) => {
    const kind = trigger.dataset.openArchive;
    const dialog = archiveDialogs.find((item) => item.dataset.archive === kind);
    if (!dialog || dialog.open) return;
    dialogTriggers.set(dialog, trigger);
    if (!archiveDialogs.some((item) => item.open)) bodyWasLocked = document.body.classList.contains('no-scroll');
    dialog.showModal();
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => dialog.querySelector<HTMLButtonElement>('[data-close-archive]')?.focus());
  };

  feature.querySelectorAll<HTMLElement>('[data-open-archive]').forEach((trigger) => {
    trigger.addEventListener('click', () => openArchive(trigger), { signal });
  });
  feature.querySelectorAll<HTMLButtonElement>('[data-close-archive]').forEach((button) => {
    button.addEventListener('click', () => button.closest<HTMLDialogElement>('dialog')?.close(), { signal });
  });
  archiveDialogs.forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    }, { signal });
    dialog.addEventListener('close', () => {
      if (!archiveDialogs.some((item) => item.open) && !bodyWasLocked) document.body.classList.remove('no-scroll');
      if (suppressDialogFocusRestore) return;
      const trigger = dialogTriggers.get(dialog);
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    }, { signal });
  });

  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) {
      autoOpenAnimation?.cancel();
      autoOpenAnimation = null;
      isAutoOpening = false;
      portal.classList.remove('is-auto-opening');
      applyProgress(1, 'open');
      return;
    }
    updatePortal();
  }, { signal });

  if (reducedMotion.matches) applyProgress(1, 'open');
  else updatePortal();

  const cleanup = () => {
    suppressDialogFocusRestore = true;
    controller.abort();
    if (frame) cancelAnimationFrame(frame);
    autoOpenAnimation?.cancel();
    archiveDialogs.forEach((dialog) => {
      if (dialog.open) dialog.close();
    });
    if (!bodyWasLocked) document.body.classList.remove('no-scroll');
    portalCleanups.delete(feature);
  };
  portalCleanups.set(feature, cleanup);
}

export function initializeHomePortals() {
  document.querySelectorAll<HTMLElement>('[data-home-portal-root]').forEach(initializePortal);
  if (lifecycleBound) return;
  document.addEventListener('astro:page-load', () => {
    document.querySelectorAll<HTMLElement>('[data-home-portal-root]').forEach(initializePortal);
  });
  document.addEventListener('astro:before-swap', () => {
    portalCleanups.forEach((cleanup) => cleanup());
  });
  window.addEventListener('pagehide', () => {
    portalCleanups.forEach((cleanup) => cleanup());
  });
  window.addEventListener('pageshow', () => {
    document.querySelectorAll<HTMLElement>('[data-home-portal-root]').forEach(initializePortal);
  });
  lifecycleBound = true;
}
