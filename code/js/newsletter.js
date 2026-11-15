/* ==========================================================================
   newsletter.js — Private Salon Dispatch sign-up
   --------------------------------------------------------------------------
   BACKEND REQUIRED: set CONFIG.NEWSLETTER_ENDPOINT in js/data.js to your
   mailing provider's POST URL. Until then the form validates the address
   and keeps it in this browser's localStorage only — no email is sent and
   the visitor is told so.
   ========================================================================== */
import { CONFIG } from './data.js';
import { $, $$ } from './utils.js';

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

export function initNewsletter() {
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
