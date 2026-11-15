/* ==========================================================================
   app.bundle.js — GENERATED FILE, DO NOT EDIT
   Built from js/*.js by build.js (run: node build.js).
   Only used when index.html is opened from disk (file://); over http:// the
   page loads the ES modules in js/main.js instead.
   ========================================================================== */
(function () {
'use strict';

var __defs = Object.create(null);
var __cache = Object.create(null);

function __define(id, fn) { __defs[id] = fn; }

function __require(id) {
  if (__cache[id]) return __cache[id];
  var fn = __defs[id];
  if (!fn) throw new Error('[elitedesigner] bundle is missing "' + id + '"');
  var exports = (__cache[id] = {});
  fn(exports, __require);
  return exports;
}

/* ---------- js/main.js ---------- */
__define("main.js", function (__exports, __require) {
  var { refreshIcons } = __require("utils.js");
  var { setupMotion, initAnimations } = __require("animations.js");
  var { initNavigation } = __require("navigation.js");
  var { initSalons } = __require("gallery.js");
  var { initFilters } = __require("filters.js");
  var { initModal } = __require("modal.js");
  var { initSearch } = __require("search.js");
  var { initNewsletter } = __require("newsletter.js");
/* ==========================================================================
   elitedesigner — entry point
   No build step: native ES modules + CDN libraries (GSAP, ScrollTrigger,
   Lenis, Motion, Lucide) loaded as deferred globals in index.html.
   ========================================================================== */









function boot() {
  const steps = [setupMotion, initSalons, initFilters, initModal, initSearch, initNewsletter, initNavigation, refreshIcons, initAnimations];
  steps.forEach((step) => {
    try { step(); } catch (err) { console.error(`[elitedesigner] ${step.name} failed`, err); }
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
  Object.assign(__exports, {  });
});

/* ---------- js/utils.js ---------- */
__define("utils.js", function (__exports, __require) {
/* ==========================================================================
   utils.js — shared helpers (DOM, scroll lock, toast, icons, card entrances)
   ========================================================================== */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Shared runtime state (Lenis instance is set by animations.js) */
const state = { lenis: null };

const escapeHtml = (str = '') =>
  String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const pad2 = (n) => String(n).padStart(2, '0');

/** (Re)hydrate <i data-lucide> placeholders — call after injecting markup */
function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

/** Scroll locking for overlays; several overlays may hold a lock at once */
const locks = new Set();
function lockScroll(key, locked) {
  locked ? locks.add(key) : locks.delete(key);
  const active = locks.size > 0;
  document.documentElement.classList.toggle('is-locked', active);
  if (state.lenis) active ? state.lenis.stop() : state.lenis.start();
}

/** Smooth scroll to an element / selector / number (Lenis when available) */
function scrollToTarget(target, { offset = 0, immediate = false } = {}) {
  const el = typeof target === 'string' ? $(target) : target;
  if (el == null) return;
  /* resolve to an absolute position from the live DOM (never from a cached scroll value) */
  const top = Math.max(0, typeof el === 'number' ? el : el.getBoundingClientRect().top + window.scrollY + offset);
  if (state.lenis) state.lenis.scrollTo(top, { immediate, duration: 1.6 });
  else window.scrollTo({ top, behavior: reducedMotion || immediate ? 'auto' : 'smooth' });
}

let toastTimer;
function toast(message) {
  const el = $('[data-toast]');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2600);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Keep Tab focus inside an open dialog */
function trapFocus(container, event) {
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
function closeOverlay(el, done) {
  if (el.hidden) return;
  el.classList.add('is-closing');
  setTimeout(() => {
    el.hidden = true;
    el.classList.remove('is-closing');
    done && done();
  }, reducedMotion ? 0 : 260);
}

/** Staggered, scroll-aware entrance for freshly rendered cards */
function animateIn(elements) {
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
function killTriggersIn(container) {
  const { ScrollTrigger } = window;
  if (!ScrollTrigger) return;
  ScrollTrigger.getAll().forEach((t) => { if (t.trigger && container.contains(t.trigger)) t.kill(); });
}

let refreshTimer;
/** Debounced ScrollTrigger.refresh(). Never runs while Lenis is mid-glide:
    refresh() briefly rewinds the page to measure, which would cancel the glide. */
function refreshScroll() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    if (!window.ScrollTrigger) return;
    if (state.lenis && state.lenis.isScrolling === 'smooth') return refreshScroll();
    window.ScrollTrigger.refresh();
  }, 160);
}

/** Pinterest "create pin" URL (same share endpoint the original site used) */
function pinterestUrl({ description, media } = {}) {
  const params = new URLSearchParams({ url: window.location.href.split('#')[0] });
  if (description) params.set('description', description);
  if (media) params.set('media', new URL(media, window.location.href).href);
  return `https://www.pinterest.com/pin/create/button/?${params}`;
}
  Object.assign(__exports, { refreshIcons, lockScroll, scrollToTarget, toast, copyText, trapFocus, closeOverlay, animateIn, killTriggersIn, refreshScroll, pinterestUrl, $, $$, reducedMotion, finePointer, state, escapeHtml, pad2 });
});

/* ---------- js/animations.js ---------- */
__define("animations.js", function (__exports, __require) {
  var { $, $$, state, reducedMotion, finePointer } = __require("utils.js");
/* ==========================================================================
   animations.js — Lenis + GSAP/ScrollTrigger choreography
   Responsibilities:
     • Lenis ............ smooth scrolling (synced to the GSAP ticker)
     • GSAP ............. hero timeline, reveals, parallax, arc, SVG drawing
     • Motion ........... spring-based magnetic buttons (only)
     • CSS .............. marquee loop, floating labels, overlay entrances
   Everything is skipped under prefers-reduced-motion.
   ========================================================================== */


/** Register plugins + start Lenis. Must run before any card is rendered. */
function setupMotion() {
  const { gsap, ScrollTrigger, Lenis } = window;
  if (reducedMotion || !gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out' });

  if (!Lenis) return;
  const lenis = new Lenis({
    duration: 1.6,
    smoothWheel: true,
    smoothTouch: true,   // brief's option name (Lenis ≤ 1.0)
    syncTouch: true,     // its equivalent in Lenis ≥ 1.1
    wheelMultiplier: 1,
    touchMultiplier: 1,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  state.lenis = lenis;
}

/* ---- Split text into masked words (keeps <em> styling) ---- */
function splitWords(root) {
  const wrap = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.append(' ');
          const outer = document.createElement('span');
          outer.className = 'split-w';
          const inner = document.createElement('span');
          inner.className = 'split-i';
          inner.textContent = part;
          outer.append(inner);
          frag.append(outer);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) wrap(child);
    });
  };
  root.setAttribute('aria-label', root.textContent.replace(/\s+/g, ' ').trim());
  wrap(root);
  return $$('.split-i', root);
}

function marquee() {
  const track = $('[data-marquee]');
  if (!track) return;
  track.innerHTML += track.innerHTML;      // duplicate once for a seamless -50% loop
  track.classList.add('is-ready');
}

function heroIntro(gsap) {
  const hero = $('.hero');
  const words = splitWords($('.hero__title'));
  const tl = gsap.timeline({ delay: 0.15, onStart: () => document.documentElement.classList.add('is-ready') });
  tl.fromTo('[data-hero-media]', { clipPath: 'inset(14% 16% 14% 16% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 1.9, ease: 'power4.inOut', clearProps: 'clipPath' }, 0)
    .fromTo('[data-hero-img]', { scale: 1.36 }, { scale: 1.08, duration: 2.3, ease: 'power3.out' }, 0)
    .from('.hero__veil', { opacity: 0, duration: 1.4 }, 0.3)
    .from(words, { yPercent: 115, duration: 1.3, ease: 'power4.out', stagger: 0.09 }, 0.55)
    .from('[data-hero-fade]', { opacity: 0, y: 26, duration: 1.1, stagger: 0.12 }, 0.95)
    .from('.hero__tag', { opacity: 0, scale: 0.85, duration: 0.9, stagger: 0.15 }, 1.5)
    .from('[data-hero-notes] li', { opacity: 0, y: 20, duration: 0.9, stagger: 0.08 }, 1.5)
    .from('[data-hero-caption]', { opacity: 0, y: 34, duration: 1.1 }, 1.55);

  /* scroll parallax on the photograph */
  gsap.to('[data-hero-img]', { yPercent: 9, ease: 'none', immediateRender: false, scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__content', { yPercent: -14, opacity: 0.25, ease: 'none', immediateRender: false, scrollTrigger: { trigger: hero, start: '25% top', end: 'bottom top', scrub: true } });
}

function reveals(gsap, ScrollTrigger) {
  /* section titles: masked word rise */
  $$('[data-split]').forEach((title) => {
    if (title.closest('.hero')) return;
    const words = splitWords(title);
    gsap.from(words, { yPercent: 115, duration: 1.25, ease: 'power4.out', stagger: 0.07, scrollTrigger: { trigger: title, start: 'top 88%', once: true } });
  });

  /* generic fade-rise, batched so neighbours stagger together */
  const soft = $$('[data-reveal]:not([data-reveal="image"])');
  gsap.set(soft, { opacity: 0, y: 34 });
  ScrollTrigger.batch(soft, { start: 'top 90%', once: true, onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1, overwrite: true }) });

  /* photographs: curtain reveal */
  $$('[data-reveal="image"]').forEach((frame) => {
    gsap.fromTo(frame, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power4.inOut', clearProps: 'clipPath', scrollTrigger: { trigger: frame, start: 'top 92%', once: true } });
  });

  /* arc cards + style tiles + guides get a simple staggered entrance */
  gsap.from('.style-tile', { opacity: 0, y: 60, duration: 1.2, stagger: 0.08, scrollTrigger: { trigger: '.style-strip', start: 'top 85%', once: true } });
  gsap.from('.salon', { opacity: 0, x: 80, duration: 1.3, stagger: 0.1, scrollTrigger: { trigger: '.salons__rail', start: 'top 88%', once: true } });

  /* pillar counters */
  $$('.pillar__count strong').forEach((n) => {
    const end = parseInt(n.textContent, 10);
    const obj = { v: 0 };
    gsap.to(obj, { v: end, duration: 2, ease: 'power2.out', onUpdate: () => { n.textContent = Math.round(obj.v); }, scrollTrigger: { trigger: n, start: 'top 90%', once: true } });
  });
}

function parallax(gsap) {
  const mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 961px)', compact: '(max-width: 960px)' }, (ctx) => {
    const factor = ctx.conditions.desktop ? 1 : 0.45;       // reduced on tablet / mobile
    $$('[data-parallax]').forEach((img) => {
      const amount = parseFloat(img.dataset.parallax) * factor;
      gsap.set(img, { scale: 1 + (amount * 2.4) / 100 });
      gsap.fromTo(img, { yPercent: -amount }, { yPercent: amount, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    /* footer watermark drifts up into place */
    gsap.from('.footer__mark', { yPercent: 35 * factor, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  });
}

/* Mirror collections fan out along the dotted arc as the section scrolls in */
function arc(gsap) {
  const root = $('[data-arc]');
  if (!root) return;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 961px)', () => {
    $$('[data-arc-card]', root).forEach((card) => {
      const cs = getComputedStyle(card);
      const r = parseFloat(cs.getPropertyValue('--r'));
      const y = parseFloat(cs.getPropertyValue('--y'));
      gsap.fromTo(card,
        { rotation: r * 2.6, y: y + 190, rotationX: 18, opacity: 0.2, transformOrigin: '50% 60%' },
        { rotation: r, y, rotationX: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: root, start: 'top 96%', end: 'top 30%', scrub: 1 } });
    });
    gsap.from('.arc__line path', { opacity: 0, ease: 'none', scrollTrigger: { trigger: root, start: 'top 90%', end: 'top 40%', scrub: true } });
    return () => gsap.set('[data-arc-card]', { clearProps: 'all' });
  });
}

/* Architectural drawing strokes itself in */
function drawing(gsap) {
  const svg = $('.ratio__drawing svg');
  if (!svg) return;
  const strokes = $$('.draw', svg).filter((p) => typeof p.getTotalLength === 'function');
  strokes.forEach((p) => { const len = p.getTotalLength(); gsap.set(p, { strokeDasharray: len, strokeDashoffset: len }); });
  const tl = gsap.timeline({ scrollTrigger: { trigger: svg, start: 'top 82%', once: true } });
  tl.to(strokes, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.14 })
    .from($$('text', svg), { opacity: 0, duration: 0.8, stagger: 0.1 }, '-=0.9');
}

/* Magnetic buttons — Motion springs (falls back to GSAP if Motion is absent) */
function magnetic(gsap) {
  if (!finePointer) return;
  const spring = (el, x, y) => {
    if (window.Motion && window.Motion.animate) window.Motion.animate(el, { x, y }, { type: 'spring', stiffness: 190, damping: 14, mass: 0.6 });
    else gsap.to(el, { x, y, duration: 0.6, ease: 'elastic.out(1, 0.6)' });
  };
  $$('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const b = el.getBoundingClientRect();
      spring(el, (e.clientX - (b.left + b.width / 2)) * 0.28, (e.clientY - (b.top + b.height / 2)) * 0.36);
    });
    el.addEventListener('pointerleave', () => spring(el, 0, 0));
  });
}

function initAnimations() {
  marquee();
  const { gsap, ScrollTrigger } = window;
  if (reducedMotion || !gsap || !ScrollTrigger) {
    document.documentElement.classList.add('is-ready');
    return;
  }
  heroIntro(gsap);
  reveals(gsap, ScrollTrigger);
  parallax(gsap);
  arc(gsap);
  drawing(gsap);
  magnetic(gsap);

  /* layout settles after fonts/images → recalculate trigger positions */
  window.addEventListener('load', () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
}
  Object.assign(__exports, { setupMotion, initAnimations });
});

/* ---------- js/navigation.js ---------- */
__define("navigation.js", function (__exports, __require) {
  var { $, $$, lockScroll, scrollToTarget } = __require("utils.js");
/* ==========================================================================
   navigation.js — glass nav state, active links, anchors, mobile menu,
   scroll progress and back-to-top
   ========================================================================== */


function initNavigation() {
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
  Object.assign(__exports, { initNavigation });
});

/* ---------- js/gallery.js ---------- */
__define("gallery.js", function (__exports, __require) {
  var { DESIGNS, CATEGORY_LABEL, FOCUS } = __require("data.js");
  var { $, escapeHtml, pad2, refreshIcons, animateIn, killTriggersIn, refreshScroll } = __require("utils.js");
/* ==========================================================================
   gallery.js — card templates, grid rendering and the Living Room rail
   ========================================================================== */



const focusStyle = (item) => (FOCUS[item.id] ? ` style="object-position:${FOCUS[item.id]}"` : '');

/** Editorial design card (used by the feed, TV and mirror grids) */
function cardTemplate(item) {
  const title = escapeHtml(item.title);
  return `
  <article class="card" data-id="${item.id}">
    <div class="card__media">
      <img src="${item.image}" alt="${escapeHtml(item.alt)}" loading="lazy" decoding="async"${focusStyle(item)}>
      <span class="chip chip--glass card__chip">${escapeHtml(item.style)}</span>
      <button class="card__pin" type="button" data-pin-design="${item.id}" aria-label="Save ${title} to Pinterest"><i data-lucide="pin"></i></button>
      <div class="card__palette" aria-hidden="true">${item.swatches.slice(0, 4).map((c) => `<span style="background:${c}"></span>`).join('')}</div>
      <span class="card__view" aria-hidden="true">View Salon <i data-lucide="arrow-right"></i></span>
    </div>
    <div class="card__body">
      <p class="card__meta"><span>${escapeHtml(item.subCategory)}</span><span>${escapeHtml(item.room)}</span></p>
      <h3 class="card__title"><button type="button" data-open-design="${item.id}">${title}</button></h3>
      <p class="card__desc">${escapeHtml(item.description)}</p>
      <p class="card__foot"><span>${escapeHtml(item.surface)}</span><span>${CATEGORY_LABEL[item.category]}</span></p>
    </div>
  </article>`;
}

/** Compact row (search results + field-note references) */
function rowTemplate(item, highlight = (s) => escapeHtml(s)) {
  return `
  <button class="result" type="button" data-result="${item.id}">
    <img src="${item.thumb}" alt="" loading="lazy" width="76" height="58">
    <span>
      <span class="result__meta">${escapeHtml(item.subCategory)} <span>· ${CATEGORY_LABEL[item.category]} · ${escapeHtml(item.style)}</span></span>
      <strong>${highlight(item.title)}</strong>
      <small>${highlight(item.surface)} — ${escapeHtml(item.room)}</small>
    </span>
    <i data-lucide="chevron-right"></i>
  </button>`;
}

/** Render a list of designs into a grid container */
function renderCards(container, items, { emptyText = 'No curations in this selection yet.' } = {}) {
  killTriggersIn(container);
  container.innerHTML = items.length
    ? items.map(cardTemplate).join('')
    : `<p class="grid__empty">${escapeHtml(emptyText)}</p>`;
  refreshIcons();
  animateIn([...container.children]);
  refreshScroll();
}

/** Append more cards without disturbing those already shown */
function appendCards(container, items) {
  const tpl = document.createElement('template');
  tpl.innerHTML = items.map(cardTemplate).join('');
  const added = [...tpl.content.children];
  container.append(...added);
  refreshIcons();
  animateIn(added);
  refreshScroll();
}

/** Living Room Wall Salons — horizontal rail (original: first six curations) */
function initSalons() {
  const rail = $('[data-salon-rail]');
  if (!rail) return;
  const items = DESIGNS.slice(0, 6);
  rail.innerHTML = items.map((item, i) => `
    <article class="salon">
      <button class="salon__media" type="button" data-open-design="${item.id}" aria-label="View details: ${escapeHtml(item.title)}">
        <img src="${item.image}" alt="${escapeHtml(item.alt)}" loading="lazy" decoding="async">
        <span class="salon__n">${pad2(i + 1)} / ${pad2(items.length)}</span>
      </button>
      <div class="salon__body">
        <div><p class="label">${escapeHtml(item.room)}</p><h3>${escapeHtml(item.title)}</h3></div>
        <p>${escapeHtml(item.description)}</p>
      </div>
    </article>`).join('');

  const prev = $('[data-salon-prev]');
  const next = $('[data-salon-next]');
  const step = () => (rail.firstElementChild?.getBoundingClientRect().width || 400) + parseFloat(getComputedStyle(rail).columnGap || 24);
  const update = () => {
    prev.disabled = rail.scrollLeft < 8;
    next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8;
  };
  prev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
  rail.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();

  /* Mouse drag-to-scroll (touch devices scroll natively) */
  let startX = 0, startLeft = 0, dragging = false, moved = false;
  rail.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = true; moved = false; startX = e.clientX; startLeft = rail.scrollLeft;
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 6 && !moved) { moved = true; rail.classList.add('is-dragging'); }
    if (moved) rail.scrollLeft = startLeft - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    /* keep pointer-events off for this tick so the drag never fires a click */
    setTimeout(() => rail.classList.remove('is-dragging'), 0);
  });
}
  Object.assign(__exports, { cardTemplate, rowTemplate, renderCards, appendCards, initSalons });
});

