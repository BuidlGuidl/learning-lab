"use client";

import { signIn } from "~~/lib/auth-client";

export const SignInButtons = () => (
  <div className="flex gap-2 p-6">
    <button
      type="button"
      className="btn btn-primary"
      onClick={() => signIn.social({ provider: "google", callbackURL: "/db-demo" })}
    >
      Continue with Google
    </button>
    <button
      type="button"
      className="btn btn-outline"
      onClick={() => signIn.social({ provider: "github", callbackURL: "/db-demo" })}
    >
      Continue with GitHub
    </button>
  </div>
);
