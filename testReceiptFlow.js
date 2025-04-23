import { Receipt } from './src/Models/receiptModel.js';
import { ReceiptLineItem } from './src/Models/receiptLineItemModel.js';
import { PaymentMethod } from './src/Models/receiptModel.js';
import { digitalReceiptService } from './src/Services/digitalReceiptService.js';

async function testReceiptFlow() {
  try {
    console.log('=== Testing Receipt Flow ===\n');

    // Let's say we already have a matched transaction with ID 1
    const transactionId = 1; // This would come from the matching process

    // Step 1: Create a receipt for this transaction
    console.log('Creating receipt for matched transaction...');
    const receipt = await Receipt.create({
      total_amount_incl_vat: 299.90,
      total_amount_excl_vat: 239.92,
      receipt_number: `TEST-REC-${Date.now()}`,
      receipt_timestamp: new Date(),
      currency_iso_code: 'NOK',
      transaction_id: transactionId,
      vat_summary: [{
        vatRate: 25.00,
        vatAmount: 59.98
      }]
    });
    console.log('✅ Receipt created:', receipt.id);

    // Step 2: Add line items
    console.log('\nAdding line items...');
    const lineItems = await ReceiptLineItem.create({
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

    // Step 3: Add payment method
    console.log('\nAdding payment method...');
    const paymentMethod = await PaymentMethod.create({
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

    // Step 4: Convert to XDRE format (this is what we'll send back to X-Receipt)
    console.log('\nConverting to XDRE format...');
    const xdreReceipt = await digitalReceiptService.convertToXDREFormat(
      receipt,
      { id: transactionId }, // The matched transaction
      [lineItems]
    );
    console.log('✅ Converted to XDRE format:');
    console.log(JSON.stringify(xdreReceipt, null, 2));

    console.log('\n=== Test Completed ===');

  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testReceiptFlow(); 