/**
 * Centralized anti-spam, bot-detection, CAPTCHA verification, rate-limiting,
 * input validation, and CRM duplicate-prevention module for SOL REViBE.
 *
 * File is prefixed with '_' so Vercel does not expose it as a public endpoint.
 */

const crypto = require('crypto');

const ALLOWED_HOST_SUFFIXES = [
  'solrevibe.com',
  'solworld.ai',
  '.vercel.app',
  'localhost',
  '127.0.0.1',
];

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com',
  '10minutemail.net',
  '20minutemail.com',
  'burnermail.io',
  'dispostable.com',
  'dropmail.me',
  'emailondeck.com',
  'fakeinbox.com',
  'getairmail.com',
  'getnada.com',
  'guerrillamail.biz',
  'guerrillamail.com',
  'guerrillamail.de',
  'guerrillamail.info',
  'guerrillamail.net',
  'guerrillamail.org',
  'harakirimail.com',
  'inboxbear.com',
  'jetable.org',
  'mailcatch.com',
  'maildrop.cc',
  'mailinator.com',
  'mailinator.net',
  'mailinator2.com',
  'mailnesia.com',
  'mintemail.com',
  'mohmal.com',
  'mytemp.email',
  'nada.email',
  'sharklasers.com',
  'spam4.me',
  'spamgourmet.com',
  'temp-mail.io',
  'temp-mail.org',
  'tempail.com',
  'tempmail.com',
  'tempmail.net',
  'tempmailo.com',
  'throwawaymail.com',
  'trashmail.at',
  'trashmail.com',
  'trashmail.de',
  'trashmail.me',
  'trashmail.net',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
]);

const HONEYPOT_FIELD_NAMES = [
  'website_url',
  'company_website',
  'contact_notes_hp',
  'hp_email',
  '_gotcha',
  'fax_number',
];

// Warm-instance fallback stores (augmented by HMAC-signed cookies + optional Upstash/Vercel KV)
const ipRateStore = new Map();
const dedupStore = new Map();
const usedNonces = new Map();

const RL_COOKIE_NAME = 'solrevibe_rl';
const DUP_COOKIE_NAME = 'solrevibe_dup';

function getSigningSecret() {
  return (
    process.env.FORM_SECURITY_SECRET ||
    process.env.STRIPE_SECRET_KEY ||
    'solrevibe-ephemeral-shield-key-v1'
  );
}

function sha256(val) {
  return crypto.createHash('sha256').update(String(val || '')).digest('hex');
}

function hmacSign(payloadStr) {
  return crypto
    .createHmac('sha256', getSigningSecret())
    .update(String(payloadStr))
    .digest('base64url');
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a || ''));
  const bufB = Buffer.from(String(b || ''));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function signToken(obj) {
  const data = Buffer.from(JSON.stringify(obj)).toString('base64url');
  const sig = hmacSign(data);
  return `${data}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  if (!safeEqual(sig, hmacSign(data))) return null;
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  } catch (_) {
    return null;
  }
}

function parseCookies(req) {
  const raw = req.headers && req.headers.cookie;
  const out = {};
  if (!raw) return out;
  raw.split(';').forEach(part => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

function appendSetCookie(res, cookieStr) {
  const existing = res.getHeader('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', [cookieStr]);
  } else if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookieStr]);
  } else {
    res.setHeader('Set-Cookie', [String(existing), cookieStr]);
  }
}

function getClientIp(req) {
  const xff = req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip']);
  if (xff) {
    return String(xff).split(',')[0].trim();
  }
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

function isHostAllowed(rawOriginOrHost) {
  if (!rawOriginOrHost) return true; // Same-origin non-CORS or server call; verified via host/token
  try {
    const parsed = rawOriginOrHost.includes('://')
      ? new URL(rawOriginOrHost)
      : new URL(`https://${rawOriginOrHost}`);
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_HOST_SUFFIXES.some(suffix =>
      suffix.startsWith('.') ? host.endsWith(suffix) : host === suffix || host.endsWith('.' + suffix)
    );
  } catch (_) {
    return false;
  }
}

