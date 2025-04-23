import { Transaction, saveTransaction, findMatchingTransaction, updateXReceiptStatus } from './src/Models/transactionModel.js';
import { Receipt } from './src/Models/receiptModel.js';
import { ReceiptLineItem } from './src/Models/receiptLineItemModel.js';
import { PaymentMethod } from './src/Models/receiptModel.js';
import { digitalReceiptService } from './src/Services/digitalReceiptService.js';

async function testCompleteFlow() {
  try {
    console.log('=== Testing Complete Flow: Transaction → X-Receipt Match → Receipt ===\n');

    // Step 1: Create initial transaction (this simulates when customer pays at terminal)
    console.log('Step 1: Creating initial transaction...');
    const initialTransaction = {
      acquirerTerminalId: 'TERM002',
      acquirerTransactionTimestamp: new Date().toISOString(),
      transactionAmount: {
        merchantTransactionAmount: 1250.50,
        merchantTransactionCurrency: 'NOK'
      },
      transactionIdentifier: {
        authorizationCode: 'AUTH456',
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
      merchantName: 'Gardeco Store'
    };

    const savedTransaction = await saveTransaction(initialTransaction);
    console.log('✅ Transaction saved:', savedTransaction.id);

    // Step 2: Simulate X-Receipt sending matching request
    console.log('\nStep 2: Simulating X-Receipt match request...');
    const xreceiptData = { ...initialTransaction }; // Use the same data for matching
    
    const matchedTransaction = await findMatchingTransaction(xreceiptData);
    
    if (!matchedTransaction) {
      throw new Error('Failed to match transaction');
    }
    
    console.log('✅ Transaction matched successfully');
    await updateXReceiptStatus(matchedTransaction.id, 'MATCHED');
    console.log('✅ Transaction status updated to MATCHED');

    // Step 3: Create receipt for matched transaction
    console.log('\nStep 3: Creating receipt...');
    const receipt = await Receipt.create({
      total_amount_incl_vat: xreceiptData.transactionAmount.merchantTransactionAmount,
      total_amount_excl_vat: xreceiptData.transactionAmount.merchantTransactionAmount / 1.25,
      receipt_number: `TEST-REC-${Date.now()}`,
      receipt_timestamp: new Date(xreceiptData.acquirerTransactionTimestamp),
      currency_iso_code: xreceiptData.transactionAmount.merchantTransactionCurrency,
      transaction_id: matchedTransaction.id,
      vat_summary: [{
        vatRate: 25.00,
        vatAmount: xreceiptData.transactionAmount.merchantTransactionAmount - (xreceiptData.transactionAmount.merchantTransactionAmount / 1.25)
      }]
    });
    console.log('✅ Receipt created:', receipt.id);

    // Step 4: Add multiple line items
    console.log('\nStep 4: Adding line items...');
    const items = [
      {
        name: 'Garden Spade Premium',
        description: 'Professional grade garden spade',
        internalId: 'TOOL001',
        ean: '7890123456789',
        quantity: 1,
        priceIncVat: 450.00
      },
      {
        name: 'Plant Fertilizer 5kg',
        description: 'All-purpose plant fertilizer',
        internalId: 'FERT002',
        ean: '7890123456790',
        quantity: 2,
        priceIncVat: 299.00
      },
      {
        name: 'Garden Hose 20m',
        description: 'Heavy duty garden hose',
        internalId: 'HOSE003',
        ean: '7890123456791',
        quantity: 1,
        priceIncVat: 202.50
      }
    ];

    for (const item of items) {
      const priceExclVat = item.priceIncVat / 1.25;
      const vatAmount = item.priceIncVat - priceExclVat;
      const lineTotal = item.priceIncVat * item.quantity;

      await ReceiptLineItem.create({
        receipt_id: receipt.id,
        item_name: item.name,
        item_description: item.description,
        item_internal_id: item.internalId,
        item_ean: item.ean,
        quantity: item.quantity,
        quantity_type: 'PCS',
        price_incl_vat: item.priceIncVat,
        price_excl_vat: priceExclVat,
        vat_rate: 25.00,
        vat_amount: vatAmount,
        line_total_incl_vat: lineTotal
      });
    }
    console.log('✅ Line items added');

    // Step 5: Add payment method
    console.log('\nStep 5: Adding payment method...');
    const paymentMethod = await PaymentMethod.create({
      receipt_id: receipt.id,
      method: 'CARD',
      amount: xreceiptData.transactionAmount.merchantTransactionAmount,
      label: `${xreceiptData.paymentCard.cardType} ****${xreceiptData.paymentCard.maskedPan[0].maskedPanValue.slice(-4)}`,
      cardType: xreceiptData.paymentCard.cardType,
      last4: xreceiptData.paymentCard.maskedPan[0].maskedPanValue.slice(-4),
      timestamp: new Date(xreceiptData.acquirerTransactionTimestamp),
      details: {
        terminalId: xreceiptData.acquirerTerminalId,
        merchantId: xreceiptData.paymentCard.acquirerMerchantIds.acquirerMerchantId,
        authCode: xreceiptData.transactionIdentifier.authorizationCode
      }
    });
    console.log('✅ Payment method added');

    // Step 6: Convert to XDRE format
    console.log('\nStep 6: Converting to XDRE format...');
    const lineItems = await ReceiptLineItem.findAll({ where: { receipt_id: receipt.id } });
    const xdreReceipt = await digitalReceiptService.convertToXDREFormat(
      receipt,
      matchedTransaction,
      lineItems
    );
    console.log('✅ Converted to XDRE format:');
    console.log(JSON.stringify(xdreReceipt, null, 2));

    console.log('\n=== Test Completed Successfully ===');

  } catch (error) {
    console.error('Error during test:', error);
    throw error;
  }
}

// Run the test
testCompleteFlow(); 