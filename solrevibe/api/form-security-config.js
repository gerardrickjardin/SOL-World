/**
 * GET /api/form-security-config
 * Issues public CAPTCHA site key (Cloudflare Turnstile or invisible reCAPTCHA),
 * signed server timing challenge token, and current Vision Control integration state.
 */

const {
  setSecurityCorsHeaders,
  getCaptchaConfig,
  isVCIntegrationEnabled,
  isVisualChallengeEnabled,
  issueVisualChallenge,
  issueFormChallengeToken,
} = require('./_security');

module.exports = function handler(req, res) {
  setSecurityCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const captcha = getCaptchaConfig();
  const vcEnabled = isVCIntegrationEnabled();
  const visualRequired = isVisualChallengeEnabled();

  return res.status(200).json({
    ok: true,
    captchaProvider: captcha.provider,
    captchaMode: captcha.mode || 'none',
    siteKey: captcha.siteKey,
    captchaRequired: captcha.configured,
    visualChallengeRequired: visualRequired,
    visualChallenge: visualRequired ? issueVisualChallenge() : null,
    vcIntegrationEnabled: vcEnabled,
    vcPaused: !vcEnabled,
    formToken: issueFormChallengeToken(req),
  });
};
