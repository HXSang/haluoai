module.exports = {
  apps: [{
    name: "nestjs-app",
    script: "yarn",
    args: "dev",
    instances: "max",     // Use all available CPU cores
    exec_mode: "cluster", // Run in cluster mode for load balancing
    watch: false,         // Don't watch for file changes
    max_memory_restart: "500M", // Restart if memory exceeds 500MB
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    },
    exp_backoff_restart_delay: 100, // Delay between restarts
    max_restarts: 10,               // Maximum restarts on crash
    restart_delay: 1000,            // Delay between restarts (ms)
  }]
};
