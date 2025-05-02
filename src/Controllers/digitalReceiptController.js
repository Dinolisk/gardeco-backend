import { Transaction } from '../Models/transactionModel.js';
import { convertToXDREFormat } from '../Services/digitalReceiptService.js';

export const handleDigitalReceiptRequest = async (req, res) => {
    try {
        const { transactionId } = req.params;
        
        // Hämta transaktionen från databasen med alla nödvändiga fält
        const transaction = await Transaction.findByPk(transactionId, {
            attributes: [
                'id',
                'card_id',
                'acquirer_terminal_id',
                'acquirer_transaction_timestamp',
                'transaction_amount',
                'transaction_currency',
                'authorization_code',
                'cardholder_reference',
                'line_items',
                'order_summary',
                'schema_version',
                'cashier_system_id',
                'round_trip_id',
                'receipt_number',
                'merchant_name',
                'card_type',
                'masked_pan',
                'acquirer_merchant_id',
                'system_trace_audit_number',
                'retrieval_reference_number',
                'merchant',
                'branch'
            ]
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Logga transaktionsdata för felsökning
        console.log('Fetched transaction data:', {
            id: transaction.id,
            cardholderReference: transaction.cardholder_reference,
            terminalId: transaction.acquirer_terminal_id,
            amount: transaction.transaction_amount,
            currency: transaction.transaction_currency,
            authCode: transaction.authorization_code,
            merchantName: transaction.merchant_name,
            cardType: transaction.card_type,
            maskedPan: transaction.masked_pan
        });

        // Kontrollera om transaktionen är berättigad till digitalt kvitto
        if (!transaction.cardholder_reference) {
            return res.status(400).json({ error: 'Transaction not eligible for digital receipt' });
        }

        // Skapa kvittot och konvertera till XDRE-format
        const receipt = {
            transactionId: transaction.id,
            cardId: transaction.card_id,
            terminalId: transaction.acquirer_terminal_id,
            timestamp: transaction.acquirer_transaction_timestamp,
            amount: transaction.transaction_amount,
            currency: transaction.transaction_currency,
            authorizationCode: transaction.authorization_code,
            cardholderReference: transaction.cardholder_reference,
            schemaVersion: transaction.schema_version,
            cashierSystemId: transaction.cashier_system_id,
            roundTripId: transaction.round_trip_id,
            receiptNumber: transaction.receipt_number,
            merchantName: transaction.merchant_name,
            cardType: transaction.card_type,
            maskedPan: transaction.masked_pan,
            acquirerMerchantId: transaction.acquirer_merchant_id,
            systemTraceAuditNumber: transaction.system_trace_audit_number,
            retrievalReferenceNumber: transaction.retrieval_reference_number,
            merchant: transaction.merchant,
            branch: transaction.branch
        };

        const lineItems = transaction.line_items || [];
        const xdreReceipt = await convertToXDREFormat(receipt, transaction, lineItems);

        res.json(xdreReceipt);
    } catch (error) {
        console.error('Error handling digital receipt request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}; 