/* ---------- js/data.js ---------- */
__define("data.js", function (__exports, __require) {
/* ==========================================================================
   elitedesigner — CONTENT DATA (single source of truth)
   --------------------------------------------------------------------------
   Every entry below is preserved verbatim from the original site's
   WALL_DATABASE at https://elitedesigner.site/ (titles, descriptions,
   categories, material specs and palette swatches).

   IMAGES
   • imageSource: "original"    → photograph retrieved from the original site.
   • imageSource: "replacement" → the original site shipped this entry with
     an empty `url('placeholder')` and no photograph. A stand-in was rendered
     from the original entry's own image brief (kept here as `alt`).
     To restore/replace: drop a file in assets/images + assets/thumbnails
     and update `image` / `thumb` — nothing else needs to change.
   ========================================================================== */

const DESIGNS = [
  {
    "id": 1,
    "title": "Modern Calacatta Gold Marble TV Wall",
    "category": "tv-walls",
    "subCategory": "Marble",
    "style": "Luxury",
    "room": "Living Room",
    "description": "An awe-inspiring bookmatched Italian Calacatta Gold slab installation. Featuring precision waterjet cutouts for flush television integration and perimeter architectural 2700K ambient glow.",
    "surface": "Bookmatched Calacatta Gold",
    "lighting": "2700K High-CRI LED Cove",
    "frame": "Bleached Natural Oak",
    "ratio": "16:9 Golden Splay",
    "swatches": [
      "#FAF7F2",
      "#E8D8C3",
      "#A89580",
      "#544E45",
      "#2C2925"
    ],
    "image": "assets/images/01-calacatta-gold-marble-tv-wall.jpg",
    "thumb": "assets/thumbnails/01-calacatta-gold-marble-tv-wall.jpg",
    "imageSource": "original",
    "alt": "Ultra-luxurious minimalist living room with floor-to-ceiling bookmatched Calacatta gold marble TV wall, hidden perimeter warm 2700K ambient LED backlighting, slim floating European oak media console, flush OLED screen, and a soft beige linen curved sofa, quiet luxury architectural interior photograph, 8k"
  },
  {
    "id": 2,
    "title": "Elegant Round Brass Mirror Wall",
    "category": "mirror-walls",
    "subCategory": "Round",
    "style": "Modern",
    "room": "Entryway & Dining",
    "description": "A monolithic 60-inch spun-brass circular mirror designed to balance severe linear architectural plans. Delivers deep spatial reverberation in foyers and dining salons.",
    "surface": "Ultra-Clear Low-Iron Glass",
    "lighting": "Diffused Daylight & Sconces",
    "frame": "Solid Spun Brushed Brass",
    "ratio": "1:1 Perfect Circle",
    "swatches": [
      "#F5F0E8",
      "#D4AF37",
      "#9E8B68",
      "#4A4036",
      "#201D1A"
    ],
    "image": "assets/images/02-round-brass-mirror-wall.jpg",
    "thumb": "assets/thumbnails/02-round-brass-mirror-wall.jpg",
    "imageSource": "original",
    "alt": "Grand oversized 60 inch round brass framed statement mirror hung above a textured plaster wall console, reflecting warm morning light and an architectural chandelier, luxury penthouse hallway"
  },
  {
    "id": 3,
    "title": "Bleached White Oak Slat TV Wall with Fireplace",
    "category": "tv-walls",
    "subCategory": "Wooden",
    "style": "Scandinavian",
    "room": "Living Room",
    "description": "Sound-absorbing acoustic felt with bleached white oak micro-slats. Paired seamlessly with a 72-inch flush linear water-vapor fireplace for tactile Nordic warmth.",
    "surface": "Bleached White Oak Slats",
    "lighting": "Hidden Low-Profile Grazing Strip",
    "frame": "Matte Black Acoustic Felt",
    "ratio": "Floor-to-Ceiling 3:1",
    "swatches": [
      "#EFEAE1",
      "#CDBFA8",
      "#8C7E6A",
      "#3D3831",
      "#1A1918"
    ],
    "image": "assets/images/03-white-oak-slat-fireplace-tv-wall.jpg",
    "thumb": "assets/thumbnails/03-white-oak-slat-fireplace-tv-wall.jpg",
    "imageSource": "original",
    "alt": "Full panoramic living room with Scandinavian acoustic slat TV wall in natural bleached white oak, hidden storage doors, integrated linear fireplace below the television screen, warm indirect LED glow, and cozy neutral bouclé armchairs"
  },
  {
    "id": 4,
    "title": "Luxury Antique Mercury Mirror Panel Gallery",
    "category": "mirror-walls",
    "subCategory": "Decorative Panels",
    "style": "Classic",
    "room": "Formal Dining Salon",
    "description": "Hand-silvered distressed mirror panels crafted by Venetian artisans. Each grid element introduces subtle champagne mottling, softening bright reflections into vintage intimacy.",
    "surface": "Distressed Mercury Glass",
    "lighting": "Candelabra Warm 2200K",
    "frame": "Concealed Rosette Mounts",
    "ratio": "4x3 Classical Matrix",
    "swatches": [
      "#E7DFD5",
      "#B8A99A",
      "#7A6C5F",
      "#463E36",
      "#25211D"
    ],
    "image": "assets/images/04-antique-mercury-mirror-panels.jpg",
    "thumb": "assets/thumbnails/04-antique-mercury-mirror-panels.jpg",
    "imageSource": "original",
    "alt": "Grid of 12 antiqued mercury glass mirror tiles forming a complete salon feature wall, subtle aged mottled patina, reflections of warm candlelit dining room"
  },
  {
    "id": 5,
    "title": "Minimalist Travertine Slab TV Wall",
    "category": "tv-walls",
    "subCategory": "Minimalist",
    "style": "Minimalist",
    "room": "Open Concept Living",
    "description": "Unfilled Roman travertine panels with fine horizontal veining. The floating console is fabricated with patinated bronze sheeting for a raw, sculptural presence.",
    "surface": "Honed Roman Travertine",
    "lighting": "Recessed Downward Wash",
    "frame": "Patinated Architectural Bronze",
    "ratio": "16:10 Horizontal Span",
    "swatches": [
      "#F9F6F0",
      "#E3D5C5",
      "#A6927C",
      "#635647",
      "#2D261F"
    ],
    "image": "assets/images/05-travertine-slab-tv-wall.jpg",
    "thumb": "assets/thumbnails/05-travertine-slab-tv-wall.jpg",
    "imageSource": "original",
    "alt": "Monolithic honed travertine slab TV accent wall, clean unadorned seams, low profile floating bronze shelf, recessed ambient downward wash illumination, contemporary organic minimalism"
  },
  {
    "id": 6,
    "title": "Decorative Arched Entryway Mirror",
    "category": "mirror-walls",
    "subCategory": "Arched",
    "style": "Contemporary",
    "room": "Foyer Gallery",
    "description": "Slender arched steel silhouette inspired by Renaissance cloister cloisters. Finished with unlacquered hand-applied gunmetal wax that matures over decades.",
    "surface": "Beveled Edge Glass",
    "lighting": "Filtered Ambient Daylight",
    "frame": "Slender Wrought Steel",
    "ratio": "2.4:1 Architectural Arch",
    "swatches": [
      "#FAF8F5",
      "#D8D0C5",
      "#8E867A",
      "#4B443B",
      "#1C1B19"
    ],
    "image": "assets/images/06-arched-entryway-mirror.jpg",
    "thumb": "assets/thumbnails/06-arched-entryway-mirror.jpg",
    "imageSource": "original",
    "alt": "Cathedral style arched minimalist mirror resting on a polished herringbone oak floor against warm off-white lime wash walls, natural bright morning reflections"
  },
  {
    "id": 7,
    "title": "Contemporary Smoked Glass TV Wall",
    "category": "tv-walls",
    "subCategory": "Modern",
    "style": "Modern",
    "room": "Media Salon",
    "description": "Dark reflective bronze-smoked glass cladding that camouflages 85-inch screens when inactive, transitioning into a luminous media theater when energized.",
    "surface": "Smoked Bronze Glass",
    "lighting": "RGBW Tunable Smart Cove",
    "frame": "Anodized Black Aluminum",
    "ratio": "Full Wall Horizon",
    "swatches": [
      "#F0EDE6",
      "#BCB3A4",
      "#70675A",
      "#39332C",
      "#141312"
    ],
    "image": "assets/images/07-smoked-glass-tv-wall.jpg",
    "thumb": "assets/thumbnails/07-smoked-glass-tv-wall.jpg",
    "imageSource": "original",
    "alt": "Contemporary dark smoked glass TV wall with built in ambient backlighting, reflections of dim luxury apartment interior, dark oak cabinetry, floating console with architectural ceramics"
  },
  {
    "id": 8,
    "title": "Modern Living Room Organic Mirror",
    "category": "mirror-walls",
    "subCategory": "Geometric",
    "style": "Scandinavian",
    "room": "Living Room",
    "description": "Fluid biometric pond contours resting nonchalantly against custom limestone plaster. Creates subtle optical shifts across room transitions.",
    "surface": "Frameless Polished Rim",
    "lighting": "Organic Side Grazing",
    "frame": "Hidden Z-Bar Bracket",
    "ratio": "Asymmetric Freeform",
    "swatches": [
      "#F7F4EF",
      "#D6CABE",
      "#918475",
      "#524A40",
      "#23201D"
    ],
    "image": "assets/images/08-organic-living-room-mirror.jpg",
    "thumb": "assets/thumbnails/08-organic-living-room-mirror.jpg",
    "imageSource": "original",
    "alt": "Contemporary organic pebble shaped pond mirror with ultra slim dark bronze rim resting against a textured greige plaster living room accent wall, Scandinavian modern luxury"
  },
  {
    "id": 9,
    "title": "Nero Marquina & Walnut Fireplace TV Wall",
    "category": "tv-walls",
    "subCategory": "Fireplace",
    "style": "Luxury",
    "room": "Great Room",
    "description": "High-contrast architectural drama pairing midnight Spanish Nero Marquina with American black walnut fluting and a low-slung ethanol fireplace.",
    "surface": "Nero Marquina Marble",
    "lighting": "Warm 2400K Hearth LED",
    "frame": "American Black Walnut",
    "ratio": "Double Height 2:1",
    "swatches": [
      "#ECE7E1",
      "#C2B29D",
      "#6F604E",
      "#302B24",
      "#121110"
    ],
    "image": "assets/images/09-nero-marquina-walnut-fireplace-tv-wall.jpg",
    "thumb": "assets/thumbnails/09-nero-marquina-walnut-fireplace-tv-wall.jpg",
    "imageSource": "replacement",
    "alt": "Striking contrast TV wall with deep black Nero Marquina marble hearth, fluted American walnut upper paneling, integrated widescreen television, recessed linear flame fireplace, warm evening mood"
  },
  {
    "id": 10,
    "title": "Full-Length Floor Standing Brass Mirror",
    "category": "mirror-walls",
    "subCategory": "Full-Length",
    "style": "Modern",
    "room": "Primary Suite",
    "description": "An 84-inch leaning mirror with softly rounded corners and weighted anti-tip solid bronze anchor bolts. Designed to expand primary suites.",
    "surface": "Ultra-Clear Mirror",
    "lighting": "Morning Eastern Light",
    "frame": "Cast Aged Brass",
    "ratio": "2.8:1 Leaning Profile",
    "swatches": [
      "#F6F3EE",
      "#D7CCBD",
      "#978977",
      "#584E42",
      "#26221D"
    ],
    "image": "assets/images/10-full-length-brass-mirror.jpg",
    "thumb": "assets/thumbnails/10-full-length-brass-mirror.jpg",
    "imageSource": "replacement",
    "alt": "Massive 84 inch full length leaning mirror with rounded corners and antique burnished brass frame in an airy master bedroom suite with neutral linens and herringbone flooring"
  },
  {
    "id": 11,
    "title": "Compact Scandinavian Floating TV Wall",
    "category": "tv-walls",
    "subCategory": "Small Spaces",
    "style": "Scandinavian",
    "room": "Urban Apartment",
    "description": "A compact spatial solution utilizing vertical line rhythm and 10-inch slim storage modules to provide full cinema amenities in boutique apartments.",
    "surface": "Light Ash & Acoustic Vaneer",
    "lighting": "Under-Console Floating Glow",
    "frame": "Ash White Pigment",
    "ratio": "Compact 4:3",
    "swatches": [
      "#F9F7F3",
      "#DDD6CA",
      "#9C9384",
      "#5B5347",
      "#282520"
    ],
    "image": "assets/images/11-compact-scandinavian-tv-wall.jpg",
    "thumb": "assets/thumbnails/11-compact-scandinavian-tv-wall.jpg",
    "imageSource": "replacement",
    "alt": "Smart small space TV wall in an urban studio apartment with light ash wood floating media storage, white acoustic slatted backdrop, cord concealment channel, minimal decor"
  },
  {
    "id": 12,
    "title": "Curated Mirror Gallery Wall Array",
    "category": "mirror-walls",
    "subCategory": "Gallery",
    "style": "Luxury",
    "room": "Staircase & Corridor",
    "description": "A balanced constellation of nine varied frames reflecting dynamic views across ascending architectural stairways and lofty double-height walls.",
    "surface": "Mixed Tint Mirrors",
    "lighting": "Directional Ceiling Spots",
    "frame": "Curated Alloy Finishes",
    "ratio": "Multi-Piece Salon Array",
    "swatches": [
      "#F4EFE8",
      "#CBBFA8",
      "#877964",
      "#4B4235",
      "#1E1C1A"
    ],
    "image": "assets/images/12-mirror-gallery-wall-array.jpg",
    "thumb": "assets/thumbnails/12-mirror-gallery-wall-array.jpg",
    "imageSource": "replacement",
    "alt": "Curated gallery wall of nine mixed geometric mirrors in unlacquered brass, burnished copper, and smoked glass frames arranged harmoniously along a two story staircase wall"
  },
  {
    "id": 13,
    "title": "Raw Concrete & Oak Industrial TV Wall",
    "category": "tv-walls",
    "subCategory": "Modern",
    "style": "Contemporary",
    "room": "Loft Salon",
    "description": "Fair-faced architectural micro-cement with exposed tie-rod detail, softened by an illuminated European rift-cut oak media recess.",
    "surface": "Architectural Micro-Cement",
    "lighting": "Niche 2700K Micro-Spots",
    "frame": "Rift-Cut Natural Oak",
    "ratio": "Asymmetric Split",
    "swatches": [
      "#EDEAE4",
      "#B8B3AA",
      "#736E66",
      "#3E3B36",
      "#1B1917"
    ],
    "image": "assets/images/13-concrete-oak-industrial-tv-wall.jpg",
    "thumb": "assets/thumbnails/13-concrete-oak-industrial-tv-wall.jpg",
    "imageSource": "replacement",
    "alt": "Architectural fair-faced concrete panel TV wall with inset horizontal oak niche, concealed black audio soundbar, warm directional spotlighting in an urban loft setting"
  },
  {
    "id": 14,
    "title": "Gilded Baroque Accent Wall Mirror",
    "category": "mirror-walls",
    "subCategory": "Luxury",
    "style": "Classic",
    "room": "Drawing Room",
    "description": "Authentic water-gilded 24k gold leaf frame with acanthus leaf cresting, lending royal contrast against pale French lime wash boiserie.",
    "surface": "Hand-Polished Glass",
    "lighting": "Fireplace Glow & Natural Sun",
    "frame": "Carved Gold Leaf Giltwood",
    "ratio": "1.8:1 Classic Crest",
    "swatches": [
      "#F9F6ED",
      "#E2C98F",
      "#A0864B",
      "#5C4B24",
      "#2B220E"
    ],
    "image": "assets/images/14-gilded-baroque-mirror.jpg",
    "thumb": "assets/thumbnails/14-gilded-baroque-mirror.jpg",
    "imageSource": "replacement",
    "alt": "Exquisite hand carved gold leaf rococo French mirror hung above a dark marble mantelpiece in a Parisian salon with high ceilings, boiserie wall paneling and parquet floor"
  },
  {
    "id": 15,
    "title": "Ceiling-High Geometric Mirror Panels",
    "category": "mirror-walls",
    "subCategory": "Geometric",
    "style": "Modern",
    "room": "Dining Pavilion",
    "description": "Precision diamond-faceted mirror expanses with micro-beveled brass dividers, engineered to visually double the spatial volume of entertaining pavilions.",
    "surface": "Faceted Beveled Mirror",
    "lighting": "Pendant Crystal Refraction",
    "frame": "Micro-Beveled Brass Dividers",
    "ratio": "Floor-to-Ceiling Diamond Grid",
    "swatches": [
      "#F8F5F1",
      "#DACFC1",
      "#968A79",
      "#564B3E",
      "#221E19"
    ],
    "image": "assets/images/15-geometric-mirror-panels.jpg",
    "thumb": "assets/thumbnails/15-geometric-mirror-panels.jpg",
    "imageSource": "replacement",
    "alt": "Floor to ceiling angled geometric mirror panels reflecting a modern sculptural dining table with delicate brass trim dividing the diamond shaped reflective glass planes"
  },
  {
    "id": 16,
    "title": "Textured Plaster & Bronze Media Wall",
    "category": "tv-walls",
    "subCategory": "Minimalist",
    "style": "Minimalist",
    "room": "Primary Living Lounge",
    "description": "Hand-troweled Moroccan tadelakt plaster in warm sand, sculpted with seamless bullnose returns that eliminate harsh television corners.",
    "surface": "Waterproof Tadelakt Plaster",
    "lighting": "Diffuse Floor Up-Lighting",
    "frame": "Monolithic Plaster Return",
    "ratio": "Continuous Curved Wall",
    "swatches": [
      "#F5ECE3",
      "#D2BFAD",
      "#8E7A68",
      "#4F4236",
      "#201B15"
    ],
    "image": "assets/images/16-tadelakt-plaster-media-wall.jpg",
    "thumb": "assets/thumbnails/16-tadelakt-plaster-media-wall.jpg",
    "imageSource": "replacement",
    "alt": "Warm earth-toned tadelakt plaster TV wall with soft rounded corners, recessed television niche, floating bronze ledge, warm diffused up-lighting creating serene shadows"
  }
];

/* Focal points for portrait crops of landscape originals (CSS object-position) */
const FOCUS = { 6: '78% 50%', 8: '62% 50%' };

/* Category labels used across cards, search and the viewer */
const CATEGORY_LABEL = {
  'tv-walls': 'TV Focal Wall',
  'mirror-walls': 'Mirror Array',
};

/* Filter pills — values match the original site's filter keys
   (matched against subCategory OR style, exactly as the original did). */
const FEED_FILTERS = [
  { key: 'all', label: 'All Pieces' },
  { key: 'tv-walls', label: 'TV Focal Walls' },
  { key: 'mirror-walls', label: 'Mirror Arrays' },
];

const TV_FILTERS = [
  { key: 'all', label: 'All Designs' },
  { key: 'Modern', label: 'Modern' },
  { key: 'Marble', label: 'Marble & Stone' },
  { key: 'Wooden', label: 'Wooden Slats' },
  { key: 'Minimalist', label: 'Minimalist' },
  { key: 'Luxury', label: 'Luxury' },
  { key: 'Small Spaces', label: 'Small Spaces' },
  { key: 'Fireplace', label: 'Fireplace TV Walls' },
];

const MIRROR_FILTERS = [
  { key: 'all', label: 'All Mirrors' },
  { key: 'Round', label: 'Round Mirrors' },
  { key: 'Arched', label: 'Arched Mirrors' },
  { key: 'Full-Length', label: 'Full-Length' },
  { key: 'Decorative Panels', label: 'Decorative Panels' },
  { key: 'Geometric', label: 'Geometric' },
  { key: 'Gallery', label: 'Gallery Wall' },
  { key: 'Luxury', label: 'Luxury Gilding' },
];

/* Design guides (original "Architectural Notebook") */
const GUIDES = [
  {
    id: 1,
    number: 'Guide 01',
    title: 'How to Choose the Perfect TV Wall Design',
    description: 'Scale relationships between sofa distance, console depth, and flush wall anchors for OLED and Frame screens.',
    image: 'assets/images/guide-01-tv-wall.jpg',
    related: (d) => d.category === 'tv-walls',
    relatedLabel: 'TV walls referenced in this note',
  },
  {
    id: 2,
    number: 'Guide 02',
    title: 'Beautiful Ways to Decorate with Mirrors',
    description: 'Maximizing light reflections, pairing frames with raw plaster, and avoiding awkward glare angles in living rooms.',
    image: 'assets/images/guide-02-mirrors.jpg',
    related: (d) => d.category === 'mirror-walls',
    relatedLabel: 'Mirror installations referenced in this note',
  },
  {
    id: 3,
    number: 'Guide 03',
    title: 'Modern Wall Panel Ideas for Elegant Interiors',
    description: 'Comparing sound-dampened acoustic felt slatted wood with bookmatched porcelain and antique French boiserie.',
    image: 'assets/images/guide-03-wall-panels.jpg',
    related: (d) => [3, 4, 11, 14].includes(d.id),
    relatedLabel: 'Panel compositions referenced in this note',
  },
];

/* Search overlay */
const SEARCH_PLACEHOLDER = 'Search TV walls, marble, fluted wood, arched mirrors...';
const POPULAR_SEARCHES = ['Marble TV wall', 'Arched mirrors', 'Wooden slats', 'Travertine', 'Antique mirror'];

/* Fallback specification values shown by the original viewer */
const DEFAULT_SPECS = {
  surface: 'Calacatta Gold',
  lighting: '2700K Warm Dim',
  frame: 'European Oak',
  ratio: '16:9 Balanced',
};

/* ---- Integrations that need configuration -------------------------------
   NEWSLETTER_ENDPOINT: POST URL of your mailing provider (Mailchimp,
   ConvertKit, Formspree, your own API…). While empty, the form validates
   and stores the address in this browser only — nothing is sent.
   SOCIAL: replace with the brand's real profile URLs.
   ----------------------------------------------------------------------- */
const CONFIG = {
  NEWSLETTER_ENDPOINT: '',
  SOCIAL: {
    pinterest: 'https://www.pinterest.com/',
    instagram: 'https://www.instagram.com/',
  },
};
  Object.assign(__exports, { DESIGNS, FOCUS, CATEGORY_LABEL, FEED_FILTERS, TV_FILTERS, MIRROR_FILTERS, GUIDES, SEARCH_PLACEHOLDER, POPULAR_SEARCHES, DEFAULT_SPECS, CONFIG });
});

