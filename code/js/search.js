/* ==========================================================================
   search.js — global live search overlay (⌘K / Ctrl+K / "/")
   Searches the real curation data: title, description, surface, frame,
   sub-category, style, room and category.
   ========================================================================== */
import { DESIGNS, CATEGORY_LABEL, POPULAR_SEARCHES, SEARCH_PLACEHOLDER } from './data.js';
import { $, $$, escapeHtml, refreshIcons, lockScroll, trapFocus, closeOverlay } from './utils.js';
import { rowTemplate } from './gallery.js';
import { openDesign } from './modal.js';

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

export function searchDesigns(query) {
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

export function openSearch(query = '') {
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

export function initSearch() {
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
