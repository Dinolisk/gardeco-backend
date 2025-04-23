import axios from 'axios';
import { Receipt } from '../Models/receiptModel.js';
import { ReceiptLineItem } from '../Models/receiptLineItemModel.js';
import { Transaction } from '../Models/transactionModel.js';
import { merchantConfig } from '../config/merchant.js';

class DigitalReceiptService {
    constructor() {
        // XDRE API Configuration
        this.baseUrl = 'https://stg.xcr.receipts.no/CardRecognition/api';
        this.apiKey = process.env.XDRE_API_KEY;
        this.cashierSystemId = process.env.CASHIER_SYSTEM_ID;
    }

    /**
     * Convert our database models to XDRE format
     * @param {Receipt} receipt - Receipt model instance
     * @param {Transaction} transaction - Related transaction model instance
     * @param {Array<ReceiptLineItem>} lineItems - Array of receipt line items
     * @returns {Object} XDRE formatted receipt object
     */
    async convertToXDREFormat(receipt, transaction, lineItems) {
        try {
            // Basic receipt structure
            const xdreReceipt = {
                xReceipts: {
                    schemaVersion: "1.0",
                    cashierSystemId: this.cashierSystemId,
                    roundTripId: receipt.id.toString(), // We might want to generate a proper UUID
                    cardId: transaction.cardId, // Assuming this comes from the transaction
                    cardholderMemberships: [] // Will be populated if membership exists
                },
                generalInformation: {
                    receiptType: "DIGITAL_RECEIPT",
                    systemTimestamp: receipt.receipt_timestamp.toISOString(),
                    receiptNumber: receipt.receipt_number
                },
                merchant: {
                    merchantName: merchantConfig.name,
                    branch: merchantConfig.branch
                },
                lineItems: this.convertLineItems(lineItems),
                orderSummary: {
                    currencyIsoCode: receipt.currency_iso_code,
                    totalAmountIncVat: parseFloat(receipt.total_amount_incl_vat),
                    totalAmountExcVat: parseFloat(receipt.total_amount_excl_vat),
                    vatSummary: receipt.vat_summary || []
                },
                payment: await this.convertPayments(receipt)
            };

            return xdreReceipt;
        } catch (error) {
            console.error('Error converting to XDRE format:', error);
            throw new Error('Failed to convert receipt to XDRE format');
        }
    }

    /**
     * Convert line items to XDRE format
     * @param {Array<ReceiptLineItem>} lineItems 
     * @returns {Array} Formatted line items
     */
    convertLineItems(lineItems) {
        return lineItems.map(item => ({
            itemName: item.item_name,
            itemDescription: item.item_description,
            itemIds: {
                id: item.item_internal_id,
                ean: item.item_ean
            },
            itemPrice: {
                priceIncVat: parseFloat(item.price_incl_vat),
                priceExcVat: parseFloat(item.price_excl_vat),
                vatRate: parseFloat(item.vat_rate),
                vatAmount: parseFloat(item.vat_amount)
            },
            itemQuantity: {
                type: item.quantity_type,
                quantity: parseFloat(item.quantity)
            },
            ...(item.discount_amount && {
                itemDiscount: {
                    amount: parseFloat(item.discount_amount),
                    percentage: item.discount_percentage ? parseFloat(item.discount_percentage) : null,
                    description: item.discount_description
                }
            }),
            itemSumTotal: parseFloat(item.line_total_incl_vat),
            ...(item.metadata_json && {
                itemMetadata: item.metadata_json
            })
        }));
    }

    /**
     * Convert payments to XDRE format
     * @param {Receipt} receipt 
     * @returns {Array} Formatted payments
     */
    async convertPayments(receipt) {
        // Fetch payment methods for this receipt
        const paymentMethods = await receipt.getPaymentMethods();
        
        // Convert to XDRE payment format
        return paymentMethods.map(payment => ({
            type: payment.method.toUpperCase(),
            ...(payment.method === 'CARD' && {
                cardType: payment.cardType,
                maskedPan: payment.maskedPan,
                acquirerTransactionTimestamp: payment.timestamp.toISOString(),
                acquirerTerminalId: payment.details?.terminalId,
                acquirerMerchantId: payment.details?.merchantId,
                transactionIdentifiers: {
                    authorizationCode: payment.details?.authCode
                },
                transactionAmount: {
                    merchantTransactionAmount: parseFloat(payment.amount),
                    merchantTransactionCurrency: receipt.currency_iso_code,
                    cardholderTransactionAmount: parseFloat(payment.amount),
                    cardholderTransactionCurrency: receipt.currency_iso_code
                }
            }),
            ...(payment.method === 'CASH' && {
                amount: parseFloat(payment.amount)
            })
        }));
    }

    /**
     * Validate receipt against XDRE validation endpoint
     * @param {Object} xdreReceipt 
     * @returns {Object} Validation result
     */
    async validateReceipt(xdreReceipt) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/validate`,
                xdreReceipt,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Validation error:', error.response?.data || error.message);
            throw new Error('Receipt validation failed');
        }
    }

    /**
     * Submit receipt to XDRE
     * @param {Object} xdreReceipt 
     * @returns {Object} Submission result
     */
    async submitReceipt(xdreReceipt) {
        try {
            // First validate
            const validationResult = await this.validateReceipt(xdreReceipt);
            if (!validationResult.valid) {
                throw new Error('Receipt validation failed: ' + JSON.stringify(validationResult.errors));
            }

            // Then submit
            const response = await axios.post(
                `${this.baseUrl}/putReceipt`,
                xdreReceipt,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Submission error:', error.response?.data || error.message);
            throw new Error('Receipt submission failed');
        }
    }

    /**
     * Main method to process and submit a digital receipt
     * @param {number} receiptId 
     * @returns {Object} Submission result
     */
    async processDigitalReceipt(receiptId) {
        try {
            // 1. Fetch receipt and related data
            const receipt = await Receipt.findByPk(receiptId, {
                include: [
                    { model: ReceiptLineItem, as: 'lineItems' },
                    { model: Transaction, as: 'transaction' }
                ]
            });

            if (!receipt) {
                throw new Error('Receipt not found');
            }

            // 2. Convert to XDRE format
            const xdreReceipt = await this.convertToXDREFormat(
                receipt,
                receipt.transaction,
                receipt.lineItems
            );

            // 3. Submit to XDRE
            const result = await this.submitReceipt(xdreReceipt);

            return result;
        } catch (error) {
            console.error('Error processing digital receipt:', error);
            throw error;
        }
    }
}

export const digitalReceiptService = new DigitalReceiptService(); 