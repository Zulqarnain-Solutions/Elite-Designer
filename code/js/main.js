/* ==========================================================================
   elitedesigner — entry point
   No build step: native ES modules + CDN libraries (GSAP, ScrollTrigger,
   Lenis, Motion, Lucide) loaded as deferred globals in index.html.
   ========================================================================== */
import { refreshIcons } from './utils.js';
import { setupMotion, initAnimations } from './animations.js';
import { initNavigation } from './navigation.js';
import { initSalons } from './gallery.js';
import { initFilters } from './filters.js';
import { initModal } from './modal.js';
import { initSearch } from './search.js';
import { initNewsletter } from './newsletter.js';

function boot() {
  const steps = [setupMotion, initSalons, initFilters, initModal, initSearch, initNewsletter, initNavigation, refreshIcons, initAnimations];
  steps.forEach((step) => {
    try { step(); } catch (err) { console.error(`[elitedesigner] ${step.name} failed`, err); }
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
