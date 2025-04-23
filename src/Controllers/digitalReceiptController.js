import { sequelize } from '../Database/db.js';
import { Receipt } from '../Models/receiptModel.js';
import { ReceiptLineItem } from '../Models/receiptLineItemModel.js';
import { Transaction } from '../Models/transactionModel.js';
import { digitalReceiptService } from '../Services/digitalReceiptService.js';

export const handleDigitalReceiptRequest = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { transactionId } = req.params;

    // Find the transaction
    const matchedTransaction = await Transaction.findByPk(transactionId);
    if (!matchedTransaction) {
      await transaction.rollback();
      return res.status(404).json({
        error: 'Transaction not found'
      });
    }

    // Check if transaction is eligible (status should be MATCHED)
    if (matchedTransaction.xreceipt_status !== 'MATCHED') {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Transaction is not eligible for digital receipt'
      });
    }

    // Create receipt
    const receipt = await Receipt.create({
      total_amount_incl_vat: matchedTransaction.transaction_amount,
      total_amount_excl_vat: matchedTransaction.transaction_amount / 1.25, // Assuming 25% VAT
      receipt_number: `REC-${Date.now()}`,
      receipt_timestamp: matchedTransaction.acquirer_transaction_timestamp,
      currency_iso_code: matchedTransaction.transaction_currency,
      transaction_id: matchedTransaction.id,
      vat_summary: [{
        vatRate: 25.00,
        vatAmount: matchedTransaction.transaction_amount - (matchedTransaction.transaction_amount / 1.25)
      }]
    }, { transaction });

    // Add line items (in this case, we create a single line item for the total amount)
    const lineItem = await ReceiptLineItem.create({
      receipt_id: receipt.id,
      item_name: 'Purchase',
      item_description: 'Store purchase',
      quantity: 1,
      quantity_type: 'PCS',
      price_incl_vat: matchedTransaction.transaction_amount,
      price_excl_vat: matchedTransaction.transaction_amount / 1.25,
      vat_rate: 25.00,
      vat_amount: matchedTransaction.transaction_amount - (matchedTransaction.transaction_amount / 1.25),
      line_total_incl_vat: matchedTransaction.transaction_amount
    }, { transaction });

    // Convert to XDRE format
    const xdreReceipt = await digitalReceiptService.convertToXDREFormat(
      receipt,
      matchedTransaction,
      [lineItem]
    );

    await transaction.commit();

    // Return the XDRE formatted receipt
    return res.status(200).json(xdreReceipt);

  } catch (error) {
    await transaction.rollback();
    console.error('Error creating digital receipt:', error);
    return res.status(500).json({
      error: 'Failed to create digital receipt',
      details: error.message
    });
  }
}; 