function setSecurityCorsHeaders(req, res) {
  const origin = req.headers && req.headers.origin;
  if (origin && isHostAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.solrevibe.com');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

function parseJsonBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    if (req.body.length > 65536) {
      const err = new Error('Payload too large.');
      err.statusCode = 413;
      throw err;
    }
    try {
      return JSON.parse(req.body || '{}');
    } catch (_) {
      const err = new Error('Invalid JSON request payload.');
      err.statusCode = 400;
      throw err;
    }
  }
  return typeof req.body === 'object' ? req.body : {};
}

function getCaptchaConfig() {
  const turnstileSiteKey = String(process.env.TURNSTILE_SITE_KEY || '').trim();
  const turnstileSecretKey = String(process.env.TURNSTILE_SECRET_KEY || '').trim();
  const recaptchaMode = String(process.env.RECAPTCHA_MODE || 'v3').trim().toLowerCase() === 'v2' ? 'v2' : 'v3';
  const recaptchaSiteKey = String(
    (recaptchaMode === 'v2' && process.env.RECAPTCHA_V2_SITE_KEY) || process.env.RECAPTCHA_SITE_KEY || ''
  ).trim();
  const recaptchaSecretKey = String(
    (recaptchaMode === 'v2' && process.env.RECAPTCHA_V2_SECRET_KEY) || process.env.RECAPTCHA_SECRET_KEY || ''
  ).trim();

  if (turnstileSiteKey && turnstileSecretKey) {
    return {
      provider: 'turnstile',
      mode: String(process.env.TURNSTILE_APPEARANCE || 'interaction-only').trim(),
      siteKey: turnstileSiteKey,
      secretKey: turnstileSecretKey,
      configured: true,
    };
  }
  if (recaptchaSiteKey && recaptchaSecretKey) {
    return {
      provider: 'recaptcha',
      mode: recaptchaMode,
      siteKey: recaptchaSiteKey,
      secretKey: recaptchaSecretKey,
      configured: true,
    };
  }
  return {
    provider: 'none',
    mode: 'none',
    siteKey: '',
    secretKey: '',
    configured: false,
  };
}

function isVCIntegrationEnabled() {
  return (
    process.env.VC_INTEGRATION_ENABLED === 'true' &&
    process.env.VC_PAUSED !== 'true'
  );
}

function issueFormChallengeToken(req) {
  const ua = String((req.headers && req.headers['user-agent']) || '');
  return signToken({
    ts: Date.now(),
    nonce: crypto.randomBytes(12).toString('hex'),
    uh: sha256(ua).slice(0, 16),
  });
}

function checkTimingChallenge(securityMeta, req, minMs = 1200) {
  const token = securityMeta && securityMeta.formToken;
  const now = Date.now();
  if (token) {
    const decoded = verifyToken(token);
    if (!decoded || typeof decoded.ts !== 'number') {
      return { ok: false, reason: 'INVALID_SECURITY_TOKEN' };
    }
    const age = now - decoded.ts;
    if (age < minMs) {
      return { ok: false, reason: 'SUBMITTED_TOO_FAST' };
    }
    if (age > 24 * 60 * 60 * 1000) {
      return { ok: false, reason: 'EXPIRED_SECURITY_TOKEN' };
    }
    return { ok: true, mode: 'signed-token', dwellMs: age };
  }

  // Fallback check if form initialized before config endpoint responded
  const clientMountedAt = Number(securityMeta && securityMeta.mountedAt);
  if (Number.isFinite(clientMountedAt) && clientMountedAt > 0) {
    const dwell = now - clientMountedAt;
    if (dwell < 900) {
      return { ok: false, reason: 'SUBMITTED_TOO_FAST' };
    }
  }
  if (!securityMeta || securityMeta.interacted !== true) {
    return { ok: false, reason: 'NO_HUMAN_INTERACTION' };
  }
  return { ok: true, mode: 'client-telemetry' };
}

