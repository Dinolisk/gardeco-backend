import request from 'supertest';
import express from 'express';
import { sequelize, initializeDatabase } from '../Database/db.js';
import transactionRouter from '../Routes/transactionRoute.js';
import { Transaction } from '../Models/transactionModel.js';

const TEST_API_KEY = 'test-api-key-for-jest-12345';
process.env.API_KEY = TEST_API_KEY;

const app = express();
app.use(express.json());
app.use('/api', transactionRouter);

// Testdata enligt Postman-flödet, men med schemaVersion, clientId och roundTripId
const cardId = '111e8400-e29b-41d4-a716-446655441111';
const clientId = '123456789';
const roundTripId = '123e4567-e89b-12d3-a456-426614174000';
const schemaVersion = 'V1.0';
const transactionData = {
  schemaVersion, // krävs av backend
  clientId,     // krävs av backend
  roundTripId,  // krävs av backend
  acquirerTerminalId: 'TERM002',
  acquirerTransactionTimestamp: '2025-05-19T22:22:15.982Z',
  transactionAmount: {
    merchantTransactionAmount: 1250.5,
    merchantTransactionCurrency: 'NOK'
  },
  transactionIdentifier: {
    authorizationCode: '123456',
    systemTraceAuditNumber: '789012',
    retrievalReferenceNumber: '456789012'
  },
  paymentCard: {
    cardType: 'MASTERCARD',
    maskedPan: [
      {
        maskedPanType: 'PRIMARY_PAN',
        maskedPanValue: '************5678'
      }
    ],
    acquirerMerchantIds: {
      acquirerMerchantId: 'MERCH002'
    }
  },
  merchantName: 'Gardeco Store',
  cardholderReference: 'TEST-REF-123',
  lineItems: [
    {
      itemName: 'Bryggkaffe',
      itemDescription: 'Färskbryggt kaffe',
      itemId: '1001',
      itemPrice: 30.00,
      itemQuantity: 2,
      quantityType: 'PCS',
      itemSumTotal: 60.00,
      itemMetadataList: [
        { key: 'kategori', value: 'dryck' }
      ]
    }
  ],
  orderSummary: {
    currencyIsoCode: 'NOK',
    totalAmountIncVat: 1250.5,
    totalAmountExcVat: 1000.4,
    vatSummary: [
      { vatRate: 12, vatAmount: 3.21 }
    ]
  }
};

describe('X-Receipt End-to-End Flow', () => {
  let createdTransactionId;

  beforeAll(async () => {
    await initializeDatabase();
    await Transaction.destroy({ where: {}, truncate: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('Step 1: should create an initial transaction', async () => {
    const response = await request(app)
      .post('/api/transaction')
      .set('x-api-key', TEST_API_KEY)
      .send({ cardId, transactionData });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body.card_id).toBe(cardId);
    expect(response.body.acquirer_terminal_id).toBe(transactionData.acquirerTerminalId);
    createdTransactionId = response.body.id;
  });

  it('Step 2: should match the transaction with X-Receipt POST', async () => {
    // Skapa matchningspayload enligt Postman
    const matchPayload = {
      acquirerTerminalId: transactionData.acquirerTerminalId,
      acquirerTransactionTimestamp: transactionData.acquirerTransactionTimestamp,
      transactionAmount: transactionData.transactionAmount,
      transactionIdentifier: transactionData.transactionIdentifier,
      paymentCard: transactionData.paymentCard,
      merchantName: transactionData.merchantName,
      xReceipts: {
        cardId,
        clientId,
        roundTripId
      }
    };

    const response = await request(app)
      .post('/api/transaction-check')
      .set('x-api-key', TEST_API_KEY)
      .send(matchPayload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({});

    // Kontrollera att transaktionen nu har MATCHED-status och card_id är satt
    const updated = await Transaction.findByPk(createdTransactionId);
    expect(updated).not.toBeNull();
    expect(updated.card_id).toBe(cardId);
    expect(updated.xreceipt_status).toBe('MATCHED');
  });

  it('Step 3: should fetch the digital receipt in XDRE format', async () => {
    const response = await request(app)
      .get(`/api/transaction/${createdTransactionId}/receipt`)
      .set('x-api-key', TEST_API_KEY);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('xReceipts');
    const xReceipts = response.body.xReceipts;
    expect(xReceipts).toHaveProperty('schemaVersion');
    expect(xReceipts).toHaveProperty('cashierSystemId');
    expect(xReceipts).toHaveProperty('roundTripId');
    expect(xReceipts).toHaveProperty('cardholderReference', 'TEST-REF-123');
    expect(xReceipts).toHaveProperty('generalInformation');
    expect(xReceipts).toHaveProperty('merchant');
    expect(xReceipts).toHaveProperty('lineItems');
    expect(xReceipts).toHaveProperty('orderSummary');
    expect(xReceipts).toHaveProperty('payment');
  });
}); 