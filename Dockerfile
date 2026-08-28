FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM deps AS builder
ENV NODE_ENV=production \
    DATABASE_URL=postgresql://fincat_build:fincat_build@127.0.0.1:5432/fincat_build \
    BETTER_AUTH_SECRET=build-only-placeholder-not-used-at-runtime \
    BETTER_AUTH_URL=http://127.0.0.1:3000
COPY . .
RUN npm run build

FROM deps AS migrations
COPY . .
CMD ["npm", "run", "db:migrate"]

FROM base AS runtime
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN mkdir -p /app/.next/cache && chown -R node:node /app
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
USER node
CMD ["node", "server.js"]
