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
                'authorization_code',
                'cardholder_reference',
                'line_items',
                'order_summary',
                'schema_version',
                'cashier_system_id',
                'round_trip_id',
                'merchant_name',
                'card_type',
                'masked_pan',
                'acquirer_merchant_id',
                'system_trace_audit_number',
                'retrieval_reference_number',
                'payment',
                'xreceipt_status'
            ]
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Kontrollera att transaktionen har matchats med X-receipt
        if (transaction.xreceipt_status !== 'MATCHED') {
            return res.status(403).json({ 
                error: 'Transaction has not been matched with X-receipt',
                status: transaction.xreceipt_status
            });
        }

        // Logga transaktionsdata för felsökning
        console.log('Fetched transaction data:', {
            id: transaction.id,
            cardholderReference: transaction.cardholder_reference,
            terminalId: transaction.acquirer_terminal_id,
            payment: transaction.payment,
            authCode: transaction.authorization_code,
            merchantName: transaction.merchant_name,
            cardType: transaction.card_type,
            maskedPan: transaction.masked_pan,
            xreceiptStatus: transaction.xreceipt_status
        });

        // Kontrollera om transaktionen är berättigad till digitalt kvitto
        if (!transaction.cardholder_reference) {
            // Om cardholder_reference saknas, använd ett defaultvärde
            transaction.cardholder_reference = 'DEFAULT-REF';
        }

        // Se till att merchant_name mappas till merchant.merchantName
        // Om transaction.merchant inte finns, skapa det
        if (!transaction.merchant) {
            transaction.merchant = {};
        }
        transaction.merchant.merchantName = transaction.merchant_name;

        // Skapa kvittot och konvertera till XDRE-format
        // Hämta belopp och valuta från payment (JSON) istället för transaction_amount/transaction_currency
        let amount = null;
        let currency = null;
        if (transaction.payment) {
            // payment kan vara array eller objekt
            const paymentObj = Array.isArray(transaction.payment) ? transaction.payment[0] : transaction.payment;
            amount = paymentObj?.merchantTransactionAmount || paymentObj?.transactionAmount?.merchantTransactionAmount || null;
            currency = paymentObj?.merchantTransactionCurrency || paymentObj?.transactionAmount?.merchantTransactionCurrency || null;
        }
        // fallback till order_summary om payment saknas
        if (!amount && transaction.order_summary) {
            amount = transaction.order_summary.totalAmountIncVat || null;
        }
        if (!currency && transaction.order_summary) {
            currency = transaction.order_summary.currencyIsoCode || null;
        }
        const receipt = {
            transactionId: transaction.id,
            cardId: transaction.card_id,
            terminalId: transaction.acquirer_terminal_id,
            timestamp: transaction.acquirer_transaction_timestamp,
            amount: amount,
            currency: currency,
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