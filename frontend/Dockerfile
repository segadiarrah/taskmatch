FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy application code (overridden by bind mount in dev)
COPY . .

EXPOSE 3000

# Dev server with hot-reload for MVP
CMD ["npm", "run", "dev"]
