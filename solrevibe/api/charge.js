export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Please use POST.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
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
      return new Response(JSON.stringify({ error: 'Missing tokenized payment credentials. Please re-enter your card details.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chargePayload),
    });

    const rawText = await response.text();
    const cleanText = (rawText || '').replace(/^\uFEFF/, '').trim();
    let data;
    try {
      data = JSON.parse(cleanText);
    } catch (parseErr) {
      return new Response(JSON.stringify({ error: 'Invalid response from payment gateway.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const messages = data && data.messages;
    if (messages && messages.resultCode === 'Error') {
      const errMsg = (messages.message && messages.message[0] && messages.message[0].text) || 'Transaction failed.';
      return new Response(JSON.stringify({ error: errMsg }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const txResult = data && data.transactionResponse;
    const responseCode = txResult && txResult.responseCode;

    if (responseCode === '1') {
      return new Response(JSON.stringify({
        success: true,
        transactionId: txResult.transId,
        authCode: txResult.authCode,
        accountType: txResult.accountType || 'Card',
        last4: txResult.accountNumber ? txResult.accountNumber.replace(/X/g, '') : '',
        amount: amount || '3000.00',
        message: (txResult.messages && txResult.messages.message && txResult.messages.message[0] && txResult.messages.message[0].description) || 'Transaction approved',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const declineMsg =
      (txResult && txResult.errors && txResult.errors.error && txResult.errors.error[0] && txResult.errors.error[0].errorText) ||
      (txResult && txResult.messages && txResult.messages.message && txResult.messages.message[0] && txResult.messages.message[0].description) ||
      'The transaction was declined by the card issuer. Please verify your details or use another card.';

    return new Response(JSON.stringify({ error: declineMsg }), {
      status: 402,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error processing transaction: ' + (err.message || 'Unknown error') }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
