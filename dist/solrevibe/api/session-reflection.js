const { setSecurityCorsHeaders, parseJsonBody, isVisualChallengeEnabled, guardSubmission } = require('./_security');

module.exports = async function handler(req, res) {
  setSecurityCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
  }

  try {
    const body = parseJsonBody(req);

    const guard = await guardSubmission(req, res, body, {
      formType: 'session_reflection',
      requireName: false,
      requireEmail: false,
      requirePhone: false,
      allowRepeat: true,
      requireHumanTiming: Boolean(body._security),
      requireVisualChallenge: false,
      skipProviderCaptcha: true,
      maxPerTenMin: 12,
      maxPerHour: 40,
      captchaOptionalWhenUnconfigured: true,
    });

    if (!guard.ok) {
      return res.status(guard.status).json({
        ok: false,
        code: guard.code,
        error: guard.error || 'Submission blocked by security check.',
        visualChallenge: guard.visualChallenge || undefined,
      });
    }

    const openingNumber = Number(body.openingNumber);
    const endingNumber = Number(body.endingNumber);
    if (
      !Number.isInteger(openingNumber) ||
      openingNumber < 1 ||
      openingNumber > 10 ||
      !Number.isInteger(endingNumber) ||
      endingNumber < 1 ||
      endingNumber > 10
    ) {
      return res.status(400).json({ error: 'Opening and ending numbers must be integers from 1 to 10.' });
    }

    const payload = {
      formType: String(body.formType || 'thought_loop_clearing_reflection'),
      submittedAt: String(body.submittedAt || new Date().toISOString()),
      videoId: body.videoId ?? 2,
      vimeoId: String(body.vimeoId || '1239524014'),
      videoTitle: String(body.videoTitle || 'TAG 1 - Thought Loop Clearing'),
      stationLocation: String(body.stationLocation || '').slice(0, 200),
      openingNumber,
      endingNumber,
      scaleMax: Number(body.scaleMax) === 4 ? 4 : 10,
      pointDrop: openingNumber - endingNumber,
      distance: Math.abs(openingNumber - endingNumber),
      encouragerTitle: String(body.encouragerTitle || '').slice(0, 240),
      experienceDescription: String(body.experienceDescription || body.loopAppearance || '').slice(0, 4000),
      loopAppearance: String(body.loopAppearance || body.experienceDescription || '').slice(0, 4000),
      bodyLocation: String(body.bodyLocation || '').slice(0, 2000),
      userAgent: (req.headers && req.headers['user-agent']) || '',
    };

    const sheetsUrl = process.env.TLC_GOOGLE_SHEETS_WEBAPP_URL || '';
    const webhookUrl = process.env.TLC_WEBHOOK_URL || '';

    const tasks = [];
    if (sheetsUrl) {
      tasks.push(
        fetch(sheetsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
          redirect: 'follow',
        })
      );
    }
    if (webhookUrl) {
      tasks.push(
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        })
      );
    }

    if (tasks.length > 0) {
      await Promise.allSettled(tasks);
    }

    return res.status(200).json({
      ok: true,
      forwardedToSheets: Boolean(sheetsUrl),
      forwardedToWebhook: Boolean(webhookUrl),
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      error: err.message || 'Failed to process reflection submission.',
    });
  }
};
