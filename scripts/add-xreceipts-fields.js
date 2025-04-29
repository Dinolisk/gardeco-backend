import { sequelize } from '../src/Database/db.js';
import { DataTypes } from 'sequelize';

async function addXReceiptsFields() {
  const transaction = await sequelize.transaction();

  try {
    console.log('Adding X-Receipts fields to transactions table...');

    // Check if columns exist before adding them
    const tableDescription = await sequelize.queryInterface.describeTable('transactions');

    // Add line_items column if it doesn't exist
    if (!tableDescription.line_items) {
      await sequelize.queryInterface.addColumn(
        'transactions',
        'line_items',
        {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'X-Receipts line items with formatted prices'
        },
        { transaction }
      );
      console.log('Added line_items column');
    } else {
      console.log('line_items column already exists');
    }

    // Add order_summary column if it doesn't exist
    if (!tableDescription.order_summary) {
      await sequelize.queryInterface.addColumn(
        'transactions',
        'order_summary',
        {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'X-Receipts order summary with formatted prices'
        },
        { transaction }
      );
      console.log('Added order_summary column');
    } else {
      console.log('order_summary column already exists');
    }

    await transaction.commit();
    console.log('Successfully added all missing X-Receipts fields');
  } catch (error) {
    await transaction.rollback();
    console.error('Error adding X-Receipts fields:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
addXReceiptsFields()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 