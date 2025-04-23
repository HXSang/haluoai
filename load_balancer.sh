#!/bin/bash

# Set log file location
LOG_FILE="/home/ubuntu/hailuoai/load_balancer.log"

# Set script directory
SCRIPT_DIR="/home/ubuntu/hailuoai"

# API endpoint to check
API_URL="http://localhost:80/api/ping"

# Function to log message
log_message() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] $1" >> "$LOG_FILE"
}

# Function to check API status
check_api_status() {
    log_message "Starting API health check..."

    # Using curl with silent mode (-s) and getting only the HTTP status code (-w)
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" --connect-timeout 10 --max-time 20)

    if [ "$status_code" != "200" ]; then
        log_message "API returned status code: $status_code. Restarting server..."
        echo "API returned status code: $status_code. Restarting server..."

        # Execute the pm2 start script
        log_message "Executing pm2_start.sh..."
        sh "$SCRIPT_DIR/pm2_start.sh" >> "$LOG_FILE" 2>&1
        sh "$SCRIPT_DIR/clear_cache.sh" >> "$LOG_FILE" 2>&1
        # Log result of restart
        if [ $? -eq 0 ]; then
            log_message "Server restart completed successfully"
        else
            log_message "Server restart failed with exit code $?"
        fi
    else
        log_message "API is responding normally with status code 200"
        echo "API is responding normally with status code 200"
    fi
}

# Run the check
check_api_status

# Keep log file from growing too large (keep last 1000 lines)
tail -n 1000 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"

# REMOVED the invalid 'error' command from here


# 0 * * * * /bin/bash /home/ubuntu/hailuoai/clear_cache.sh
# * * * * * /bin/bash /home/ubuntu/hailuoai/load_balancer.sh