/* ---------- js/filters.js ---------- */
__define("filters.js", function (__exports, __require) {
  var { DESIGNS, FEED_FILTERS, TV_FILTERS, MIRROR_FILTERS } = __require("data.js");
  var { $, $$, escapeHtml, refreshIcons, reducedMotion, scrollToTarget, killTriggersIn } = __require("utils.js");
  var { renderCards, appendCards } = __require("gallery.js");
/* ==========================================================================
   filters.js — category pills, style taxonomy and load-more for the 3 grids
   Filter semantics mirror the original site: a key matches when it equals
   the entry's subCategory OR its style.
   ========================================================================== */




const tvItems = DESIGNS.filter((d) => d.category === 'tv-walls');
const mirrorItems = DESIGNS.filter((d) => d.category === 'mirror-walls');
const bySub = (key) => (d) => d.subCategory === key || d.style === key;

const GROUPS = {
  feed: {
    filters: FEED_FILTERS,
    active: 'all',
    style: null,             // set by "Explore by Style"
    cap: 8,                  // the dispatch shows the eight latest pieces
    noun: ['piece', 'pieces'],
    items() {
      if (this.style) return DESIGNS.filter((d) => d.style === this.style);
      return this.active === 'all' ? DESIGNS : DESIGNS.filter((d) => d.category === this.active);
    },
  },
  tv: {
    filters: TV_FILTERS, active: 'all', page: 4, shown: 4, noun: ['portfolio', 'portfolios'],
    items() { return this.active === 'all' ? tvItems : tvItems.filter(bySub(this.active)); },
  },
  mirror: {
    filters: MIRROR_FILTERS, active: 'all', page: 4, shown: 4, noun: ['portfolio', 'portfolios'],
    items() { return this.active === 'all' ? mirrorItems : mirrorItems.filter(bySub(this.active)); },
  },
};

const plural = (n, [one, many]) => `${n} ${n === 1 ? one : many}`;

function renderPills(name) {
  const g = GROUPS[name];
  const host = $(`[data-filter-group="${name}"]`);
  const stylePill = g.style
    ? `<button class="pill pill--style" type="button" data-clear-style aria-label="Clear style filter: ${escapeHtml(g.style)}">Style · ${escapeHtml(g.style)} <i data-lucide="x"></i></button>`
    : '';
  host.innerHTML = g.filters.map((f) =>
    `<button class="pill" type="button" data-filter="${escapeHtml(f.key)}" aria-pressed="${!g.style && g.active === f.key}">${escapeHtml(f.label)}</button>`).join('') + stylePill;
  refreshIcons();
}

function visibleItems(name) {
  const g = GROUPS[name];
  const all = g.items();
  if (name === 'feed') return all.slice(0, g.cap);
  return g.active === 'all' ? all.slice(0, g.shown) : all;   // filtered views show every match
}

function updateStatus(name) {
  const g = GROUPS[name];
  const total = g.items().length;
  const shown = visibleItems(name).length;
  const status = $(`[data-filter-status="${name}"]`);
  if (name === 'feed') {
    status.textContent = g.style
      ? `${plural(total, g.noun)} in ${g.style}`
      : g.active === 'all' ? `${shown} latest of ${plural(total, g.noun)}` : plural(shown, g.noun);
  } else {
    status.textContent = shown < total ? `Showing ${shown} of ${plural(total, g.noun)}` : plural(total, g.noun);
  }

  const more = $(`[data-load-more="${name}"]`);
  if (!more) return;
  const remaining = total - shown;
  more.parentElement.hidden = g.active !== 'all';
  more.disabled = remaining <= 0;
  more.classList.remove('is-loading');
  more.innerHTML = remaining > 0
    ? `<span>Load Additional Portfolios (${Math.min(remaining, g.page)})</span><i data-lucide="plus"></i>`
    : `<span>All ${plural(total, g.noun)} in this edition shown</span>`;
  refreshIcons();
}

/** Fade the current cards out, swap, then let gallery.js stagger the new ones in */
function swap(name) {
  const grid = $(`[data-grid="${name}"]`);
  const draw = () => {
    renderCards(grid, visibleItems(name), { emptyText: 'No curations match this filter yet.' });
    updateStatus(name);
  };
  const { gsap } = window;
  if (reducedMotion || !gsap || !grid.children.length) return draw();
  /* timer-driven swap: an entrance tween still running on these cards can never block it */
  killTriggersIn(grid);
  gsap.to([...grid.children], { opacity: 0, y: -14, duration: 0.26, ease: 'power2.in', overwrite: true });
  clearTimeout(swapTimers[name]);
  swapTimers[name] = setTimeout(draw, 280);
}

const swapTimers = {};

function setFilter(name, key) {
  const g = GROUPS[name];
  if (!g.style && g.active === key) return;
  g.active = key;
  g.style = null;
  if (g.page) g.shown = g.page;
  renderPills(name);
  swap(name);
}

/** Explore by Style → filters the Curator Dispatch across TV walls and mirrors */
function applyStyle(style) {
  const g = GROUPS.feed;
  g.style = style;
  renderPills('feed');
  swap('feed');
  scrollToTarget('#latest', { offset: -20 });
}

function initFilters() {
  Object.keys(GROUPS).forEach((name) => {
    renderPills(name);
    renderCards($(`[data-grid="${name}"]`), visibleItems(name));
    updateStatus(name);

    $(`[data-filter-group="${name}"]`).addEventListener('click', (e) => {
      const pill = e.target.closest('[data-filter]');
      if (pill) return setFilter(name, pill.dataset.filter);
      if (e.target.closest('[data-clear-style]')) { GROUPS[name].style = null; GROUPS[name].active = '__reset'; setFilter(name, 'all'); }
    });

    const more = $(`[data-load-more="${name}"]`);
    if (more) more.addEventListener('click', () => {
      const g = GROUPS[name];
      const next = g.items().slice(g.shown, g.shown + g.page);
      if (!next.length) return;
      g.shown += next.length;
      appendCards($(`[data-grid="${name}"]`), next);
      updateStatus(name);
    });
  });

  $$('[data-style]').forEach((tile) => tile.addEventListener('click', () => applyStyle(tile.dataset.style)));
}
  Object.assign(__exports, { applyStyle, initFilters });
});

