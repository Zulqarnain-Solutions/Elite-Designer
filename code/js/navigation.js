/* ==========================================================================
   navigation.js — glass nav state, active links, anchors, mobile menu,
   scroll progress and back-to-top
   ========================================================================== */
import { $, $$, lockScroll, scrollToTarget } from './utils.js';

export function initNavigation() {
  const nav = $('[data-nav]');
  const bar = $('.scroll-progress__bar');
  const toTop = $('[data-to-top]');
  const links = $$('[data-nav-link]');
  const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const menu = $('[data-menu]');
  const toggle = $('[data-menu-toggle]');

  /* ---- Scroll state (one rAF-throttled reader for everything) ---- */
  let ticking = false;
  const read = () => {
    ticking = false;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle('is-scrolled', y > 40);
    toTop.classList.toggle('is-visible', y > 700 && y < max - 320);   // steps aside for the footer form
    bar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;

    const probe = y + window.innerHeight * 0.4;
    let current = sections[0];
    sections.forEach((s) => { if (s.getBoundingClientRect().top + y <= probe) current = s; });
    links.forEach((a) => {
      const on = a.getAttribute('href') === `#${current.id}`;
      a.classList.toggle('is-active', on);
      on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
    });
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(read); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  read();

  /* ---- Mobile menu ---- */
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    lockScroll('menu', open);
  };
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  $$('[data-menu-close]', menu).forEach((b) => b.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false); });
  window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => e.matches && setMenu(false));

  /* ---- Smooth in-page anchors ---- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id.length > 1 ? $(id) : null;
    if (!target) return;
    e.preventDefault();
    if (menu.classList.contains('is-open')) setMenu(false);
    scrollToTarget(target, { offset: id === '#home' ? 0 : -20 });
    history.replaceState(null, '', id);
  });

  toTop.addEventListener('click', () => scrollToTarget('#home'));
}
