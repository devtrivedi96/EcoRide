/**
 * PM2 Ecosystem Configuration
 * Docs: https://pm2.keymetrics.io/docs/usage/application-declaration/
 *
 * Usage:
 *   pm2 start pm2.config.js             # start
 *   pm2 reload pm2.config.js            # zero-downtime reload
 *   pm2 stop carpooling-api             # stop
 *   pm2 save && pm2 startup             # auto-start on reboot
 */
module.exports = {
  apps: [
    {
      name: 'carpooling-api',
      script: 'src/server.js',
      instances: 'max',        // use all CPU cores (cluster mode)
      exec_mode: 'cluster',
      watch: false,

      // Environment — production
      env_production: {
        NODE_ENV: 'production',
        PORT: 8081,
      },
      // Environment — development (pm2 start pm2.config.js --env development)
      env_development: {
        NODE_ENV: 'development',
        PORT: 8081,
      },

      // Logs
      out_file: 'logs/pm2-out.log',
      error_file: 'logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,

      // Auto-restart options
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 2000,
      max_memory_restart: '512M',

      // Graceful shutdown: send SIGINT and wait up to 10 s
      kill_timeout: 10000,
      wait_ready: false,

      // Source maps for better stack traces
      source_map_support: true,
    },
  ],
};
