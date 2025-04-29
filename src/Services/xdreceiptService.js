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

        // Skapa XDRE-formatet
        const xdreReceipt = {
            acquirerTerminalId: receipt.terminalId,
            acquirerTransactionTimestamp: receipt.timestamp,
            transactionAmount: {
                merchantTransactionAmount: receipt.amount,
                merchantTransactionCurrency: receipt.currency
            },
            transactionIdentifier: {
                authorizationCode: receipt.authorizationCode
            },
            xReceipts: {
                cardId: receipt.cardId,
                cardholderReference: receipt.cardholderReference
            }
        };

        console.log('Formatted XDRE receipt:', xdreReceipt);
        return xdreReceipt;
    } catch (error) {
        console.error('Error formatting to XDRE:', error);
        throw error;
    }
}; 