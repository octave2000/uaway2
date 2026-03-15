# Uaway Starter

Minimal Next.js starter kit with Auth.js v5, Drizzle ORM, Postgres, Google OAuth, email/password auth, and magic links sent through HubMail.

## Included

- Google sign-in
- Email/password registration and login
- Magic link login through HubMail
- Drizzle schema and migrations under `db/`
- Auth.js config in root `auth.ts`
- Minimal shadcn-style auth UI
- Protected dashboard route through `proxy.ts`

## Stack

- Next.js 16 App Router
- Auth.js v5
- Drizzle ORM
- Postgres via `postgres`
- HubMail
- Zod
- shadcn-style UI components

## Project Structure

```text
app/
  (auth)/
    actions.ts
    helpers.ts
    login/page.tsx
    register/page.tsx
    schemas.ts
  api/auth/[...nextauth]/route.ts
  dashboard/page.tsx
  page.tsx
auth.ts
db/
  drizzle.config.ts
  index.ts
  migrations/
  schema.ts
  users.ts
proxy.ts
```

## Auth Notes

- `auth.ts` contains the Auth.js configuration, providers, callbacks, and adapter wiring.
- Database-related code lives under `db/`.
- Credentials auth uses JWT sessions because Auth.js credentials support requires it.
- Users, linked OAuth accounts, and magic-link verification tokens are stored in Postgres.
- Routes stay at `/login` and `/register`, even though the pages live under `app/(auth)/`.

## Environment Variables

Copy `.env.example` to `.env` and set:

```bash
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_EMAIL_FROM=
DATABASE_URL=
HUBMAIL_KEY=
```

## Google OAuth Setup

Use this callback URL in Google Cloud:

```text
http://localhost:3000/api/auth/callback/google
```

For production, add the matching production callback URL as well.

## Getting Started

```bash
bun install
bun run db:migrate
bun dev
```

Open `http://localhost:3000`.

## Scripts

```bash
bun dev
bun run build
bun run lint
bun run typecheck
bun run db:generate
bun run db:migrate
bun run db:push
bun run db:studio
```

## Starter Routes

- `/` minimal home page
- `/login` sign in with Google, password, or magic link
- `/register` register with password or continue with Google
- `/dashboard` protected example page

## Customizing

- Edit `db/schema.ts` for your data model
- Edit `db/users.ts` for user-related DB helpers
- Edit `auth.ts` to add or change providers
- Replace the pages under `app/` with your product routes
