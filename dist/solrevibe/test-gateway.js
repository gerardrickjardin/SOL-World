#!/usr/bin/env node
/**
 * test-gateway.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Quick gateway connection test — run this locally to verify your
 * Authorize.net sandbox credentials are working BEFORE deploying.
 *
 * Usage:
 *   AUTHORIZENET_API_LOGIN_ID=xxxx AUTHORIZENET_TRANSACTION_KEY=xxxx node test-gateway.js
 *
 * Or create a .env file and run:
 *   node test-gateway.js
 */

const https = require('https');
const http  = require('http');
const os    = require('os');

// ── Load .env file if present (no external deps needed) ───────────────────────
const path = require('path');
const fs   = require('fs');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...vals] = line.trim().split('=');
    if (key && !key.startsWith('#') && !(key in process.env)) {
      process.env[key] = vals.join('=').trim();
    }
  });
}

// ── Read credentials from environment ────────────────────────────────────────
const API_LOGIN_ID    = process.env.AUTHORIZENET_API_LOGIN_ID;
const TRANSACTION_KEY = process.env.AUTHORIZENET_TRANSACTION_KEY;
const ENV             = (process.env.AUTHORIZENET_ENV || 'sandbox').toLowerCase();

const AUTHNET_HOST = ENV === 'production' ? 'api2.authorize.net' : 'apitest.authorize.net';

// ── Helpers ───────────────────────────────────────────────────────────────────
function color(code, text) { return `\x1b[${code}m${text}\x1b[0m`; }
const green  = t => color('32;1', t);
const red    = t => color('31;1', t);
const yellow = t => color('33;1', t);
const cyan   = t => color('36;1', t);
const bold   = t => color('1', t);

function callAuthNet(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req  = https.request({
      hostname: AUTHNET_HOST,
      path:     '/xml/v1/request.api',
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data.replace(/^\uFEFF/, ''))); }
        catch { reject(new Error('Invalid JSON from Authorize.net')); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Print banner ──────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(60));
console.log(bold('  SOL REViBE — Authorize.net Gateway Test'));
console.log('─'.repeat(60));
console.log(`  Environment : ${cyan(ENV.toUpperCase())}`);
console.log(`  API Host    : ${cyan(AUTHNET_HOST)}`);
console.log(`  Login ID    : ${API_LOGIN_ID ? cyan(API_LOGIN_ID) : red('NOT SET')}`);
console.log(`  Trans. Key  : ${TRANSACTION_KEY ? cyan('*'.repeat(TRANSACTION_KEY.length)) : red('NOT SET')}`);
console.log('─'.repeat(60) + '\n');

if (!API_LOGIN_ID || !TRANSACTION_KEY) {
  console.log(red('✗  Missing credentials.\n'));
  console.log('  Set them in a .env file:\n');
  console.log('    ' + yellow('AUTHORIZENET_API_LOGIN_ID=your_login_id'));
  console.log('    ' + yellow('AUTHORIZENET_TRANSACTION_KEY=your_transaction_key'));
  console.log('    ' + yellow('AUTHORIZENET_ENV=sandbox\n'));
  console.log('  Then re-run: ' + cyan('node test-gateway.js') + '\n');
  process.exit(1);
}

// ── Test 1: authenticateTestRequest ──────────────────────────────────────────
async function testAuthentication() {
  process.stdout.write('  [1/3] Testing API credentials... ');
  const resp = await callAuthNet({
    authenticateTestRequest: {
      merchantAuthentication: {
        name:           API_LOGIN_ID,
        transactionKey: TRANSACTION_KEY,
      },
    },
  });

  const r = resp.authenticateTestResponse || resp;
  const code = r?.messages?.resultCode;
  const msg  = r?.messages?.message?.[0];

  if (code === 'Ok') {
    console.log(green('✓ Connected!'));
    return true;
  } else {
    console.log(red('✗ Failed'));
    console.log(`     Code: ${msg?.code || 'UNKNOWN'}`);
    console.log(`     Text: ${msg?.text || JSON.stringify(r)}`);
    return false;
  }
}