function checkHoneypots(body) {
  const secHp = (body && body._security && body._security.honeypot) || {};
  for (const name of HONEYPOT_FIELD_NAMES) {
    const val = body[name] !== undefined ? body[name] : secHp[name];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return { ok: false, field: name };
    }
  }
  return { ok: true };
}

function containsSuspiciousInjection(str) {
  if (!str) return false;
  return /<\s*script|javascript:|onerror\s*=|onload\s*=|<iframe/i.test(str);
}

function containsUrlSpam(str) {
  if (!str) return false;
  return /(https?:\/\/|www\.|\[url=|\bbit\.ly\/|\btinyurl\.com\/)/i.test(str);
}

function isValidHumanName(raw) {
  const v = String(raw || '').trim();
  if (v.length < 2 || v.length > 80) return false;
  if (containsSuspiciousInjection(v) || containsUrlSpam(v)) return false;
  // Must contain at least two letters (supports Unicode accented characters, spaces, hyphens, apostrophes, periods)
  const letters = v.match(/\p{L}/gu);
  if (!letters || letters.length < 2) return false;
  // Reject mostly numeric strings or excessive repeated characters (e.g. "aaaaaaa")
  if (/(.)\1{4,}/i.test(v)) return false;
  if (!/^[\p{L}\p{M}\s.'\-,]{2,80}$/u.test(v)) return false;
  return true;
}

function isValidEmail(raw) {
  const v = String(raw || '').trim().toLowerCase();
  if (!v || v.length > 254) return { valid: false, reason: 'Please enter a valid email address.' };
  if (containsSuspiciousInjection(v)) return { valid: false, reason: 'Invalid characters in email address.' };
  if (!/^[^\s@<>()[\]\\,;:\"]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(v)) {
    return { valid: false, reason: 'Please enter a valid email address.' };
  }
  const domain = v.split('@')[1] || '';
  const tld = domain.split('.').pop() || '';
  if (tld.length < 2 || /^\d+$/.test(tld)) {
    return { valid: false, reason: 'Please enter a valid email domain.' };
  }
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return { valid: false, reason: 'Please use a permanent personal or business email address (disposable emails are blocked).' };
  }
  return { valid: true, normalized: v, domain };
}

function normalizePhone(raw) {
  const str = String(raw || '').trim();
  const digits = str.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1);
  }
  return digits;
}

function isValidPhone(raw) {
  const digits = normalizePhone(raw);
  if (digits.length < 10 || digits.length > 15) {
    return { valid: false, reason: 'Please enter a valid 10-digit or international phone number.' };
  }
  if (/^(\d)\1+$/.test(digits)) {
    return { valid: false, reason: 'Please enter a real phone number.' };
  }
  if (digits === '1234567890' || digits === '0123456789' || digits === '9876543210') {
    return { valid: false, reason: 'Please enter a real phone number.' };
  }
  if (digits.length === 10 && (/^[01]/.test(digits) || /^[01]/.test(digits.slice(3)))) {
    return { valid: false, reason: 'Please enter a valid US/Canada phone number.' };
  }
  return { valid: true, normalized: digits };
}

function validateSubmissionFields(payload, rules = {}) {
  const {
    requireName = true,
    requireEmail = true,
    requirePhone = false,
    requireCompany = false,
    requireZip = false,
  } = rules;

  const firstName = String(payload.firstName || payload.first_name || '').trim();
  const lastName = String(payload.lastName || payload.last_name || '').trim();
  const fullName = String(payload.fullName || payload.full_name || payload.name || `${firstName} ${lastName}`.trim()).trim();
  const email = String(payload.email || '').trim();
  const phone = String(payload.phone || payload.phone_number || '').trim();
  const company = String(payload.companyName || payload.company_name || payload.company || '').trim();
  const zip = String(payload.zip || payload.postalCode || '').trim();
  const message = String(payload.businessBackground || payload.message || payload.notes || '').trim();

  if (requireName) {
    if (firstName || lastName) {
      if (firstName && !isValidHumanName(firstName)) {
        return { valid: false, error: 'Please enter a valid first name.' };
      }
      if (lastName && !isValidHumanName(lastName)) {
        return { valid: false, error: 'Please enter a valid last name.' };
      }
    }
    if (!fullName || !isValidHumanName(fullName)) {
      return { valid: false, error: 'Please enter your valid full name.' };
    }
  } else if (fullName && !isValidHumanName(fullName)) {
    return { valid: false, error: 'Please enter a valid name without special scripts or links.' };
  }

  let normalizedEmail = '';
  if (requireEmail || email) {
    const emailCheck = isValidEmail(email);
    if (!emailCheck.valid) {
      return { valid: false, error: emailCheck.reason };
    }
    normalizedEmail = emailCheck.normalized;
  }

  let normalizedPhone = '';
  if (requirePhone || phone) {
    const phoneCheck = isValidPhone(phone);
    if (!phoneCheck.valid) {
      return { valid: false, error: phoneCheck.reason };
    }
    normalizedPhone = phoneCheck.normalized;
  }

  if (requireCompany && (!company || company.length < 2 || company.length > 120 || containsSuspiciousInjection(company) || containsUrlSpam(company))) {
    return { valid: false, error: 'Please enter a valid organization or company name.' };
  }
  if (!requireCompany && company && (containsSuspiciousInjection(company) || containsUrlSpam(company))) {
    return { valid: false, error: 'Please enter a valid company name without URLs or HTML.' };
  }

  if (requireZip || zip) {
    if (!/^\d{5}(?:-\d{4})?$/.test(zip)) {
      return { valid: false, error: 'Please enter a valid 5-digit ZIP code.' };
    }
  }

  if (containsSuspiciousInjection(message)) {
    return { valid: false, error: 'Please remove HTML or script markup from your message.' };
  }
  if (message && (message.match(/https?:\/\//gi) || []).length > 1) {
    return { valid: false, error: 'Please remove external promotional links from your submission.' };
  }

  return {
    valid: true,
    normalized: {
      fullName,
      firstName,
      lastName,
      email: normalizedEmail,
      phone: normalizedPhone,
      company,
      zip,
    },
  };
}

async function verifyCaptchaToken(captchaToken, clientIp) {
  const cfg = getCaptchaConfig();
  if (!cfg.configured) {
    return {
      configured: false,
      verified: false,
      provider: 'none',
    };
  }

  const token = String(captchaToken || '').trim();
  if (!token) {
    return {
      configured: true,
      verified: false,
      provider: cfg.provider,
      error: 'Missing CAPTCHA verification token. Please complete verification and try again.',
    };
  }

  if (cfg.provider === 'turnstile') {
    const formData = new URLSearchParams();
    formData.append('secret', cfg.secretKey);
    formData.append('response', token);
    if (clientIp && clientIp !== 'unknown') {
      formData.append('remoteip', clientIp);
    }

    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });
    const data = await r.json().catch(() => ({}));
    return {
      configured: true,
      verified: Boolean(data && data.success),
      provider: 'turnstile',
      errorCodes: data['error-codes'] || [],
      error: data && data.success ? undefined : 'Security verification failed. Please refresh and try again.',
    };
  }

  if (cfg.provider === 'recaptcha') {
    const formData = new URLSearchParams();
    formData.append('secret', cfg.secretKey);
    formData.append('response', token);
    if (clientIp && clientIp !== 'unknown') {
      formData.append('remoteip', clientIp);
    }

    const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });
    const data = await r.json().catch(() => ({}));
    const scoreOk = typeof data.score !== 'number' || data.score >= 0.5;
    const ok = Boolean(data && data.success && scoreOk);
    return {
      configured: true,
      verified: ok,
      provider: 'recaptcha',
      score: data.score,
      errorCodes: data['error-codes'] || [],
      error: ok ? undefined : 'Security verification failed. Please refresh and try again.',
    };
  }

  return { configured: false, verified: false, provider: 'none' };
}

