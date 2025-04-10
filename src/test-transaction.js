import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const testTransaction = async () => {
  try {
    const response = await fetch('http://localhost:4001/api/transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.API_KEY
      },
      body: JSON.stringify({
        xReceipts: {
          cardId: "TEST123"
        },
        transactionAmount: {
          merchantTransactionAmount: 1000,
          transactionCurrency: "SEK"
        },
        paymentCard: {
          cardType: "VISA",
          maskedPan: [{
            maskedPanValue: "************1234"
          }]
        },
        retrievalReferenceNumber: "REF123456",
        acquirerTerminalId: "TERM001",
        merchantName: "Test Store"
      })
    });

    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

testTransaction();
