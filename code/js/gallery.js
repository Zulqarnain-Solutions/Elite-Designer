/* ==========================================================================
   gallery.js — card templates, grid rendering and the Living Room rail
   ========================================================================== */
import { DESIGNS, CATEGORY_LABEL, FOCUS } from './data.js';
import { $, escapeHtml, pad2, refreshIcons, animateIn, killTriggersIn, refreshScroll } from './utils.js';

const focusStyle = (item) => (FOCUS[item.id] ? ` style="object-position:${FOCUS[item.id]}"` : '');

/** Editorial design card (used by the feed, TV and mirror grids) */
export function cardTemplate(item) {
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
export function rowTemplate(item, highlight = (s) => escapeHtml(s)) {
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
export function renderCards(container, items, { emptyText = 'No curations in this selection yet.' } = {}) {
  killTriggersIn(container);
  container.innerHTML = items.length
    ? items.map(cardTemplate).join('')
    : `<p class="grid__empty">${escapeHtml(emptyText)}</p>`;
  refreshIcons();
  animateIn([...container.children]);
  refreshScroll();
}

/** Append more cards without disturbing those already shown */
export function appendCards(container, items) {
  const tpl = document.createElement('template');
  tpl.innerHTML = items.map(cardTemplate).join('');
  const added = [...tpl.content.children];
  container.append(...added);
  refreshIcons();
  animateIn(added);
  refreshScroll();
}

/** Living Room Wall Salons — horizontal rail (original: first six curations) */
export function initSalons() {
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
