import { sequelize } from './src/Database/db.js';

async function listTables() {
  try {
    // Query to get all tables
    const [results] = await sequelize.query('SHOW TABLES;');
    console.log('Current tables in database:');
    console.log('-------------------------');
    results.forEach(result => {
      // Get the table name from the result object
      const tableName = Object.values(result)[0];
      console.log(tableName);
    });
  } catch (error) {
    console.error('Error listing tables:', error);
  } finally {
    await sequelize.close();
  }
}

listTables(); 