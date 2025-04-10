import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import { sequelize } from './src/Database/db.js';
import { Transaction } from './src/Models/transactionModel.js';
import { CardInfo } from './src/Models/cardInfoModel.js';
import { Membership } from './src/Models/membershipModel.js';
import transactionRoutes from './src/Routes/transactionRoute.js';

const app = express();

// Middleware to parse incoming JSON
app.use(bodyParser.json());

// Initialize Sequelize connection and sync ALL models
const initializeDatabase = async () => {
  try {
    // This will create all tables if they don't exist
    await sequelize.sync({ alter: false });
    console.log('✅ Database synchronized successfully');
  } catch (err) {
    console.error('❌ Error synchronizing database:', err);
    process.exit(1);
  }
};

// Initialize database
initializeDatabase();

// Use the transaction routes
app.use('/api', transactionRoutes);

// Start the Express server on the specified port and bind to all interfaces
const PORT = process.env.PORT || 4002; // Changed default port to 4002
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Let PM2 restart the process
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  // Let PM2 restart the process
  process.exit(1);
});
