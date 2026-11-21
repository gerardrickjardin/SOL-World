/**
 * POST /api/submit-lead
 * Centralized server-side form security gateway for all SOL REViBE signup,
 * contact, lead capture, voucher, territory reservation, and booking forms.
 *
 * Enforces:
 *   - Origin & honeypot rejection
 *   - Signed timing / human-interaction validation
 *   - Input validation (human name, permanent email, valid phone, ZIP)
 *   - Rate limiting (cookie + IP + optional KV)
 *   - Server-side CAPTCHA verification (Cloudflare Turnstile / reCAPTCHA)
 *   - Duplicate contact & opportunity prevention
 *   - Vision Control (VC) pause guard until VC_INTEGRATION_ENABLED=true
 */

const {
  setSecurityCorsHeaders,
  parseJsonBody,
  isVCIntegrationEnabled,
  isVisualChallengeEnabled,
  getCaptchaConfig,
  guardSubmission,
} = require('./_security');

function buildCleanCRMPayload(raw, normalized, dedupKey) {
  const first = normalized.firstName || normalized.fullName.split(/\s+/)[0] || '';
  const last = normalized.lastName || normalized.fullName.split(/\s+/).slice(1).join(' ') || '';

  return {
    firstName: first,
    lastName: last,
    first_name: first,
    last_name: last,
    name: normalized.fullName,
    full_name: normalized.fullName,
    email: normalized.email,
    phone: normalized.phone,
    phone_number: normalized.phone,
    companyName: normalized.company,
    company_name: normalized.company,
    company: normalized.company,
    zip: normalized.zip,
    selectedZoneId: String(raw.selectedZoneId || raw.selected_zone_id || '').slice(0, 64),
    territoryCityState: String(raw.territoryCityState || raw.territory_city_state || '').slice(0, 140),
    businessBackground: String(raw.businessBackground || raw.business_background || raw.message || '').slice(0, 2000),
    station: String(raw.station || '').slice(0, 200),
    voucher_code: String(raw.voucher_code || '').slice(0, 40),
    selected_benefit: String(raw.selected_benefit || '').slice(0, 80),
    recommended_mvp: String(raw.recommended_mvp || '').slice(0, 120),
    estimatedMonthlyRevenue: raw.estimatedMonthlyRevenue ? String(raw.estimatedMonthlyRevenue).slice(0, 40) : undefined,
    event: String(raw.event || 'lead_submitted').slice(0, 64),
    source: String(raw.source || 'SOL REViBE Website').slice(0, 120),
    formType: String(raw.formType || 'lead').slice(0, 64),
    tags: Array.isArray(raw.tags) ? raw.tags.map(t => String(t).slice(0, 60)).slice(0, 12) : ['solrevibe-lead'],
    dedupKey: dedupKey || undefined,
    submittedAt: new Date().toISOString(),
  };
}

module.exports = async function handler(req, res) {
  setSecurityCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const body = parseJsonBody(req);
    const formType = String(body.formType || body.source || 'lead').trim();
    const isTelemetry = body.event === 'waiver_started' || body.event === 'intro_video_started' || body.event === 'session_start';

    const vcEnabled = isVCIntegrationEnabled();
    const captchaCfg = getCaptchaConfig();

    const guard = await guardSubmission(req, res, body, {
      formType,
      requireName: !isTelemetry && body.requireName !== false,
      requireEmail: !isTelemetry && body.requireEmail !== false,
      requirePhone: Boolean(body.requirePhone),
      requireCompany: Boolean(body.requireCompany),
      requireZip: Boolean(body.requireZip),
      allowRepeat: isTelemetry || Boolean(body.allowRepeat),
      requireHumanTiming: body.requireHumanTiming !== false,
      requireVisualChallenge: !isTelemetry && isVisualChallengeEnabled(),
      maxPerTenMin: isTelemetry ? 20 : 5,
      maxPerHour: isTelemetry ? 60 : 15,
      // Fail closed before forwarding live CRM traffic if CAPTCHA isn't configured yet
      captchaOptionalWhenUnconfigured: !vcEnabled,
    });

    if (!guard.ok) {
      return res.status(guard.status).json({
        ok: false,
        code: guard.code,
        duplicate: Boolean(guard.duplicate),
        error: guard.error,
        visualChallenge: guard.visualChallenge || undefined,
      });
    }

    const cleanPayload = buildCleanCRMPayload(body, guard.normalized, guard.dedupKey);

    // IMPORTANT: Keep Vision Control integration disabled/paused unless explicitly activated
    if (!vcEnabled) {
      return res.status(200).json({
        ok: true,
        validated: true,
        vcPaused: true,
        forwardedToVC: false,
        captchaVerified: guard.captcha.verified,
        captchaProvider: captchaCfg.provider,
        dedupKey: guard.dedupKey,
        message: 'Submission validated and protected cleanly. Vision Control integration is currently paused.',
      });
    }

    // Fail-safe guard: never send to VC without server-side CAPTCHA configured & verified
    if (!captchaCfg.configured || !guard.captcha.verified) {
      return res.status(503).json({
        ok: false,
        code: 'CAPTCHA_REQUIRED_FOR_CRM',
        error: 'CAPTCHA verification must be active and passed before CRM sync.',
      });
    }

    const vcWebhookUrl = String(process.env.VC_WEBHOOK_URL || '').trim();
    if (!vcWebhookUrl) {
      return res.status(503).json({
        ok: false,
        code: 'VC_WEBHOOK_UNCONFIGURED',
        error: 'Vision Control webhook endpoint is not configured on the server.',
      });
    }

    const forwardTasks = [
      fetch(vcWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(cleanPayload),
      }),
    ];

    const sheetsUrl = String(process.env.LEADS_GOOGLE_SHEETS_WEBAPP_URL || '').trim();
    if (sheetsUrl) {
      forwardTasks.push(
        fetch(sheetsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(cleanPayload),
          redirect: 'follow',
        })
      );
    }

    const results = await Promise.allSettled(forwardTasks);
    const vcRes = results[0];
    if (vcRes.status !== 'fulfilled' || !vcRes.value.ok) {
      return res.status(502).json({
        ok: false,
        code: 'VC_UPSTREAM_ERROR',
        error: 'Unable to deliver verified submission to CRM. Please try again shortly.',
      });
    }

    return res.status(200).json({
      ok: true,
      validated: true,
      vcPaused: false,
      forwardedToVC: true,
      captchaVerified: true,
      captchaProvider: captchaCfg.provider,
      dedupKey: guard.dedupKey,
      message: 'Submission verified and delivered.',
    });
  } catch (err) {
    console.error('[submit-lead] Error:', err.message);
    return res.status(err.statusCode || 500).json({
      ok: false,
      error: err.message || 'Unable to process submission safely.',
    });
  }
};
