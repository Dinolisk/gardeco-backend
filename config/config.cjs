// config/config.js
require('dotenv').config({ path: '../.env' }); // Läs in .env-filen från projektets rot

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306, // Lägg till port! Använd 3306 om DB_PORT saknas i .env
    dialect: "mysql"
    // Lägg till andra sequelize-optioner här om det behövs, t.ex. pool-inställningar
  },
  test: {
    // Konfigurera för testdatabas - använd separata env-variabler om ni har det
    username: process.env.DB_USER_TEST || process.env.DB_USER,
    password: process.env.DB_PASSWORD_TEST || process.env.DB_PASSWORD,
    database: process.env.DB_NAME_TEST || 'database_test', // Eller cashiersystem_db om ni testar mot samma?
    host: process.env.DB_HOST_TEST || process.env.DB_HOST,
    port: process.env.DB_PORT_TEST || process.env.DB_PORT || 3306,
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