// seedTestData.js
import { sequelize } from './src/Database/db.js'; // Anpassa sökväg
import { Transaction } from './src/Models/transactionModel.js'; // Anpassa sökväg

const seedDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate(); // Testa anslutningen
    console.log('Database connected.');

    console.log('Seeding test transaction...');
    const testTxData = {
      acquirer_terminal_id: '123456789012345',
      acquirer_transaction_timestamp: new Date('2023-04-01T12:00:00Z'),
      transaction_amount: 100.00,
      transaction_currency: 'NOK',
      authorization_code: '009856',
      card_type: 'BANKAXEPT',
      acquirer_merchant_id: null,
      system_trace_audit_number: '986585',
      retrieval_reference_number: '20240532009856',
      masked_pan: '************1234',
      merchant_name: 'Maxbo - Oslo',
      card_id: null
    };

    // Valfritt: Rensa gamla testdata först
    // await Transaction.destroy({ where: { acquirer_terminal_id: testTxData.acquirer_terminal_id } });

    const createdTransaction = await Transaction.create(testTxData);
    console.log('Test transaction created:', createdTransaction.toJSON());

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    console.log('Closing database connection...');
    await sequelize.close();
    console.log('Database connection closed.');
  }
};

seedDatabase(); // Kör funktionen