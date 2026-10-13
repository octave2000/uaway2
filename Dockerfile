FROM node:24-bookworm-slim AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-bookworm-slim AS builder

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Next inspects route modules during the image build, so it needs syntactically
# valid settings. These placeholders are confined to this stage and are never
# copied into the runtime image; Hubfly injects the real settings at runtime.
ENV DATABASE_URL=postgres://build:build@127.0.0.1:5432/build \
    AUTH_SECRET=build-only-placeholder \
    AUTH_GOOGLE_ID=build-only.apps.invalid \
    AUTH_GOOGLE_SECRET=build-only-placeholder \
    AUTH_EMAIL_FROM="Build <build@example.invalid>" \
    HUBMAIL_KEY=build-only-placeholder \
    DARAJA_CONSUMER_KEY=build-only-placeholder \
    DARAJA_CONSUMER_SECRET=build-only-placeholder \
    DARAJA_SHORTCODE=000000 \
    DARAJA_PASSKEY=build-only-placeholder \
    DARAJA_CALLBACK_URL=https://example.invalid/api/daraja/callback \
    DARAJA_BASE_URL=https://sandbox.safaricom.co.ke \
    UPLOADTHING_TOKEN=eyJhcGlLZXkiOiJidWlsZC1vbmx5IiwiYXBwSWQiOiJidWlsZC1vbmx5IiwicmVnaW9ucyI6WyJzZWExIl19 \
    APP_URL=https://example.invalid \
    AUTH_TRUST_HOST=true \
    SUPER_ADMIN_EMAILS=build@example.invalid \
    BOOKING_FEE_KES=0 \
    ADMIN_MFA_REQUIRED=false
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
