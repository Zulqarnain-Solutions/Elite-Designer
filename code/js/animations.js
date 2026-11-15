/* ==========================================================================
   animations.js — Lenis + GSAP/ScrollTrigger choreography
   Responsibilities:
     • Lenis ............ smooth scrolling (synced to the GSAP ticker)
     • GSAP ............. hero timeline, reveals, parallax, arc, SVG drawing
     • Motion ........... spring-based magnetic buttons (only)
     • CSS .............. marquee loop, floating labels, overlay entrances
   Everything is skipped under prefers-reduced-motion.
   ========================================================================== */
import { $, $$, state, reducedMotion, finePointer } from './utils.js';

/** Register plugins + start Lenis. Must run before any card is rendered. */
export function setupMotion() {
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

export function initAnimations() {
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