async function kvCommand(args) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    });
    if (!r.ok) return null;
    const data = await r.json().catch(() => null);
    return data ? data.result : null;
  } catch (_) {
    return null;
  }
}

async function checkRateLimit(req, res, { maxTenMin = 6, maxHour = 20, scope = 'lead' } = {}) {
  const now = Date.now();
  const tenMinAgo = now - 10 * 60 * 1000;
  const hourAgo = now - 60 * 60 * 1000;
  const ip = getClientIp(req);
  const ipKey = `${scope}:${sha256(ip).slice(0, 24)}`;

  // 1. Optional distributed Upstash/Vercel KV rate limit
  const kvKey = `solrevibe:rl:${ipKey}`;
  const kvCount = await kvCommand(['INCR', kvKey]);
  if (typeof kvCount === 'number') {
    if (kvCount === 1) await kvCommand(['EXPIRE', kvKey, 600]);
    if (kvCount > maxTenMin) {
      return { allowed: false, retryAfter: 600, source: 'kv' };
    }
  }

  // 2. Warm-container memory window
  const arr = (ipRateStore.get(ipKey) || []).filter(ts => ts > hourAgo);
  const recentTen = arr.filter(ts => ts > tenMinAgo);
  if (recentTen.length >= maxTenMin || arr.length >= maxHour) {
    return { allowed: false, retryAfter: 600, source: 'memory' };
  }
  arr.push(now);
  ipRateStore.set(ipKey, arr);
  if (ipRateStore.size > 5000) {
    const firstKey = ipRateStore.keys().next().value;
    if (firstKey) ipRateStore.delete(firstKey);
  }

  // 3. HMAC-signed client cookie rate limit (persists across serverless cold starts)
  const cookies = parseCookies(req);
  let cookieTimes = [];
  if (cookies[RL_COOKIE_NAME]) {
    const parsed = verifyToken(cookies[RL_COOKIE_NAME]);
    if (parsed && Array.isArray(parsed.t)) {
      cookieTimes = parsed.t.filter(ts => typeof ts === 'number' && ts > hourAgo);
    }
  }
  const cookieRecentTen = cookieTimes.filter(ts => ts > tenMinAgo);
  if (cookieRecentTen.length >= maxTenMin || cookieTimes.length >= maxHour) {
    return { allowed: false, retryAfter: 600, source: 'cookie' };
  }
  cookieTimes.push(now);
  const signedCookie = signToken({ t: cookieTimes.slice(-maxHour) });
  appendSetCookie(
    res,
    `${RL_COOKIE_NAME}=${encodeURIComponent(signedCookie)}; Path=/; Max-Age=3600; HttpOnly; SameSite=Lax; Secure`
  );

  return { allowed: true };
}