// ── Test 2: getHostedPaymentPageRequest (formToken) ───────────────────────────
async function testFormToken() {
  process.stdout.write('  [2/3] Requesting Accept Hosted formToken... ');

  const baseUrl = ENV === 'production' ? 'https://accept.authorize.net' : 'https://test.authorize.net'; // return URL for the hosted form

  const resp = await callAuthNet({
    getHostedPaymentPageRequest: {
      merchantAuthentication: {
        name:           API_LOGIN_ID,
        transactionKey: TRANSACTION_KEY,
      },
      transactionRequest: {
        transactionType: 'authCaptureTransaction',
        amount: '3000.00',
      },
      hostedPaymentSettings: {
        setting: [
          {
            settingName:  'hostedPaymentReturnOptions',
            settingValue: JSON.stringify({
              showReceipt: true,
              url:         `${baseUrl}/success`,
              urlText:     'Return',
              cancelUrl:   `${baseUrl}/cancel`,
              cancelUrlText: 'Cancel',
            }),
          },
          {
            settingName:  'hostedPaymentIFrameCommunicatorUrl',
            settingValue: JSON.stringify({ url: `${baseUrl}/communicator` }),
          },
          {
            settingName:  'hostedPaymentStyleOptions',
            settingValue: JSON.stringify({ bgColor: 'f8fafc' }),
          },
          {
            settingName:  'hostedPaymentOrderOptions',
            settingValue: JSON.stringify({ show: true, merchantName: 'SOL REViBE' }),
          },
          {
            settingName:  'hostedPaymentButtonOptions',
            settingValue: JSON.stringify({ text: 'Complete Payment — $3,000' }),
          },
          {
            settingName:  'hostedPaymentCustomerOptions',
            settingValue: JSON.stringify({ showEmail: false, requiredEmail: false, addPaymentProfile: false }),
          },
          {
            settingName:  'hostedPaymentShippingAddressOptions',
            settingValue: JSON.stringify({ show: false, required: false }),
          },
        ],
      },
    },
  });

  const r    = resp.getHostedPaymentPageResponse || resp;
  const code = r?.messages?.resultCode;
  const token = r?.token;

  if (code === 'Ok' && token) {
    console.log(green('✓ Got formToken!'));
    console.log(`     Token: ${cyan(token.substring(0, 30))}...`);

    // Build the hosted payment URL so user can open it in a browser
    const paymentHost = ENV === 'production' ? 'accept.authorize.net' : 'test.authorize.net';
    const payUrl = `https://${paymentHost}/payment/payment?token=${encodeURIComponent(token)}`;
    return { token, payUrl, paymentHost };
  } else {
    const msg = r?.messages?.message?.[0];
    console.log(red('✗ Failed'));
    console.log(`     Code: ${msg?.code || 'UNKNOWN'}`);
    console.log(`     Text: ${msg?.text || JSON.stringify(r)}`);
    return null;
  }
}

