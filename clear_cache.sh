#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Clear temporary files and logs
sudo rm -rf /tmp/*
sudo rm -rf "$SCRIPT_DIR/logs"
sudo rm -rf /var/log
# Start the PM2 process
#sudo sh "/home/ubuntu/hailuoai/pm2_start.sh"
