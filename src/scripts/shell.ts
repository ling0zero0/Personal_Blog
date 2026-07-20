import { resolveIntent } from './intent';

type ShellLocale = 'zh' | 'en';

let audioContext: AudioContext | null = null;
let master: GainNode | null = null;
let preferredSoundEnabled = false;
let actualSoundPlaying = false;
let soundSuspendTimer = 0;
let activeCleanup: (() => void) | undefined;
let lifecycleBound = false;

const soundLabels = {
  zh: {
    enable: '开启环境声',
    disable: '关闭环境声',
    resume: '点击恢复环境声',
  },
  en: {
    enable: 'Enable ambience',
    disable: 'Mute ambience',
    resume: 'Click to resume ambience',
  },
} as const;

function getLocale(): ShellLocale {
  return document.body.dataset.lang === 'zh' ? 'zh' : 'en';
}

function readSoundPreference() {
  try {
    return localStorage.getItem('ambient-sound') === 'on';
  } catch {
    return false;
  }
}

function writeSoundPreference(enabled: boolean) {
  try {
    localStorage.setItem('ambient-sound', enabled ? 'on' : 'off');
  } catch {
    // Storage can be unavailable in hardened or private browsing contexts.
  }
}

function updateSoundButton(button: HTMLButtonElement | null, lang = getLocale()) {
  if (!button) return;
  const state = actualSoundPlaying ? 'playing' : preferredSoundEnabled ? 'remembered' : 'off';
  const label = actualSoundPlaying
    ? soundLabels[lang].disable
    : preferredSoundEnabled
      ? soundLabels[lang].resume
      : soundLabels[lang].enable;

  button.dataset.soundState = state;
  if (preferredSoundEnabled && !actualSoundPlaying) button.dataset.remembered = 'true';
  else delete button.dataset.remembered;
  button.setAttribute('aria-pressed', String(actualSoundPlaying));
  button.setAttribute('aria-label', label);
  button.title = label;
}

function createAmbientGraph() {
  audioContext = new AudioContext();
  master = audioContext.createGain();
  master.gain.value = 0.0001;
  master.connect(audioContext.destination);

  [55, 82.5, 110].forEach((frequency, index) => {
    const oscillator = audioContext!.createOscillator();
    const gain = audioContext!.createGain();
    oscillator.type = index === 0 ? 'sine' : 'triangle';
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.018 / (index + 1);
    oscillator.connect(gain).connect(master!);
    oscillator.start();
  });
}

async function startAmbientSound(button: HTMLButtonElement | null) {
  preferredSoundEnabled = true;
  writeSoundPreference(true);
  updateSoundButton(button);
  window.clearTimeout(soundSuspendTimer);

  try {
    if (!audioContext || audioContext.state === 'closed' || !master) createAmbientGraph();
    await audioContext!.resume();
    const now = audioContext!.currentTime;
    master!.gain.cancelScheduledValues(now);
    master!.gain.setValueAtTime(Math.max(master!.gain.value, 0.0001), now);
    master!.gain.exponentialRampToValueAtTime(0.4, now + 0.8);
    actualSoundPlaying = audioContext!.state === 'running';
  } catch {
    actualSoundPlaying = false;
  }

  updateSoundButton(button);
}

function stopAmbientSound(button: HTMLButtonElement | null) {
  preferredSoundEnabled = false;
  actualSoundPlaying = false;
  writeSoundPreference(false);
  window.clearTimeout(soundSuspendTimer);

  if (audioContext && master && audioContext.state !== 'closed') {
    const now = audioContext.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    soundSuspendTimer = window.setTimeout(() => {
      if (!actualSoundPlaying) void audioContext?.suspend();
    }, 650);
  }

  updateSoundButton(button);
}

