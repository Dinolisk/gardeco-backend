import { sequelize } from '../src/Database/db.js';

async function listTables() {
  try {
    console.log('Listing all tables in the database...');
    
    // Get all tables
    const [tables] = await sequelize.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'cashiersystem_db'"
    );
    
    console.log('\nTables in cashiersystem_db:');
    console.log('---------------------------');
    
    // For each table, get its columns
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      console.log(`\nTable: ${tableName}`);
      console.log('Columns:');
      console.log('--------');
      
      const [columns] = await sequelize.query(
        `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
         FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = 'cashiersystem_db' 
         AND TABLE_NAME = ?`,
        { replacements: [tableName] }
      );
      
      columns.forEach((col, index) => {
        console.log(`${index + 1}. ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
        console.log(`   Nullable: ${col.IS_NULLABLE}`);
        if (col.COLUMN_DEFAULT !== null) {
          console.log(`   Default: ${col.COLUMN_DEFAULT}`);
        }
      });
    }
    
    console.log(`\nTotal tables: ${tables.length}`);
  } catch (error) {
    console.error('Error listing tables:', error);
  } finally {
    await sequelize.close();
  }
}

listTables()
  .then(() => {
    console.log('Listing completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Listing failed:', error);
    process.exit(1);
  }); 