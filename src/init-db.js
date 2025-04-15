import { sequelize, testConnection } from './Database/db.js';
import { Transaction } from './Models/transactionModel.js';

async function initializeDatabase() {
  try {
    // Test the database connection
    await testConnection();

    // Sync all models with the database
    // force: true will drop existing tables and recreate them
    // CAUTION: Only use force: true in development/testing
    await sequelize.sync({ force: true });
    
    console.log('✅ Database synchronized successfully');
    
    // Exit the process
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();
