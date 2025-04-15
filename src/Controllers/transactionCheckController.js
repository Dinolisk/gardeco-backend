import { sequelize } from "../Database/db.js";
import { findMatchingTransaction } from "../Models/transactionModel.js";

/**
 * Handles the Transaction Check Request from X-Receipts
 * Validates input and implements matching logic based on the Transaction Matching Table
 */
export const handleTransactionCheck = async (req, res) => {
  // Starta transaktion
  const transaction = await sequelize.transaction();

  try {
    // Hämta hela request bodyn
    const body = req.body;

    // --- 1. Validering av Inkommande Data (Utökad) ---
    const missingFields = [];

    // Kolla fält nödvändiga för primär matchning (enligt findMatchingTransaction)
    if (!body.acquirerTerminalId) {
        missingFields.push('acquirerTerminalId');
    }
    if (!body.acquirerTransactionTimestamp) {
        missingFields.push('acquirerTransactionTimestamp');
    } else {
        // Enkel kontroll att datumet är någorlunda giltigt
        if (isNaN(new Date(body.acquirerTransactionTimestamp).getTime())) {
            missingFields.push('acquirerTransactionTimestamp (invalid format)');
        }
    }
    // Använd '??' (Nullish Coalescing) eller '== null' för att korrekt hantera 0 som ett giltigt belopp
    if (body.transactionAmount?.merchantTransactionAmount == null) {
        missingFields.push('transactionAmount.merchantTransactionAmount');
    }
    if (!body.transactionAmount?.merchantTransactionCurrency) {
        missingFields.push('transactionAmount.merchantTransactionCurrency');
    }
    if (!body.transactionIdentifier?.authorizationCode) {
        missingFields.push('transactionIdentifier.authorizationCode');
    }

    // Kolla även fältet som behövs för uppdateringssteget senare
    if (!body.xReceipts?.cardId) {
        missingFields.push('xReceipts.cardId');
    }

    // Om några obligatoriska fält för processen saknas, returnera 400
    if (missingFields.length > 0) {
        await transaction.rollback(); // Ångra transaktionen direkt
        console.log('Input validation failed. Missing fields:', missingFields); // Logga för felsökning
        return res.status(400).json({
            error: 'Missing or invalid required fields for processing request',
            fields: missingFields
        });
    }

    // Om vi kommer hit är grundläggande validering OK -> fortsätt till matchning
    console.log('Input validation passed. Proceeding to find matching transaction...');

    // --- 2. Sök efter Matchande Transaktion ---
    const matchingTransaction = await findMatchingTransaction(body, { transaction });

    // --- 3. Hantera Icke-Match ---
    if (!matchingTransaction) {
      await transaction.commit();
      return res.status(404).json({
        error: 'Transaction not found'
      });
    }

    // --- 4. Uppdatera Transaktion med cardId vid Match ---
    const cardIdToUpdate = body.xReceipts.cardId;

    await matchingTransaction.update({
      card_id: cardIdToUpdate
    }, { transaction });
    console.log(`Transaction ${matchingTransaction.id} updated with card_id.`);

    // --- 5. Slutför Transaktionen ---
    await transaction.commit();

    // --- 6. Returnera Success-svar enligt Dokumentation ---
    return res.status(200).json({});

  } catch (error) {
    if (transaction && !transaction.finished) {
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError);
        }
    }
    console.error('Error handling transaction check:', error);
    return res.status(500).json({
      error: 'Failed to process transaction check',
      details: error.message
    });
  }
};