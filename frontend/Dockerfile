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

# Same reasoning, and it decides more than the client bundle: this origin is
# baked into the canonical URLs, the sitemap and the Open Graph tags at build
# time. Without the ARG, a preview build could not stop itself from advertising
# the production origin to a crawler — which src/lib/site.ts says it can.
ARG NEXT_PUBLIC_SITE_URL=https://taskmatch.ai
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Build for production
RUN npm run build

RUN addgroup --system appuser && adduser --system --ingroup appuser appuser
USER appuser

EXPOSE 3000

CMD ["npm", "run", "start"]
