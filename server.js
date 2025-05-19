import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser'; // Du kan byta till express.json() om du vill
import https from 'https'; // <-- NY: Importera https-modulen
import fs from 'fs';      // <-- NY: Importera file system-modulen

import { sequelize } from './src/Database/db.js';
// Importera de modeller som faktiskt används av dina routes
import { Transaction } from './src/Models/transactionModel.js';
import { Card } from './src/Models/cardModel.js';
import { Membership } from './src/Models/membershipModel.js';
import transactionRoutes from './src/Routes/transactionRoute.js';
import transactionRouter from './src/Routes/transaction.js';

const app = express();

// Middleware
app.use(bodyParser.json()); // Eller app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ---- SSL Configuration ----
const privateKeyPath = 'C:/Certs/receipts.gardeco.se-key.pem';
const certificatePath = 'C:/Certs/receipts.gardeco.se-chain.pem';
let httpsOptions;

try {
  httpsOptions = {
    key: fs.readFileSync(privateKeyPath),
    cert: fs.readFileSync(certificatePath)
  };
  console.log('✅ SSL certificate files loaded successfully.');
} catch (error) {
  console.error('❌ Error loading SSL certificate files:', error);
  // Don't exit, try to start HTTP server instead
  console.log('⚠️ Falling back to HTTP server');
}

// Initialize Sequelize connection
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Remove the sync call since we want to match existing tables
    // await sequelize.sync({ alter: true });
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    // Don't exit, try to continue without database
    console.log('⚠️ Continuing without database connection');
  }
};

// Initialize database
initializeDatabase();

// Use the transaction routes
app.use('/api', transactionRoutes);
app.use('/api/transaction', transactionRouter);

// Start server
let server;
if (httpsOptions) {
  server = https.createServer(httpsOptions, app).listen(443, "0.0.0.0", () => {
    console.log(`🚀 HTTPS Server running on port 443`);
  });
} else {
  server = app.listen(4002, "0.0.0.0", () => {
    console.log(`🚀 HTTP Server running on port 4002`);
  });
}

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down gracefully...');
  
  try {
    await sequelize.close();
    console.log('Database connection closed');
  } catch (err) {
    console.error('Error closing database connection:', err);
  }
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  
  // Force shutdown after 5 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 5000);
};

// Handle process termination
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  shutdown();
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  shutdown();
});