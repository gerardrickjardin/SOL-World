const https = require('https');

function sendJson(res, statusCode, data) {
  const jsonStr = JSON.stringify(data);
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(jsonStr);
}

function getBody(req) {
  return new Promise((resolve) => {
    if (req.body) {
      if (typeof req.body === 'string') {
        try { return resolve(JSON.parse(req.body)); } catch (e) { return resolve({}); }
      }
      return resolve(req.body);
    }
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function postJson(urlStr, data) {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(urlStr);
      const body = JSON.stringify(data);

      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 25000,
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, body: responseBody });
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Authorize.net gateway timeout'));
      });

      req.write(body);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed. Please use POST.' });
  }

  try {
    const body = await getBody(req);

    const {
      opaqueDataDescriptor,
      opaqueDataValue,
      amount,
      businessName,
      contactName,
      email,
      phone,
      address,
      city,
      state,
      zip,
      cardholderName,
    } = body || {};

    if (!opaqueDataDescriptor || !opaqueDataValue) {
      return sendJson(res, 400, { error: 'Missing tokenized payment credentials. Please re-enter your card details.' });
    }

    const apiLoginId = process.env.AUTHORIZENET_API_LOGIN_ID || '76zv3ZF6';
    const transactionKey = process.env.AUTHORIZENET_TRANSACTION_KEY || '4ypP828TvKAqs35c';
    const env = (process.env.AUTHORIZENET_ENV || 'production').toLowerCase().trim();

    const endpoint = (env === 'sandbox')
      ? 'https://apitest.authorize.net/xml/v1/request.api'
      : 'https://api.authorize.net/xml/v1/request.api';

    const chargePayload = {
      createTransactionRequest: {
        merchantAuthentication: {
          name: apiLoginId,
          transactionKey: transactionKey,
        },
        refId: 'ORDER-' + Date.now(),
        transactionRequest: {
          transactionType: 'authCaptureTransaction',
          amount: amount || '3000.00',
          payment: {
            opaqueData: {
              dataDescriptor: opaqueDataDescriptor,
              dataValue: opaqueDataValue,
            },
          },
          billTo: {
            firstName: (cardholderName || contactName || 'Valued').split(' ')[0] || 'Valued',
            lastName: (cardholderName || contactName || 'Partner').split(' ').slice(1).join(' ') || 'Partner',
            company: businessName || '',
            address: address || '',
            city: city || '',
            state: state || '',
            zip: zip || '',
            country: 'US',
            email: email || '',
            phoneNumber: phone || '',
          },
          order: {
            description: 'SOUL REViBE Business-in-a-Box Station — Direct B2B Purchase',
          },
          userFields: {
            userField: [
              { name: 'businessName', value: businessName || '' },
              { name: 'contactName', value: contactName || '' },
            ],
          },
        },
      },
    };

    console.log(`Executing charge against Authorize.net (${env})...`);
    const { statusCode, body: rawBody } = await postJson(endpoint, chargePayload);
    const cleanText = (rawBody || '').replace(/^\uFEFF/, '').trim();
    let data;
    try {
      data = JSON.parse(cleanText);
    } catch (parseErr) {
      return sendJson(res, 502, { error: 'Invalid response from payment gateway.' });
    }

    const messages = data && data.messages;
    if (messages && messages.resultCode === 'Error') {
      const errMsg = (messages.message && messages.message[0] && messages.message[0].text) || 'Transaction failed.';
      return sendJson(res, 400, { error: errMsg });
    }

    const txResult = data && data.transactionResponse;
    const responseCode = txResult && txResult.responseCode;

    if (responseCode === '1') {
      return sendJson(res, 200, {
        success: true,
        transactionId: txResult.transId,
        authCode: txResult.authCode,
        accountType: txResult.accountType || 'Card',
        last4: txResult.accountNumber ? txResult.accountNumber.replace(/X/g, '') : '',
        amount: amount || '3000.00',
        message: (txResult.messages && txResult.messages.message && txResult.messages.message[0] && txResult.messages.message[0].description) || 'Transaction approved',
      });
    }

    const declineMsg =
      (txResult && txResult.errors && txResult.errors.error && txResult.errors.error[0] && txResult.errors.error[0].errorText) ||
      (txResult && txResult.messages && txResult.messages.message && txResult.messages.message[0] && txResult.messages.message[0].description) ||
      'The transaction was declined by the card issuer. Please verify your details or use another card.';

    return sendJson(res, 402, { error: declineMsg });

  } catch (err) {
    console.error('Charge API Exception:', err);
    return sendJson(res, 500, { error: 'Server error processing transaction: ' + (err.message || 'Unknown error') });
  }
};
