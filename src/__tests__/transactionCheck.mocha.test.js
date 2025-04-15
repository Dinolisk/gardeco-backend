import request from 'supertest';
import express from 'express';
import { expect } from 'chai';
import { Transaction } from '../Models/transactionModel.js';
import { sequelize } from '../Database/db.js';
import { handleTransactionCheck } from '../Controllers/transactionCheckController.js';

const app = express();
app.use(express.json());
app.post('/transaction-check', handleTransactionCheck);

describe('Transaction Check Request API - Mocha', function() {
  before(async function() {
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

  after(async function() {
    await Transaction.destroy({ where: {} });
    await sequelize.close();
  });

  it('should match an existing transaction', async function() {
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

    expect(response.status).to.equal(200);
    expect(response.body.message).to.equal('Transaction matched successfully');
    expect(response.body.data).to.have.property('transactionId');
  });

  it('should fail when required fields are missing', async function() {
    const response = await request(app)
      .post('/transaction-check')
      .send({
        cardType: 'VISA',
        TransactionAmount: 100.50
      });

    expect(response.status).to.equal(400);
    expect(response.body.error).to.equal('Missing required fields');
    expect(response.body.fields).to.include('AcquirerTerminalId');
  });

  it('should fail when no matching transaction is found', async function() {
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

    expect(response.status).to.equal(404);
    expect(response.body.error).to.equal('Transaction not found');
  });
});
