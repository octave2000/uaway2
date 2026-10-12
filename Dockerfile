FROM node:24-bookworm-slim AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1
# Build-only placeholders. Real secrets are supplied at runtime; no provider is called during build.
RUN DATABASE_URL=postgres://build:build@localhost:5432/build AUTH_SECRET=build-only-placeholder-not-for-runtime AUTH_GOOGLE_ID=build AUTH_GOOGLE_SECRET=build AUTH_EMAIL_FROM=build@example.invalid HUBMAIL_KEY=build npm run build
FROM node:24-bookworm-slim AS web
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
FROM base AS worker
ENV NODE_ENV=production
USER node
CMD ["npm", "run", "worker"]
