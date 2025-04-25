import { formatToXDRE } from './Services/xdreceiptService.js';

// Test data
const testTransaction = {
    card_id: "TESTCARD789",
    merchant_name: "Test Store",
    card_type: "MASTERCARD",
    masked_pan: "************5678",
    acquirer_transaction_timestamp: "2024-03-21T14:30:00.000Z",
    acquirer_terminal_id: "TERM789012",
    authorization_code: "AUTH789012",
    transaction_amount: 250.50,
    transaction_currency: "SEK"
};

const testReceipt = {
    receipt_number: "REC-789012",
    total_amount_incl_vat: 250.50,
    total_amount_excl_vat: 200.40,
    vat_summary: [{ vatRate: 25, vatAmount: 50.10 }],
    lineItems: [{
        item_name: "Test Product",
        item_description: "Test Description",
        price_incl_vat: 250.50,
        price_excl_vat: 200.40,
        vat_rate: 25,
        vat_amount: 50.10,
        quantity_type: "PCS",
        quantity: 1,
        line_total_incl_vat: 250.50
    }]
};

// Test the formatting
console.log('Testing XDRE Format...');
console.log('Input Transaction:', JSON.stringify(testTransaction, null, 2));
console.log('Input Receipt:', JSON.stringify(testReceipt, null, 2));

const xdreReceipt = formatToXDRE(testTransaction, testReceipt);
console.log('\nGenerated XDRE Receipt:');
console.log(JSON.stringify(xdreReceipt, null, 2));

// Compare with X-Receipts example structure
console.log('\nChecking required fields...');
const requiredFields = {
    xReceipts: ['schemaVersion', 'cashierSystemId', 'roundTripId', 'cardId'],
    generalInformation: ['receiptType', 'systemTimestamp', 'receiptNumber'],
    merchant: ['merchantName', 'branch'],
    lineItems: ['itemName', 'itemPrice', 'itemQuantity', 'itemSumTotal'],
    orderSummary: ['currencyIsoCode', 'totalAmountIncVat', 'totalAmountExcVat', 'vatSummary'],
    payment: ['type', 'cardType', 'maskedPan', 'acquirerTransactionTimestamp', 'acquirerTerminalId', 'transactionIdentifiers', 'transactionAmount']
};

// Check if all required fields are present
Object.entries(requiredFields).forEach(([section, fields]) => {
    fields.forEach(field => {
        const path = field.includes('.') ? field.split('.') : [field];
        let value = xdreReceipt[section];
        path.forEach(part => {
            value = value?.[part];
        });
        console.log(`${section}.${field}: ${value ? '✅ Present' : '❌ Missing'}`);
    });
}); 