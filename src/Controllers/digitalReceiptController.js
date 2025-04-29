import { sequelize } from '../Database/db.js';
import { Receipt } from '../Models/receiptModel.js';
import { ReceiptLineItem } from '../Models/receiptLineItemModel.js';
import { Transaction } from '../Models/transactionModel.js';
import { digitalReceiptService } from '../Services/digitalReceiptService.js';

export const handleDigitalReceiptRequest = async (req, res) => {
  // Starta en databastransaktion för atomicitet
  const transaction = await sequelize.transaction(); 

  try {
    const { transactionId } = req.params;
    console.log('--- Controller: Starting digital receipt request for transaction:', transactionId);

    // Hämta den matchade transaktionen från databasen
    // Not: Vi inkluderar alla fält som behövs senare. 'attributes' är tillbaka här som du hade senast.
    const matchedTransaction = await Transaction.findByPk(transactionId, {
      attributes: [
        'id',
        'cardholder_reference', // Viktigt fält
        'line_items',           // Viktigt fält (JSON)
        'order_summary',        // Viktigt fält (JSON)
        'card_id',
        'acquirer_terminal_id',
        'card_type',
        'acquirer_transaction_timestamp',
        'transaction_amount',
        'transaction_currency',
        'authorization_code',
        'system_trace_audit_number',
        'retrieval_reference_number',
        'masked_pan',
        'merchant_name',
        'xreceipt_status',
        'created_at',
        'updated_at'
      ]
      // transaction: transaction // Behövs sällan för findByPk om inte låsning krävs
    });

    // Kontrollera om transaktionen hittades
    if (!matchedTransaction) {
      console.error(`Transaction with ID ${transactionId} not found IN CONTROLLER.`);
      await transaction.rollback();
      return res.status(404).json({
        error: 'Transaction not found'
      });
    }

    // ---> DETALJERAD LOGGNING (Behåll för felsökning tills allt funkar) <---
    console.log('--- Controller: Fetched matchedTransaction Immediately ---');
    console.log('Controller Fetched - cardholder_reference:', matchedTransaction.cardholder_reference); 
    console.log('Controller Fetched - line_items PRESENT?:', !!matchedTransaction.line_items); 
    console.log('Controller Fetched - order_summary PRESENT?:', !!matchedTransaction.order_summary); 
    console.log('Controller Fetched - Plain Object:', JSON.stringify(matchedTransaction.get({ plain: true }), null, 2)); 
    if (matchedTransaction.line_items) {
        console.log('Controller Fetched - line_items TYPE:', typeof matchedTransaction.line_items);
    }
    if (matchedTransaction.order_summary) {
        console.log('Controller Fetched - order_summary TYPE:', typeof matchedTransaction.order_summary);
    }
    // ------------------------------------

    // Kontrollera om transaktionen har rätt status för att skapa kvitto
    if (matchedTransaction.xreceipt_status !== 'MATCHED') {
      console.log('Transaction is not eligible for digital receipt. Status:', matchedTransaction.xreceipt_status);
      await transaction.rollback();
      return res.status(400).json({
        error: 'Transaction is not eligible for digital receipt'
      });
    }

    // Skapa ett nytt kvitto-objekt i databasen
    // Not: Beräkningar för moms etc. kan behöva justeras baserat på riktig data
    const receipt = await Receipt.create({
      total_amount_incl_vat: matchedTransaction.transaction_amount,
      total_amount_excl_vat: parseFloat(matchedTransaction.transaction_amount) / 1.25, // Antag 25% moms
      receipt_number: `REC-${Date.now()}`,
      receipt_timestamp: matchedTransaction.acquirer_transaction_timestamp,
      currency_iso_code: matchedTransaction.transaction_currency,
      transaction_id: matchedTransaction.id,
      vat_summary: JSON.stringify([{ // Spara som sträng om DB-kolumnen är TEXT/VARCHAR, annars direkt om JSON/JSONB
        vatRate: 25.00,
        vatAmount: parseFloat(matchedTransaction.transaction_amount) - (parseFloat(matchedTransaction.transaction_amount) / 1.25)
      }])
    }, { transaction }); // Koppla till DB-transaktionen

    // Skapa en generell artikelrad (detta kanske ska baseras på matchedTransaction.line_items istället?)
    const lineItem = await ReceiptLineItem.create({
      receipt_id: receipt.id,
      item_name: 'Purchase', // Exempel
      item_description: 'Store purchase', // Exempel
      quantity: 1,
      quantity_type: 'PCS',
      price_incl_vat: matchedTransaction.transaction_amount,
      price_excl_vat: parseFloat(matchedTransaction.transaction_amount) / 1.25,
      vat_rate: 25.00,
      vat_amount: parseFloat(matchedTransaction.transaction_amount) - (parseFloat(matchedTransaction.transaction_amount) / 1.25),
      line_total_incl_vat: matchedTransaction.transaction_amount
    }, { transaction }); // Koppla till DB-transaktionen

    // ---> LOGGA IGEN PRECIS INNAN SERVICE-ANROP (Behåll för felsökning) <---
    console.log('--- Controller: Passing matchedTransaction to service ---');
    console.log('Controller Passing - cardholder_reference:', matchedTransaction.cardholder_reference); 
    console.log('Controller Passing - Plain Object:', JSON.stringify(matchedTransaction.get({ plain: true }), null, 2)); 
    // -------------------------------------------

    // Konvertera till XDRE-format - HÄR VAR FELET TIDIGARE!
    // Se till att matchedTransaction kommer FÖRST och receipt SEDAN.
    const xdreReceipt = await digitalReceiptService.convertToXDREFormat(
      matchedTransaction,  // Korrekt ordning nu!
      receipt,             // Korrekt ordning nu!
      [lineItem]           // Skickar med nyskapad lineItem (kolla om/hur servicen använder detta)
    );

    // Om allt gick bra, committa ändringarna i databasen
    await transaction.commit(); 
    console.log('--- Controller: Successfully created digital receipt ---');

    // Returnera det formaterade kvittot
    return res.status(200).json(xdreReceipt);

  } catch (error) {
    // Om något går fel, rulla tillbaka DB-transaktionen
    await transaction.rollback(); 
    console.error('Error creating digital receipt:', error); // Logga det faktiska felet
    // Skicka ett generellt felmeddelande till klienten
    return res.status(500).json({
      error: 'Failed to create digital receipt',
      details: error.message // Inkludera felmeddelandet för mer info vid felsökning
    });
  }
};