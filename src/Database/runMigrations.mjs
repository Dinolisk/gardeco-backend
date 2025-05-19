import { sequelize } from './db.js';
import createTransactionsTable from './migrations/20240423_create_transactions_table.js';

const runMigrations = async () => {
  try {
    console.log('Running migrations...');
    await createTransactionsTable.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
  } finally {
    await sequelize.close();
  }
};

runMigrations(); 