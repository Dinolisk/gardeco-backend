module.exports = {
  apps: [{
    name: 'gardeco-backend',
    script: './server.js',
    watch: true,              // Automatically restart on file changes
    ignore_watch: [           // Don't watch these directories
      "node_modules",
      "logs"
    ],
    env: {
      NODE_ENV: 'development',
      PORT: 4002,            // Match the port in .env
      DB_HOST: 'localhost',
      DB_USER: 'root',
      DB_PASSWORD: 'qwER67890B!vbwe',
      DB_NAME: 'cashiersystem_db'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    max_memory_restart: '1G', // Restart if memory exceeds 1GB
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    time: true               // Add timestamps to logs
  }]
};
