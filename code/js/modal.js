/* ==========================================================================
   modal.js — premium design detail viewer + field-note dialog
   Keyboard: ← previous · → next · Esc close
   ========================================================================== */
import { DESIGNS, GUIDES, CATEGORY_LABEL, DEFAULT_SPECS } from './data.js';
import { $, $$, escapeHtml, pad2, refreshIcons, lockScroll, trapFocus, closeOverlay, toast, copyText, pinterestUrl, reducedMotion } from './utils.js';
import { rowTemplate } from './gallery.js';

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

export function openDesign(id, trigger) {
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
export function initModal() {
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
