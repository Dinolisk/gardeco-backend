import { Transaction, saveTransaction, findMatchingTransaction, updateXReceiptStatus } from './src/Models/transactionModel.js';
import { Receipt } from './src/Models/receiptModel.js';
import { ReceiptLineItem } from './src/Models/receiptLineItemModel.js';
import { PaymentMethod } from './src/Models/receiptModel.js';

// Test data that matches what X-Receipt might send
const xreceiptTestData = {
  acquirerTerminalId: "TERM001",
  acquirerTransactionTimestamp: new Date().toISOString(),
  transactionAmount: {
    merchantTransactionAmount: 299.90,
    merchantTransactionCurrency: "NOK"
  },
  transactionIdentifier: {
    authorizationCode: "AUTH123",
    systemTraceAuditNumber: "123456",
    retrievalReferenceNumber: "987654321"
  },
  paymentCard: {
    cardType: "VISA",
    maskedPan: [
      {
        maskedPanType: "PRIMARY_PAN",
        maskedPanValue: "************1234"
      }
    ],
    acquirerMerchantIds: {
      acquirerMerchantId: "MERCH001"
    }
  },
  merchantName: "Test Store"
};

async function testXReceiptFlow() {
  try {
    console.log('=== Starting X-Receipt Flow Test ===\n');

    // Step 1: Save the transaction (simulating a card payment)
    console.log('Creating test transaction...');
    const transaction = await saveTransaction(xreceiptTestData);
    console.log('✅ Transaction created:', transaction.id);

    // Step 2: Create a receipt for this transaction
    console.log('\nCreating test receipt...');
    const receipt = await Receipt.create({
      total_amount_incl_vat: 299.90,
      total_amount_excl_vat: 239.92,
      receipt_number: `TEST-REC-${Date.now()}`,
      receipt_timestamp: new Date(),
      currency_iso_code: 'NOK',
      transaction_id: transaction.id,
      vat_summary: [{
        vatRate: 25.00,
        vatAmount: 59.98
      }]
    });
    console.log('✅ Receipt created:', receipt.id);

    // Step 3: Add some line items
    console.log('\nAdding line items...');
    await ReceiptLineItem.create({
      receipt_id: receipt.id,
      item_name: 'Test Product',
      item_description: 'A test product',
      item_internal_id: 'TEST001',
      item_ean: '5901234123457',
      quantity: 1,
      quantity_type: 'PCS',
      price_incl_vat: 299.90,
      price_excl_vat: 239.92,
      vat_rate: 25.00,
      vat_amount: 59.98,
      line_total_incl_vat: 299.90
    });
    console.log('✅ Line items added');

    // Step 4: Add payment method
    console.log('\nAdding payment method...');
    await PaymentMethod.create({
      receipt_id: receipt.id,
      method: 'CARD',
      amount: 299.90,
      label: 'VISA ****1234',
      cardType: 'VISA',
      last4: '1234',
      timestamp: new Date(),
      details: {
        terminalId: 'TERM001',
        merchantId: 'MERCH001',
        authCode: 'AUTH123'
      }
    });
    console.log('✅ Payment method added');

    // Step 5: Simulate X-Receipt sending a request
    console.log('\nSimulating X-Receipt request...');
    const matchedTransaction = await findMatchingTransaction(xreceiptTestData);
    
    if (matchedTransaction) {
      console.log('✅ Transaction matched!');
      console.log('Transaction ID:', matchedTransaction.id);
      
      // Update the status to MATCHED
      await updateXReceiptStatus(matchedTransaction.id, 'MATCHED');
      console.log('✅ Status updated to MATCHED');

      // Find the associated receipt
      const matchedReceipt = await Receipt.findOne({
        where: { transaction_id: matchedTransaction.id },
        include: [
          { model: ReceiptLineItem, as: 'lineItems' },
          { model: PaymentMethod, as: 'paymentMethods' }
        ]
      });

      if (matchedReceipt) {
        console.log('\nFound associated receipt:');
        console.log('Receipt ID:', matchedReceipt.id);
        console.log('Receipt Number:', matchedReceipt.receipt_number);
        console.log('Total Amount:', matchedReceipt.total_amount_incl_vat);
        console.log('Line Items:', matchedReceipt.lineItems.length);
        console.log('Payment Methods:', matchedReceipt.paymentMethods.length);
      }
    } else {
      console.log('❌ No matching transaction found');
    }

    console.log('\n=== Test Completed ===');

  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testXReceiptFlow(); 