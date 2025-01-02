FROM node:18-slim

# Install required packages
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    libssl-dev \
    make \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Bundle app source
COPY . .

# Run Prisma generate
RUN npx prisma generate

# Switch to non-root user
# USER node

# Set the entrypoint
# ENTRYPOINT [ "npm", "run", "start:dev" ]