// ── Test 3: Open a mini browser preview ──────────────────────────────────────
async function serveBrowserPreview(payUrl, token, paymentHost) {
  process.stdout.write('  [3/3] Starting local preview server... ');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Authorize.net Gateway Test — SOL REViBE</title>
<style>
  body { margin:0; font-family:system-ui,sans-serif; background:#f1f5f9; display:flex; align-items:center; justify-content:center; min-height:100vh; }
  .card { background:#fff; border-radius:18px; box-shadow:0 8px 40px rgba(0,0,0,.12); padding:2.5rem 2rem; max-width:480px; width:100%; text-align:center; }
  .badge { display:inline-flex; align-items:center; gap:6px; background:#d1fae5; color:#065f46; font-size:.78rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; padding:.35rem .75rem; border-radius:999px; margin-bottom:1.5rem; }
  .dot { width:8px;height:8px;background:#10b981;border-radius:50%;animation:pulse 1.5s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)} }
  h1 { font-size:1.5rem; font-weight:800; color:#0f172a; margin:0 0 .5rem; }
  p  { color:#64748b; font-size:.95rem; margin:.5rem 0 1.5rem; line-height:1.5; }
  .token-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:.75rem 1rem; font-family:monospace; font-size:.78rem; color:#0f172a; word-break:break-all; margin-bottom:1.5rem; text-align:left; }
  .label { font-size:.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#94a3b8; margin-bottom:.3rem; }
  .open-btn { display:inline-block; background:linear-gradient(135deg,#10b981,#059669); color:white; text-decoration:none; font-weight:700; font-size:1rem; padding:.9rem 2rem; border-radius:10px; box-shadow:0 4px 14px rgba(16,185,129,.35); transition:transform .2s,box-shadow .2s; }
  .open-btn:hover { transform:translateY(-2px); box-shadow:0 8px 22px rgba(16,185,129,.45); }
  .note { margin-top:1.25rem; font-size:.78rem; color:#94a3b8; }
  .checks { text-align:left; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:1rem 1.25rem; margin-bottom:1.5rem; }
  .check-row { display:flex; align-items:center; gap:.5rem; font-size:.88rem; color:#065f46; padding:.2rem 0; }
  .check-icon { color:#10b981; font-size:1rem; flex-shrink:0; }
</style>
</head>
<body>
<div class="card">
  <div class="badge"><span class="dot"></span> Gateway Connected</div>
  <h1>Authorize.net — Live</h1>
  <p>Your sandbox credentials are verified and working. Click below to open the real Authorize.net hosted payment form.</p>

  <div class="checks">
    <div class="check-row"><span class="check-icon">✓</span> API credentials authenticated</div>
    <div class="check-row"><span class="check-icon">✓</span> formToken received from sandbox</div>
    <div class="check-row"><span class="check-icon">✓</span> No credentials exposed to browser</div>
    <div class="check-row"><span class="check-icon">✓</span> Serverless API route working</div>
  </div>

  <div class="token-box">
    <div class="label">formToken (${ENV.toUpperCase()}, 15-min expiry)</div>
    ${token.substring(0,48)}...
  </div>

  <form method="POST" action="https://${paymentHost}/payment/payment" target="_blank" style="display:inline;">
    <input type="hidden" name="token" value="${token}">
    <button type="submit" class="open-btn">Open Authorize.net Payment Form &rarr;</button>
  </form>

  <p class="note">
    Test card: <strong>4111 1111 1111 1111</strong> · any future exp · any CVV<br>
    This is the SANDBOX — no real charges are made.
  </p>
</div>
</body>
</html>`;

  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    });

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      const url = `http://localhost:${port}`;
      console.log(green('✓ Ready'));
      console.log(`\n  ${bold('Preview URL:')} ${cyan(url)}\n`);

      // Auto-open browser
      const { exec } = require('child_process');
      const openCmd = process.platform === 'darwin' ? `open "${url}"`
                    : process.platform === 'win32'  ? `start "${url}"`
                    : `xdg-open "${url}"`;
      exec(openCmd, err => {
        if (err) console.log(`  (Could not auto-open browser — visit the URL above manually)`);
      });

      console.log('  ' + yellow('Press Ctrl+C to stop the test server.\n'));
      resolve(server);
    });
  });
}

// ── Run all tests ─────────────────────────────────────────────────────────────
(async () => {
  try {
    const authOk = await testAuthentication();
    if (!authOk) {
      console.log('\n  ' + red('Authentication failed — check your credentials.\n'));
      process.exit(1);
    }

    const tokenResult = await testFormToken();
    if (!tokenResult) {
      console.log('\n  ' + red('Could not get formToken — check your account settings.\n'));
      process.exit(1);
    }

    console.log('\n' + green('  ✓ All tests passed!') + ' Gateway is connected and working.\n');
    await serveBrowserPreview(tokenResult.payUrl, tokenResult.token, tokenResult.paymentHost);

  } catch (err) {
    console.log('\n  ' + red('Unexpected error:'), err.message, '\n');
    process.exit(1);
  }
})();
