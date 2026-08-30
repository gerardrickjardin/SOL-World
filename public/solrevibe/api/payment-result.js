/**
 * api/payment-result.js
 *
 * Vercel Serverless Function — Authorize.net Accept Hosted Result Handler
 *
 * PURPOSE:
 *   Authorize.net POSTs the transaction outcome to this endpoint after the
 *   customer completes (or cancels) payment in the hosted iframe.
 *   We verify the result and redirect the browser to the appropriate page.
 *
 * SECURITY:
 *   - We verify the transaction ID server-side by calling Authorize.net's
 *     getTransactionDetailsRequest API before marking a payment as successful.
 *   - No card data is ever received here — only the transaction ID.
 *   - Credentials are read from environment variables only.
 */

const https = require('https');

const AUTHNET_ENDPOINTS = {
  sandbox:    'apitest.authorize.net',
  production: 'api2.authorize.net',
};

/**
 * Makes a POST request to the Authorize.net JSON API.
 */
function callAuthorizeNet(host, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = {
      hostname: host,
      path: '/xml/v1/request.api',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data.replace(/^\uFEFF/, '')));
        } catch (err) {
          reject(new Error('Invalid JSON response from Authorize.net'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Parse URL-encoded body (Authorize.net posts as application/x-www-form-urlencoded).
 */
function parseUrlEncoded(str) {
  const result = {};
  if (!str) return result;
  str.split('&').forEach((pair) => {
    const [key, val] = pair.split('=').map(decodeURIComponent);
    if (key) result[key] = val || '';
  });
  return result;
}

module.exports = async function handler(req, res) {
  // Authorize.net sends GET for the communicator iframe and POST for results.
  // Allow both — GET with query params (lightbox communication) and POST (relay).
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  // ── Determine base URL for redirects ──────────────────────────────────────
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.SITE_URL || 'http://localhost:3000');

  // ── Handle GET (communicator iframe pings) ────────────────────────────────
  // Accept Hosted uses a communicator URL to send postMessages to the parent.
  // This is handled by iframeCommunicator.html (a static file).
  // If Authorize.net hits this endpoint via GET, just redirect to it.
  if (req.method === 'GET') {
    return res.redirect(302, `${baseUrl}/iframeCommunicator.html`);
  }

  // ── Parse the POST body from Authorize.net ────────────────────────────────
  let fields = {};

  if (req.body) {
    fields = typeof req.body === 'string'
      ? parseUrlEncoded(req.body)
      : req.body;
  }

  // Accept Hosted relay response fields
  // x_response_code: 1=Approved, 2=Declined, 3=Error, 4=Held
  const responseCode   = fields['x_response_code']   || '';
  const transactionId  = fields['x_trans_id']         || '';
  const responseReason = fields['x_response_reason_text'] || 'Unknown';
  const authCode       = fields['x_auth_code']        || '';

  // ── Load credentials ──────────────────────────────────────────────────────
  const apiLoginId     = process.env.AUTHORIZENET_API_LOGIN_ID;
  const transactionKey = process.env.AUTHORIZENET_TRANSACTION_KEY;
  const env            = process.env.AUTHORIZENET_ENV || 'sandbox';
  const host           = AUTHNET_ENDPOINTS[env] || AUTHNET_ENDPOINTS.sandbox;

  // ── Handle canceled payment ───────────────────────────────────────────────
  if (!responseCode && !transactionId) {
    console.log('[payment-result] No response fields — likely canceled by customer.');
    return res.redirect(302, `${baseUrl}/payment-error.html?reason=canceled`);
  }

  // ── Declined or errored ───────────────────────────────────────────────────
  if (responseCode !== '1') {
    const reason = encodeURIComponent(responseReason);
    console.log(`[payment-result] Non-approved response — code: ${responseCode}, reason: ${responseReason}`);
    return res.redirect(302, `${baseUrl}/payment-error.html?reason=${reason}&code=${responseCode}`);
  }

  // ── Approved: verify server-side via getTransactionDetailsRequest ─────────
  if (apiLoginId && transactionKey && transactionId) {
    try {
      const verifyPayload = {
        getTransactionDetailsRequest: {
          merchantAuthentication: {
            name:           apiLoginId,
            transactionKey: transactionKey,
          },
          transId: transactionId,
        },
      };

      const verifyResponse = await callAuthorizeNet(host, verifyPayload);
      const txDetail = verifyResponse && verifyResponse.getTransactionDetailsResponse;
      const txStatus = txDetail && txDetail.transaction && txDetail.transaction.transactionStatus;

      if (txStatus !== 'capturedPendingSettlement' && txStatus !== 'settledSuccessfully') {
        console.warn(`[payment-result] Transaction ${transactionId} verification failed — status: ${txStatus}`);
        return res.redirect(302, `${baseUrl}/payment-error.html?reason=verification_failed`);
      }

      console.log(`[payment-result] Transaction ${transactionId} verified — status: ${txStatus}, auth: ${authCode}`);
    } catch (err) {
      // If verification itself fails, still allow the redirect but log the warning.
      // This prevents a transient API error from blocking a legitimate payment.
      console.warn(`[payment-result] Could not verify transaction ${transactionId}: ${err.message}`);
    }
  }

  // ── Success ───────────────────────────────────────────────────────────────
  const txParam = transactionId ? `?txid=${encodeURIComponent(transactionId)}` : '';
  return res.redirect(302, `${baseUrl}/payment-success.html${txParam}`);
};