function consumeNonce(formToken) {
  const decoded = verifyToken(formToken);
  if (!decoded || !decoded.nonce) return true;
  const now = Date.now();
  // Prune old nonces periodically
  if (usedNonces.size > 5000) {
    for (const [k, exp] of usedNonces.entries()) {
      if (exp < now) usedNonces.delete(k);
    }
  }
  if (usedNonces.has(decoded.nonce)) {
    return false;
  }
  usedNonces.set(decoded.nonce, now + 15 * 60 * 1000);
  return true;
}

async function checkAndRecordDuplicate(req, res, { email, phone, formType, allowRepeat = false, windowMs = 12 * 60 * 60 * 1000 }) {
  if (allowRepeat || (!email && !phone)) {
    return { duplicate: false };
  }

  const normalizedType = String(formType || 'lead').toLowerCase().trim();
  const contactFingerprint = sha256(`${email || ''}::${phone || ''}`).slice(0, 24);
  const opportunityFingerprint = sha256(`${email || ''}::${phone || ''}::${normalizedType}`).slice(0, 24);
  const now = Date.now();

  // 1. Distributed KV check if configured
  const kvDupKey = `solrevibe:dup:${opportunityFingerprint}`;
  const kvExists = await kvCommand(['GET', kvDupKey]);
  if (kvExists) {
    return { duplicate: true, key: opportunityFingerprint, source: 'kv' };
  }

  // 2. Warm-container dedup store
  const existingExp = dedupStore.get(opportunityFingerprint);
  if (existingExp && existingExp > now) {
    return { duplicate: true, key: opportunityFingerprint, source: 'memory' };
  }

  // 3. HMAC-signed duplicate cookie check
  const cookies = parseCookies(req);
  let recentOpps = [];
  if (cookies[DUP_COOKIE_NAME]) {
    const parsed = verifyToken(cookies[DUP_COOKIE_NAME]);
    if (parsed && Array.isArray(parsed.o)) {
      recentOpps = parsed.o.filter(entry => entry && entry.e > now);
    }
  }
  if (recentOpps.some(entry => entry.k === opportunityFingerprint)) {
    return { duplicate: true, key: opportunityFingerprint, source: 'cookie' };
  }

  // 4. Optional live Vision Control CRM API lookup before allowing opportunity creation
  const vcApiKey = String(process.env.VC_API_KEY || process.env.GHL_API_KEY || '').trim();
  const vcLocationId = String(process.env.VC_LOCATION_ID || 'yl7m9259ARgabLb2neQw').trim();
  if (vcApiKey && vcLocationId && isVCIntegrationEnabled()) {
    try {
      const qs = new URLSearchParams({ locationId: vcLocationId });
      if (email) qs.set('email', email);
      else if (phone) qs.set('number', `+1${phone.slice(-10)}`);
      const lookupRes = await fetch(`https://services.leadconnectorhq.com/contacts/search/duplicate?${qs.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${vcApiKey}`,
          Version: '2021-07-28',
          Accept: 'application/json',
        },
      });
      if (lookupRes.ok) {
        const lookupData = await lookupRes.json().catch(() => null);
        const existingContact = lookupData && (lookupData.contact || (Array.isArray(lookupData.contacts) && lookupData.contacts[0]));
        if (existingContact && existingContact.id) {
          // Record locally so follow-up attempts are also short-circuited
          dedupStore.set(opportunityFingerprint, now + windowMs);
          return {
            duplicate: true,
            key: opportunityFingerprint,
            contactId: existingContact.id,
            source: 'vc-crm',
          };
        }
      }
    } catch (err) {
      console.warn('[security] Optional VC duplicate lookup skipped:', err.message);
    }
  }

  // Record fingerprint cleanly
  dedupStore.set(opportunityFingerprint, now + windowMs);
  if (dedupStore.size > 5000) {
    for (const [k, exp] of dedupStore.entries()) {
      if (exp < now) dedupStore.delete(k);
    }
  }
  await kvCommand(['SET', kvDupKey, contactFingerprint, 'EX', Math.round(windowMs / 1000)]);

  recentOpps.push({ k: opportunityFingerprint, e: now + windowMs });
  const signedDup = signToken({ o: recentOpps.slice(-12) });
  appendSetCookie(
    res,
    `${DUP_COOKIE_NAME}=${encodeURIComponent(signedDup)}; Path=/; Max-Age=${Math.round(windowMs / 1000)}; HttpOnly; SameSite=Lax; Secure`
  );

  return { duplicate: false, key: opportunityFingerprint, contactKey: contactFingerprint };
}