function setupShell() {
  const controller = new AbortController();
  const { signal } = controller;
  const lang = getLocale();
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const delayedActions = new Set<number>();
  let revealObserver: IntersectionObserver | undefined;
  let pointerFrame = 0;
  let scrollFrame = 0;
  let navigating = false;

  const menuButton = document.querySelector<HTMLButtonElement>('.mobile-menu-button');
  const menu = document.querySelector<HTMLElement>('.mobile-menu');
  const setMenuOpen = (open: boolean) => {
    if (menu) menu.dataset.open = String(open);
    menuButton?.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('no-scroll', open);
    const menuIcon = menuButton?.querySelector<HTMLElement>('.menu-icon');
    const closeIcon = menuButton?.querySelector<HTMLElement>('.close-icon');
    if (menuIcon) menuIcon.style.display = open ? 'none' : '';
    if (closeIcon) closeIcon.style.display = open ? '' : 'none';
  };
  menuButton?.addEventListener('click', () => setMenuOpen(menu?.dataset.open !== 'true'), { signal });

  const dialog = document.querySelector<HTMLDialogElement>('#command-dialog');
  const input = document.querySelector<HTMLInputElement>('#command-input');
  const response = document.querySelector<HTMLElement>('.command-response');
  const openDialog = () => {
    if (!dialog?.open) dialog?.showModal();
    requestAnimationFrame(() => input?.focus());
  };
  document.querySelectorAll<HTMLElement>('.command-open').forEach((button) => {
    button.addEventListener('click', openDialog, { signal });
  });
  dialog?.querySelector<HTMLButtonElement>('.command-close')?.addEventListener('click', () => dialog.close(), { signal });
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openDialog();
    }
  }, { signal });

  const curtain = document.querySelector<HTMLElement>('.transition-curtain');
  const darkCurtain = curtain?.querySelector<HTMLElement>('.curtain-dark');
  const accentCurtain = curtain?.querySelector<HTMLElement>('.curtain-accent');
  const curtainLabel = curtain?.querySelector<HTMLElement>('span');
  const resetCurtain = () => {
    curtain?.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
    if (curtain) curtain.style.visibility = 'hidden';
  };
  resetCurtain();

  const navigate = async (href: string) => {
    if (navigating) return;
    navigating = true;
    if (!curtain || !darkCurtain || !accentCurtain || !curtainLabel || reduceMotion || !('animate' in curtain)) {
      location.assign(href);
      return;
    }

    curtain.style.visibility = 'visible';
    const animations = [
      darkCurtain.animate(
        [
          { transform: 'translateX(-120%) skewX(-8deg)' },
          { transform: 'translateX(0) skewX(-8deg)' },
        ],
        { duration: 420, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'forwards' },
      ),
      accentCurtain.animate(
        [
          { transform: 'translateX(120%) skewX(-8deg)' },
          { transform: 'translateX(0) skewX(-8deg)' },
        ],
        { duration: 360, delay: 60, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'forwards' },
      ),
      curtainLabel.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 120, delay: 240, fill: 'forwards' },
      ),
    ];

    await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
    location.assign(href);
  };

  const execute = (value: string) => {
    const result = resolveIntent(value, lang);
    if (response) response.textContent = result.message;
    if (!result.target) return;
    const timeout = window.setTimeout(() => {
      delayedActions.delete(timeout);
      dialog?.close();
      void navigate(result.target!);
    }, 420);
    delayedActions.add(timeout);
  };
  document.querySelectorAll<HTMLButtonElement>('[data-command]').forEach((button) => {
    button.addEventListener('click', () => execute(button.dataset.command || ''), { signal });
  });
  dialog?.querySelector<HTMLFormElement>('.command-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    execute(input?.value || '');
  }, { signal });

  document.querySelectorAll<HTMLAnchorElement>('a[href^="/"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (
        event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
        || link.target
        || link.hasAttribute('download')
      ) return;

      const destination = new URL(link.href, location.href);
      if (destination.origin !== location.origin) return;
      if (
        destination.pathname === location.pathname
        && destination.search === location.search
      ) return;

      event.preventDefault();
      void navigate(`${destination.pathname}${destination.search}${destination.hash}`);
    }, { signal });
  });

  const reveals = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
  if (reduceMotion) reveals.forEach((element) => element.classList.add('is-visible'));
  else {
    revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      const element = entry.target as HTMLElement;
      if (entry.isIntersecting) {
        element.classList.add('is-visible');
        return;
      }
      const bounds = entry.boundingClientRect;
      if (bounds.bottom < 0 || bounds.top > innerHeight) element.classList.remove('is-visible');
    }), { threshold: 0.16, rootMargin: '-4% 0px -8% 0px' });
    reveals.forEach((element) => revealObserver?.observe(element));

    const finePointer = matchMedia('(pointer: fine)');
    addEventListener('pointermove', (event) => {
      if (!finePointer.matches || pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--pointer-x', ((event.clientX / innerWidth) - 0.5).toFixed(3));
        document.documentElement.style.setProperty('--pointer-y', ((event.clientY / innerHeight) - 0.5).toFixed(3));
        pointerFrame = 0;
      });
    }, { passive: true, signal });

    const updateScrollScene = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      document.documentElement.style.setProperty('--scroll-shift', `${Math.min(54, scrollY * 0.025)}px`);
      document.documentElement.style.setProperty('--page-progress', (scrollY / max).toFixed(4));
      scrollFrame = 0;
    };
    addEventListener('scroll', () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollScene);
    }, { passive: true, signal });
    updateScrollScene();
  }

  const soundButton = document.querySelector<HTMLButtonElement>('#sound-toggle');
  preferredSoundEnabled = readSoundPreference();
  actualSoundPlaying = Boolean(actualSoundPlaying && audioContext?.state === 'running');
  updateSoundButton(soundButton, lang);
  soundButton?.addEventListener('click', () => {
    if (actualSoundPlaying) stopAmbientSound(soundButton);
    else void startAmbientSound(soundButton);
  }, { signal });

  return () => {
    controller.abort();
    delayedActions.forEach((timeout) => window.clearTimeout(timeout));
    delayedActions.clear();
    revealObserver?.disconnect();
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    if (menu?.dataset.open === 'true') setMenuOpen(false);
    if (dialog?.open) dialog.close();
    resetCurtain();
  };
}

function initializeShell() {
  activeCleanup?.();
  activeCleanup = setupShell();
}

function cleanupShell() {
  activeCleanup?.();
  activeCleanup = undefined;
}

export function initShell() {
  initializeShell();
  if (!lifecycleBound) {
    document.addEventListener('astro:page-load', initializeShell);
    document.addEventListener('astro:before-swap', cleanupShell);
    window.addEventListener('pagehide', cleanupShell);
    window.addEventListener('pageshow', initializeShell);
    lifecycleBound = true;
  }
  return cleanupShell;
}
