import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth/minimal";
import { oAuthProxy } from "better-auth/plugins";
import { siwe } from "better-auth/plugins/siwe";
import { generateSiweNonce } from "viem/siwe";
import { PRODUCTION_URL, lookupEns, siweDomain, verifySiweSignature } from "~~/lib/siwe";
import { db } from "~~/services/database/config/postgresClient";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
  plugins: [
    // Wallet sign-in. The plugin stores each nonce single-use in the verification table, checks
    // the message's domain and expiry, creates the user + walletAddress rows on first sign-in
    // and sets the same session cookie the social providers do.
    siwe({
      domain: siweDomain(),
      getNonce: async () => generateSiweNonce(),
      verifyMessage: verifySiweSignature,
      ensLookup: lookupEns,
    }),
    // Preview deployments sign in through production's OAuth callback, so Google and GitHub
    // only ever know the two production redirect URIs. The proxy engages whenever the request
    // origin differs from PRODUCTION_URL, which would bounce localhost through prod, so Vercel only.
    ...(process.env.VERCEL ? [oAuthProxy({ productionURL: PRODUCTION_URL })] : []),
  ],
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