/**
 * Full server-side submission guard invoked across all lead/booking/checkout/reflection endpoints.
 */
async function guardSubmission(req, res, body, options = {}) {
  const {
    formType = 'lead',
    requireName = true,
    requireEmail = true,
    requirePhone = false,
    requireCompany = false,
    requireZip = false,
    allowRepeat = false,
    requireHumanTiming = true,
    maxPerTenMin = 6,
    maxPerHour = 20,
    minDwellMs = 1200,
    captchaOptionalWhenUnconfigured = true,
  } = options;

  const origin = (req.headers && req.headers.origin) || '';
  if (origin && !isHostAllowed(origin)) {
    return { ok: false, status: 403, code: 'ORIGIN_NOT_ALLOWED', error: 'Unauthorized request origin.' };
  }

  // 1. Honeypot trap check
  const hp = checkHoneypots(body);
  if (!hp.ok) {
    return { ok: false, status: 400, code: 'BOT_DETECTED', error: 'Submission rejected by security filter.' };
  }

  // 2. Timing / human interaction check (nonce is consumed only after validation passes)
  const securityMeta = (body && body._security) || {};
  if (requireHumanTiming) {
    const timing = checkTimingChallenge(securityMeta, req, minDwellMs);
    if (!timing.ok) {
      return {
        ok: false,
        status: 403,
        code: timing.reason,
        error: 'Please take a moment to fill out the form naturally and submit again.',
      };
    }
  }

  // 3. Rate limiting check
  const rate = await checkRateLimit(req, res, {
    maxTenMin: maxPerTenMin,
    maxHour: maxPerHour,
    scope: allowRepeat ? 'telemetry' : 'lead',
  });
  if (!rate.allowed) {
    res.setHeader('Retry-After', String(rate.retryAfter || 600));
    return {
      ok: false,
      status: 429,
      code: 'RATE_LIMITED',
      error: 'Too many submissions from your connection. Please wait a few minutes before trying again.',
    };
  }

  // 4. Server-side field validation & sanitization
  const validated = validateSubmissionFields(body, {
    requireName,
    requireEmail,
    requirePhone,
    requireCompany,
    requireZip,
  });
  if (!validated.valid) {
    return { ok: false, status: 400, code: 'INVALID_INPUT', error: validated.error };
  }

  // 5. Server-side CAPTCHA token verification (Turnstile / reCAPTCHA)
  const ip = getClientIp(req);
  const captchaToken =
    body.captchaToken ||
    body['cf-turnstile-response'] ||
    body['g-recaptcha-response'] ||
    securityMeta.captchaToken ||
    '';
  const captchaResult = await verifyCaptchaToken(captchaToken, ip);
  if (captchaResult.configured && !captchaResult.verified) {
    return {
      ok: false,
      status: 403,
      code: 'CAPTCHA_FAILED',
      error: captchaResult.error || 'CAPTCHA verification failed. Please try again.',
    };
  }
  if (!captchaResult.configured && !captchaOptionalWhenUnconfigured) {
    return {
      ok: false,
      status: 503,
      code: 'CAPTCHA_NOT_CONFIGURED',
      error: 'Server-side CAPTCHA protection is required before live CRM forwarding.',
    };
  }

  // Consume single-use form token only after validation & CAPTCHA succeed (and not on repeatable actions)
  if (requireHumanTiming && !allowRepeat && securityMeta.formToken && !consumeNonce(securityMeta.formToken)) {
    return {
      ok: false,
      status: 409,
      code: 'REPLAY_DETECTED',
      error: 'This form session was already submitted. Please refresh to start a new request.',
    };
  }

  // 6. Duplicate contact & opportunity guard
  const dedup = await checkAndRecordDuplicate(req, res, {
    email: validated.normalized.email,
    phone: validated.normalized.phone,
    formType,
    allowRepeat,
  });
  if (dedup.duplicate) {
    return {
      ok: false,
      status: 409,
      duplicate: true,
      code: 'DUPLICATE_SUBMISSION',
      dedupKey: dedup.key,
      error: 'We already received your submission. Please check your inbox or wait before submitting again.',
    };
  }

  return {
    ok: true,
    normalized: validated.normalized,
    captcha: captchaResult,
    dedupKey: dedup.key || null,
    ip,
  };
}

module.exports = {
  HONEYPOT_FIELD_NAMES,
  setSecurityCorsHeaders,
  parseJsonBody,
  getCaptchaConfig,
  isVCIntegrationEnabled,
  issueFormChallengeToken,
  guardSubmission,
  isValidEmail,
  isValidPhone,
  isValidHumanName,
};
