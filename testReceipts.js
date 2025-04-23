import { sequelize } from './src/Database/db.js';
import { Receipt, PaymentMethod } from './src/Models/receiptModel.js';
import { ReceiptLineItem } from './src/Models/receiptLineItemModel.js';
import { Transaction } from './src/Models/transactionModel.js';
import { digitalReceiptService } from './src/Services/digitalReceiptService.js';

async function testReceipts() {
  try {
    console.log('Starting receipt tests...\n');

    // Create a test transaction first
    console.log('Creating test transaction...');
    const transaction = await Transaction.create({
      card_id: 'TEST_CARD_001',
      acquirer_terminal_id: 'TERM001',
      card_type: 'VISA',
      acquirer_transaction_timestamp: new Date(),
      transaction_amount: 299.90,
      transaction_currency: 'NOK',
      authorization_code: 'AUTH123',
      masked_pan: '************1234',
      merchant_name: 'Test Store'
    });
    console.log('✅ Test transaction created');

    // Create a test receipt
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
    console.log('✅ Test receipt created');

    // Add line items
    console.log('\nAdding line items...');
    const lineItems = await ReceiptLineItem.bulkCreate([
      {
        receipt_id: receipt.id,
        item_name: 'Premium Hammer',
        item_description: 'Professional grade hammer',
        item_internal_id: 'HAM001',
        item_ean: '5901234123457',
        quantity: 1,
        quantity_type: 'PCS',
        price_incl_vat: 199.90,
        price_excl_vat: 159.92,
        vat_rate: 25.00,
        vat_amount: 39.98,
        line_total_incl_vat: 199.90,
        metadata_json: {
          category: 'Tools',
          brand: 'ProTools'
        }
      },
      {
        receipt_id: receipt.id,
        item_name: 'Box of Nails',
        item_description: '100pc construction nails',
        item_internal_id: 'NAI100',
        item_ean: '5901234123458',
        quantity: 2,
        quantity_type: 'PCS',
        price_incl_vat: 50.00,
        price_excl_vat: 40.00,
        vat_rate: 25.00,
        vat_amount: 10.00,
        line_total_incl_vat: 100.00
      }
    ]);
    console.log('✅ Line items added');

    // Add payment methods
    console.log('\nAdding payment methods...');
    const paymentMethod = await PaymentMethod.create({
      receipt_id: receipt.id,
      method: 'CARD',
      amount: 299.90,
      cardType: 'VISA',
      last4: '1234',
      label: 'VISA ****1234',
      timestamp: new Date(),
      details: {
        terminalId: 'TERM001',
        merchantId: 'MERCH001',
        authCode: 'AUTH123'
      }
    });
    console.log('✅ Payment method added');

    // Test digital receipt conversion
    console.log('\nTesting digital receipt conversion...');
    const xdreReceipt = await digitalReceiptService.convertToXDREFormat(
      receipt,
      transaction,
      lineItems
    );
    console.log('✅ Digital receipt conversion successful');
    console.log('\nConverted receipt structure:');
    console.log(JSON.stringify(xdreReceipt, null, 2));

    console.log('\n🎉 All receipt tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Error during receipt tests:', error);
  } finally {
    await sequelize.close();
  }
}

testReceipts(); 