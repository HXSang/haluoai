
# NestJS Docker Setup Guide

This repository contains various scripts and configurations for setting up and deploying a NestJS application with Docker.

## Project Structure

The project includes several initialization and deployment scripts:

### Docker Compose Files

1. **docker-compose.yml** - Main development environment setup
   - Sets up the complete development environment with Node.js, PostgreSQL, and Redis
   - Includes hot-reload for development
   - Maps local volumes for development

2. **docker-compose-prod.yml** - Production environment setup
   - Streamlined setup without PostgreSQL (assumes external database)
   - Includes Redis for caching
   - Optimized for production deployment

3. **docker-compose-db-only.yml** - Database-only setup
   - Standalone PostgreSQL setup for development
   - Useful for local database testing
   - Includes health check configuration

### Initialization Scripts

1. **init.sh**
   ```bash
   docker compose -f ./docker-compose.yml up --build -d
   ```
   - Builds and starts the development environment

2. **init.db.sh**
   ```bash
   docker compose -f ./docker-compose-db-only.yml up --build -d
   ```
   - Initializes only the database container

3. **init.prod.sh**
   ```bash
   docker compose -f ./docker-compose-prod.yml up --build -d
   ```
   - Builds and starts the production environment

### Deployment Scripts

1. **deploy.sh**
   - Automated deployment script for production
   - Features:
     - Environment variable loading
     - Git pull from main branch
     - Dependency installation
     - PM2 process management
     - Auto-restart configuration
     - Port 80 configuration

2. **pm2_start.sh**
   - PM2 process management script
   - Features:
     - Process cleanup
     - Application startup
     - PM2 status monitoring
     - Startup configuration
     
3. **init.db.sh**
   ```bash
   docker compose -f ./docker-compose-db-only.yml up --build -d
   ```
   - Initializes only the database container

### Makefile Commands

The project includes a Makefile with useful commands:
