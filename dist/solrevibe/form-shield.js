/**
 * SOL REViBE Centralized Form & Bot Protection (SOLFormShield)
 * Reusable across all existing and future pages containing signup, registration,
 * contact, lead capture, voucher, booking, or checkout forms.
 *
 * Features:
 *   - Invisible Cloudflare Turnstile / Google reCAPTCHA v3 integration
 *   - Hidden decoy honeypot inputs (screen-reader & tab safe)
 *   - Unified human input validation (names, emails, disposable domains, phone, ZIP)
 *   - Client & server rate limiting + signed timing token
 *   - Duplicate contact / opportunity prevention before CRM sync
 *   - Vision Control pause status awareness
 *   - Automatic MutationObserver protection for newly added/future forms
 */
(function (window, document) {
  'use strict';

  const currentScript = document.currentScript;
  function resolveApiBase() {
    if (currentScript && currentScript.src) {
      try {
        return new URL('api/', currentScript.src).pathname.replace(/\/$/, '');
      } catch (_) {}
    }
    return '/api';
  }

  const API_BASE = resolveApiBase();
  const RL_KEY = 'solrevibe_shield_rl_v1';
  const DUP_KEY = 'solrevibe_shield_dup_v1';
  const DISPOSABLE_DOMAINS = new Set([
    '10minutemail.com', '10minutemail.net', '20minutemail.com', 'burnermail.io',
    'dispostable.com', 'dropmail.me', 'emailondeck.com', 'fakeinbox.com',
    'getairmail.com', 'getnada.com', 'guerrillamail.biz', 'guerrillamail.com',
    'guerrillamail.de', 'guerrillamail.info', 'guerrillamail.net', 'guerrillamail.org',
    'harakirimail.com', 'inboxbear.com', 'jetable.org', 'mailcatch.com',
    'maildrop.cc', 'mailinator.com', 'mailinator.net', 'mailnesia.com',
    'mintemail.com', 'mohmal.com', 'mytemp.email', 'nada.email',
    'sharklasers.com', 'spam4.me', 'spamgourmet.com', 'temp-mail.io',
    'temp-mail.org', 'tempail.com', 'tempmail.com', 'tempmail.net',
    'tempmailo.com', 'throwawaymail.com', 'trashmail.com', 'trashmail.net',
    'yopmail.com', 'yopmail.fr', 'yopmail.net',
  ]);

  let configPromise = null;
  let cachedConfig = {
    captchaProvider: 'none',
    captchaMode: 'none',
    siteKey: '',
    captchaRequired: false,
    visualChallengeRequired: false,
    visualChallenge: null,
    vcIntegrationEnabled: false,
    vcPaused: true,
    formToken: '',
  };
  let turnstileLoader = null;
  let recaptchaLoader = null;
  let recaptchaV2Loader = null;
  let userInteracted = false;

  const markInteracted = () => { userInteracted = true; };
  ['pointerdown', 'keydown', 'touchstart', 'focusin'].forEach(evt => {
    window.addEventListener(evt, markInteracted, { once: true, passive: true });
  });

  function injectShieldStyles() {
    if (document.getElementById('sol-form-shield-styles')) return;
    const style = document.createElement('style');
    style.id = 'sol-form-shield-styles';
    style.textContent = `
      .sol-hp-wrap {
        position: absolute !important;
        left: -9999px !important;
        top: -9999px !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .sol-captcha-slot {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        margin: 10px 0 12px;
        min-height: 0;
        width: 100%;
      }
      .sol-provider-slot {
        display: flex;
        justify-content: center;
        width: 100%;
      }
      .sol-visual-gate {
        width: 100%;
        max-width: 340px;
        background: #faf8f4;
        border: 1px solid rgba(43, 41, 38, 0.14);
        border-radius: 12px;
        padding: 11px 12px 12px;
        box-sizing: border-box;
        text-align: left;
        color: #2b2926;
        font-family: inherit;
      }
      .sol-visual-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 8px;
      }
      .sol-visual-title {
        font-size: 0.85rem;
        font-weight: 700;
        color: #2b2926;
        line-height: 1.25;
      }
      .sol-visual-sub {
        font-size: 0.74rem;
        font-weight: 500;
        color: #6b655c;
        display: block;
        margin-top: 2px;
      }
      .sol-visual-refresh {
        border: 1px solid rgba(43, 41, 38, 0.16);
        background: #ffffff;
        color: #4a453f;
        font-size: 0.72rem;
        font-weight: 600;
        border-radius: 8px;
        padding: 4px 8px;
        cursor: pointer;
        flex-shrink: 0;
      }
      .sol-visual-refresh:hover {
        background: #f1ede4;
      }
      .sol-visual-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 7px;
      }
      .sol-visual-tile {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 60px;
        border-radius: 10px;
        border: 1.5px solid rgba(43, 41, 38, 0.14);
        background: #ffffff;
        cursor: pointer;
        padding: 6px;
        transition: border-color 0.15s ease, background-color 0.15s ease;
      }
      .sol-visual-tile:hover {
        border-color: #9c733e;
      }
      .sol-visual-tile svg {
        width: 34px;
        height: 34px;
        pointer-events: none;
      }
      .sol-visual-tile.is-selected {
        border-color: #7a8776;
        background: rgba(122, 135, 118, 0.14);
        box-shadow: inset 0 0 0 1px #7a8776;
      }
      .sol-visual-tile.is-selected::after {
        content: "✓";
        position: absolute;
        top: 4px;
        right: 6px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #7a8776;
        color: #ffffff;
        font-size: 10px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
      }
      .sol-shield-feedback {
        margin-top: 10px;
        padding: 10px 14px;
        border-radius: 10px;
        font-size: 0.86rem;
        font-weight: 500;
        line-height: 1.4;
        text-align: left;
      }
      .sol-shield-feedback.is-error {
        background: rgba(185, 28, 28, 0.08);
        border: 1px solid rgba(185, 28, 28, 0.28);
        color: #991b1b;
      }
      .sol-shield-feedback.is-success {
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.32);
        color: #065f46;
      }
    `;
    document.head.appendChild(style);
  }

  async function fetchConfig(forceRefresh = false) {
    if (configPromise && !forceRefresh) return configPromise;
    configPromise = fetch(`${API_BASE}/form-security-config`, {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data && data.ok) {
          cachedConfig = Object.assign({}, cachedConfig, data);
        }
        return cachedConfig;
      })
      .catch(() => cachedConfig);
    return configPromise;
  }

  function loadTurnstileScript() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (turnstileLoader) return turnstileLoader;
    turnstileLoader = new Promise((resolve) => {
      const existing = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
      if (existing) {
        const poll = setInterval(() => {
          if (window.turnstile) { clearInterval(poll); resolve(window.turnstile); }
        }, 60);
        setTimeout(() => { clearInterval(poll); resolve(window.turnstile || null); }, 6000);
        return;
      }
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.defer = true;
      s.onload = () => resolve(window.turnstile || null);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
    return turnstileLoader;
  }

  function loadRecaptchaScript(siteKey) {
    if (window.grecaptcha && typeof window.grecaptcha.execute === 'function') {
      return Promise.resolve(window.grecaptcha);
    }
    if (recaptchaLoader) return recaptchaLoader;
    recaptchaLoader = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      s.async = true;
      s.defer = true;
      s.onload = () => {
        if (window.grecaptcha && window.grecaptcha.ready) {
          window.grecaptcha.ready(() => resolve(window.grecaptcha));
        } else {
          resolve(window.grecaptcha || null);
        }
      };
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
    return recaptchaLoader;
  }

  function loadRecaptchaV2Script() {
    if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
      return Promise.resolve(window.grecaptcha);
    }
    if (recaptchaV2Loader) return recaptchaV2Loader;
    recaptchaV2Loader = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      s.async = true;
      s.defer = true;
      s.onload = () => {
        if (window.grecaptcha && window.grecaptcha.ready) {
          window.grecaptcha.ready(() => resolve(window.grecaptcha));
        } else {
          resolve(window.grecaptcha || null);
        }
      };
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
    return recaptchaV2Loader;
  }

  function ensureRecaptchaV2Widget(containerEl, cfg) {
    if (!containerEl || cfg.captchaProvider !== 'recaptcha' || cfg.captchaMode !== 'v2' || !cfg.siteKey) {
      return Promise.resolve(null);
    }
    if (containerEl.dataset.grWidgetId !== undefined) {
      return Promise.resolve(containerEl.dataset.grWidgetId);
    }
    return loadRecaptchaV2Script().then(gr => {
      if (!gr || typeof gr.render !== 'function') return null;
      if (containerEl.dataset.grWidgetId !== undefined) return containerEl.dataset.grWidgetId;
      try {
        const wid = gr.render(containerEl, {
          sitekey: cfg.siteKey,
          theme: 'light',
          callback: (token) => {
            containerEl._grToken = token;
          },
          'expired-callback': () => {
            containerEl._grToken = '';
          },
          'error-callback': () => {
            containerEl._grToken = '';
          },
        });
        containerEl.dataset.grWidgetId = String(wid);
        return String(wid);
      } catch (_) {
        return null;
      }
    });
  }

  function ensureHoneypots(form) {
    if (!form || form.querySelector('.sol-hp-wrap')) return;
    const wrap = document.createElement('div');
    wrap.className = 'sol-hp-wrap';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = [
      '<label>Leave this field empty<input type="text" name="website_url" tabindex="-1" autocomplete="new-password" value=""></label>',
      '<label>Do not fill<input type="email" name="hp_email" tabindex="-1" autocomplete="new-password" value=""></label>',
    ].join('');
    form.insertBefore(wrap, form.firstChild);
    if (!form.dataset.solMountedAt) {
      form.dataset.solMountedAt = String(Date.now());
    }
  }

  function readHoneypots(form) {
    const hp = {};
    if (!form) return hp;
    ['website_url', 'hp_email', '_gotcha', 'company_website'].forEach(name => {
      const el = form.querySelector(`[name="${name}"]`);
      if (el) hp[name] = String(el.value || '');
    });
    return hp;
  }

  function ensureTurnstileWidget(containerEl, cfg) {
    if (!containerEl || cfg.captchaProvider !== 'turnstile' || !cfg.siteKey) {
      return Promise.resolve(null);
    }
    if (containerEl.dataset.tsWidgetId !== undefined) {
      return Promise.resolve(containerEl.dataset.tsWidgetId);
    }
    return loadTurnstileScript().then(ts => {
      if (!ts || typeof ts.render !== 'function') return null;
      if (containerEl.dataset.tsWidgetId !== undefined) return containerEl.dataset.tsWidgetId;
      try {
        const id = ts.render(containerEl, {
          sitekey: cfg.siteKey,
          execution: 'execute',
          appearance: 'interaction-only',
          size: 'flexible',
          theme: 'light',
          callback: (token) => {
            containerEl._tsToken = token;
            if (typeof containerEl._tsResolve === 'function') {
              const fn = containerEl._tsResolve;
              containerEl._tsResolve = null;
              fn(token);
            }
          },
          'error-callback': () => {
            if (typeof containerEl._tsResolve === 'function') {
              const fn = containerEl._tsResolve;
              containerEl._tsResolve = null;
              fn('');
            }
          },
          'expired-callback': () => {
            containerEl._tsToken = '';
          },
        });
        containerEl.dataset.tsWidgetId = String(id);
        return String(id);
      } catch (_) {
        return null;
      }
    });
  }

  function getCaptchaSlot(form) {
    if (!form) return null;
    let slot = form.querySelector('.sol-captcha-slot');
    if (!slot) {
      slot = document.createElement('div');
      slot.className = 'sol-captcha-slot';
      const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      if (submitBtn && submitBtn.parentNode === form) {
        form.insertBefore(slot, submitBtn);
      } else if (submitBtn && submitBtn.parentNode) {
        submitBtn.parentNode.insertBefore(slot, submitBtn);
      } else {
        form.appendChild(slot);
      }
    }
    return slot;
  }

  function getProviderSlot(slot) {
    if (!slot) return null;
    let pSlot = slot.querySelector('.sol-provider-slot');
    if (!pSlot) {
      pSlot = document.createElement('div');
      pSlot.className = 'sol-provider-slot';
      slot.appendChild(pSlot);
    }
    return pSlot;
  }

  function renderVisualGateIntoSlot(slot, challenge) {
    if (!slot || !challenge || !Array.isArray(challenge.tiles)) return;
    let gate = slot.querySelector('.sol-visual-gate');
    if (!gate) {
      gate = document.createElement('div');
      gate.className = 'sol-visual-gate';
      const pSlot = slot.querySelector('.sol-provider-slot');
      if (pSlot) {
        slot.insertBefore(gate, pSlot);
      } else {
        slot.appendChild(gate);
      }
    }

    slot._visualSelected = new Set();
    slot._visualToken = challenge.visualToken || '';
    slot._visualPrompt = challenge.prompt || 'Tap matching images';

    gate.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'sol-visual-head';

    const titleWrap = document.createElement('div');
    const titleEl = document.createElement('span');
    titleEl.className = 'sol-visual-title';
    titleEl.textContent = challenge.prompt || 'Tap matching images';
    const subEl = document.createElement('span');
    subEl.className = 'sol-visual-sub';
    subEl.textContent = `Human check — select ${challenge.targetCount || 'all'} matching image${challenge.targetCount === 1 ? '' : 's'}`;
    titleWrap.appendChild(titleEl);
    titleWrap.appendChild(subEl);

    const refreshBtn = document.createElement('button');
    refreshBtn.type = 'button';
    refreshBtn.className = 'sol-visual-refresh';
    refreshBtn.setAttribute('aria-label', 'Load new images');
    refreshBtn.textContent = '↻ New';
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      const fresh = await fetchConfig(true);
      if (fresh && fresh.visualChallenge) {
        renderVisualGateIntoSlot(slot, fresh.visualChallenge);
      }
      refreshBtn.disabled = false;
    });

    head.appendChild(titleWrap);
    head.appendChild(refreshBtn);
    gate.appendChild(head);

    const grid = document.createElement('div');
    grid.className = 'sol-visual-grid';
    challenge.tiles.forEach((svgMarkup, idx) => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'sol-visual-tile';
      tile.setAttribute('aria-pressed', 'false');
      tile.setAttribute('aria-label', `Image ${idx + 1}`);
      tile.innerHTML = svgMarkup;
      tile.addEventListener('click', () => {
        if (slot._visualSelected.has(idx)) {
          slot._visualSelected.delete(idx);
          tile.classList.remove('is-selected');
          tile.setAttribute('aria-pressed', 'false');
        } else {
          slot._visualSelected.add(idx);
          tile.classList.add('is-selected');
          tile.setAttribute('aria-pressed', 'true');
        }
      });
      grid.appendChild(tile);
    });
    gate.appendChild(grid);
  }

  function refreshAllVisualGates(challenge) {
    if (!challenge) return;
    cachedConfig.visualChallenge = challenge;
    document.querySelectorAll('.sol-captcha-slot').forEach(slot => {
      if (slot.querySelector('.sol-visual-gate')) {
        renderVisualGateIntoSlot(slot, challenge);
      }
    });
  }

  async function executeCaptcha(containerEl, action = 'submit') {
    const cfg = await fetchConfig();
    if (!cfg.captchaRequired || !cfg.siteKey) {
      return '';
    }
    if (cfg.captchaProvider === 'turnstile') {
      const wid = await ensureTurnstileWidget(containerEl, cfg);
      if (!wid || !window.turnstile) return '';
      if (containerEl._tsToken) {
        const tok = containerEl._tsToken;
        containerEl._tsToken = '';
        return tok;
      }
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          containerEl._tsResolve = null;
          resolve(containerEl._tsToken || '');
        }, 10000);
        containerEl._tsResolve = (tok) => {
          clearTimeout(timer);
          resolve(tok || '');
        };
        try {
          window.turnstile.reset(wid);
          window.turnstile.execute(wid);
        } catch (_) {
          clearTimeout(timer);
          resolve('');
        }
      });
    }
    if (cfg.captchaProvider === 'recaptcha') {
      if (cfg.captchaMode === 'v2') {
        const wid = await ensureRecaptchaV2Widget(containerEl, cfg);
        if (wid !== null && window.grecaptcha && typeof window.grecaptcha.getResponse === 'function') {
          return window.grecaptcha.getResponse(Number(wid)) || (containerEl && containerEl._grToken) || '';
        }
        return (containerEl && containerEl._grToken) || '';
      }
      const gr = await loadRecaptchaScript(cfg.siteKey);
      if (!gr || typeof gr.execute !== 'function') return '';
      try {
        return await gr.execute(cfg.siteKey, { action: action.replace(/[^a-zA-Z0-9_]/g, '_') || 'submit' });
      } catch (_) {
        return '';
      }
    }
    return '';
  }

  function validateNameText(v) {
    const val = String(v || '').trim();
    if (val.length < 2 || val.length > 80) return false;
    if (/<|>|https?:\/\/|www\./i.test(val)) return false;
    if (/(.)\1{4,}/i.test(val)) return false;
    const letters = val.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g);
    return Boolean(letters && letters.length >= 2);
  }

  function validateEmailText(raw) {
    const v = String(raw || '').trim().toLowerCase();
    if (!/^[^\s@<>()[\]\\,;:\"]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(v)) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }
    const domain = v.split('@')[1] || '';
    const tld = domain.split('.').pop() || '';
    if (tld.length < 2 || /^\d+$/.test(tld)) {
      return { ok: false, error: 'Please enter a valid email domain.' };
    }
    if (DISPOSABLE_DOMAINS.has(domain)) {
      return { ok: false, error: 'Please use a permanent personal or business email address.' };
    }
    return { ok: true, normalized: v };
  }

  function validatePhoneText(raw) {
    let digits = String(raw || '').replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
    if (digits.length < 10 || digits.length > 15) {
      return { ok: false, error: 'Please enter a valid 10-digit or international phone number.' };
    }
    if (/^(\d)\1+$/.test(digits) || digits === '1234567890' || digits === '0123456789') {
      return { ok: false, error: 'Please enter a real phone number.' };
    }
    if (digits.length === 10 && (/^[01]/.test(digits) || /^[01]/.test(digits.slice(3)))) {
      return { ok: false, error: 'Please enter a valid US/Canada phone number.' };
    }
    return { ok: true, normalized: digits };
  }

  function findField(form, patterns) {
    if (!form) return null;
    for (const sel of patterns) {
      const el = form.querySelector(sel);
      if (el && !el.closest('.sol-hp-wrap') && el.type !== 'hidden') return el;
    }
    return null;
  }

  function validateFormInputs(form, opts = {}) {
    if (!form) return { ok: true };
    if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
      if (typeof form.reportValidity === 'function') form.reportValidity();
      return { ok: false, nativeInvalid: true, error: 'Please complete all required fields.' };
    }

    const hp = readHoneypots(form);
    if (Object.values(hp).some(v => String(v).trim() !== '')) {
      return { ok: false, bot: true, error: 'Submission blocked by bot protection.' };
    }

    const emailEl = findField(form, ['input[type="email"]', 'input[name*="email" i]', 'input[id*="email" i]']);
    if (emailEl && (emailEl.value.trim() || emailEl.required || opts.requireEmail)) {
      const check = validateEmailText(emailEl.value);
      if (!check.ok) return { ok: false, error: check.error, field: emailEl };
    }

    const phoneEl = findField(form, ['input[type="tel"]', 'input[name*="phone" i]', 'input[id*="phone" i]']);
    if (phoneEl && (phoneEl.value.trim() || phoneEl.required || opts.requirePhone)) {
      const check = validatePhoneText(phoneEl.value);
      if (!check.ok) return { ok: false, error: check.error, field: phoneEl };
    }

    const nameFields = Array.from(form.querySelectorAll('input[type="text"]')).filter(el => {
      if (el.closest('.sol-hp-wrap')) return false;
      const hint = `${el.name} ${el.id} ${el.placeholder}`.toLowerCase();
      return /name|first|last/.test(hint) && !/company|business|org|station|address/.test(hint);
    });
    for (const nf of nameFields) {
      const val = nf.value.trim();
      if ((val || nf.required) && !validateNameText(val)) {
        return { ok: false, error: 'Please enter a valid name without links or invalid characters.', field: nf };
      }
    }

    const zipEl = findField(form, ['input[name*="zip" i]', 'input[id*="zip" i]']);
    if (zipEl && (zipEl.value.trim() || zipEl.required || opts.requireZip)) {
      if (!/^\d{5}(?:-\d{4})?$/.test(zipEl.value.trim())) {
        return { ok: false, error: 'Please enter a valid 5-digit ZIP code.', field: zipEl };
      }
    }

    return { ok: true };
  }

  function showFormFeedback(form, message, isSuccess = false) {
    if (!form) {
      if (message) alert(message);
      return;
    }
    const existingErr = form.querySelector('[data-sol-error], .error');
    if (existingErr && !isSuccess) {
      existingErr.textContent = message;
      existingErr.hidden = false;
      return;
    }
    let box = form.querySelector('.sol-shield-feedback');
    if (!message) {
      if (box) box.remove();
      return;
    }
    if (!box) {
      box = document.createElement('div');
      box.className = 'sol-shield-feedback';
      box.setAttribute('role', isSuccess ? 'status' : 'alert');
      form.appendChild(box);
    }
    box.className = `sol-shield-feedback ${isSuccess ? 'is-success' : 'is-error'}`;
    box.textContent = message;
  }

  function checkClientRateLimit() {
    const now = Date.now();
    try {
      const raw = localStorage.getItem(RL_KEY);
      const list = raw ? JSON.parse(raw).filter(t => typeof t === 'number' && now - t < 10 * 60 * 1000) : [];
      if (list.length >= 6) {
        return false;
      }
      list.push(now);
      localStorage.setItem(RL_KEY, JSON.stringify(list));
    } catch (_) {}
    return true;
  }

  function makeDedupSignature(payload, formType) {
    const email = String(payload.email || '').trim().toLowerCase();
    const digits = String(payload.phone || payload.phone_number || '').replace(/\D/g, '').slice(-10);
    if (!email && !digits) return '';
    return `${String(formType || 'lead').toLowerCase()}::${email}::${digits}`;
  }

  function isClientDuplicate(sig) {
    if (!sig) return false;
    const now = Date.now();
    try {
      const raw = JSON.parse(localStorage.getItem(DUP_KEY) || '{}');
      const exp = raw[sig];
      if (exp && exp > now) return true;
    } catch (_) {}
    return false;
  }

  function recordClientDuplicate(sig) {
    if (!sig) return;
    const now = Date.now();
    try {
      const raw = JSON.parse(localStorage.getItem(DUP_KEY) || '{}');
      const cleaned = {};
      Object.keys(raw).forEach(k => {
        if (raw[k] > now) cleaned[k] = raw[k];
      });
      cleaned[sig] = now + 12 * 60 * 60 * 1000;
      localStorage.setItem(DUP_KEY, JSON.stringify(cleaned));
    } catch (_) {}
  }

  function resolveFormEl(formOrSelector) {
    if (!formOrSelector) return null;
    if (typeof formOrSelector === 'string') return document.querySelector(formOrSelector);
    return formOrSelector;
  }

  async function protectForm(formOrSelector, options = {}) {
    injectShieldStyles();
    const form = resolveFormEl(formOrSelector);
    if (!form) return null;
    if (options.managed) form.dataset.solManaged = 'true';
    ensureHoneypots(form);
    const skipVisual = form.dataset.noVisualChallenge === 'true';
    const skipProvider = form.dataset.noProviderCaptcha === 'true';
    const slot = options.withCaptchaSlot !== false && !(skipVisual && skipProvider) ? getCaptchaSlot(form) : null;
    const cfg = await fetchConfig();
    if (!skipVisual && slot && cfg.visualChallengeRequired && cfg.visualChallenge) {
      renderVisualGateIntoSlot(slot, cfg.visualChallenge);
    }
    if (skipProvider) {
      return form;
    }
    const providerContainer = slot ? getProviderSlot(slot) : null;
    if (providerContainer && cfg.captchaRequired && cfg.captchaProvider === 'turnstile') {
      ensureTurnstileWidget(providerContainer, cfg);
    } else if (cfg.captchaRequired && cfg.captchaProvider === 'recaptcha') {
      if (cfg.captchaMode === 'v2' && providerContainer) {
        ensureRecaptchaV2Widget(providerContainer, cfg);
      } else {
        loadRecaptchaScript(cfg.siteKey);
      }
    }
    return form;
  }

  async function getSecurityPayload(formOrSelector, action = 'submit') {
    const form = resolveFormEl(formOrSelector);
    const cfg = await fetchConfig();
    const slot = form ? getCaptchaSlot(form) : null;
    const skipProvider = Boolean(form && form.dataset.noProviderCaptcha === 'true');
    const providerContainer = slot && !skipProvider ? getProviderSlot(slot) : null;
    const captchaToken = skipProvider ? '' : await executeCaptcha(providerContainer || slot, action);
    const mountedAt = Number((form && form.dataset.solMountedAt) || Date.now());
    const visualAnswer = slot && slot._visualSelected ? Array.from(slot._visualSelected).sort((a, b) => a - b) : [];
    const visualToken = (slot && slot._visualToken) || (cfg.visualChallenge && cfg.visualChallenge.visualToken) || '';
    return {
      captchaToken,
      formToken: cfg.formToken || '',
      visualToken,
      visualAnswer,
      mountedAt,
      interacted: Boolean(userInteracted || (Date.now() - mountedAt > 1200)),
      honeypot: readHoneypots(form),
    };
  }

  async function submitLead(formOrSelector, payload, options = {}) {
    const form = resolveFormEl(formOrSelector);
    const opts = Object.assign({
      formId: 'lead',
      allowRepeat: false,
      skipClientValidation: false,
      showErrors: true,
    }, options);

    if (form) {
      ensureHoneypots(form);
      if (opts.showErrors) showFormFeedback(form, '');
    }

    if (form && !opts.skipClientValidation) {
      const v = validateFormInputs(form, opts);
      if (!v.ok) {
        if (!v.nativeInvalid && opts.showErrors) showFormFeedback(form, v.error, false);
        if (v.field && typeof v.field.focus === 'function') v.field.focus();
        const err = new Error(v.error);
        err.code = v.bot ? 'BOT_DETECTED' : 'VALIDATION_ERROR';
        throw err;
      }
    }

    const sig = !opts.allowRepeat ? makeDedupSignature(payload, opts.formId) : '';
    if (sig && isClientDuplicate(sig)) {
      const msg = 'We already received your submission. Please check your inbox or wait before submitting again.';
      if (form && opts.showErrors) showFormFeedback(form, msg, false);
      const err = new Error(msg);
      err.code = 'DUPLICATE_SUBMISSION';
      err.duplicate = true;
      throw err;
    }

    const cfg = await fetchConfig();
    const sec = await getSecurityPayload(form, opts.formId);
    if (cfg.visualChallengeRequired && (!sec.visualToken || !Array.isArray(sec.visualAnswer) || sec.visualAnswer.length === 0)) {
      const promptLabel = (form && getCaptchaSlot(form) && getCaptchaSlot(form)._visualPrompt) || 'matching images';
      const msg = `Please complete the visual check ("${promptLabel}") above before submitting.`;
      if (form && opts.showErrors) showFormFeedback(form, msg, false);
      const err = new Error(msg);
      err.code = 'VISUAL_CHALLENGE_INCOMPLETE';
      throw err;
    }
    if (cfg.captchaRequired && cfg.captchaProvider === 'recaptcha' && cfg.captchaMode === 'v2' && !sec.captchaToken) {
      const msg = 'Please complete the "I\'m not a robot" verification checkbox before submitting.';
      if (form && opts.showErrors) showFormFeedback(form, msg, false);
      const err = new Error(msg);
      err.code = 'CAPTCHA_INCOMPLETE';
      throw err;
    }

    if (!checkClientRateLimit()) {
      const msg = 'Too many rapid submissions detected. Please wait a few minutes before trying again.';
      if (form && opts.showErrors) showFormFeedback(form, msg, false);
      const err = new Error(msg);
      err.code = 'RATE_LIMITED';
      throw err;
    }
    const body = Object.assign({}, payload, {
      formType: opts.formId,
      requireName: opts.requireName,
      requireEmail: opts.requireEmail,
      requirePhone: opts.requirePhone,
      requireCompany: opts.requireCompany,
      requireZip: opts.requireZip,
      allowRepeat: opts.allowRepeat,
      _security: sec,
    });

    const res = await fetch(`${API_BASE}/submit-lead`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      const msg = data.error || 'Submission could not be completed. Please try again.';
      if (form && opts.showErrors) showFormFeedback(form, msg, false);
      if (data.visualChallenge) {
        const slot = form ? getCaptchaSlot(form) : null;
        if (slot) renderVisualGateIntoSlot(slot, data.visualChallenge);
        else refreshAllVisualGates(data.visualChallenge);
      }
      if (data.code === 'CAPTCHA_FAILED' && cfg.captchaProvider === 'recaptcha' && cfg.captchaMode === 'v2' && form) {
        const slot = form.querySelector('.sol-provider-slot') || form.querySelector('.sol-captcha-slot');
        if (slot && slot.dataset.grWidgetId !== undefined && window.grecaptcha && window.grecaptcha.reset) {
          try { window.grecaptcha.reset(Number(slot.dataset.grWidgetId)); } catch (_) {}
          slot._grToken = '';
        }
      }
      const err = new Error(msg);
      err.status = res.status;
      err.code = data.code || 'SUBMIT_REJECTED';
      err.duplicate = Boolean(data.duplicate);
      throw err;
    }

    // Refresh single-use token & visual challenge for any follow-up forms
    fetchConfig(true).then(fresh => {
      if (fresh && fresh.visualChallenge) refreshAllVisualGates(fresh.visualChallenge);
    });
    if (sig) recordClientDuplicate(sig);
    return data;
  }

  async function submitTelemetry(payload, options = {}) {
    const cfg = await fetchConfig();
    const res = await fetch(`${API_BASE}/submit-lead`, {
      method: 'POST',
      credentials: 'same-origin',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(Object.assign({}, payload, {
        allowRepeat: true,
        requireName: false,
        requireEmail: false,
        _security: {
          formToken: cfg.formToken || '',
          mountedAt: Date.now() - 2000,
          interacted: true,
          honeypot: {},
        },
      })),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status));
    return data;
  }

  // Gate utility for embedded Vision Control calendar/waiver containers
  async function verifyGate(containerEl, onVerified) {
    injectShieldStyles();
    const cfg = await fetchConfig();
    if (cfg.vcPaused || !cfg.captchaRequired || !cfg.siteKey || !containerEl) {
      if (typeof onVerified === 'function') onVerified(cfg);
      return true;
    }
    const slot = document.createElement('div');
    slot.className = 'sol-captcha-slot';
    containerEl.appendChild(slot);
    if (cfg.captchaProvider === 'recaptcha' && cfg.captchaMode === 'v2') {
      const gr = await loadRecaptchaV2Script();
      if (gr && typeof gr.render === 'function') {
        await new Promise((resolve) => {
          gr.render(slot, {
            sitekey: cfg.siteKey,
            theme: 'light',
            callback: () => resolve(),
          });
        });
      }
    } else {
      await executeCaptcha(slot, 'booking_gate');
    }
    if (typeof onVerified === 'function') onVerified(cfg);
    return true;
  }

  function extractGenericFormPayload(form) {
    const fd = new FormData(form);
    const out = {};
    fd.forEach((v, k) => {
      if (['website_url', 'hp_email', '_gotcha', 'company_website', 'cf-turnstile-response', 'g-recaptcha-response'].includes(k)) {
        return;
      }
      out[k] = typeof v === 'string' ? v.trim() : v;
    });
    return out;
  }

  function isExcludedForm(form) {
    if (!form) return true;
    if (form.dataset.noShield === 'true' || form.dataset.solShieldReady === 'true') return true;
    if (form.getAttribute('role') === 'search' || form.id === 'zip-search-form' || form.closest('[role="search"]')) return true;
    const inputs = form.querySelectorAll('input, textarea, select');
    return inputs.length === 0;
  }

  function attachGenericAutoHandler(form) {
    if (form.dataset.solManaged === 'true' || form.getAttribute('onsubmit') || form.dataset.solAutoBound === 'true') {
      return;
    }
    // Check if an existing inline page listener handles form via custom flag or known ID
    const knownCustomIds = new Set([
      'leadForm', 'franchise-application-form', 'introForm', 'voucherForm',
      'lead-form', 'customerOrderForm', 'orderCheckoutForm', 'tlcForm',
    ]);
    if (knownCustomIds.has(form.id)) return;

    form.dataset.solAutoBound = 'true';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"], input[type="submit"]');
      const origHtml = btn ? btn.innerHTML : '';
      try {
        if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }
        const payload = extractGenericFormPayload(form);
        await submitLead(form, payload, {
          formId: form.dataset.solForm || form.id || 'auto_form',
        });
        showFormFeedback(form, 'Thank you! Your information has been verified and received.', true);
        form.reset();
      } catch (err) {
        if (err.code !== 'VALIDATION_ERROR') {
          showFormFeedback(form, err.message || 'Unable to submit right now. Please try again.', false);
        }
      } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = origHtml; }
      }
    });
  }

  function scanAndProtectForms(root = document) {
    const forms = root.querySelectorAll ? root.querySelectorAll('form') : [];
    forms.forEach(form => {
      if (isExcludedForm(form)) return;
      form.dataset.solShieldReady = 'true';
      protectForm(form);
      attachGenericAutoHandler(form);
    });
  }

  function boot() {
    injectShieldStyles();
    fetchConfig();
    scanAndProtectForms(document);
    if (window.MutationObserver && document.body) {
      const obs = new MutationObserver(mutations => {
        for (const m of mutations) {
          m.addedNodes.forEach(node => {
            if (node.nodeType !== 1) return;
            if (node.tagName === 'FORM') {
              if (!isExcludedForm(node)) {
                node.dataset.solShieldReady = 'true';
                protectForm(node);
                attachGenericAutoHandler(node);
              }
            } else if (node.querySelectorAll) {
              scanAndProtectForms(node);
            }
          });
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  function syncErrorResponse(formOrSelector, data) {
    if (data && data.visualChallenge) {
      const form = resolveFormEl(formOrSelector);
      const slot = form ? getCaptchaSlot(form) : null;
      if (slot) renderVisualGateIntoSlot(slot, data.visualChallenge);
      else refreshAllVisualGates(data.visualChallenge);
    }
  }

  function validateVisualSelection(formOrSelector) {
    const form = resolveFormEl(formOrSelector);
    if (!cachedConfig.visualChallengeRequired) return { ok: true };
    const slot = form ? getCaptchaSlot(form) : null;
    const count = slot && slot._visualSelected ? slot._visualSelected.size : 0;
    if (count === 0) {
      const promptLabel = (slot && slot._visualPrompt) || 'matching images';
      return { ok: false, error: `Please complete the visual check ("${promptLabel}") above before submitting.` };
    }
    return { ok: true };
  }

  window.SOLFormShield = {
    ready: fetchConfig,
    protectForm,
    validateFormInputs,
    validateVisualSelection,
    syncErrorResponse,
    showFormFeedback,
    getSecurityPayload,
    submitLead,
    submitTelemetry,
    verifyGate,
  };
})(window, document);
