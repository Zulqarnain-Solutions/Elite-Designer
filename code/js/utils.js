/* ==========================================================================
   utils.js — shared helpers (DOM, scroll lock, toast, icons, card entrances)
   ========================================================================== */

export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Shared runtime state (Lenis instance is set by animations.js) */
export const state = { lenis: null };

export const escapeHtml = (str = '') =>
  String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const pad2 = (n) => String(n).padStart(2, '0');

/** (Re)hydrate <i data-lucide> placeholders — call after injecting markup */
export function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

/** Scroll locking for overlays; several overlays may hold a lock at once */
const locks = new Set();
export function lockScroll(key, locked) {
  locked ? locks.add(key) : locks.delete(key);
  const active = locks.size > 0;
  document.documentElement.classList.toggle('is-locked', active);
  if (state.lenis) active ? state.lenis.stop() : state.lenis.start();
}

/** Smooth scroll to an element / selector / number (Lenis when available) */
export function scrollToTarget(target, { offset = 0, immediate = false } = {}) {
  const el = typeof target === 'string' ? $(target) : target;
  if (el == null) return;
  /* resolve to an absolute position from the live DOM (never from a cached scroll value) */
  const top = Math.max(0, typeof el === 'number' ? el : el.getBoundingClientRect().top + window.scrollY + offset);
  if (state.lenis) state.lenis.scrollTo(top, { immediate, duration: 1.6 });
  else window.scrollTo({ top, behavior: reducedMotion || immediate ? 'auto' : 'smooth' });
}

let toastTimer;
export function toast(message) {
  const el = $('[data-toast]');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2600);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Keep Tab focus inside an open dialog */
export function trapFocus(container, event) {
  if (event.key !== 'Tab') return;
  const items = $$('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])', container)
    .filter((el) => el.offsetParent !== null);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

/** Close an overlay with its exit animation, then hide it */
export function closeOverlay(el, done) {
  if (el.hidden) return;
  el.classList.add('is-closing');
  setTimeout(() => {
    el.hidden = true;
    el.classList.remove('is-closing');
    done && done();
  }, reducedMotion ? 0 : 260);
}

/** Staggered, scroll-aware entrance for freshly rendered cards */
export function animateIn(elements) {
  const { gsap, ScrollTrigger } = window;
  if (reducedMotion || !gsap || !ScrollTrigger || !elements.length) return;
  gsap.set(elements, { opacity: 0, y: 44 });
  ScrollTrigger.batch(elements, {
    start: 'top 94%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.09, overwrite: true, clearProps: 'transform' }),
  });
}

/** Kill ScrollTriggers attached to nodes inside a container about to be re-rendered */
export function killTriggersIn(container) {
  const { ScrollTrigger } = window;
  if (!ScrollTrigger) return;
  ScrollTrigger.getAll().forEach((t) => { if (t.trigger && container.contains(t.trigger)) t.kill(); });
}

let refreshTimer;
/** Debounced ScrollTrigger.refresh(). Never runs while Lenis is mid-glide:
    refresh() briefly rewinds the page to measure, which would cancel the glide. */
export function refreshScroll() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    if (!window.ScrollTrigger) return;
    if (state.lenis && state.lenis.isScrolling === 'smooth') return refreshScroll();
    window.ScrollTrigger.refresh();
  }, 160);
}

/** Pinterest "create pin" URL (same share endpoint the original site used) */
export function pinterestUrl({ description, media } = {}) {
  const params = new URLSearchParams({ url: window.location.href.split('#')[0] });
  if (description) params.set('description', description);
  if (media) params.set('media', new URL(media, window.location.href).href);
  return `https://www.pinterest.com/pin/create/button/?${params}`;
}
