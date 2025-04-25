// ecosystem.config.cjs

module.exports = {
  apps : [{
    // --- Grundläggande Inställningar ---
    name   : "gardeco-backend",      // Processnamn i PM2 (samma som tidigare)
    script : "server.js",           // Relativ sökväg till startfilen (mer portabelt)
    // cwd: undefined,              // Ofta onödig när 'script' är relativ och filen ligger i roten

    // --- Körningsläge ---
    instances: 1,                   // Kör en instans
    exec_mode: "fork",              // Standardläge för Node.js

    // --- Utvecklingsmiljö (aktiveras med --env development) ---
    env_development: {
      NODE_ENV: "development",      // Sätt NODE_ENV
      PORT: 4002,                   // Din angivna port
      // Lägg till fler utvecklingsspecifika variabler här
    },

    // --- Produktionsmiljö (aktiveras med --env production) ---
    env_production: {
      NODE_ENV: "production",
      PORT: 4002, // Eller en annan port för produktion? Ändra vid behov.
      // Lägg till fler produktionsspecifika variabler här
    },

    // --- Övervakning & Resurser ---
    watch  : false,                 // Stäng av automatisk omstart vid filändring (som tidigare)
    max_memory_restart: '2G',       // Starta om vid 1GB minne (som tidigare)

    // --- Logghantering ---
    error_file: './logs/err.log',   // Relativ sökväg för fellogg (som tidigare)
    out_file:   './logs/out.log',   // Relativ sökväg för vanlig logg (som tidigare)
    combine_logs: true,             // (Valfritt) Kombinera ut- och fellogg till en fil (out_file)
    log_date_format: 'YYYY-MM-DD HH:mm:ss', // Tidsstämpelformat (som tidigare)
    // time: true,                  // Behövs oftast inte om log_date_format är satt

    // --- Interpreter (Node.js) ---
    // interpreter: 'node',         // Behövs sällan, PM2 hittar oftast Node själv
    // interpreter_args: '',        // Ta bort --experimental-modules, behövs sällan nu

  }]
};