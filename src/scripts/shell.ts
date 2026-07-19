import gsap from 'gsap';
import { resolveIntent } from './intent';

let audioContext: AudioContext | null = null;
let master: GainNode | null = null;
let soundEnabled = false;

function setSound(enabled: boolean) {
  soundEnabled = enabled;
  localStorage.setItem('ambient-sound', enabled ? 'on' : 'off');
  const button = document.querySelector<HTMLButtonElement>('#sound-toggle');
  const lang = document.body.dataset.lang === 'zh' ? 'zh' : 'en';
  const labels = enabled ? (lang === 'zh' ? '关闭环境声' : 'Mute ambience') : (lang === 'zh' ? '开启环境声' : 'Enable ambience');
  button?.setAttribute('aria-label', labels);
  button?.setAttribute('title', labels);
  if (!enabled) { master?.gain.exponentialRampToValueAtTime(0.0001, (audioContext?.currentTime || 0) + .6); return; }
  if (!audioContext) {
    audioContext = new AudioContext();
    master = audioContext.createGain();
    master.gain.value = .0001;
    master.connect(audioContext.destination);
    [55, 82.5, 110].forEach((freq, i) => {
      const osc = audioContext!.createOscillator();
      const gain = audioContext!.createGain();
      osc.type = i === 0 ? 'sine' : 'triangle'; osc.frequency.value = freq; gain.gain.value = .018 / (i + 1);
      osc.connect(gain).connect(master!); osc.start();
    });
  }
  audioContext.resume();
  master?.gain.exponentialRampToValueAtTime(.4, audioContext.currentTime + .8);
}

export function initShell() {
  const lang = document.body.dataset.lang === 'zh' ? 'zh' : 'en';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const menuButton = document.querySelector<HTMLButtonElement>('.mobile-menu-button');
  const menu = document.querySelector<HTMLElement>('.mobile-menu');
  menuButton?.addEventListener('click', () => {
    const open = menu?.dataset.open !== 'true';
    if (menu) menu.dataset.open = String(open);
    menuButton.setAttribute('aria-expanded', String(open)); document.body.classList.toggle('no-scroll', open);
    const menuIcon = menuButton.querySelector<HTMLElement>('.menu-icon'); const closeIcon = menuButton.querySelector<HTMLElement>('.close-icon');
    if (menuIcon) menuIcon.style.display = open ? 'none' : ''; if (closeIcon) closeIcon.style.display = open ? '' : 'none';
  });

  const dialog = document.querySelector<HTMLDialogElement>('#command-dialog');
  const input = document.querySelector<HTMLInputElement>('#command-input');
  const response = document.querySelector<HTMLElement>('.command-response');
  const openDialog = () => { if (!dialog?.open) dialog?.showModal(); requestAnimationFrame(() => input?.focus()); };
  document.querySelectorAll('.command-open').forEach((button) => button.addEventListener('click', openDialog));
  document.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openDialog(); } });
  const execute = (value: string) => {
    const result = resolveIntent(value, lang); if (response) response.textContent = result.message;
    if (result.type === 'scene') window.dispatchEvent(new CustomEvent('scene-command', { detail: result.value }));
    if (result.target) setTimeout(() => { dialog?.close(); navigate(result.target!); }, 420);
  };
  document.querySelectorAll<HTMLButtonElement>('[data-command]').forEach((button) => button.addEventListener('click', () => execute(button.dataset.command || '')));
  document.querySelector('.command-form')?.addEventListener('submit', (event) => { event.preventDefault(); execute(input?.value || ''); });

  const curtain = document.querySelector<HTMLElement>('.transition-curtain');
  const navigate = (href: string) => {
    if (!curtain || reduceMotion) { location.href = href; return; }
    curtain.style.visibility = 'visible';
    gsap.timeline()
      .fromTo('.curtain-dark', { xPercent: -120 }, { xPercent: 0, duration: .42, ease: 'power3.inOut' })
      .fromTo('.curtain-accent', { xPercent: 120 }, { xPercent: 0, duration: .36, ease: 'power3.inOut' }, .06)
      .to(curtain.querySelector('span'), { opacity: 1, duration: .12 }, .24)
      .add(() => { location.href = href; });
  };
  document.querySelectorAll<HTMLAnchorElement>('a[href^="/"]').forEach((link) => link.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || link.target || link.pathname === location.pathname) return;
    event.preventDefault(); navigate(link.pathname + link.search);
  }));
  if (curtain) gsap.set(curtain, { autoAlpha: 1 });

  const reveals = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
  if (reduceMotion) reveals.forEach((element) => element.classList.add('is-visible'));
  else {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      const element = entry.target as HTMLElement;
      if (entry.isIntersecting) {
        element.classList.add('is-visible');
        return;
      }
      // Reset only after the element has fully left the viewport to avoid threshold flicker.
      const bounds = entry.boundingClientRect;
      if (bounds.bottom < 0 || bounds.top > innerHeight) element.classList.remove('is-visible');
    }), { threshold: .16, rootMargin: '-4% 0px -8% 0px' });
    reveals.forEach((element) => observer.observe(element));

    let pointerFrame = 0;
    addEventListener('pointermove', (event) => {
      if (!matchMedia('(pointer: fine)').matches || pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--pointer-x', ((event.clientX / innerWidth) - .5).toFixed(3));
        document.documentElement.style.setProperty('--pointer-y', ((event.clientY / innerHeight) - .5).toFixed(3));
        pointerFrame = 0;
      });
    }, { passive: true });
    let scrollFrame = 0;
    const updateScrollScene = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      document.documentElement.style.setProperty('--scroll-shift', `${Math.min(54, scrollY * .025)}px`);
      document.documentElement.style.setProperty('--page-progress', (scrollY / max).toFixed(4));
      scrollFrame = 0;
    };
    addEventListener('scroll', () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollScene);
    }, { passive: true });
    updateScrollScene();
  }

  document.querySelector('#sound-toggle')?.addEventListener('click', () => setSound(!soundEnabled));
  soundEnabled = localStorage.getItem('ambient-sound') === 'on';
  const soundButton = document.querySelector<HTMLElement>('#sound-toggle');
  if (soundEnabled && soundButton) soundButton.dataset.remembered = 'true';
}
