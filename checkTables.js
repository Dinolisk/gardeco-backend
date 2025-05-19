import { sequelize } from './src/Database/db.js';

const checkTables = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Get all tables
    const [results] = await sequelize.query('SHOW TABLES');
    console.log('\nTables in database:');
    
    for (const row of results) {
      const tableName = Object.values(row)[0];
      console.log(`\n=== ${tableName} ===`);
      const [columns] = await sequelize.query(`DESCRIBE ${tableName}`);
      columns.forEach(col => {
        console.log(`${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key === 'PRI' ? 'PRIMARY KEY' : ''} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
};

checkTables(); 