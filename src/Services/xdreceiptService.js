export const formatToXDRE = (receipt, transaction, lineItems) => {
    try {
        console.log('Formatting to XDRE:', {
            receipt,
            transaction,
            lineItems
        });

        // Validera att alla nödvändiga fält finns
        if (!receipt.cardholderReference) {
            throw new Error('Missing cardholderReference in receipt');
        }

        if (!transaction.cardholder_reference) {
            throw new Error('Missing cardholder_reference in transaction');
        }

        // Skapa XDRE-formatet med alla required fält
        const xdreReceipt = {
            xReceipts: {
                schemaVersion: transaction.schema_version || "1.0",
                cashierSystemId: transaction.cashier_system_id,
                roundTripId: transaction.round_trip_id,
                cardholderReference: transaction.cardholder_reference,
                generalInformation: {
                    receiptType: "DIGITAL_RECEIPT",
                    systemTimestamp: transaction.acquirer_transaction_timestamp,
                    receiptNumber: transaction.receipt_number,
                    receiptStatus: "COMPLETED",
                    receiptTimestamp: transaction.acquirer_transaction_timestamp
                },
                merchant: {
                    merchantName: transaction.merchant?.merchantName || transaction.merchant_name,
                    merchantId: transaction.merchant?.merchantId,
                    merchantAddress: {
                        street: transaction.merchant?.merchantAddress?.street,
                        city: transaction.merchant?.merchantAddress?.city,
                        postalCode: transaction.merchant?.merchantAddress?.postalCode,
                        country: transaction.merchant?.merchantAddress?.country
                    }
                },
                branch: {
                    branchName: transaction.branch?.branchName || transaction.merchant?.merchantName || transaction.merchant_name,
                    branchId: transaction.branch?.branchId,
                    branchAddress: {
                        street: transaction.branch?.branchAddress?.street,
                        city: transaction.branch?.branchAddress?.city,
                        postalCode: transaction.branch?.branchAddress?.postalCode,
                        country: transaction.branch?.branchAddress?.country
                    }
                },
                lineItems: lineItems.map(item => ({
                    itemName: item.itemName,
                    itemDescription: item.itemDescription,
                    itemIds: {
                        id: item.itemIds?.id || item.itemId || 'N/A',
                        ean: item.itemIds?.ean
                    },
                    itemPrice: {
                        priceIncVat: item.itemPrice?.priceIncVat,
                        priceExcVat: item.itemPrice?.priceExcVat,
                        vatRate: item.itemPrice?.vatRate,
                        vatAmount: item.itemPrice?.vatAmount
                    },
                    quantity: item.quantity?.toString() || "1.000",
                    quantityType: item.quantityType || "PCS",
                    itemSumTotal: item.itemSumTotal,
                    itemMetadataList: item.itemMetadataList || []
                })),
                orderSummary: {
                    currencyIsoCode: transaction.transaction_currency,
                    totalAmountIncVat: transaction.order_summary?.totalAmountIncVat || transaction.transaction_amount,
                    totalAmountExcVat: transaction.order_summary?.totalAmountExcVat,
                    vatSummary: transaction.order_summary?.vatSummary || [{
                        vatRate: "25.00",
                        vatAmount: (transaction.transaction_amount - (transaction.transaction_amount / 1.25)).toFixed(2),
                        amountExcVat: (transaction.transaction_amount / 1.25).toFixed(2)
                    }]
                },
                payment: [{
                    paymentMethod: "CARD",
                    paymentType: "CREDIT",
                    cardType: transaction.card_type,
                    maskedPan: transaction.masked_pan,
                    acquirerTerminalId: transaction.acquirer_terminal_id,
                    acquirerMerchantId: transaction.acquirer_merchant_id,
                    acquirerTransactionTimestamp: transaction.acquirer_transaction_timestamp,
                    transactionAmount: {
                        merchantTransactionAmount: transaction.transaction_amount,
                        merchantTransactionCurrency: transaction.transaction_currency
                    },
                    transactionIdentifier: {
                        authorizationCode: transaction.authorization_code,
                        systemTraceAuditNumber: transaction.system_trace_audit_number,
                        retrievalReferenceNumber: transaction.retrieval_reference_number
                    }
                }]
            }
        };

        console.log('Formatted XDRE receipt:', xdreReceipt);
        return xdreReceipt;
    } catch (error) {
        console.error('Error formatting to XDRE:', error);
        throw error;
    }
}; 