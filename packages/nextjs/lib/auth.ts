import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth/minimal";
import { oAuthProxy } from "better-auth/plugins";
import { db } from "~~/services/database/config/postgresClient";

const PRODUCTION_URL = "https://lab.buidlguidl.com";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
  // Preview deployments sign in through production's OAuth callback, so Google and GitHub
  // only ever know the two production redirect URIs. The proxy engages whenever the request
  // origin differs from PRODUCTION_URL, which would bounce localhost through prod, so Vercel only.
  plugins: process.env.VERCEL ? [oAuthProxy({ productionURL: PRODUCTION_URL })] : [],
  // The proxy only sends the session back to a trusted origin; without this it falls back to
  // the per-deployment VERCEL_URL and you land on a different host than the one you opened.
  trustedOrigins: ["https://learning-lab-nextjs-*-buidlguidldao.vercel.app"],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    },
  },
});
