import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Create Sequelize instance with connection pool configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'cashiersystem_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'qwER67890B!vbwe',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

// Function to initialize database
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Sync all models
    // Note: In production, you should use migrations instead of sync
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

export { sequelize, testConnection, initializeDatabase };
