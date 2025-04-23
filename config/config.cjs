// config/config.js
require('dotenv').config();

module.exports = {
  development: {
    username: 'root',
    password: 'qwER67890B!vbwe',
    database: 'cashiersystem_db',
    host: 'localhost',
    port: 3306,
    dialect: "mysql"
    // Lägg till andra sequelize-optioner här om det behövs, t.ex. pool-inställningar
  },
  test: {
    username: 'root',
    password: 'qwER67890B!vbwe',
    database: 'cashiersystem_db',
    host: 'localhost',
    port: 3306,
    dialect: "mysql",
    logging: false // Stäng ofta av loggning för tester
  },
  production: {
    // !! ANVÄND ALLTID SPECIFIKA PRODUKTIONSVARIABLER FRÅN SYSTEMET/ENV !!
    // Läs INTE produktionslösenord från en .env-fil som checkas in i Git.
    username: process.env.DB_USER_PROD,
    password: process.env.DB_PASSWORD_PROD,
    database: process.env.DB_NAME_PROD,
    host: process.env.DB_HOST_PROD,
    port: process.env.DB_PORT_PROD || 3306,
    dialect: "mysql",
    logging: false // Stäng av detaljerad loggning i produktion
    // Lägg till produktionsspecifika optioner som pool-inställningar, SSL för DB etc. här
  }
};