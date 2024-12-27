#!/bin/bash

# Load environment variables if needed
if [ -f .env ]; then
    source .env
fi

cd /home/ubuntu/vivivi-english-backend

# Set the application name
APP_NAME="vivivi-app-server"
NODE_ENV="production"

# Pull newest code from git
echo "Pulling latest code..."
git fetch origin main
git reset --hard origin/main

# Install dependencies
echo "Installing dependencies..."
yarn install --frozen-lockfile

# Install PM2 globally if it's not installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 could not be found. Installing PM2 globally..."
    yarn global add pm2
fi

# Build the application
echo "Building application..."
yarn build

# Remove all PM2 process
echo "Removing all PM2 processes..."
pm2 delete all || true

# Start the application with PM2 in production mode
echo "Starting the application with PM2 in production mode..."
sudo PORT=80 NODE_ENV=$NODE_ENV pm2 start "npm run start:prod" --name "$APP_NAME" --interpreter bash || sudo PORT=80 NODE_ENV=$NODE_ENV pm2 restart "$APP_NAME"

# Save PM2 process list and set startup
echo "Setting PM2 to auto-start on system reboot..."
sudo pm2 startup
pm2 save

# Display PM2 process list
pm2 list

echo "Deployment complete! The $APP_NAME is running under PM2 in production mode on port 80."