/* ---------- js/modal.js ---------- */
__define("modal.js", function (__exports, __require) {
  var { DESIGNS, GUIDES, CATEGORY_LABEL, DEFAULT_SPECS } = __require("data.js");
  var { $, $$, escapeHtml, pad2, refreshIcons, lockScroll, trapFocus, closeOverlay, toast, copyText, pinterestUrl, reducedMotion } = __require("utils.js");
  var { rowTemplate } = __require("gallery.js");
/* ==========================================================================
   modal.js — premium design detail viewer + field-note dialog
   Keyboard: ← previous · → next · Esc close
   ========================================================================== */




let viewer, note, index = 0, lastFocus = null;
const el = {};

const designUrl = (item) => `${window.location.href.split('#')[0]}#design-${item.id}`;

/* ---------- Viewer ---------- */
function fill(direction = 0) {
  const item = DESIGNS[index];
  el.cat.textContent = `${CATEGORY_LABEL[item.category]} · ${item.style}`;
  el.source.hidden = item.imageSource === 'original';
  el.room.textContent = `${item.room} · ${item.subCategory}`;
  el.title.textContent = item.title;
  el.desc.textContent = item.description;
  el.surface.textContent = item.surface || DEFAULT_SPECS.surface;
  el.lighting.textContent = item.lighting || DEFAULT_SPECS.lighting;
  el.frame.textContent = item.frame || DEFAULT_SPECS.frame;
  el.ratio.textContent = item.ratio || DEFAULT_SPECS.ratio;
  el.count.textContent = `${pad2(index + 1)} / ${pad2(DESIGNS.length)}`;
  el.palette.innerHTML = item.swatches.map((hex) =>
    `<button type="button" data-hex="${hex}" style="background:${hex}" aria-label="Copy colour ${hex}"><span>${hex}</span></button>`).join('');
  el.paletteMsg.textContent = 'Select a tone to copy its hex value.';
  el.img.src = item.image;
  el.img.alt = item.alt;
  el.body.scrollTop = 0;

  const { gsap } = window;
  if (gsap && !reducedMotion) {
    gsap.fromTo(el.img, { opacity: 0, scale: 1.05, xPercent: direction * 3 }, { opacity: 1, scale: 1, xPercent: 0, duration: 0.9, ease: 'power3.out', overwrite: true });
    gsap.fromTo([...el.body.children], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.035, overwrite: true });
  }
  /* warm the neighbours so ← / → feel instant */
  [index + 1, index - 1].forEach((i) => { new Image().src = DESIGNS[(i + DESIGNS.length) % DESIGNS.length].image; });
}

function openDesign(id, trigger) {
  const i = DESIGNS.findIndex((d) => d.id === Number(id));
  if (i < 0) return;
  index = i;
  if (viewer.hidden) {
    lastFocus = trigger || document.activeElement;
    viewer.hidden = false;
    lockScroll('viewer', true);
  }
  setZoom(false);
  fill();
  $('[data-viewer-close].round-btn', viewer).focus({ preventScroll: true });
}

function closeDesign() {
  closeOverlay(viewer, () => {
    lockScroll('viewer', false);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  });
}

function step(delta) {
  index = (index + delta + DESIGNS.length) % DESIGNS.length;
  fill(delta);
}

function setZoom(on) {
  viewer.classList.toggle('is-zoomed', on);
  el.zoom.setAttribute('aria-pressed', String(on));
  $('span', el.zoom).textContent = on ? 'Exit Enlarged View' : 'Enlarge View';
}

function pin(item) {
  window.open(pinterestUrl({ description: `${item.title} — ${item.description}`, media: item.image }), '_blank', 'noopener,width=750,height=600');
}

async function share() {
  const item = DESIGNS[index];
  const data = { title: item.title, text: item.description, url: designUrl(item) };
  if (navigator.share) {
    try { await navigator.share(data); } catch { /* dismissed */ }
  } else {
    toast((await copyText(data.url)) ? 'Salon link copied to clipboard' : data.url);
  }
}

/* ---------- Field note ---------- */
function openGuide(id, trigger) {
  const guide = GUIDES.find((g) => g.id === Number(id));
  if (!guide) return;
  lastFocus = trigger || document.activeElement;
  $('[data-note-img]', note).src = guide.image;
  $('[data-note-img]', note).alt = guide.title;
  $('[data-note-number]', note).textContent = `${guide.number} · Field Note`;
  $('[data-note-title]', note).textContent = guide.title;
  $('[data-note-desc]', note).textContent = guide.description;
  $('[data-note-related-label]', note).textContent = guide.relatedLabel;
  $('[data-note-related]', note).innerHTML = DESIGNS.filter(guide.related).map((d) => rowTemplate(d)).join('');
  refreshIcons();
  note.hidden = false;
  lockScroll('note', true);
  $('.note__panel', note).scrollTop = 0;
  $('.note__close', note).focus({ preventScroll: true });
}

function closeGuide(then) {
  closeOverlay(note, () => {
    lockScroll('note', false);
    then ? then() : lastFocus && document.contains(lastFocus) && lastFocus.focus({ preventScroll: true });
  });
}

/* ---------- Init ---------- */
function initModal() {
  viewer = $('[data-viewer]');
  note = $('[data-note]');
  ['img', 'cat', 'source', 'room', 'title', 'desc', 'surface', 'lighting', 'frame', 'ratio', 'count', 'palette', 'body', 'zoom'].forEach((k) => {
    el[k] = $(`[data-viewer-${k}]`, viewer);
  });
  el.paletteMsg = $('[data-viewer-palette-msg]', viewer);

  /* Delegated triggers anywhere on the page */
  document.addEventListener('click', (e) => {
    const pinBtn = e.target.closest('[data-pin-design]');
    if (pinBtn) { e.stopPropagation(); return pin(DESIGNS.find((d) => d.id === Number(pinBtn.dataset.pinDesign))); }

    const open = e.target.closest('[data-open-design]');
    if (open) return openDesign(open.dataset.openDesign, open);

    const guide = e.target.closest('[data-open-guide]');
    if (guide) return openGuide(guide.dataset.openGuide, guide);

    if (e.target.closest('[data-pin-site]')) {
      window.open(pinterestUrl({ description: 'elitedesigner — Beautiful Walls. Inspired Living. Luxury architectural TV wall designs and mirror decor curation.', media: DESIGNS[0].image }), '_blank', 'noopener,width=750,height=600');
    }
  });

  /* Viewer controls */
  $$('[data-viewer-close]', viewer).forEach((b) => b.addEventListener('click', closeDesign));
  $('[data-viewer-prev]', viewer).addEventListener('click', () => step(-1));
  $('[data-viewer-next]', viewer).addEventListener('click', () => step(1));
  el.zoom.addEventListener('click', () => setZoom(!viewer.classList.contains('is-zoomed')));
  el.img.addEventListener('click', () => setZoom(!viewer.classList.contains('is-zoomed')));
  $('[data-viewer-pin]', viewer).addEventListener('click', () => pin(DESIGNS[index]));
  $('[data-viewer-share]', viewer).addEventListener('click', share);
  el.palette.addEventListener('click', async (e) => {
    const sw = e.target.closest('[data-hex]');
    if (!sw) return;
    const ok = await copyText(sw.dataset.hex);
    el.paletteMsg.textContent = ok ? `Copied ${sw.dataset.hex} to clipboard.` : `Tone ${sw.dataset.hex}`;
    /* Motion spring gives the swatch a tactile pop */
    if (window.Motion && !reducedMotion) window.Motion.animate(sw, { scaleY: [0.86, 1] }, { type: 'spring', stiffness: 420, damping: 14 });
  });

  /* Touch: swipe the stage to navigate */
  let touchX = null;
  const stage = $('[data-viewer-stage]', viewer);
  stage.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    touchX = null;
  }, { passive: true });

  /* Field note controls */
  $$('[data-note-close]', note).forEach((b) => b.addEventListener('click', () => closeGuide()));
  $('[data-note-related]', note).addEventListener('click', (e) => {
    const row = e.target.closest('[data-result]');
    if (row) { const back = lastFocus; closeGuide(() => openDesign(row.dataset.result, back)); }
  });

  /* Keyboard */
  window.addEventListener('keydown', (e) => {
    if (!viewer.hidden) {
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      else if (e.key === 'Escape') closeDesign();
      else trapFocus($('.viewer__panel', viewer), e);
    } else if (!note.hidden) {
      if (e.key === 'Escape') closeGuide();
      else trapFocus($('.note__panel', note), e);
    }
  });

  /* Deep link: /#design-7 opens that salon */
  const match = window.location.hash.match(/^#design-(\d+)$/);
  if (match) openDesign(match[1]);
}
  Object.assign(__exports, { openDesign, initModal });
});

