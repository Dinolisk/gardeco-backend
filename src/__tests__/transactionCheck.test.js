import request from 'supertest';
import express from 'express';
import { Transaction } from '../Models/transactionModel.js';
import { sequelize } from '../Database/db.js';
import { handleTransactionCheck } from '../Controllers/transactionCheckController.js';

jest.setTimeout(20000); // Sets 20s timeout for all tests/hooks in this file

const app = express();
app.use(express.json());
app.post('/transaction-check', handleTransactionCheck);

describe('Transaction Check Request API', () => {
  beforeAll(async () => {
    await Transaction.create({
      acquirer_terminal_id: 'TERMINAL123',
      acquirer_merchant_id: 'MERCHANT456',
      card_type: 'VISA',
      acquirer_transaction_timestamp: new Date('2023-01-01T12:00:00Z'),
      transaction_amount: 100.50,
      transaction_currency: 'SEK',
      authorization_code: 'AUTH789',
      system_trace_audit_number: 'STAN001',
      retrieval_reference_number: 'REF123',
      masked_pan: '********1234',
      merchant_name: 'Test Merchant'
    });
  });

  afterAll(async () => {
    console.log('Starting cleanup...');
    await Transaction.destroy({ where: {} });
    console.log('Destroyed transactions');
    console.log('Attempting to close sequelize connection...');
    await sequelize.close();
    console.log('Sequelize connection closed.');
  }, 30000);

  it('should match an existing transaction', async () => {
    const response = await request(app)
      .post('/transaction-check')
      .send({
        AcquirerTerminalId: 'TERMINAL123',
        AcquirerMerchantId: 'MERCHANT456',
        cardType: 'VISA',
        AcquirerTransactionTimestamp: '2023-01-01T12:00:00Z',
        TransactionAmount: 100.50,
        TransactionCurrency: 'SEK',
        AuthorizationCode: 'AUTH789'
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Transaction matched successfully');
    expect(response.body.data).toHaveProperty('transactionId');
  });

  it('should fail when required fields are missing', async () => {
    const response = await request(app)
      .post('/transaction-check')
      .send({
        cardType: 'VISA',
        TransactionAmount: 100.50
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Missing required fields');
    expect(response.body.fields).toContain('AcquirerTerminalId');
  });

  it('should fail when no matching transaction is found', async () => {
    const response = await request(app)
      .post('/transaction-check')
      .send({
        AcquirerTerminalId: 'TERMINAL999',
        cardType: 'VISA',
        AcquirerTransactionTimestamp: '2023-01-01T12:00:00Z',
        TransactionAmount: 100.50,
        TransactionCurrency: 'SEK',
        AuthorizationCode: 'AUTH789'
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Transaction not found');
  });
});
