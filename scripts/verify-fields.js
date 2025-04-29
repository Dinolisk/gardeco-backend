import { sequelize } from '../src/Database/db.js';

async function verifyFields() {
  try {
    console.log('Verifying X-Receipts fields in transactions table...');
    
    const tableDescription = await sequelize.queryInterface.describeTable('transactions');
    
    console.log('\nCurrent table structure:');
    console.log('------------------------');
    console.log('cardholder_reference:', tableDescription.cardholder_reference ? 'Exists' : 'Missing');
    console.log('line_items:', tableDescription.line_items ? 'Exists' : 'Missing');
    console.log('order_summary:', tableDescription.order_summary ? 'Exists' : 'Missing');
    
    if (tableDescription.cardholder_reference && 
        tableDescription.line_items && 
        tableDescription.order_summary) {
      console.log('\n✅ All X-Receipts fields are present in the database');
    } else {
      console.log('\n❌ Some X-Receipts fields are missing');
    }
  } catch (error) {
    console.error('Error verifying fields:', error);
  } finally {
    await sequelize.close();
  }
}

verifyFields()
  .then(() => {
    console.log('Verification completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  }); 