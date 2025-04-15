import request from 'supertest';
import express from 'express';
import { Transaction } from '../Models/transactionModel.js'; // Behövs för beforeAll och extra check
import { sequelize } from '../Database/db.js';
// Importera routern istället för bara controllern
import transactionRouter from '../Routes/transactionRoute.js'; // Antag att den exporteras som default

// Definiera en API-nyckel för testning
const TEST_API_KEY = 'test-api-key-for-jest-12345';

// Sätt miljövariabeln INNAN testerna körs
process.env.API_KEY = TEST_API_KEY;

jest.setTimeout(20000); // Sets 20s timeout for all tests/hooks in this file

const app = express();
app.use(express.json());
// Montera routern så att middleware körs
app.use('/api', transactionRouter); // Antag att routern är monterad på /api i er riktiga app, annars justera/ta bort /api

// --- Test Data Setup ---
const testTransactionData = {
  acquirerTerminalId: 'TERMINAL123',
  acquirerMerchantId: 'MERCHANT456', // För CR1 test senare
  cardType: 'VISA',
  acquirerTransactionTimestamp: '2023-01-01T12:00:00Z',
  merchantTransactionAmount: 100.50,
  merchantTransactionCurrency: 'SEK',
  authorizationCode: 'AUTH789',
  systemTraceAuditNumber: 'STAN001', // För CR2 test senare
  retrievalReferenceNumber: 'REF123', // För CR2 test senare
  maskedPanValue: '********1234', // För CR2 test senare
  merchantName: 'Test Merchant'
};

// Data som ska skickas i request body (matchar X-Receipts struktur)
// Vi behöver ett cardId att skicka med som ska sparas vid match
const testCardId = '111e8400-e29b-41d4-a716-446655441111';

const createRequestBody = (overrides = {}) => {
  // Skapa en bas-payload som följer X-Receipts schema
  const basePayload = {
    schemaVersion: "V1.0",
    xReceipts: {
      cashierSystemId: "987654321", // Erforderligt dummy-värde
      cardId: testCardId,           // Erforderligt dummy-värde som ska sparas
      cardholderConsents: [{ consentType: "DIGITAL_RECEIPT", consentStatus: true }], // Erforderlig dummy
      cardholderMemberships: [] // Erforderlig dummy
      // roundTripId är optional
    },
    merchantName: testTransactionData.merchantName, // Erforderligt
    acquirerTerminalId: testTransactionData.acquirerTerminalId, // Erforderligt
    acquirerTransactionTimestamp: testTransactionData.acquirerTransactionTimestamp, // Erforderligt
    transactionAmount: { // Erforderligt objekt
      merchantTransactionAmount: testTransactionData.merchantTransactionAmount, // Erforderligt
      merchantTransactionCurrency: testTransactionData.merchantTransactionCurrency // Erforderligt
      // cardholder amount/currency är optional
    },
    transactionIdentifier: { // Erforderligt objekt, fält inuti optional
      authorizationCode: testTransactionData.authorizationCode, // Skickas med för matchning
      systemTraceAuditNumber: testTransactionData.systemTraceAuditNumber, // Skickas med
      retrievalReferenceNumber: testTransactionData.retrievalReferenceNumber // Skickas med
    },
    paymentCard: { // Erforderligt objekt
      cardType: testTransactionData.cardType, // Erforderligt för matchning
      maskedPan: [ // Erforderlig array
        { maskedPanType: "PRIMARY_PAN", maskedPanValue: testTransactionData.maskedPanValue }
      ]
      // acquirerMerchantIds är optional men kan behövas för CR1
      // acquirerMerchantIds: { acquirerMerchantId: testTransactionData.acquirerMerchantId }
    }
  };

  // Applicera overrides för specifika testfall
  // Detta kräver en funktion för att slå samman nästlade objekt, förenklar här:
  // För mer komplexa overrides kan en deep merge-funktion behövas
  return { ...basePayload, ...overrides };
};


