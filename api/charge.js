export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
  }

  try {
    let body = {};
    if (req.body) {
      if (typeof req.body === 'string') {
        try {
          body = JSON.parse(req.body);
        } catch (e) {
          body = {};
        }
      } else {
        body = req.body;
      }
    }

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
    } = body;

    if (!opaqueDataDescriptor || !opaqueDataValue) {
      return res.status(400).json({ error: 'Missing tokenized payment credentials. Please re-enter your card details.' });
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

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chargePayload),
    });

    const rawText = await response.text();
    const cleanText = (rawText || '').replace(/^\uFEFF/, '').trim();
    let data;
    try {
      data = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error('Failed to parse Authorize.net JSON:', cleanText);
      return res.status(502).json({ error: 'Invalid response received from payment gateway.' });
    }

    const messages = data && data.messages;
    if (messages && messages.resultCode === 'Error') {
      const errMsg = (messages.message && messages.message[0] && messages.message[0].text) || 'Transaction failed.';
      console.error('Authorize.net Gateway Error:', errMsg);
      return res.status(400).json({ error: errMsg });
    }

    const txResult = data && data.transactionResponse;
    const responseCode = txResult && txResult.responseCode;

    if (responseCode === '1') {
      return res.status(200).json({
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

    return res.status(402).json({ error: declineMsg });

  } catch (err) {
    console.error('API Handler Error:', err);
    return res.status(500).json({ error: 'Server error processing transaction: ' + (err.message || 'Unknown error') });
  }
}
