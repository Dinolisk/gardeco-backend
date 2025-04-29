import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

export const formatToXDRE = (receipt, transaction, lineItems) => {
    try {
        console.log('=== XDRE Formatting Debug ===');
        console.log('Receipt object:', {
            id: receipt?.id,
            type: typeof receipt,
            isNull: receipt === null,
            isUndefined: receipt === undefined
        });
        console.log('Transaction object:', {
            id: transaction?.id,
            cardholder_reference: transaction?.cardholder_reference,
            type: typeof transaction,
            isNull: transaction === null,
            isUndefined: transaction === undefined
        });
        console.log('Line items:', {
            count: lineItems?.length,
            type: typeof lineItems,
            isArray: Array.isArray(lineItems)
        });

        if (!transaction || !transaction.cardholder_reference) {
            console.error('Missing transaction or cardholder_reference:', {
                hasTransaction: !!transaction,
                cardholderReference: transaction?.cardholder_reference,
                transactionKeys: transaction ? Object.keys(transaction) : []
            });
            throw new Error('Transaction data is missing or invalid');
        }

        const xdreReceipt = {
            schemaVersion: '1.0',
            cashierSystemId: 'GARDECO',
            roundTripId: receipt.receipt_number,
            cardholderReference: transaction.cardholder_reference,
            cardholderMemberships: [],
            merchant: {
                merchantId: transaction.acquirer_merchant_id,
                merchantName: transaction.merchant_name,
                terminalId: transaction.acquirer_terminal_id
            },
            transaction: {
                transactionTimestamp: transaction.acquirer_transaction_timestamp,
                transactionAmount: {
                    amount: transaction.transaction_amount,
                    currency: transaction.transaction_currency
                },
                card: {
                    cardType: transaction.card_type,
                    maskedPan: transaction.masked_pan
                },
                transactionIdentifier: {
                    authorizationCode: transaction.authorization_code,
                    systemTraceAuditNumber: transaction.system_trace_audit_number,
                    retrievalReferenceNumber: transaction.retrieval_reference_number
                }
            },
            lineItems: lineItems.map(item => ({
                itemName: item.item_name,
                itemDescription: item.item_description,
                quantity: item.quantity,
                quantityType: item.quantity_type,
                price: {
                    amount: item.price_incl_vat,
                    currency: transaction.transaction_currency
                },
                vat: {
                    rate: item.vat_rate,
                    amount: item.vat_amount
                },
                lineTotal: {
                    amount: item.line_total_incl_vat,
                    currency: transaction.transaction_currency
                },
                itemIds: [
                    {
                        id: item.item_id,
                        ean: item.ean
                    }
                ]
            })),
            orderSummary: {
                totalAmount: {
                    amount: receipt.total_amount_incl_vat,
                    currency: transaction.transaction_currency
                },
                vatSummary: receipt.vat_summary.map(vat => ({
                    vatRate: vat.vatRate,
                    vatAmount: vat.vatAmount
                }))
            }
        };

        console.log('Generated XDRE receipt:', JSON.stringify(xdreReceipt, null, 2));
        return xdreReceipt;
    } catch (error) {
        console.error('Error in formatToXDRE:', error);
        throw error;
    }
}; 