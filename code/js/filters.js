/* ==========================================================================
   filters.js — category pills, style taxonomy and load-more for the 3 grids
   Filter semantics mirror the original site: a key matches when it equals
   the entry's subCategory OR its style.
   ========================================================================== */
import { DESIGNS, FEED_FILTERS, TV_FILTERS, MIRROR_FILTERS } from './data.js';
import { $, $$, escapeHtml, refreshIcons, reducedMotion, scrollToTarget, killTriggersIn } from './utils.js';
import { renderCards, appendCards } from './gallery.js';

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
export function applyStyle(style) {
  const g = GROUPS.feed;
  g.style = style;
  renderPills('feed');
  swap('feed');
  scrollToTarget('#latest', { offset: -20 });
}

export function initFilters() {
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