/* ---------- js/search.js ---------- */
__define("search.js", function (__exports, __require) {
  var { DESIGNS, CATEGORY_LABEL, POPULAR_SEARCHES, SEARCH_PLACEHOLDER } = __require("data.js");
  var { $, $$, escapeHtml, refreshIcons, lockScroll, trapFocus, closeOverlay } = __require("utils.js");
  var { rowTemplate } = __require("gallery.js");
  var { openDesign } = __require("modal.js");
/* ==========================================================================
   search.js — global live search overlay (⌘K / Ctrl+K / "/")
   Searches the real curation data: title, description, surface, frame,
   sub-category, style, room and category.
   ========================================================================== */





let overlay, input, results, meta, clearBtn, lastFocus;

/* Words people use interchangeably for the same material / form */
const SYNONYMS = {
  wood: ['wood', 'oak', 'walnut', 'ash'],
  wooden: ['wood', 'oak', 'walnut', 'ash'],
  fluted: ['fluted', 'fluting', 'slat'],
  slat: ['slat'],
  antique: ['antique', 'antiqued', 'distressed'],
  stone: ['marble', 'travertine', 'concrete', 'cement'],
  tv: ['tv', 'television', 'media'],
};

const INDEX = DESIGNS.map((d) => ({
  item: d,
  text: [d.title, d.description, d.surface, d.frame, d.subCategory, d.style, d.room, CATEGORY_LABEL[d.category]].join(' ').toLowerCase(),
}));

const tokenize = (q) => q.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  .map((t) => (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t));       // "mirrors" → "mirror"
const variants = (t) => SYNONYMS[t] || [t];
const hit = (text, token) => variants(token).some((v) => (v.length <= 2 ? new RegExp(`\\b${v}\\b`).test(text) : text.includes(v)));

function searchDesigns(query) {
  const tokens = tokenize(query);
  if (!tokens.length) return { tokens, matches: [], exact: true };
  const scored = INDEX.map(({ item, text }) => ({ item, score: tokens.filter((t) => hit(text, t)).length })).filter((r) => r.score);
  const full = scored.filter((r) => r.score === tokens.length);
  /* every word matched → exact; otherwise fall back to the closest partial matches */
  const list = (full.length ? full : scored.sort((a, b) => b.score - a.score)).map((r) => r.item);
  return { tokens, matches: list, exact: full.length > 0 };
}

function highlighter(tokens) {
  const words = [...new Set(tokens.flatMap(variants))].filter((w) => w.length > 1).sort((a, b) => b.length - a.length);
  if (!words.length) return (s) => escapeHtml(s);
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return (s) => escapeHtml(s).replace(re, '<mark>$1</mark>');
}

function run(query) {
  const q = query.trim();
  clearBtn.hidden = !q;
  if (!q) {
    meta.textContent = 'Type to search architectural TV walls, custom mirrors, marble species, and layouts.';
    results.innerHTML = '';
    return;
  }
  const { tokens, matches, exact } = searchDesigns(q);
  if (!matches.length) {
    meta.textContent = '';
    results.innerHTML = `<div class="search__empty"><strong>No curations found for “${escapeHtml(q)}”</strong>Try “Marble”, “Slat”, “Arched”, “Travertine”, or “Round”.</div>`;
    return;
  }
  meta.textContent = exact
    ? `${matches.length} ${matches.length === 1 ? 'curation' : 'curations'} for “${q}”`
    : `No exact match for “${q}” — ${matches.length} closest ${matches.length === 1 ? 'curation' : 'curations'}`;
  const mark = highlighter(tokens);
  results.innerHTML = matches.map((d) => rowTemplate(d, mark)).join('');
  results.scrollTop = 0;
  refreshIcons();
}

function openSearch(query = '') {
  if (overlay.hidden) {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    lockScroll('search', true);
  }
  input.value = query;
  run(query);
  requestAnimationFrame(() => input.focus({ preventScroll: true }));
}

function closeSearch(then) {
  closeOverlay(overlay, () => {
    lockScroll('search', false);
    then ? then() : lastFocus && document.contains(lastFocus) && lastFocus.focus({ preventScroll: true });
  });
}

function initSearch() {
  overlay = $('[data-search]');
  input = $('[data-search-input]', overlay);
  results = $('[data-search-results]', overlay);
  meta = $('[data-search-meta]', overlay);
  clearBtn = $('[data-search-clear]', overlay);
  input.placeholder = SEARCH_PLACEHOLDER;

  $('[data-search-popular]', overlay).innerHTML = POPULAR_SEARCHES
    .map((p) => `<button class="pill" type="button" data-popular="${escapeHtml(p)}">${escapeHtml(p)}</button>`).join('');

  $$('[data-search-open]').forEach((b) => b.addEventListener('click', () => openSearch()));
  $$('[data-search-close]', overlay).forEach((b) => b.addEventListener('click', () => closeSearch()));
  input.addEventListener('input', () => run(input.value));
  clearBtn.addEventListener('click', () => { input.value = ''; run(''); input.focus(); });

  overlay.addEventListener('click', (e) => {
    const popular = e.target.closest('[data-popular]');
    if (popular) { input.value = popular.dataset.popular; run(input.value); input.focus(); return; }
    const row = e.target.closest('[data-result]');
    if (row) { const back = lastFocus; closeSearch(() => openDesign(row.dataset.result, back)); }
  });

  window.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); overlay.hidden ? openSearch() : closeSearch(); return; }
    if (e.key === '/' && !typing && overlay.hidden && !document.documentElement.classList.contains('is-locked')) { e.preventDefault(); openSearch(); return; }
    if (overlay.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); closeSearch(); }
    else if (e.key === 'Enter' && document.activeElement === input) { $('[data-result]', results)?.click(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const rows = $$('[data-result]', results);
      if (!rows.length) return;
      e.preventDefault();
      const i = rows.indexOf(document.activeElement);
      const next = e.key === 'ArrowDown' ? i + 1 : i - 1;
      (next < 0 || next >= rows.length ? input : rows[next]).focus();
    } else trapFocus($('.search__panel', overlay), e);
  });
}
  Object.assign(__exports, { searchDesigns, openSearch, initSearch });
});

