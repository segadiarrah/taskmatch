FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy application code
COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so this
# must be an ARG — setting it only at runtime (env_file) has no effect on the
# already-compiled JS.
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build for production
RUN npm run build

RUN addgroup --system appuser && adduser --system --ingroup appuser appuser
USER appuser

EXPOSE 3000

CMD ["npm", "run", "start"]
