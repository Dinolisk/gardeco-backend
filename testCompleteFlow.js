import { Transaction, saveTransaction, findMatchingTransaction, updateXReceiptStatus } from './src/Models/transactionModel.js';
import { Receipt } from './src/Models/receiptModel.js';
import { ReceiptLineItem } from './src/Models/receiptLineItemModel.js';
import { PaymentMethod } from './src/Models/receiptModel.js';
import { convertToXDREFormat } from './src/Services/digitalReceiptService.js';
import { testConnection } from './src/Database/db.js';

async function testCompleteFlow() {
  try {
    // Test database connection first
    console.log('Testing database connection...');
    await testConnection();
    console.log('Database connection successful!\n');

    console.log('=== Testing Complete Flow: Transaction → X-Receipt Match → Receipt ===\n');

    // Step 1: Create initial transaction
    const transactionData = {
      xReceipts: {
        schemaVersion: "1.0",
        cashierSystemId: "SE556677889901",
        roundTripId: "550e8400-e29b-41d4-a716-446655440000",
        cardholderReference: "CUSTOMER123",
        generalInformation: {
          receiptType: "PURCHASE",
          systemTimestamp: new Date().toISOString(),
          receiptNumber: "REC123",
          receiptStatus: "PENDING",
          receiptTimestamp: new Date().toISOString()
        },
        merchant: {
          merchantName: "Gardeco Testbutik 2",
          merchantId: "1234567890",
          merchantAddress: {
            street: "Testgatan 1",
            city: "Stockholm",
            postalCode: "12345",
            country: "SE"
          }
        },
        branch: {
          branchName: "Huvudkontor",
          branchId: "BRANCH001",
          branchAddress: {
            street: "Testgatan 1",
            city: "Stockholm",
            postalCode: "12345",
            country: "SE"
          }
        },
        lineItems: [{
          itemName: "Test Product",
          itemDescription: "A test product",
          itemIds: {
            id: "PROD001"
          },
          itemPrice: {
            priceIncVat: "899.00",
            priceExcVat: "719.20",
            vatRate: 25,
            vatAmount: "179.80"
          },
          itemQuantity: {
            type: "PIECE",
            quantity: 1
          },
          itemSumTotal: "899.00"
        }],
        orderSummary: {
          currencyIsoCode: "SEK",
          totalAmountIncVat: "899.00",
          totalAmountExcVat: "719.20",
          vatSummary: [{
            vatRate: 25,
            vatAmount: "179.80"
          }]
        },
        payment: [{
          paymentMethod: "CARD",
          paymentType: "VISA",
          cardType: "VISA",
          maskedPan: "555555**9876",
          acquirerTerminalId: "TERM002",
          acquirerMerchantId: "1234567890",
          acquirerTransactionTimestamp: new Date().toISOString(),
          transactionAmount: {
            merchantTransactionAmount: 899,
            merchantTransactionCurrency: "SEK"
          },
          transactionIdentifier: {
            authorizationCode: "AUTH123",
            systemTraceAuditNumber: "123456",
            retrievalReferenceNumber: "789012"
          }
        }]
      }
    };

    const savedTransaction = await saveTransaction(transactionData);
    console.log('✅ Transaction saved:', savedTransaction.id);

    // Step 2: Simulate X-Receipt sending matching request
    console.log('\nStep 2: Simulating X-Receipt match request...');
    const xreceiptData = {
      acquirerTerminalId: "TERM002",
      acquirerTransactionTimestamp: transactionData.transactionData.acquirerTransactionTimestamp,
      transactionAmount: {
        merchantTransactionAmount: 899,
        merchantTransactionCurrency: "SEK"
      },
      transactionIdentifier: {
        authorizationCode: "AUTH9876",
        systemTraceAuditNumber: "123456",
        retrievalReferenceNumber: "987654321"
      },
      paymentCard: {
        cardType: "MASTERCARD",
        maskedPan: [
          {
            maskedPanType: "PRIMARY_PAN",
            maskedPanValue: "555555******9876"
          }
        ]
      },
      merchantName: "Gardeco Testbutik 2",
      xReceipts: {
        cardId: "987e6543-b21a-43d7-c987-765432109876"
      }
    };
    
    const matchedTransaction = await findMatchingTransaction(xreceiptData);
    
    if (!matchedTransaction) {
      throw new Error('Failed to match transaction');
    }
    console.log('✅ Transaction matched:', matchedTransaction.id);

    // Step 3: Get the digital receipt
    console.log('\nStep 3: Getting digital receipt...');
    const receipt = {
      transactionId: matchedTransaction.id,
      cardId: matchedTransaction.card_id,
      terminalId: matchedTransaction.acquirer_terminal_id,
      timestamp: matchedTransaction.acquirer_transaction_timestamp,
      amount: matchedTransaction.transaction_amount,
      currency: matchedTransaction.transaction_currency,
      authorizationCode: matchedTransaction.authorization_code,
      cardholderReference: matchedTransaction.cardholder_reference,
      schemaVersion: matchedTransaction.schema_version,
      cashierSystemId: matchedTransaction.cashier_system_id,
      roundTripId: matchedTransaction.round_trip_id,
      receiptNumber: matchedTransaction.receipt_number,
      merchantName: matchedTransaction.merchant_name,
      cardType: matchedTransaction.card_type,
      maskedPan: matchedTransaction.masked_pan,
      acquirerMerchantId: matchedTransaction.acquirer_merchant_id,
      systemTraceAuditNumber: matchedTransaction.system_trace_audit_number,
      retrievalReferenceNumber: matchedTransaction.retrieval_reference_number,
      merchant: matchedTransaction.merchant,
      branch: matchedTransaction.branch
    };

    const lineItems = matchedTransaction.line_items || [];
    const xdreReceipt = await convertToXDREFormat(receipt, matchedTransaction, lineItems);
    
    console.log('\n=== Final XDRE Receipt ===');
    console.log(JSON.stringify(xdreReceipt, null, 2));

    console.log('\n=== Test Completed Successfully ===');

  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testCompleteFlow(); 