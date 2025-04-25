import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

export const formatToXDRE = (transaction, receipt) => {
    // Generate a unique roundTripId
    const roundTripId = uuidv4();

    // Debug logging
    console.log('Transaction data:', JSON.stringify(transaction, null, 2));
    console.log('Transaction fields:', {
        card_type: transaction.card_type,
        masked_pan: transaction.masked_pan,
        acquirer_transaction_timestamp: transaction.acquirer_transaction_timestamp,
        acquirer_terminal_id: transaction.acquirer_terminal_id,
        authorization_code: transaction.authorization_code,
        transaction_amount: transaction.transaction_amount,
        transaction_currency: transaction.transaction_currency
    });

    // Ensure transaction data is available
    if (!transaction) {
        throw new Error('Transaction data is required');
    }

    // Create XDRE receipt
    const xdreReceipt = {
        xReceipts: {
            schemaVersion: "1.0",
            cashierSystemId: process.env.XDRE_CASHIER_SYSTEM_ID || "123456789",
            roundTripId: roundTripId,
            cardholderMemberships: []
        },
        generalInformation: {
            receiptType: "DIGITAL_RECEIPT",
            systemTimestamp: new Date().toISOString(),
            receiptNumber: receipt.receipt_number
        },
        merchant: {
            merchantName: transaction.merchant_name || "Gardeco",
            branch: {
                branchName: "Gardeco Main",
                slogan: "Din lokala bygghandel",
                email: "contact@gardeco.no",
                phone: "+47 12345678",
                websiteUrl: "https://www.gardeco.no",
                address: {
                    addressLine1: process.env.XDRE_MERCHANT_ADDRESS || "Your Address",
                    city: process.env.XDRE_MERCHANT_CITY || "Your City",
                    zipCode: process.env.XDRE_MERCHANT_ZIPCODE || "12345",
                    country: process.env.XDRE_MERCHANT_COUNTRY || "Norway"
                }
            }
        },
        lineItems: receipt.lineItems.map(item => ({
            itemName: item.item_name,
            itemDescription: item.item_description,
            itemIds: {},
            itemPrice: {
                priceIncVat: item.price_incl_vat,
                priceExcVat: item.price_excl_vat,
                vatRate: item.vat_rate,
                vatAmount: item.vat_amount
            },
            itemQuantity: {
                type: item.quantity_type,
                quantity: item.quantity
            },
            itemSumTotal: item.line_total_incl_vat
        })),
        orderSummary: {
            currencyIsoCode: transaction.transaction_currency,
            totalAmountIncVat: receipt.total_amount_incl_vat,
            totalAmountExcVat: receipt.total_amount_excl_vat,
            vatSummary: receipt.vat_summary.map(vat => ({
                vatRate: vat.vatRate,
                vatAmount: vat.vatAmount
            }))
        },
        payment: []
    };

    // Add payment information if transaction has required fields
    if (transaction.card_type && transaction.masked_pan && transaction.acquirer_transaction_timestamp) {
        console.log('Adding payment information to receipt');
        xdreReceipt.payment = [{
            type: "CARD",
            cardType: transaction.card_type,
            maskedPan: transaction.masked_pan,
            acquirerTransactionTimestamp: transaction.acquirer_transaction_timestamp,
            acquirerTerminalId: transaction.acquirer_terminal_id,
            transactionIdentifiers: {
                authorizationCode: transaction.authorization_code
            },
            transactionAmount: {
                merchantTransactionAmount: parseFloat(transaction.transaction_amount),
                merchantTransactionCurrency: transaction.transaction_currency
            }
        }];
    } else {
        console.log('Missing required fields for payment information:', {
            hasCardType: !!transaction.card_type,
            hasMaskedPan: !!transaction.masked_pan,
            hasTimestamp: !!transaction.acquirer_transaction_timestamp
        });
    }

    console.log('Generated XDRE receipt:', JSON.stringify(xdreReceipt, null, 2));
    return xdreReceipt;
}; 