# syntax=docker/dockerfile:1
FROM node:22-slim

# Install system dependencies required for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends     python3     make     g++     curl     && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=7860

# Copy package manifests
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm install

# Copy application source code
COPY . .

# Build React / Vite frontend
RUN npm run build

# Ensure database and uploads directory exist and have write permissions
RUN mkdir -p /app/server/db /app/public/uploads /app/backups &&     chmod -R 777 /app/server/db /app/public/uploads /app/backups

# Expose standard Hugging Face Spaces port
EXPOSE 7860

# Start server
CMD ["npm", "start"]
