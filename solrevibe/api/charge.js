// api/charge.js — Vercel Serverless Function
// Receives Accept.js payment nonce from frontend and charges the card via Authorize.net

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
  } = req.body;

  if (!opaqueDataDescriptor || !opaqueDataValue) {
    return res.status(400).json({ error: 'Missing payment token. Please re-enter your card details.' });
  }

  const apiLoginId     = process.env.AUTHORIZENET_API_LOGIN_ID;
  const transactionKey = process.env.AUTHORIZENET_TRANSACTION_KEY;
  const env            = process.env.AUTHORIZENET_ENV || 'sandbox';

  if (!apiLoginId || !transactionKey) {
    console.error('Missing Authorize.net credentials in environment variables');
    return res.status(500).json({ error: 'Payment gateway not configured. Please contact support.' });
  }

  const endpoint = env === 'production'
    ? 'https://api.authorize.net/xml/v1/request.api'
    : 'https://apitest.authorize.net/xml/v1/request.api';

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
          firstName: (cardholderName || contactName || '').split(' ')[0] || '',
          lastName:  (cardholderName || contactName || '').split(' ').slice(1).join(' ') || '',
          company:   businessName || '',
          address:   address || '',
          city:      city || '',
          state:     state || '',
          zip:       zip || '',
          country:   'US',
          email:     email || '',
          phoneNumber: phone || '',
        },
        order: {
          description: 'SOUL REViBE Business-in-a-Box Station — Direct B2B Purchase',
        },
        userFields: {
          userField: [
            { name: 'businessName', value: businessName || '' },
            { name: 'contactName',  value: contactName  || '' },
          ],
        },
      },
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chargePayload),
    });

    const text = await response.text();
    const cleanText = text.replace(/^\uFEFF/, '');
    const data = JSON.parse(cleanText);

    const messages = data && data.messages;
    if (messages && messages.resultCode === 'Error') {
      const errMsg = (messages.message && messages.message[0] && messages.message[0].text) || 'Transaction failed';
      console.error('Authorize.net API error:', errMsg);
      return res.status(400).json({ error: errMsg });
    }

    const txResult = data && data.transactionResponse;
    const responseCode = txResult && txResult.responseCode;

    if (responseCode === '1') {
      return res.status(200).json({
        success: true,
        transactionId: txResult.transId,
        authCode:      txResult.authCode,
        accountType:   txResult.accountType,
        last4:         txResult.accountNumber ? txResult.accountNumber.replace(/X/g, '') : '',
        amount:        amount || '3000.00',
        message:       (txResult.messages && txResult.messages.message && txResult.messages.message[0] && txResult.messages.message[0].description) || 'Transaction approved',
      });
    } else {
      const declineMsg =
        (txResult && txResult.errors && txResult.errors.error && txResult.errors.error[0] && txResult.errors.error[0].errorText) ||
        (txResult && txResult.messages && txResult.messages.message && txResult.messages.message[0] && txResult.messages.message[0].description) ||
        'Transaction was declined. Please check your card details.';
      console.error('Transaction declined:', declineMsg, 'Code:', responseCode);
      return res.status(402).json({ error: declineMsg });
    }

  } catch (err) {
    console.error('Charge API exception:', err);
    return res.status(500).json({ error: 'Payment processing failed. Please try again or contact support.' });
  }
}
