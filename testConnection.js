import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Log the configuration (without password)
console.log('Database Configuration:');
console.log('---------------------');
console.log('Host:', process.env.DB_HOST || 'localhost');
console.log('Database:', process.env.DB_NAME || 'cashiersystem_db');
console.log('User:', process.env.DB_USER || 'root');
console.log('Port:', process.env.DB_PORT || '3306');
console.log('Password configured:', process.env.DB_PASSWORD ? 'Yes' : 'No');

// Create a direct connection without using environment variables
const sequelize = new Sequelize('cashiersystem_db', 'root', 'qwER67890B!vbwe', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: console.log
});

async function testConnection() {
  try {
    console.log('Attempting to connect to cashiersystem_db...');
    await sequelize.authenticate();
    console.log('✅ Connection has been established successfully.');
    
    // List all tables
    const [tables] = await sequelize.query('SHOW TABLES');
    console.log('✅ Tables in database:', tables.map(t => Object.values(t)[0]));
    
  } catch (error) {
    console.error('❌ Unable to connect to the database:');
    console.error('Error message:', error.message);
    if (error.parent) {
      console.error('Original error:', error.parent.message);
      console.error('Error code:', error.parent.code);
      console.error('SQL State:', error.parent.sqlState);
    }
  } finally {
    await sequelize.close();
  }
}

testConnection(); 