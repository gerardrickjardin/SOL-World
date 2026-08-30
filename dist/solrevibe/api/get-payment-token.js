/**
 * api/get-payment-token.js
 *
 * Vercel Serverless Function — Authorize.net Accept Hosted Integration
 *
 * PURPOSE:
 *   Called by payment.html when the customer clicks "Pay".
 *   Exchanges our server-side credentials for a short-lived Authorize.net
 *   formToken, which is returned to the browser so it can launch the
 *   Accept Hosted lightbox iframe.
 *
 * SECURITY:
 *   - API Login ID and Transaction Key are read from environment variables only.
 *   - These credentials are NEVER sent to the browser or logged.
 *   - No raw card data ever passes through this function.
 */

const https = require('https');

// ─── Authorize.net API endpoints ─────────────────────────────────────────────
const AUTHNET_ENDPOINTS = {
  sandbox:    'apitest.authorize.net',
  production: 'api2.authorize.net',
};

/**
 * Makes a POST request to the Authorize.net JSON API.
 * @param {string} host - The Authorize.net hostname
 * @param {object} payload - The request body object
 * @returns {Promise<object>} - The parsed JSON response
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
          // Authorize.net sometimes returns a BOM; strip it before parsing
          const cleaned = data.replace(/^\uFEFF/, '');
          resolve(JSON.parse(cleaned));
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

// ─── Main handler ─────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ── Load credentials from environment (never from request body) ─────────
  const apiLoginId      = process.env.AUTHORIZENET_API_LOGIN_ID;
  const transactionKey  = process.env.AUTHORIZENET_TRANSACTION_KEY;
  const env             = process.env.AUTHORIZENET_ENV || 'sandbox';

  if (!apiLoginId || !transactionKey) {
    console.error('[get-payment-token] Missing Authorize.net credentials in environment variables.');
    return res.status(500).json({ error: 'Payment gateway not configured. Please contact support.' });
  }

  // ── Read customer/order info from request body ───────────────────────────
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid request body.' });
  }

  const {
    businessName  = '',
    contactName   = '',
    email         = '',
    phone         = '',
    address       = '',
    city          = '',
    state         = '',
    zip           = '',
    country       = 'US',
  } = body || {};

  // ── Build Accept Hosted token request ────────────────────────────────────
  const host = AUTHNET_ENDPOINTS[env] || AUTHNET_ENDPOINTS.sandbox;

  // Determine the base URL for return paths.
  // In production on Vercel, VERCEL_URL is injected automatically.
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.SITE_URL || 'http://localhost:3000');

  const payload = {
    getHostedPaymentPageRequest: {
      merchantAuthentication: {
        name:           apiLoginId,
        transactionKey: transactionKey,
      },
      transactionRequest: {
        transactionType: 'authCaptureTransaction',
        amount: '3000.00',
        currencyCode: 'USD',
        billTo: {
          firstName:   contactName.split(' ')[0] || contactName,
          lastName:    contactName.split(' ').slice(1).join(' ') || '-',
          company:     businessName,
          address:     address,
          city:        city,
          state:       state,
          zip:         zip,
          country:     country === 'United States' ? 'US' : country,
          email:       email,
          phoneNumber: phone,
        },
        customer: {
          type:  'business',
          email: email,
        },
        order: {
          description:   'SOUL REViBE Business-in-a-Box Station',
          invoiceNumber: `SOL-${Date.now()}`,
        },
        lineItems: {
          lineItem: {
            itemId:      'REVIBE-BOX-001',
            name:        'SOUL REViBE Business-in-a-Box Station',
            description: 'Direct B2B purchase — showcase position',
            quantity:    '1',
            unitPrice:   '3000.00',
          }
        },
      },
      hostedPaymentSettings: {
        setting: [
          {
            settingName:  'hostedPaymentReturnOptions',
            settingValue: JSON.stringify({
              showReceipt: false,
              url:         `${baseUrl}/payment-success.html`,
              urlText:     'Return to SOL REViBE',
              cancelUrl:   `${baseUrl}/payment-error.html?reason=canceled`,
              cancelUrlText: 'Cancel',
            }),
          },
          {
            settingName:  'hostedPaymentIFrameCommunicatorUrl',
            settingValue: JSON.stringify({
              url: `${baseUrl}/iframeCommunicator.html`,
            }),
          },
          {
            settingName:  'hostedPaymentButtonOptions',
            settingValue: JSON.stringify({
              text: 'Pay $3,000.00 — Secure My Position',
            }),
          },
          // ── Visual branding ───────────────────────────────────────
          {
            settingName:  'hostedPaymentStyleOptions',
            settingValue: JSON.stringify({
              bgColor: 'f8fafc',  // light slate background — matches SOL REViBE palette
            }),
          },
          // ── Order details display ─────────────────────────────────
          {
            settingName:  'hostedPaymentOrderOptions',
            settingValue: JSON.stringify({
              show:         true,
              merchantName: 'SOL REViBE',
            }),
          },
          // ── Billing address — we already collected it in the form ──
          {
            settingName:  'hostedPaymentBillingAddressOptions',
            settingValue: JSON.stringify({
              show:     true,
              required: false,
            }),
          },
          // ── Customer email shown on receipt ───────────────────────
          {
            settingName:  'hostedPaymentCustomerOptions',
            settingValue: JSON.stringify({
              showEmail:         false,
              requiredEmail:     false,
              addPaymentProfile: false,
            }),
          },
          // ── Payment button label ──────────────────────────────────
          {
            settingName:  'hostedPaymentButtonOptions',
            settingValue: JSON.stringify({
              text: 'Complete Payment — $3,000',
            }),
          },
          // ── Security ──────────────────────────────────────────────
          {
            settingName:  'hostedPaymentSecurityOptions',
            settingValue: JSON.stringify({ captcha: false }),
          },
          // ── Shipping address — not needed for this product ────────
          {
            settingName:  'hostedPaymentShippingAddressOptions',
            settingValue: JSON.stringify({ show: false, required: false }),
          },
        ],
      },
    },
  };

  // ── Call Authorize.net API ────────────────────────────────────────────────
  let authResponse;
  try {
    authResponse = await callAuthorizeNet(host, payload);
  } catch (err) {
    console.error('[get-payment-token] Authorize.net API call failed:', err.message);
    return res.status(502).json({ error: 'Unable to reach payment gateway. Please try again.' });
  }

  // ── Validate response ─────────────────────────────────────────────────────
  const result = authResponse && authResponse.getHostedPaymentPageResponse;

  if (!result) {
    console.error('[get-payment-token] Unexpected Authorize.net response structure');
    return res.status(502).json({ error: 'Invalid response from payment gateway.' });
  }

  const resultCode = result.messages && result.messages.resultCode;
  if (resultCode !== 'Ok') {
    const msg  = result.messages && result.messages.message && result.messages.message[0];
    const code = (msg && msg.code) || 'UNKNOWN';
    const text = (msg && msg.text) || 'Unknown error';
    console.error(`[get-payment-token] Authorize.net error — code: ${code}, text: ${text}`);
    return res.status(422).json({
      error: `Payment gateway error (${code}): ${text}`,
    });
  }

  const formToken = result.token;
  if (!formToken) {
    console.error('[get-payment-token] Authorize.net returned Ok but no token');
    return res.status(502).json({ error: 'Payment gateway did not return a session token.' });
  }

  // ── Return the token to the browser ──────────────────────────────────────
  // formToken is NOT a secret — it is a short-lived (15 min), single-use
  // session token that opens the Authorize.net iframe.
  return res.status(200).json({ formToken, env });
};
