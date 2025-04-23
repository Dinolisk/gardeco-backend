import { jest } from '@jest/globals';
import { digitalReceiptService } from '../digitalReceiptService.js';
import { Receipt } from 'models/receiptModel.js';
import { ReceiptLineItem } from 'models/receiptLineItemModel.js';
import { Transaction } from 'models/transactionModel.js';

// Mock the models and their relationships
jest.mock('models/receiptModel.js');
jest.mock('models/receiptLineItemModel.js');
jest.mock('models/transactionModel.js');

describe('DigitalReceiptService', () => {
    let mockReceipt;
    let mockTransaction;
    let mockLineItems;
    let mockPaymentMethods;

    beforeEach(() => {
        // Create mock data
        mockLineItems = [
            {
                item_name: "Hammer",
                item_description: "Quality carpenter's hammer",
                item_internal_id: "HAM-001",
                item_ean: "5901234123457",
                quantity: 2,
                quantity_type: "PCS",
                price_incl_vat: 249.90,
                price_excl_vat: 199.92,
                vat_rate: 25.00,
                vat_amount: 49.98,
                line_total_incl_vat: 499.80,
                metadata_json: {
                    category: "Tools",
                    brand: "Stanley"
                }
            },
            {
                item_name: "Spik 100mm",
                item_description: "100-pack construction nails",
                item_internal_id: "NAI-100",
                item_ean: "5901234123458",
                quantity: 3,
                quantity_type: "PCS",
                price_incl_vat: 89.90,
                price_excl_vat: 71.92,
                vat_rate: 25.00,
                vat_amount: 17.98,
                line_total_incl_vat: 269.70,
                discount_amount: 20.00,
                discount_percentage: 10,
                discount_description: "Bulk discount"
            }
        ];

        mockPaymentMethods = [
            {
                method: 'CARD',
                amount: 669.50,
                cardType: 'VISA',
                maskedPan: '411111******1111',
                timestamp: new Date('2025-01-09T12:57:00Z'),
                details: {
                    terminalId: '12345678',
                    merchantId: '987654',
                    authCode: 'ABC123'
                }
            },
            {
                method: 'CASH',
                amount: 100.00,
                timestamp: new Date('2025-01-09T12:57:00Z')
            }
        ];

        mockTransaction = {
            id: 12345,
            cardId: '123e4567-e89b-12d3-a456-426614174000',
            // Add other transaction fields as needed
        };

        mockReceipt = {
            id: 67890,
            receipt_number: 'REC-2025-001',
            receipt_timestamp: new Date('2025-01-09T12:57:00Z'),
            total_amount_incl_vat: 769.50,
            total_amount_excl_vat: 615.60,
            currency_iso_code: 'NOK',
            transaction_id: mockTransaction.id,
            vat_summary: [
                {
                    vatRate: 25.00,
                    vatAmount: 153.90
                }
            ],
            getPaymentMethods: jest.fn().mockResolvedValue(mockPaymentMethods),
            transaction: mockTransaction,
            lineItems: mockLineItems
        };

        // Setup model mocks
        Receipt.findByPk = jest.fn().mockResolvedValue(mockReceipt);
    });

    test('convertToXDREFormat should correctly format receipt data', async () => {
        const xdreReceipt = await digitalReceiptService.convertToXDREFormat(
            mockReceipt,
            mockTransaction,
            mockLineItems
        );

        // Verify basic structure
        expect(xdreReceipt).toHaveProperty('xReceipts');
        expect(xdreReceipt).toHaveProperty('generalInformation');
        expect(xdreReceipt).toHaveProperty('merchant');
        expect(xdreReceipt).toHaveProperty('lineItems');
        expect(xdreReceipt).toHaveProperty('orderSummary');
        expect(xdreReceipt).toHaveProperty('payment');

        // Verify xReceipts section
        expect(xdreReceipt.xReceipts).toMatchObject({
            schemaVersion: "1.0",
            cardId: mockTransaction.cardId
        });

        // Verify general information
        expect(xdreReceipt.generalInformation).toMatchObject({
            receiptType: "DIGITAL_RECEIPT",
            receiptNumber: mockReceipt.receipt_number
        });

        // Verify line items
        expect(xdreReceipt.lineItems).toHaveLength(2);
        expect(xdreReceipt.lineItems[0]).toMatchObject({
            itemName: "Hammer",
            itemQuantity: {
                type: "PCS",
                quantity: 2
            }
        });

        // Verify order summary
        expect(xdreReceipt.orderSummary).toMatchObject({
            currencyIsoCode: "NOK",
            totalAmountIncVat: 769.50,
            totalAmountExcVat: 615.60
        });

        // Verify payments
        const payments = await digitalReceiptService.convertPayments(mockReceipt);
        expect(payments).toHaveLength(2);
        expect(payments[0]).toMatchObject({
            type: "CARD",
            cardType: "VISA"
        });
        expect(payments[1]).toMatchObject({
            type: "CASH",
            amount: 100.00
        });
    });

    test('processDigitalReceipt should handle the complete flow', async () => {
        // Mock the validate and submit methods
        const validateSpy = jest.spyOn(digitalReceiptService, 'validateReceipt')
            .mockResolvedValue({ valid: true });
        const submitSpy = jest.spyOn(digitalReceiptService, 'submitReceipt')
            .mockResolvedValue({ status: "OK", message: "Success" });

        const result = await digitalReceiptService.processDigitalReceipt(67890);

        expect(validateSpy).toHaveBeenCalled();
        expect(submitSpy).toHaveBeenCalled();
        expect(result).toMatchObject({
            status: "OK",
            message: "Success"
        });

        // Cleanup
        validateSpy.mockRestore();
        submitSpy.mockRestore();
    });
}); 