/* ---------- js/newsletter.js ---------- */
__define("newsletter.js", function (__exports, __require) {
  var { CONFIG } = __require("data.js");
  var { $, $$ } = __require("utils.js");
/* ==========================================================================
   newsletter.js — Private Salon Dispatch sign-up
   --------------------------------------------------------------------------
   BACKEND REQUIRED: set CONFIG.NEWSLETTER_ENDPOINT in js/data.js to your
   mailing provider's POST URL. Until then the form validates the address
   and keeps it in this browser's localStorage only — no email is sent and
   the visitor is told so.
   ========================================================================== */



const STORE_KEY = 'elitedesigner:dispatch';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function submit(email) {
  if (CONFIG.NEWSLETTER_ENDPOINT) {
    const res = await fetch(CONFIG.NEWSLETTER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, source: 'private-salon-dispatch' }),
    });
    if (!res.ok) throw new Error(`Subscription failed (${res.status})`);
    return 'remote';
  }
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ email, at: new Date().toISOString() })); } catch { /* private mode */ }
  return 'local';
}

function initNewsletter() {
  const form = $('[data-newsletter]');
  if (!form) return;
  const input = $('input', form);
  const button = $('button', form);
  const msg = $('[data-newsletter-msg]');

  /* Social links come from config so they are edited in one place */
  $$('[data-social]').forEach((a) => { const url = CONFIG.SOCIAL[a.dataset.social]; if (url) a.href = url; });

  input.addEventListener('input', () => { form.classList.remove('is-invalid'); input.removeAttribute('aria-invalid'); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = input.value.trim();
    if (!EMAIL_RE.test(email)) {
      form.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
      msg.textContent = 'Please enter a valid email address.';
      input.focus();
      return;
    }
    button.disabled = true;
    button.textContent = 'Joining…';
    try {
      const mode = await submit(email);
      form.reset();
      msg.textContent = mode === 'remote'
        ? 'Welcome to the Private Salon Dispatch.'
        : 'Thank you — your address is noted on this device. Dispatches begin once our mailing service is connected.';
    } catch {
      msg.textContent = 'We could not complete the sign-up just now. Please try again shortly.';
    } finally {
      button.disabled = false;
      button.textContent = 'Join';
    }
  });
}
  Object.assign(__exports, { initNewsletter });
});

__require("main.js");
})();
