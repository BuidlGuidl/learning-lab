# Ethereum Learning Lab

Interactive, browser-based labs that teach Ethereum, the EVM, and Solidity by doing. You build real contracts, compile, deploy, and wire them with an UI. All in the browser, with an AI tutor that grades your answers and coaches you the Socratic way.

The first lab, **Ethereum 101**, takes you from "what is Ethereum" to writing, deploying, and using your own crowdfunding contract.

Built on [Scaffold-ETH 2](https://scaffoldeth.io).

## Requirements

- [Node](https://nodejs.org/en/download/) (>= v22)
- [Yarn](https://classic.yarnpkg.com/en/docs/install/) (v1 or v2+)
- [Git](https://git-scm.com/downloads)
- [Docker](https://docs.docker.com/get-docker/) for the local Postgres
- An [OpenRouter API key](https://openrouter.ai/keys) that powers the AI grader
- Google and GitHub OAuth apps for sign-in (see [OAuth credentials](#oauth-credentials))

## Local Setup

1. Install dependencies:

   ```
   yarn install
   ```

2. Copy the env template:

   ```
   cp packages/nextjs/.env.example packages/nextjs/.env.local
   ```

   Set `OPENROUTER_API_KEY`, `BETTER_AUTH_SECRET` ( you can use `openssl rand -base64 32`) and the four OAuth vars from the section below. `DATABASE_URL` and `BETTER_AUTH_URL` already point at localhost in the committed `.env.development`.

3. Start Postgres, push the schema and seed it:

   ```
   docker compose up -d
   yarn drizzle-kit push
   yarn db:seed
   ```

4. Start the app:

   ```
   yarn start
   ```

Open [http://localhost:3000](http://localhost:3000) and pick a lab. Labs compile and deploy contracts in the browser, so you don't need to run a local chain. `yarn drizzle-kit studio` opens a browser view of the database.

### OAuth credentials

Sign-in with Google and GitHub is handled by [Better Auth](https://www.better-auth.com).

Each provider needs an OAuth app that points back at `http://localhost:3000`.

**GitHub**: [Settings → Developer settings → OAuth Apps → New OAuth App](https://github.com/settings/applications/new).

- Homepage URL `http://localhost:3000`, callback URL `http://localhost:3000/api/auth/callback/github`.
- Copy client ID and client secret, put them as `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.

**Google**: [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials) → Create credentials → OAuth client ID, type "Web application".

- Add `http://localhost:3000` under authorized JavaScript origins and `http://localhost:3000/api/auth/callback/google` under authorized redirect URIs.
- If the project has no consent screen yet, Google asks you to set one up first (External, add your own email as a test user).
- Client ID and secret as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### Database

Drizzle + Postgres: schemas in `packages/nextjs/services/database/config/`, queries in `repositories/`. Run `drizzle-kit` from the root with `yarn drizzle-kit`.

- Our tables live in `schema.ts`. After editing it, `yarn drizzle-kit push` applies the change (no migrations yet).
- `auth-schema.ts` is generated from `packages/nextjs/lib/auth.ts` by `yarn workspace @se-2/nextjs auth:generate`.
- `yarn db:seed` inserts one user and one lab progress row; it refuses to run against anything but localhost.
