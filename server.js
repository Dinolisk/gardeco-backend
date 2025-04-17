import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser'; // Du kan byta till express.json() om du vill
import https from 'https'; // <-- NY: Importera https-modulen
import fs from 'fs';      // <-- NY: Importera file system-modulen

import { sequelize } from './src/Database/db.js';
// Importera de modeller som faktiskt används av dina routes
import { Transaction } from './src/Models/transactionModel.js';
// Importera CardInfo och Membership om de används av handleTransaction
// import { CardInfo } from './src/Models/cardInfoModel.js';
// import { Membership } from './src/Models/membershipModel.js';
import transactionRoutes from './src/Routes/transactionRoute.js';

const app = express();

// Middleware
app.use(bodyParser.json()); // Eller app.use(express.json());

// ---- NYTT: Läs in SSL-certifikatfiler ----
// Använd sökvägarna du angav
const privateKeyPath = 'C:/Certs/receipts.gardeco.se-key.pem'; // Behåll denna
const certificatePath = 'C:/Certs/receipts.gardeco.se-chain.pem'; // <-- ÄNDRA TILL DENNA// <-- Fel filnamn
let httpsOptions;

try {
  httpsOptions = {
    key: fs.readFileSync(privateKeyPath),
    cert: fs.readFileSync(certificatePath)
  };
  console.log('✅ SSL certificate files loaded successfully.');
} catch (error) {
  console.error('❌ Error loading SSL certificate files:', error);
  console.error('❌ Server cannot start HTTPS without certificates. Exiting.');
  process.exit(1); // Avsluta om certifikat inte kan laddas
}
// ------------------------------------------

// Initialize Sequelize connection and sync ALL models
const initializeDatabase = async () => {
  try {
    // Denna synkroniserar bara de modeller som importerats HÄR.
    // Om du vill synka ALLA modeller, måste de importeras här ovan.
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

// ---- ÄNDRAD: Starta HTTPS-servern ----
// Använd standard HTTPS-port 443
const HTTPS_PORT = 443; // Standard HTTPS-port
// const PORT_HTTP = process.env.PORT || 4002; // Behåll om du vill ha en fallback HTTP också?

https.createServer(httpsOptions, app).listen(HTTPS_PORT, "0.0.0.0", () => {
  console.log(`🚀 HTTPS Server running on port ${HTTPS_PORT}`);
  // Ta bort eller kommentera bort den gamla app.listen för HTTP om du inte ska ha båda
});

/* Ta bort eller kommentera bort den gamla HTTP-listenern:
app.listen(PORT_HTTP, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT_HTTP}`);
});
*/
// ------------------------------------

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});