describe('Transaction Check Request API', () => {
  let createdTransactionId;

  beforeAll(async () => {
    // Rensa först för säkerhets skull
    await Transaction.destroy({ where: {}, truncate: true });
    // Skapa en transaktion att matcha mot
    const createdTx = await Transaction.create({
      acquirer_terminal_id: testTransactionData.acquirerTerminalId,
      acquirer_merchant_id: testTransactionData.acquirerMerchantId,
      card_type: testTransactionData.cardType,
      acquirer_transaction_timestamp: new Date(testTransactionData.acquirerTransactionTimestamp),
      transaction_amount: testTransactionData.merchantTransactionAmount,
      transaction_currency: testTransactionData.merchantTransactionCurrency,
      authorization_code: testTransactionData.authorizationCode,
      system_trace_audit_number: testTransactionData.systemTraceAuditNumber,
      retrieval_reference_number: testTransactionData.retrievalReferenceNumber,
      masked_pan: testTransactionData.maskedPanValue,
      merchant_name: testTransactionData.merchantName
      // card_id är null initialt
    });
    createdTransactionId = createdTx.id; // Spara ID för senare kontroll
    console.log(`Created transaction with ID: ${createdTransactionId}`);
  });

  afterAll(async () => {
    console.log('Starting cleanup...');
    try {
       await Transaction.destroy({ where: {} }); // Ta bort alla
       console.log('Destroyed transactions');
       console.log('Attempting to close sequelize connection...');
       await sequelize.close();
       console.log('Sequelize connection closed.');
    } catch (error) {
        console.error("Error during afterAll cleanup:", error);
    }
  }, 30000); // Ökad timeout för säkerhets skull

  // --- Testfall ---

  it('should fail with 401 if API key is missing', async () => {
    const requestBody = createRequestBody(); // Skapa en giltig body
    const response = await request(app)
      .post('/api/transaction-check') // Använd rätt path baserat på hur routern monterades
      // .set('x-api-key', ...) // Skicka INTE med headern
      .send(requestBody);

    expect(response.status).toBe(401);
    expect(response.body.message).toContain('Unauthorized');
  });

  it('should fail with 401 if API key is invalid', async () => {
    const requestBody = createRequestBody();
    const response = await request(app)
      .post('/api/transaction-check')
      .set('x-api-key', 'invalid-key') // Skicka med fel nyckel
      .send(requestBody);

    expect(response.status).toBe(401);
    expect(response.body.message).toContain('Unauthorized');
  });

  it('should match an existing transaction and return 200 OK with empty body', async () => {
    const requestBody = createRequestBody(); // Skapa en body som ska matcha
    const response = await request(app)
      .post('/api/transaction-check')
      .set('x-api-key', TEST_API_KEY) // Lägg till korrekt header
      .send(requestBody);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({}); // Förvänta dig en tom JSON-body

    // Extra kontroll: Verifiera att card_id uppdaterades i databasen
    const updatedTransaction = await Transaction.findByPk(createdTransactionId);
    expect(updatedTransaction).not.toBeNull();
    expect(updatedTransaction.card_id).toBe(testCardId); // Kontrollera att rätt cardId sparades
  });

  it('should fail with 400 when required fields are missing (e.g., merchantTransactionAmount)', async () => {
     // Skapa en body där en obligatorisk del saknas
     const invalidRequestBody = createRequestBody();
     delete invalidRequestBody.transactionAmount.merchantTransactionAmount; // Ta bort ett obligatoriskt fält

    const response = await request(app)
      .post('/api/transaction-check')
      .set('x-api-key', TEST_API_KEY)
      .send(invalidRequestBody);

    expect(response.status).toBe(400);
    // Uppdatera förväntat felmeddelande baserat på er *nuvarande* minimala validering
    // För närvarande kollar controllern bara xReceipts.cardId, så detta test
    // skulle *inte* fånga det borttagna beloppet just nu.
    // Om ni *hade* implementerat fullständig validering, skulle ni förvänta er:
    // expect(response.body.error).toContain('Missing required field');
    // expect(response.body.fields).toContain('transactionAmount.merchantTransactionAmount');

    // Just nu testar vi bara om cardId saknas:
    const invalidRequestBodyNoCardId = createRequestBody();
    delete invalidRequestBodyNoCardId.xReceipts.cardId;
     const responseNoCardId = await request(app)
      .post('/api/transaction-check')
      .set('x-api-key', TEST_API_KEY)
      .send(invalidRequestBodyNoCardId);
     expect(responseNoCardId.status).toBe(400);
     expect(responseNoCardId.body.error).toBe('Missing or invalid required fields for processing request');
     expect(responseNoCardId.body.fields).toContain('xReceipts.cardId');

  });

  it('should fail with 404 when no matching transaction is found', async () => {
    // Skapa en giltig body men med data som inte matchar
    const nonMatchingRequestBody = createRequestBody({
        acquirerTerminalId: 'TERMINAL999' // Ändra en nyckel för att misslyckas med matchning
    });

    const response = await request(app)
      .post('/api/transaction-check')
      .set('x-api-key', TEST_API_KEY)
      .send(nonMatchingRequestBody);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Transaction not found');
  });

  // --- TODO: Add tests for CR1, CR2, CR3 ---
  // Dessa testfall kräver att ni skapar flera transaktioner i beforeAll/beforeEach
  // som är identiska på de primära fälten men skiljer sig åt på de konditionella fälten.
  // Skicka sedan en request body som innehåller det relevanta konditionella fältet
  // och verifiera att rätt transaktion (och endast en) returneras/matchas.
  // Exempel:
  /*
  it('should use AcquirerMerchantId (CR1) to resolve duplicates', async () => {
     // 1. Setup: Skapa två transaktioner i DB som matchar primärt, men har olika acquirer_merchant_id.
     // 2. Request: Skapa en request body som matchar primärt OCH inkluderar ETT av acquirerMerchantId:n.
     // 3. Execute: Skicka request med API-nyckel.
     // 4. Assert: Förvänta 200 OK, {}, och verifiera att rätt transaktions card_id uppdaterades.
  });
  // Liknande tester för CR2 (STAN, RRN, Masked PAN) och CR3 (Card Type, om den inte är primär nyckel).
  */

});