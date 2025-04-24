export default {
  apps: [{
    name: 'gardeco-backend',
    cwd: 'C:/Users/Admin2/Documents/Gardeco/gardeco-backend',
    script: 'C:/Users/Admin2/Documents/Gardeco/gardeco-backend/server.js',
    interpreter: 'node',
    interpreter_args: '--experimental-modules',
    watch: false,
    env: {
      NODE_ENV: 'development',
      PORT: 4002
    },
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
