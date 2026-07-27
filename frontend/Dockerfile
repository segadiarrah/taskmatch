FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy application code
COPY . .

# Build for production
RUN npm run build

RUN addgroup --system appuser && adduser --system --ingroup appuser appuser
USER appuser

EXPOSE 3000

CMD ["npm", "run", "start"]
