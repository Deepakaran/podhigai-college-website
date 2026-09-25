// ============================================================
//  PM2 Ecosystem Config
//  Podhigai College — Backend API + Frontend Site
// ============================================================

module.exports = {
  apps: [

    // ── 1. Backend API (Express + MongoDB) ─────────────────────
    {
      name        : 'podhigai-backend',
      script      : 'server.js',
      cwd         : __dirname,

      watch          : false,
      autorestart    : true,
      restart_delay  : 3000,
      max_restarts   : 10,
      min_uptime     : '5s',

      log_date_format : 'YYYY-MM-DD HH:mm:ss',
      out_file        : './logs/api-out.log',
      error_file      : './logs/api-error.log',
      merge_logs      : true,

      env: {
        NODE_ENV : 'production',
        PORT     : 3001,
      },
    },

    // ── 2. Frontend Static Site (http-server on port 8080) ─────
    {
      name       : 'podhigai-site',
      script     : 'c:\\College website\\podhigai-site\\node_modules\\http-server\\bin\\http-server',
      args       : '-p 5500 -c-1 --cors',
      cwd        : 'c:\\College website\\podhigai-site',
      interpreter: 'node',

      autorestart   : true,
      restart_delay : 3000,
      max_restarts  : 10,
      min_uptime    : '5s',

      log_date_format : 'YYYY-MM-DD HH:mm:ss',
      out_file        : 'c:\\College website\\podhigai-site\\logs\\site-out.log',
      error_file      : 'c:\\College website\\podhigai-site\\logs\\site-error.log',
      merge_logs      : true,

      env: { NODE_ENV: 'production' },
    },

  ],
};
